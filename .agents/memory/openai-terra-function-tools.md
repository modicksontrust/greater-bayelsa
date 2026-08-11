---
name: gpt-5.6-terra with function tools
description: The Replit AI integration model gpt-5.6-terra requires reasoning_effort "none" when passing function tools.
---

When calling chat completions on `gpt-5.6-terra` (Replit OpenAI AI integration) with `tools`, you must pass `reasoning_effort: "none"` or the call misbehaves/fails.

**Why:** discovered while building the public AI screening chat; tool calls only worked reliably with reasoning disabled.

**How to apply:** any chat-completions call to this model that includes function tools should set `reasoning_effort: "none"` and cap `max_completion_tokens`.
