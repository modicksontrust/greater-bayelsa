import { Router, type IRouter } from "express";
import { randomBytes } from "node:crypto";
import { and, eq, desc, count, inArray, type SQL } from "drizzle-orm";
import {
  db,
  meetingsTable,
  meetingMediaTable,
  hqRequestsTable,
  uploadsTable,
  attendanceRecordsTable,
  eventsTable,
  usersTable,
  villagesTable,
  type User,
  type Meeting,
} from "@workspace/db";
import {
  SubmitMeetingBody,
  SubmitMeetingResponse,
  ListMeetingsResponse,
  GetMeetingResponse,
  AttendanceCheckinBody,
  AttendanceCheckinResponse,
  AttendanceVideoBody,
  AttendanceVideoResponse,
  ListHqRequestsResponse,
  UpdateHqRequestBody,
  UpdateHqRequestResponse,
  ListEventsResponse,
  CreateEventBody,
  CreateEventResponse,
} from "@workspace/api-zod";
import {
  requireUser,
  requireRole,
  requireHq,
  isHq,
} from "../middlewares/auth";
import { ObjectStorageService, ObjectNotFoundError } from "../lib/objectStorage";
import { probeVideoDuration } from "../lib/videoProbe";

const objectStorageService = new ObjectStorageService();

const router: IRouter = Router();

function meetingScope(user: User): SQL | undefined {
  if (isHq(user)) return undefined;
  return eq(meetingsTable.villageId, user.villageId ?? -1);
}

const serializeMeeting = (m: Meeting, extra?: Record<string, unknown>) => ({
  ...m,
  createdAt: m.createdAt.toISOString(),
  ...extra,
});

router.post(
  "/meetings",
  requireRole("village_head", "secretary", "assistant", "founder"),
  async (req, res): Promise<void> => {
    const parsed = SubmitMeetingBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const body = parsed.data;
    const caller = req.user!;

    // Determine target village: village_head uses their own village;
    // HQ may specify targetVillageId explicitly, which must resolve to a real village.
    let villageId: number;
    if (isHq(caller)) {
      const targetId = body.targetVillageId ?? caller.villageId;
      if (!targetId) {
        res.status(400).json({
          error: "HQ accounts must supply targetVillageId when submitting a meeting",
        });
        return;
      }
      const [village] = await db
        .select({ id: villagesTable.id })
        .from(villagesTable)
        .where(eq(villagesTable.id, targetId))
        .limit(1);
      if (!village) {
        res.status(400).json({ error: "targetVillageId does not refer to a known village" });
        return;
      }
      villageId = village.id;
    } else {
      if (!caller.villageId) {
        res.status(400).json({ error: "Your account is not linked to a village" });
        return;
      }
      villageId = caller.villageId;
    }

    // Verify every referenced upload exists and belongs to the submitter.
    const mediaPaths = [...body.photos, body.video.objectPath];
    const owned = await db
      .select({ objectPath: uploadsTable.objectPath })
      .from(uploadsTable)
      .where(
        and(
          inArray(uploadsTable.objectPath, mediaPaths),
          eq(uploadsTable.ownerId, caller.id),
        ),
      );
    if (owned.length !== new Set(mediaPaths).size) {
      res.status(400).json({
        error: "One or more media files were not uploaded by your account",
      });
      return;
    }
    // Server-side video duration verification via ffprobe.
    // The client-supplied durationSeconds is informational only; we re-measure.
    try {
      const videoFile = await objectStorageService.getObjectEntityFile(
        body.video.objectPath,
      );
      const actualSeconds = await probeVideoDuration(videoFile);
      if (actualSeconds < 120) {
        res.status(400).json({
          error: `Video is ${Math.floor(actualSeconds)}s — it must be at least 2 minutes (120s). Upload a longer recording.`,
        });
        return;
      }
      // Overwrite the client-supplied duration with the server-verified value.
      body.video.durationSeconds = Math.floor(actualSeconds);
    } catch (err: any) {
      if (err instanceof ObjectNotFoundError) {
        res.status(400).json({ error: "Video object not found in storage" });
      } else {
        req.log.error({ err }, "ffprobe video duration check failed");
        res.status(400).json({
          error: "Could not verify video duration. Ensure the file is a valid video (MP4 recommended).",
        });
      }
      return;
    }

    // Serialize the structured six-segment agenda into the stored discussionPoints
    // column so historical reads remain backward-compatible.
    const SEGMENT_LABELS: Record<string, string> = {
      opening: "1. Opening",
      wellbeing: "2. Wellbeing / Welfare Check",
      updates: "3. Updates & Reporting",
      openFloor: "4. Open Floor",
      dues: "5. Dues Confirmation & Administrative Matters",
      closing: "6. Closing Remarks",
    };
    const agenda = body.agenda;
    const discussionPoints = Object.entries(SEGMENT_LABELS)
      .map(([key, label]) => `${label}\n${(agenda as Record<string, string>)[key]}`)
      .join("\n\n");

    const checkinCode = randomBytes(6).toString("hex");
    const [meeting] = await db
      .insert(meetingsTable)
      .values({
        villageId,
        heldOn: body.heldOn,
        attendanceCount: body.attendanceCount,
        unitBreakdown: body.unitBreakdown ?? null,
        discussionPoints,
        submittedById: caller.id,
        checkinCode,
      })
      .returning();
    await db.insert(meetingMediaTable).values([
      ...body.photos.map((objectPath) => ({
        meetingId: meeting.id,
        kind: "photo",
        objectPath,
      })),
      {
        meetingId: meeting.id,
        kind: "video",
        objectPath: body.video.objectPath,
        durationSeconds: body.video.durationSeconds,
      },
    ]);
    if (body.hqRequest && body.hqRequest.trim()) {
      await db.insert(hqRequestsTable).values({
        meetingId: meeting.id,
        villageId,
        submittedById: caller.id,
        body: body.hqRequest.trim(),
      });
    }
    res.status(201).json(SubmitMeetingResponse.parse(serializeMeeting(meeting)));
  },
);

router.get("/meetings", requireUser, async (req, res): Promise<void> => {
  const conds: SQL[] = [];
  const scope = meetingScope(req.user!);
  if (scope) conds.push(scope);
  if (req.query.villageId)
    conds.push(eq(meetingsTable.villageId, Number(req.query.villageId)));
  const rows = await db
    .select({ meeting: meetingsTable, villageName: villagesTable.name })
    .from(meetingsTable)
    .innerJoin(villagesTable, eq(meetingsTable.villageId, villagesTable.id))
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(meetingsTable.heldOn))
    .limit(200);
  const verified = await db
    .select({ meetingId: attendanceRecordsTable.meetingId, n: count() })
    .from(attendanceRecordsTable)
    .groupBy(attendanceRecordsTable.meetingId);
  res.json(
    ListMeetingsResponse.parse(
      rows.map((r) =>
        serializeMeeting(r.meeting, {
          villageName: r.villageName,
          verifiedAttendance:
            verified.find((v) => v.meetingId === r.meeting.id)?.n ?? 0,
        }),
      ),
    ),
  );
});

router.get("/meetings/:id", requireUser, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const scope = meetingScope(req.user!);
  const [row] = await db
    .select({ meeting: meetingsTable, villageName: villagesTable.name })
    .from(meetingsTable)
    .innerJoin(villagesTable, eq(meetingsTable.villageId, villagesTable.id))
    .where(scope ? and(eq(meetingsTable.id, id), scope) : eq(meetingsTable.id, id))
    .limit(1);
  if (!row) {
    res.status(404).json({ error: "Meeting not found" });
    return;
  }
  const media = await db
    .select()
    .from(meetingMediaTable)
    .where(eq(meetingMediaTable.meetingId, id));
  const attendance = await db
    .select({
      rec: attendanceRecordsTable,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
    })
    .from(attendanceRecordsTable)
    .innerJoin(usersTable, eq(attendanceRecordsTable.userId, usersTable.id))
    .where(eq(attendanceRecordsTable.meetingId, id));
  res.json(
    GetMeetingResponse.parse(
      serializeMeeting(row.meeting, {
        villageName: row.villageName,
        verifiedAttendance: attendance.length,
        media: media.map(({ createdAt: _c, meetingId: _m, ...m }) => m),
        attendance: attendance.map((a) => ({
          ...a.rec,
          memberName: `${a.firstName} ${a.lastName}`,
          createdAt: a.rec.createdAt.toISOString(),
        })),
      }),
    ),
  );
});

router.post("/attendance/checkin", requireUser, async (req, res): Promise<void> => {
  const parsed = AttendanceCheckinBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [meeting] = await db
    .select()
    .from(meetingsTable)
    .where(eq(meetingsTable.checkinCode, parsed.data.code))
    .limit(1);
  if (!meeting) {
    res.status(404).json({ error: "Invalid check-in code" });
    return;
  }
  // Village-scope enforcement: the caller must belong to the meeting's village.
  // QR codes may circulate; prevent cross-village attendance falsification.
  const caller = req.user!;
  if (!isHq(caller) && caller.villageId !== meeting.villageId) {
    res.status(403).json({
      error: "This check-in code is for a meeting in a different village",
    });
    return;
  }
  const [existing] = await db
    .select({ id: attendanceRecordsTable.id })
    .from(attendanceRecordsTable)
    .where(
      and(
        eq(attendanceRecordsTable.meetingId, meeting.id),
        eq(attendanceRecordsTable.userId, req.user!.id),
      ),
    )
    .limit(1);
  if (existing) {
    res.status(409).json({ error: "Already checked in to this meeting" });
    return;
  }
  const [rec] = await db
    .insert(attendanceRecordsTable)
    .values({ meetingId: meeting.id, userId: caller.id, method: "qr" })
    .returning();
  res.status(201).json(
    AttendanceCheckinResponse.parse({
      ...rec,
      createdAt: rec.createdAt.toISOString(),
    }),
  );
});

router.post(
  "/attendance/video",
  // Video attendance is a village-executive responsibility — head, secretary,
  // treasurer — plus HQ oversight. unit_leader is intentionally excluded.
  requireRole("village_head", "secretary", "treasurer", "assistant", "founder"),
  async (req, res): Promise<void> => {
    const parsed = AttendanceVideoBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const { meetingId, userId, videoObjectPath } = parsed.data;
    const caller = req.user!;
    const [meeting] = await db
      .select({ villageId: meetingsTable.villageId })
      .from(meetingsTable)
      .where(eq(meetingsTable.id, meetingId))
      .limit(1);
    if (!meeting) {
      res.status(404).json({ error: "Meeting not found" });
      return;
    }
    const [target] = await db
      .select({ villageId: usersTable.villageId, unitId: usersTable.unitId })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);
    if (!target) {
      res.status(404).json({ error: "Member not found" });
      return;
    }
    if (!isHq(caller)) {
      if (
        caller.villageId !== meeting.villageId ||
        target.villageId !== meeting.villageId
      ) {
        res.status(403).json({ error: "Outside your scope" });
        return;
      }
      if (caller.role === "unit_leader" && target.unitId !== caller.unitId) {
        res.status(403).json({ error: "Outside your unit" });
        return;
      }
    }
    // The video evidence must be an upload the caller made themselves
    // (recorded at the meeting) — reject arbitrary/foreign object paths.
    const ALLOWED_VIDEO_CONTENT_TYPES = [
      "video/mp4", "video/quicktime", "video/x-msvideo",
      "video/webm", "video/ogg", "video/3gpp", "video/3gpp2",
    ];
    const [videoUpload] = await db
      .select({
        ownerId: uploadsTable.ownerId,
        purpose: uploadsTable.purpose,
        contentType: uploadsTable.contentType,
      })
      .from(uploadsTable)
      .where(eq(uploadsTable.objectPath, videoObjectPath))
      .limit(1);
    if (!videoUpload || videoUpload.ownerId !== caller.id) {
      res.status(400).json({
        error: "Video must be a file uploaded by your own account",
      });
      return;
    }
    if (videoUpload.purpose !== "attendance_video") {
      res.status(400).json({
        error:
          "The referenced file was not uploaded as an attendance video. Re-upload with purpose='attendance_video'.",
      });
      return;
    }
    // Validate using ffprobe — the stored contentType is caller-supplied and
    // cannot be trusted. Any non-video payload will make ffprobe fail/return
    // duration 0 which we reject outright.
    try {
      const videoFile = await objectStorageService.getObjectEntityFile(videoObjectPath);
      await probeVideoDuration(videoFile);
    } catch (err: any) {
      if (err instanceof ObjectNotFoundError) {
        res.status(400).json({ error: "Attendance video not found in storage" });
      } else {
        res.status(400).json({
          error:
            "The uploaded file does not appear to be a valid video. Upload an MP4 or similar video file.",
        });
      }
      return;
    }
    const [existing] = await db
      .select({ id: attendanceRecordsTable.id })
      .from(attendanceRecordsTable)
      .where(
        and(
          eq(attendanceRecordsTable.meetingId, meetingId),
          eq(attendanceRecordsTable.userId, userId),
        ),
      )
      .limit(1);
    if (existing) {
      res.status(409).json({ error: "Member already has an attendance record" });
      return;
    }
    const [rec] = await db
      .insert(attendanceRecordsTable)
      .values({ meetingId, userId, method: "video", videoObjectPath })
      .returning();
    res.status(201).json(
      AttendanceVideoResponse.parse({
        ...rec,
        createdAt: rec.createdAt.toISOString(),
      }),
    );
  },
);

router.get("/hq-requests", requireUser, async (req, res): Promise<void> => {
  const user = req.user!;
  const conds: SQL[] = [];
  if (!isHq(user)) conds.push(eq(hqRequestsTable.villageId, user.villageId ?? -1));
  if (req.query.status)
    conds.push(eq(hqRequestsTable.status, String(req.query.status)));
  const rows = await db
    .select({
      r: hqRequestsTable,
      villageName: villagesTable.name,
      firstName: usersTable.firstName,
      lastName: usersTable.lastName,
    })
    .from(hqRequestsTable)
    .innerJoin(villagesTable, eq(hqRequestsTable.villageId, villagesTable.id))
    .innerJoin(usersTable, eq(hqRequestsTable.submittedById, usersTable.id))
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(hqRequestsTable.createdAt))
    .limit(200);
  res.json(
    ListHqRequestsResponse.parse(
      rows.map((row) => ({
        ...row.r,
        villageName: row.villageName,
        submitterName: `${row.firstName} ${row.lastName}`,
        createdAt: row.r.createdAt.toISOString(),
      })),
    ),
  );
});

router.patch("/hq-requests/:id", requireHq, async (req, res): Promise<void> => {
  const parsed = UpdateHqRequestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [updated] = await db
    .update(hqRequestsTable)
    .set({
      status: parsed.data.status,
      response: parsed.data.response ?? undefined,
      respondedById: req.user!.id,
    })
    .where(eq(hqRequestsTable.id, Number(req.params.id)))
    .returning();
  if (!updated) {
    res.status(404).json({ error: "Request not found" });
    return;
  }
  res.json(
    UpdateHqRequestResponse.parse({
      ...updated,
      createdAt: updated.createdAt.toISOString(),
    }),
  );
});

router.get("/events", requireUser, async (req, res): Promise<void> => {
  const user = req.user!;
  const rows = await db
    .select()
    .from(eventsTable)
    .orderBy(eventsTable.startsAt)
    .limit(500);
  const visible = rows.filter((e) => {
    if (e.scope === "org") return true;
    if (isHq(user)) return true;
    if (e.scope === "village") return e.villageId === user.villageId;
    if (e.scope === "unit")
      return e.unitId === user.unitId || e.villageId === user.villageId;
    return false;
  });
  res.json(
    ListEventsResponse.parse(
      visible.map((e) => ({
        ...e,
        startsAt: e.startsAt.toISOString(),
        createdAt: e.createdAt.toISOString(),
      })),
    ),
  );
});

router.post(
  "/events",
  requireRole("unit_leader", "village_head", "assistant", "founder"),
  async (req, res): Promise<void> => {
    const parsed = CreateEventBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message });
      return;
    }
    const body = parsed.data;
    const caller = req.user!;
    // Only HQ can create org-wide fixed dates
    if (body.scope === "org" && !isHq(caller)) {
      res
        .status(403)
        .json({ error: "Only headquarters can set organization-wide dates" });
      return;
    }
    let villageId = body.villageId ?? null;
    let unitId = body.unitId ?? null;
    if (!isHq(caller)) {
      villageId = caller.villageId;
      unitId = body.scope === "unit" ? caller.unitId : null;
    }
    const [created] = await db
      .insert(eventsTable)
      .values({
        title: body.title,
        description: body.description ?? null,
        location: body.location ?? null,
        startsAt: new Date(body.startsAt),
        scope: body.scope,
        villageId,
        unitId,
        createdById: caller.id,
      })
      .returning();
    res.status(201).json(
      CreateEventResponse.parse({
        ...created,
        startsAt: created.startsAt.toISOString(),
        createdAt: created.createdAt.toISOString(),
      }),
    );
  },
);

router.delete("/events/:id", requireUser, async (req, res): Promise<void> => {
  const id = Number(req.params.id);
  const [event] = await db
    .select()
    .from(eventsTable)
    .where(eq(eventsTable.id, id))
    .limit(1);
  if (!event) {
    res.status(404).json({ error: "Event not found" });
    return;
  }
  const caller = req.user!;
  if (!isHq(caller) && event.createdById !== caller.id) {
    res.status(403).json({ error: "You can only delete your own events" });
    return;
  }
  await db.delete(eventsTable).where(eq(eventsTable.id, id));
  res.status(204).end();
});

export default router;
