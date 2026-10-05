# Public AI assistant — release and spending controls

## Scope and data boundary
- The endpoint is \`POST /api/public/ask\`. It is a public, non-authenticated **Al Somman quarry-only** assistant, **not** an unrestricted chat product.
- Public prompts are checked against a small domain whitelist and obvious prompt-override patterns **before** calling the paid AI gateway. Such checks are deliberately conservative, not a complete semantic safety guarantee.
- The developer prompt restricts content to the project facts and **never** authorizes disclosure of confidential financial valuation, unverified permits or business information. Provider responses still require manual accuracy checking against source documents.
- Never put \`LOVABLE_API_KEY\` or Supabase service-role keys in \`VITE_*\` variables or in client code. The server reads credentials at runtime and avoids logging questions, AI bodies, IPs, or customer contact details.

## Implemented per-worker spending protection
- \`src/lib/public-ai-budget.ts\`: a sliding window of at most **24 accepted on-topic gateway requests per 60 seconds per server worker**.
- At most **3 concurrent accepted upstream streams per worker**. If quota is hit, the server returns HTTP 429, a friendly localized response and \`Retry-After\`; the expensive gateway is never called.
- The browser sends only the **current question + language**. Prior visible chat messages remain local to the drawer and are not transmitted to the server or paid gateway.
- Assistant request bodies over **4 KiB** are cancelled early, before JSON parsing. The accepted question remains capped at 500 characters.
- Paid upstream calls have a **35-second abort deadline**. Streaming output is relayed with backpressure and capped to **32 KiB**. The paid concurrency slot is released on EOF, stream cancellation and provider errors; release is idempotent.
- The gateway request does not ask for encrypted reasoning payloads; only the public answer stream is needed.
- Off-topic replies stay local and never invoke the gateway. No incoming IP/header values are used as a trusted identifier: \`X-Forwarded-For\` can be forged on untrusted ingress.

## Shared deployment quotas

The checked-in migration `20261003143000_somman_global_public_quotas.sql`
provides a service-role-only atomic public action limit for assistant questions
(48/60s) and investor submissions (12/600s), aggregated across all app
workers with no IP, prompt, identity or email stored.

The matching production database, RLS and RPC privileges were verified.
Production builds therefore default the shared quota **ON** when the optional
server-only `SOMMAN_SHARED_QUOTA_ENABLED` override is blank/omitted.
Development defaults OFF; explicit `true`/`false` remains available as an
operational override. Database accounting failures fail closed before paid AI
calls or inquiry inserts. See `docs/SHARED_QUOTA_ROLLOUT.md`.

The investor form also keeps its per-worker burst cap (six/minute, two
simultaneous writes), plus honeypot, Zod validation, explicit consent and
RLS/service-role restrictions. This is still not a per-person identity or
CAPTCHA guarantee.


## Drawer lifecycle and metered-stream cancellation

The floating assistant remains mounted while closed so completed conversation
messages can survive reopening in the visitor's browser. Prior messages are not
included in subsequent network requests. Closing the drawer by its close icon, floating
assistant icon, or Escape now immediately aborts any in-flight browser fetch.
The stream reader is cancelled and the unfinished assistant placeholder is
removed; a late response cannot be appended after the drawer was closed.

The message log exposes `aria-busy` while a response is streaming and uses
a polite log live region. Browser QA intercepts the assistant endpoint with a
delayed synthetic SSE response, closes the drawer before that response arrives,
and verifies that the busy state clears and no late assistant answer appears.
That test never calls the paid provider.

## What this does NOT protect
The app combines per-worker admission control with the verified shared PostgreSQL action counter. This protects normal multi-worker bursts but is not a substitute for a provider billing ceiling or CDN/WAF controls. Set a Lovable/provider spend budget, alert on AI costs and add edge anti-abuse controls for broad public traffic. Do not present the app as abuse-proof.
- This guard does not authenticate visitors, identify people or store behavioral history.
- It does not provide a CAPTCHA or persistent spam control for the **separate** \`submitInquiry\` lead form. The Supabase investment inquiry table still relies on server-side Zod and service role/RLS restrictions. Consider an approved anti-spam service/WAF or a shared submission counter if volume warrants it.
- Live model success cannot be established by CI without real production credentials. On a protected staging domain, manually test one allowed Arabic question, one allowed English question, a clearly off-topic question, provider outage and cancellation; do not log sensitive conversations.

## Release checklist
- [x] Bound inbound JSON size before parsing and validate schema.
- [x] Locally refuse clearly off-topic requests without upstream spending.
- [x] Apply per-worker request/concurrency budgets and release upon end/cancel.
- [x] Add focused unit tests for quota, bad input, abort/cancel and oversized output.
- [x] Verify the shared PostgreSQL quota across application workers.
- [ ] Add a provider spending ceiling and CDN/WAF anti-abuse controls for broad public traffic.
- [ ] Verify real Lovable gateway streaming on **staging**; set billing alerts.
- [ ] Check the separate investment inquiry form's live Supabase write permission, spam protections and retention policy.
- [ ] Security-review actual hosting secrets, lawful privacy text and document sources before broad public launch.
