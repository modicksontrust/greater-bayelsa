# Greater Bayelsa Platform

Phase One platform for Greater Bayelsa, a grassroots leadership-development and civic institution in Bayelsa State, Nigeria. Institutional positioning ("Member Development", leadership pipeline) — never welfare or campaign language. Public institutional site + role-aware member/leader/HQ portal.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server
- `pnpm --filter @workspace/voter-platform run dev` — run the web app
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Seed data: `lib/db/src/seed.ts` (run via tsx from `node_modules/.pnpm/tsx@*/node_modules/tsx/dist/cli.mjs`) — 6 placeholder villages, 2 units each, 60 sample voters (VINs `GB00000001`..`GB00000060`)
- Required env: `DATABASE_URL`, Clerk keys, object storage vars, `AI_INTEGRATIONS_OPENAI_*`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 + Clerk (Replit-managed, cookie auth via proxy middleware)
- DB: PostgreSQL + Drizzle ORM; Zod (`zod/v4`); Orval codegen from `lib/api-spec/openapi.yaml`
- Frontend: React + Vite (wouter, TanStack Query, shadcn/ui, `@clerk/react`, `@workspace/object-storage-web` Uppy uploads)
- AI screening chat: OpenAI via Replit AI integration, model `gpt-5.6-terra` (needs `reasoning_effort: "none"` when using function tools)

## Where things live

- Frontend: `artifacts/voter-platform/`
  - Public: `/`, `/about`, `/leaders`, `/news`, `/news/:id`, `/eligibility`, `/register` (AI screening chat), `/sign-in` (no sign-up — coordinator-only enrollment)
  - Portal: `/dashboard`, `/profile`, `/members`, `/members/:id`, `/enroll` (coordinator-only), `/dues`, `/meetings`, `/meetings/:id`, `/checkin`, `/calendar`, `/updates`, `/feedback`, `/notifications`
  - HQ admin: `/admin/requests`, `/admin/feedback`, `/admin/voters`, `/admin/messaging`, `/admin/content`
- API routes: `artifacts/api-server/src/routes/` (`geography`, `screening`, `voters`, `members`, `dues`, `meetings`, `content`, `storage`)
- Auth middleware: `artifacts/api-server/src/middlewares/auth.ts` (requireAuth/requireUser/requireRole/requireHq/requireCoordinator)
- DB schema: `lib/db/src/schema/` (`geography`, `users`, `voters`, `dues`, `meetings`, `content`)
- API contract: `lib/api-spec/openapi.yaml` (source of truth — run codegen after edits)

## Architecture decisions

- Geography: Zone > District > Village > Unit; Phase One populates six pilot villages ("Pilot Village One".."Six", editable placeholders) in Sagbama Constituency One.
- Roles: member | unit_leader | village_head | assistant | founder. HQ = founder+assistant (see all); village_head = own village; unit_leader = own unit; member = self.
- **Founder bootstrap**: first Clerk sign-in with an empty users table becomes founder (GB-0001), under advisory lock.
- Coordinator-only enrollment: VIN must exist on voter roll AND match the submitted village; mandatory photo; 18+; CV or coordinator bio; Clerk account created with password (placeholder email `member.<vin>@greaterbayelsa.members` when none); Clerk user deleted if the DB transaction fails; membership codes GB-#### derived from max existing code under advisory lock.
- Dues: ₦100/month stored in kobo (10000); unique (user, period); cash bulk recording w/ POS ref; digital gateway stubbed ("coming soon").
- Meetings: village head submits monthly update — ≥5 photos + video ≥120s enforced in zod; QR check-in by `checkinCode` + video-fallback attendance; unique (meeting, user) attendance; video attendance authorized against caller's village/unit scope.
- Screening chat (`/api/screening/chat`, public): privacy-minimizing — voter lookup requires EXACT VIN or phone, returns only `{found, unitName}`; per-IP rate limit 20 turns/10min; eligible → WhatsApp handoff, not found → declined.
- Private object storage: presign requests record ownership in `uploads` table; reads of `/api/storage/objects/*` are authorized per object (HQ any, owner, or same village as owner). Routes verify referenced upload paths belong to the submitter (enrollment, meeting media).
- Addendum implemented: monthly meeting form uses the fixed six-segment agenda (opening, wellbeing, updates, open floor, dues, closing); 3-person village executive (head/secretary/treasurer); annual training module with vetted+dues-current eligibility gate; meeting video duration enforced server-side via ffprobe; QR check-in village-scoped; video attendance restricted to village executive + HQ.
- Routes serialize Drizzle timestamp Dates → ISO strings before Zod response parsing.

## Brand

- Deep emerald green (#196640) + warm gold (#E6A217); Fraunces (serif headings) + Plus Jakarta Sans. No emojis in UI.
- Logo: `artifacts/voter-platform/public/logo.jpg` (`logo.svg` embeds it as a base64 data URI — SVGs loaded via `<img>` cannot reference external files).

## User preferences

- Six pilot villages are editable placeholders until real names are provided; real INEC voter CSV to replace sample voters later.

## Gotchas

- The codegen script sed-rewrites the generated zod import to `zod/v4`. Don't remove that step from `lib/api-spec/package.json`.
- Orval derives zod const names from operationIds (e.g. `EnrollMemberBody`); component schema names must not collide with them.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
