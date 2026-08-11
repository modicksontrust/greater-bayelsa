import type { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { eq, sql } from "drizzle-orm";
import { db, usersTable, type User } from "@workspace/db";

declare global {
  namespace Express {
    interface Request {
      clerkUserId?: string;
      user?: User;
    }
  }
}

export const HQ_ROLES = ["founder", "assistant"] as const;
export const COORDINATOR_ROLES = [
  "founder",
  "assistant",
  "village_head",
  "unit_leader",
] as const;

export function isHq(user: User): boolean {
  return user.role === "founder" || user.role === "assistant";
}

export function isCoordinator(user: User): boolean {
  return (COORDINATOR_ROLES as readonly string[]).includes(user.role);
}

const FOUNDER_BOOTSTRAP_LOCK = 874_212;

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.clerkUserId = userId;
  next();
}

/**
 * Loads the platform user for the signed-in Clerk account.
 * Bootstrap: if no founder exists yet, the first signed-in Clerk account
 * becomes the founder (serialized with an advisory lock).
 */
export async function requireUser(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  req.clerkUserId = userId;
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.clerkUserId, userId))
    .limit(1);
  if (user) {
    req.user = user;
    next();
    return;
  }
  // Founder bootstrap: only the explicitly trusted Clerk user ID may become the
  // first founder. This prevents any public sign-up from claiming HQ authority.
  const trustedFounderClerkId = process.env.FOUNDER_CLERK_USER_ID;
  if (!trustedFounderClerkId) {
    // Without a configured trust anchor the platform cannot bootstrap safely.
    res.status(503).json({
      error:
        "FOUNDER_CLERK_USER_ID is not configured. Contact your administrator.",
    });
    return;
  }
  if (userId !== trustedFounderClerkId) {
    // Unknown account on a fresh deployment — not the trusted founder.
    res.status(403).json({
      error:
        "No member profile for this account. If you are the platform administrator, ensure FOUNDER_CLERK_USER_ID is set to your Clerk user ID.",
    });
    return;
  }
  // The authenticated user matches the trusted identity. Bootstrap as founder
  // only if no founder exists yet (advisory lock prevents races).
  const bootstrapped = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(${FOUNDER_BOOTSTRAP_LOCK})`);
    const [founder] = await tx
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.role, "founder"))
      .limit(1);
    if (founder) return null;
    const [created] = await tx
      .insert(usersTable)
      .values({
        clerkUserId: userId,
        membershipCode: "GB-0001",
        role: "founder",
        firstName: "Founder",
        lastName: "Account",
        phone: "",
        vin: "FOUNDER",
        vettingStatus: "vetted",
        joinDate: new Date().toISOString().slice(0, 10),
      })
      .returning();
    return created;
  });
  if (bootstrapped) {
    req.user = bootstrapped;
    next();
    return;
  }
  // A founder already exists for this deployment; the trusted user's profile
  // should have been enrolled under the same Clerk ID. Deny if it wasn't.
  res.status(403).json({ error: "No member profile for this account" });
}

export function requireRole(...roles: string[]) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    await requireUser(req, res, () => {
      if (!roles.includes(req.user!.role)) {
        res.status(403).json({ error: "Insufficient permissions" });
        return;
      }
      next();
    });
  };
}

export const requireHq = requireRole(...HQ_ROLES);
export const requireCoordinator = requireRole(...COORDINATOR_ROLES);
