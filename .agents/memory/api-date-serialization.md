---
name: Date serialization in API routes
description: Generated response schemas expect ISO strings for timestamps
---

Generated `@workspace/api-zod` response schemas type timestamp fields as `zod.string()`, but Drizzle returns `Date` objects for `timestamp` columns — `.parse()` throws ZodError at runtime (typecheck passes).

**Why:** Hit on first build of the voters routes; the error surfaces as an HTML 500 from Express, not a compile error.

**How to apply:** In every route that returns rows with timestamp columns, map rows through a serializer (`createdAt: row.createdAt.toISOString()`) before calling the response schema's `.parse()`.
