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
 *
 * Bootstrap logic:
 *  1. If FOUNDER_EMAIL is set, only the account with that email may bootstrap.
 *  2. If FOUNDER_EMAIL is not set, the first authenticated user to arrive
 *     becomes the founder (suitable for initial setup / single-org deployments).
 *
 * Once a founder row exists, no further bootstrapping occurs — subsequent
 * unknown accounts receive 403.
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

  // Unknown account — attempt founder bootstrap inside an advisory lock
  const bootstrapped = await db.transaction(async (tx) => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(${FOUNDER_BOOTSTRAP_LOCK})`);

    // If a founder already exists, no further bootstrapping is allowed
    const [existing] = await tx
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.role, "founder"))
      .limit(1);
    if (existing) return null;

    // If FOUNDER_EMAIL is configured, enforce the email check
    const founderEmail = process.env.FOUNDER_EMAIL?.trim().toLowerCase();
    if (founderEmail) {
      let clerkUser: Awaited<ReturnType<typeof clerkClient.users.getUser>>;
      try {
        clerkUser = await clerkClient.users.getUser(userId);
      } catch {
        return "clerk_error" as const;
      }
      const primaryEmail = clerkUser.emailAddresses
        .find((e) => e.id === clerkUser.primaryEmailAddressId)
        ?.emailAddress?.toLowerCase();
      if (primaryEmail !== founderEmail) return "wrong_email" as const;

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
    }

    // No FOUNDER_EMAIL set — first authenticated user becomes founder
    let firstName = "Founder";
    let lastName = "Account";
    try {
      const clerkUser = await clerkClient.users.getUser(userId);
      firstName = clerkUser.firstName || firstName;
      lastName = clerkUser.lastName || lastName;
    } catch {
      // Non-fatal — proceed with placeholder name
    }

    const [created] = await tx
      .insert(usersTable)
      .values({
        clerkUserId: userId,
        membershipCode: "GB-0001",
        role: "founder",
        firstName,
        lastName,
        phone: "",
        vin: "FOUNDER",
        vettingStatus: "vetted",
        joinDate: new Date().toISOString().slice(0, 10),
      })
      .returning();
    return created;
  });

  if (bootstrapped === "clerk_error") {
    res.status(503).json({ error: "Could not verify account email. Try again." });
    return;
  }
  if (bootstrapped === "wrong_email") {
    res.status(403).json({
      error: "No member profile for this account. Contact the platform administrator to be enrolled.",
    });
    return;
  }
  if (!bootstrapped) {
    // Founder exists but this account isn't enrolled
    res.status(403).json({
      error: "No member profile for this account. Contact the platform administrator to be enrolled.",
    });
    return;
  }

  req.user = bootstrapped;
  next();
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
