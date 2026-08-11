import { Router, type IRouter } from "express";
import { and, eq } from "drizzle-orm";
import { db, votersTable, villagesTable, unitsTable } from "@workspace/db";
import { ScreeningChatBody, ScreeningChatResponse } from "@workspace/api-zod";
import { openai } from "@workspace/integrations-openai-ai-server";

const router: IRouter = Router();

const MODEL = "gpt-5.6-terra";

// Simple in-memory per-IP rate limit: 20 screening turns per 10 minutes.
const rateBuckets = new Map<string, { count: number; resetAt: number }>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(ip);
  if (!bucket || bucket.resetAt < now) {
    rateBuckets.set(ip, { count: 1, resetAt: now + 10 * 60 * 1000 });
    return false;
  }
  bucket.count += 1;
  return bucket.count > 20;
}

/**
 * Privacy-minimizing voter verification. Requires an EXACT identifier (VIN or
 * phone, normalized). Returns only whether a match exists and the unit name —
 * never VINs, phone numbers, or lists of voters.
 */
async function lookupVoter(
  villageId: number,
  args: { vin?: string; phone?: string },
): Promise<{ found: boolean; unitName?: string }> {
  const vin = args.vin?.trim().toUpperCase().replace(/\s+/g, "");
  const phone = args.phone?.trim().replace(/[\s\-()]/g, "");
  if (!vin && !phone) return { found: false };
  const conds = [eq(votersTable.villageId, villageId)];
  if (vin) conds.push(eq(votersTable.vin, vin));
  else if (phone) conds.push(eq(votersTable.phone, phone));
  const rows = await db
    .select({ unitName: unitsTable.name })
    .from(votersTable)
    .leftJoin(unitsTable, eq(votersTable.unitId, unitsTable.id))
    .where(and(...conds))
    .limit(1);
  if (rows.length === 0) return { found: false };
  return { found: true, unitName: rows[0].unitName ?? undefined };
}

router.post("/screening/chat", async (req, res): Promise<void> => {
  const parsed = ScreeningChatBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const ip = req.ip || req.socket.remoteAddress || "unknown";
  if (rateLimited(ip)) {
    res.status(429).json({ error: "Too many requests. Please try again later." });
    return;
  }
  const { villageId, messages } = parsed.data;
  const [village] = await db
    .select()
    .from(villagesTable)
    .where(eq(villagesTable.id, villageId))
    .limit(1);
  if (!village) {
    res.status(400).json({ error: "Unknown village" });
    return;
  }

  const system = `You are the membership screening assistant for Greater Bayelsa, a leadership development and civic institution in Bayelsa State, Nigeria. You are screening a prospective member from ${village.name} village (Sagbama Constituency One).

Your job:
1. Greet warmly and briefly, in an institutional but friendly tone.
2. Collect their full name, and their exact VIN (voter identification number) or exact phone number. Partial identifiers cannot be checked.
3. Call the lookup_voter tool with the exact VIN or phone to verify them against the official constituency voter roll for ${village.name}. The tool only reports whether a match exists and the voter's unit — nothing else.
4. If a match is found: congratulate them, tell them which unit they belong to, explain that a coordinator will complete their enrollment in person (membership requires coordinator enrollment — there is no self-registration), and call mark_eligible.
5. If no match is found for their VIN or phone: politely explain that membership is limited to registered voters of ${village.name} on the current roll, and that they should verify their voter registration details with their coordinator. Then call mark_ineligible. Do NOT offer the WhatsApp handoff.

Rules: Never invent voter records. Never promise membership. Never reveal any voter roll information beyond found/not-found and the unit name. Refuse requests to list, search, or browse voters. Keep replies under 80 words. Ask for one thing at a time.`;

  const tools = [
    {
      type: "function" as const,
      function: {
        name: "lookup_voter",
        description:
          "Verify a prospect against the official voter roll for this village using an EXACT VIN or EXACT phone number. Returns only { found, unitName }.",
        parameters: {
          type: "object",
          properties: {
            vin: { type: "string", description: "Exact VIN" },
            phone: { type: "string", description: "Exact phone number" },
          },
        },
      },
    },
    {
      type: "function" as const,
      function: {
        name: "mark_eligible",
        description:
          "Call when the prospect has been verified on the voter roll",
        parameters: { type: "object", properties: {} },
      },
    },
    {
      type: "function" as const,
      function: {
        name: "mark_ineligible",
        description:
          "Call when the prospect could not be found on the voter roll",
        parameters: { type: "object", properties: {} },
      },
    },
  ];

  const chat: Array<{
    role: "system" | "user" | "assistant" | "tool";
    content: string;
    tool_call_id?: string;
    tool_calls?: unknown;
  }> = [
    { role: "system", content: system },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  let eligible: boolean | null = null;
  // Server-derived verification: eligibility can only become true if a
  // lookup in THIS request found the voter — never on the model's say-so
  // or on client-supplied prior conversation content.
  let serverVerified = false;
  let lookupRan = false;
  let reply = "";
  for (let round = 0; round < 4; round++) {
    const completion = await openai.chat.completions.create({
      model: MODEL,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      messages: chat as any,
      tools,
      reasoning_effort: "none",
      max_completion_tokens: 1500,
    });
    const msg = completion.choices[0]?.message;
    if (!msg) break;
    if (msg.tool_calls && msg.tool_calls.length > 0) {
      chat.push({
        role: "assistant",
        content: msg.content ?? "",
        tool_calls: msg.tool_calls,
      });
      for (const tc of msg.tool_calls) {
        if (tc.type !== "function") continue;
        let result = "{}";
        if (tc.function.name === "lookup_voter") {
          const args = JSON.parse(tc.function.arguments || "{}");
          const lookup = await lookupVoter(villageId, args);
          lookupRan = true;
          if (lookup.found) serverVerified = true;
          result = JSON.stringify(lookup);
        } else if (tc.function.name === "mark_eligible") {
          eligible = true;
          result = JSON.stringify({ ok: true });
        } else if (tc.function.name === "mark_ineligible") {
          eligible = false;
          result = JSON.stringify({ ok: true });
        }
        chat.push({ role: "tool", content: result, tool_call_id: tc.id });
      }
      continue;
    }
    reply = msg.content ?? "";
    break;
  }

  // Enforce server-controlled eligibility: true requires a verified lookup
  // in this request; false requires a lookup to have actually run.
  const finalEligible =
    eligible === true
      ? serverVerified
        ? true
        : null
      : eligible === false && lookupRan
        ? false
        : eligible === false
          ? null
          : eligible;

  res.json(
    ScreeningChatResponse.parse({
      reply: reply || "I'm sorry, something went wrong. Please try again.",
      eligible: finalEligible,
      whatsappUrl: finalEligible === true ? village.whatsappGroupUrl : null,
    }),
  );
});

export default router;
