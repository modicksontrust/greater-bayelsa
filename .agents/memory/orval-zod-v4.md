---
name: Orval zod v4 import fix
description: Why the codegen script rewrites the generated zod import to zod/v4
---

Orval v8's zod client emits zod v4-style API calls (e.g. `zod.int()`) but generates `import * as zod from 'zod'`, which resolves to the v3 entrypoint of zod 3.25.x — producing TS2339 errors during `typecheck:libs`.

**Why:** Discovered on first codegen with integer fields in the spec (Aug 2026). Health-only template spec never triggered it.

**How to apply:** The `codegen` script in `lib/api-spec/package.json` includes a `sed` step rewriting the import to `zod/v4` after orval runs. Don't remove it; re-add it if the script is regenerated.
