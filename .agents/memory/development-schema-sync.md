---
name: Development schema sync
description: Handling a silent failure while replaying the workspace's historical Drizzle migrations in development.
---

When a newly generated Drizzle migration cannot be replayed in development and the command exits without a useful database error, use the workspace's `db push` command to apply the safe schema diff to the development database. Keep the generated migration file in source control for the publish-time database flow.

**Why:** The historical migration chain can fail before reaching a new, valid migration, while schema diffing can still safely apply the intended additive change to the live development schema.

**How to apply:** Generate the migration as usual, attempt the normal migration once, then use `pnpm --filter @workspace/db run push` if replay fails silently. Verify the changed schema and application behavior afterward.