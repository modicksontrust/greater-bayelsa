import type { Request, Response, NextFunction } from "express";
import { getAuth, clerkClient } from "@clerk/express";
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
 * Bootstrap: if no founder exists yet, the account whose primary email
 * matches FOUNDER_EMAIL becomes the founder (serialized with an advisory lock).
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

  // Fast path: user already enrolled
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

  // Founder bootstrap: compare the signed-in user's primary email to FOUNDER_EMAIL
  const founderEmail = process.env.FOUNDER_EMAIL?.trim().toLowerCase();
  if (!founderEmail) {
    res.status(503).json({
      error: "FOUNDER_EMAIL is not configured. Contact your administrator.",
    });
    return;
  }

  // Fetch the Clerk user to get their primary email address
  let clerkUser: Awaited<ReturnType<typeof clerkClient.users.getUser>>;
  try {
    clerkUser = await clerkClient.users.getUser(userId);
  } catch {
    res.status(503).json({ error: "Could not verify account email." });
    return;
  }

  const primaryEmail = clerkUser.emailAddresses
    .find((e) => e.id === clerkUser.primaryEmailAddressId)
    ?.emailAddress?.toLowerCase();

  if (primaryEmail !== founderEmail) {
    res.status(403).json({
      error:
        "No member profile for this account. Contact the platform administrator to be enrolled.",
    });
    return;
  }

  // Email matches — bootstrap as founder if none exists yet
  const bootstrapped = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(${FOUNDER_BOOTSTRAP_LOCK})`);
    const [existing] = await tx
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.role, "founder"))
      .limit(1);
    if (existing) return null;
    const [created] = await tx
      .insert(usersTable)
      .values({
        clerkUserId: userId,
        membershipCode: "GB-0001",
        role: "founder",
        firstName: clerkUser.firstName || "Founder",
        lastName: clerkUser.lastName || "Account",
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

  // Founder row already exists but isn't linked to this Clerk ID
  res.status(403).json({ error: "No member profile for this account." });
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
