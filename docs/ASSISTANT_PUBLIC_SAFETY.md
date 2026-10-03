# Public AI assistant — release and spending controls

## Scope and data boundary
- The endpoint is \`POST /api/public/ask\`. It is a public, non-authenticated **Al Somman quarry-only** assistant, **not** an unrestricted chat product.
- Public prompts are checked against a small domain whitelist and obvious prompt-override patterns **before** calling the paid AI gateway. Such checks are deliberately conservative, not a complete semantic safety guarantee.
- The developer prompt restricts content to the project facts and **never** authorizes disclosure of confidential financial valuation, unverified permits or business information. Provider responses still require manual accuracy checking against source documents.
- Never put \`LOVABLE_API_KEY\` or Supabase service-role keys in \`VITE_*\` variables or in client code. The server reads credentials at runtime and avoids logging questions, AI bodies, IPs, or customer contact details.

## Implemented per-worker spending protection
- \`src/lib/public-ai-budget.ts\`: a sliding window of at most **24 accepted on-topic gateway requests per 60 seconds per server worker**.
- At most **3 concurrent accepted upstream streams per worker**. If quota is hit, the server returns HTTP 429, a friendly localized response and \`Retry-After\`; the expensive gateway is never called.
- Bodies over **24 KiB** are cancelled early, before JSON parsing. Existing Zod question/history limits still apply.
- Paid upstream calls have a **35-second abort deadline**. Streaming output is relayed with backpressure and capped to **128 KiB**. The paid concurrency slot is released on EOF, stream cancellation and provider errors; release is idempotent.
- Off-topic replies stay local and never invoke the gateway. No incoming IP/header values are used as a trusted identifier: \`X-Forwarded-For\` can be forged on untrusted ingress.

## What this does NOT protect
**Per-process memory is not an account-wide or distributed rate limit.** Deployments with multiple worker processes or autoscaling each get independent quotas, and process restarts reset the counters. For a public domain, configure a CDN/WAF/API gateway limit (or use a shared Redis/Postgres atomic counter) ahead of the app, set an OpenAI/Lovable spend budget, and alert on AI costs. Do not present the app as abuse-proof.
- This guard does not authenticate visitors, identify people or store behavioral history.
- It does not provide a CAPTCHA or persistent spam control for the **separate** \`submitInquiry\` lead form. The Supabase investment inquiry table still relies on server-side Zod and service role/RLS restrictions. Consider an approved anti-spam service/WAF or a shared submission counter if volume warrants it.
- Live model success cannot be established by CI without real production credentials. On a protected staging domain, manually test one allowed Arabic question, one allowed English question, a clearly off-topic question, provider outage and cancellation; do not log sensitive conversations.

## Release checklist
- [x] Bound inbound JSON size before parsing and validate schema.
- [x] Locally refuse clearly off-topic requests without upstream spending.
- [x] Apply per-worker request/concurrency budgets and release upon end/cancel.
- [x] Add focused unit tests for quota, bad input, abort/cancel and oversized output.
- [ ] Inspect deployment scaling and add **shared edge rate limit** for real public traffic.
- [ ] Verify real Lovable gateway streaming on **staging**; set billing alerts.
- [ ] Check the separate investment inquiry form's live Supabase write permission, spam protections and retention policy.
- [ ] Security-review actual hosting secrets, lawful privacy text and document sources before broad public launch.
