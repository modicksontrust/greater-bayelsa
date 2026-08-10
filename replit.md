# Greater Bayelsa Platform

Full platform for the Greater Bayelsa grassroots NGO (Bayelsa State, Nigeria): public website, member registration & dashboards, and an admin portal that includes the original voter management tools.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server
- `pnpm --filter @workspace/voter-platform run dev` — run the web app
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL`, `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `VITE_CLERK_PUBLISHABLE_KEY`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 + Clerk (Replit-managed, cookie auth via proxy middleware)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Frontend: React + Vite (wouter, TanStack Query, shadcn/ui, Recharts, `@clerk/react`)

## Where things live

- Frontend app: `artifacts/voter-platform/`
  - Public: `/`, `/about`, `/contact`, `/news`, `/news/:id`, `/sign-in`, `/sign-up`
  - Member: `/onboarding`, `/dashboard`, `/profile`, `/opportunities`, `/notifications`
  - Admin: `/admin`, `/admin/members`, `/admin/content`, `/admin/notifications`, `/admin/voters`, `/admin/voters/:id`, `/admin/register`
- API routes: `artifacts/api-server/src/routes/` (`voters.ts`, `members.ts`, `content.ts`)
- Auth middleware: `artifacts/api-server/src/middlewares/` (`auth.ts` — requireAuth/requireMember/requireAdmin, `clerkProxyMiddleware.ts`)
- DB schema: `lib/db/src/schema/` (`voters.ts`, `members.ts` — members, posts, events, notifications)
- API contract: `lib/api-spec/openapi.yaml` (source of truth — run codegen after edits)

## Architecture decisions

- Auth: Replit-managed Clerk. Web is cookie-based; Clerk proxy middleware mounted before body parsers.
- **First member to register automatically becomes admin** (bootstrap rule in POST /members).
- Registration: Clerk sign-up → `/onboarding` matches VIN/phone against `voters` → creates member with auto code `GB-00001` style, linked voterId, catchment from voter record.
- Roles: member | unit_coordinator | ward_coordinator | lga_coordinator | admin. Coordinator lookup walks unit → ward → LGA.
- Notifications: `member_id` null = broadcast to all members.
- Single `voters` table; ward/polling unit free-text, LGA one of Bayelsa's 8 LGAs (hardcoded in frontend).
- Routes serialize Drizzle timestamp Dates → ISO strings before Zod response parsing (generated schemas expect strings).

## Brand

- Deep emerald green (#196640) + warm gold (#E6A217); Fraunces (serif headings) + Plus Jakarta Sans.
- Logo: `artifacts/voter-platform/public/logo.jpg` (`logo.svg` embeds it as a base64 data URI — SVGs loaded via `<img>` cannot reference external files).

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- The codegen script sed-rewrites the generated zod import to `zod/v4` (Orval emits v4-style `z.int()` but imports the v3 entrypoint). Don't remove that step from `lib/api-spec/package.json`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
