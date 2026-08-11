import { Readable } from 'stream';
import {
  RequestUploadUrlBody,
  RequestUploadUrlResponse,
} from '@workspace/api-zod';
import { Router, type IRouter, type Request, type Response } from 'express';
import { getAuth } from '@clerk/express';
import { eq } from 'drizzle-orm';
import { db, uploadsTable, usersTable, type User } from '@workspace/db';

import { ObjectPermission } from '../lib/objectAcl';
import {
  ObjectNotFoundError,
  ObjectStorageService,
} from '../lib/objectStorage';

const router: IRouter = Router();
const objectStorageService = new ObjectStorageService();

function hasAuthenticatedSession(req: Request): boolean {
  return Boolean(getAuth(req)?.userId);
}

async function getCallerUser(req: Request): Promise<User | null> {
  const clerkUserId = getAuth(req)?.userId;
  if (!clerkUserId) return null;
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkUserId, clerkUserId))
    .limit(1);
  return user ?? null;
}

const HQ_ROLES = ['founder', 'assistant'];
// Village executive per the addendum: head, secretary, treasurer.
const EXECUTIVE_ROLES = ['village_head', 'secretary', 'treasurer'];

/**
 * Purpose-based per-object read authorization:
 * - HQ reads anything; the uploader always reads their own uploads.
 * - profile_photo, meeting_photo, meeting_video: readable by members of the
 *   uploader's village (village-scoped material).
 * - attendance_video: readable by the uploader's village executive (who
 *   verify attendance) in addition to owner/HQ.
 * - cv, receipt, general: owner and HQ only (sensitive member material).
 * - Objects with no ownership record are denied to non-HQ callers.
 */
async function canReadObject(caller: User, objectPath: string): Promise<boolean> {
  if (HQ_ROLES.includes(caller.role)) return true;
  const [upload] = await db
    .select({ ownerId: uploadsTable.ownerId, purpose: uploadsTable.purpose })
    .from(uploadsTable)
    .where(eq(uploadsTable.objectPath, objectPath))
    .limit(1);
  if (!upload) return false;
  if (upload.ownerId === caller.id) return true;

  const [owner] = await db
    .select({ villageId: usersTable.villageId })
    .from(usersTable)
    .where(eq(usersTable.id, upload.ownerId))
    .limit(1);
  const sameVillage = Boolean(
    owner?.villageId && caller.villageId && owner.villageId === caller.villageId,
  );

  switch (upload.purpose) {
    case 'profile_photo':
    case 'meeting_photo':
    case 'meeting_video':
      return sameVillage;
    case 'attendance_video':
      return sameVillage && EXECUTIVE_ROLES.includes(caller.role);
    default:
      // cv | receipt | general — owner and HQ only
      return false;
  }
}

/**
 * POST /storage/uploads/request-url
 *
 * Request a presigned URL for file upload.
 * The client sends JSON metadata (name, size, contentType) — NOT the file.
 * Then uploads the file directly to the returned presigned URL.
 * Requires auth middleware so public callers cannot mint write-capable URLs.
 */
router.post(
  '/storage/uploads/request-url',
  async (req: Request, res: Response) => {
    if (!hasAuthenticatedSession(req)) {
      res.status(401).json({ error: 'Unauthorized' });

      return;
    }

    const parsed = RequestUploadUrlBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Missing or invalid required fields' });
      return;
    }

    try {
      const { name, size, contentType, purpose } = parsed.data;

      const caller = await getCallerUser(req);
      if (!caller) {
        res.status(403).json({ error: 'No member profile' });
        return;
      }

      // Enforce server-side size limits before issuing upload credentials.
      // Videos may be up to 2 GB; all other objects are capped at 50 MB.
      const VIDEO_PURPOSES = ['meeting_video', 'attendance_video'];
      const maxBytes = VIDEO_PURPOSES.includes(purpose ?? '') ? 2 * 1024 * 1024 * 1024 : 50 * 1024 * 1024;
      if (size > maxBytes) {
        res.status(400).json({
          error: VIDEO_PURPOSES.includes(purpose ?? '')
            ? `Video files must be under 2 GB (received ${(size / 1e9).toFixed(2)} GB).`
            : `Files must be under 50 MB (received ${(size / 1e6).toFixed(1)} MB). Use a meeting_video purpose for large videos.`,
        });
        return;
      }

      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      const objectPath =
        objectStorageService.normalizeObjectEntityPath(uploadURL);

      await db
        .insert(uploadsTable)
        .values({ objectPath, ownerId: caller.id, purpose: purpose ?? 'general', contentType: contentType })
        .onConflictDoNothing();

      res.json(
        RequestUploadUrlResponse.parse({
          uploadURL,
          objectPath,
          metadata: { name, size, contentType },
        }),
      );
    } catch (error) {
      req.log.error({ err: error }, 'Error generating upload URL');
      res.status(500).json({ error: 'Failed to generate upload URL' });
    }
  },
);

/**
 * GET /storage/public-objects/*
 *
 * Serve public assets from PUBLIC_OBJECT_SEARCH_PATHS.
 * These are unconditionally public — no authentication or ACL checks.
 * IMPORTANT: Always provide this endpoint when object storage is set up.
 */
router.get(
  '/storage/public-objects/*filePath',
  async (req: Request, res: Response) => {
    try {
      const raw = req.params.filePath;
      const filePath = Array.isArray(raw) ? raw.join('/') : raw;
      const file = await objectStorageService.searchPublicObject(filePath);
      if (!file) {
        res.status(404).json({ error: 'File not found' });
        return;
      }

      const response = await objectStorageService.downloadObject(file);

      res.status(response.status);
      response.headers.forEach((value, key) => res.setHeader(key, value));

      if (response.body) {
        const nodeStream = Readable.fromWeb(
          response.body as ReadableStream<Uint8Array>,
        );
        nodeStream.pipe(res);
      } else {
        res.end();
      }
    } catch (error) {
      req.log.error({ err: error }, 'Error serving public object');
      res.status(500).json({ error: 'Failed to serve public object' });
    }
  },
);

/**
 * GET /storage/objects/*
 *
 * Serve object entities from PRIVATE_OBJECT_DIR.
 * These are served from a separate path from /public-objects and can optionally
 * be protected with authentication or ACL checks based on the use case.
 */
router.get('/storage/objects/*path', async (req: Request, res: Response) => {
  try {
    const raw = req.params.path;
    const wildcardPath = Array.isArray(raw) ? raw.join('/') : raw;
    const objectPath = `/objects/${wildcardPath}`;
    if (!hasAuthenticatedSession(req)) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    const caller = await getCallerUser(req);
    if (!caller || !(await canReadObject(caller, objectPath))) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const objectFile =
      await objectStorageService.getObjectEntityFile(objectPath);

    const response = await objectStorageService.downloadObject(objectFile);

    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));

    if (response.body) {
      const nodeStream = Readable.fromWeb(
        response.body as ReadableStream<Uint8Array>,
      );
      nodeStream.pipe(res);
    } else {
      res.end();
    }
  } catch (error) {
    if (error instanceof ObjectNotFoundError) {
      req.log.warn({ err: error }, 'Object not found');
      res.status(404).json({ error: 'Object not found' });
      return;
    }
    req.log.error({ err: error }, 'Error serving object');
    res.status(500).json({ error: 'Failed to serve object' });
  }
});

export default router;
