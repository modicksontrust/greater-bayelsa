---
name: Orval operationId name collisions
description: Orval derives zod const names from operationIds; OpenAPI component schema names must not collide with them.
---

Orval generates zod consts named after operationIds (e.g. operationId `enrollMember` → `EnrollMemberBody`, `EnrollMemberResponse`). If an OpenAPI component schema is also named `EnrollMemberBody`, codegen emits duplicate exports (TS2308) or type-only-import errors.

**Why:** hit this while rewriting the API spec; renaming component schemas (e.g. `MemberEnrollment`, `ScreeningTurnInput`) and importing the operation-derived names in routes fixed it.

**How to apply:** when adding endpoints to `lib/api-spec/openapi.yaml`, never name a component schema `<OperationId>Body`/`<OperationId>Response`; use distinct domain names.
