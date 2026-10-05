# AL SOMMAN — Investor contact notice and consent release checklist

## What was actually implemented

- Visitors must actively **check a previously unchecked, required box** before
  the \`Save details and choose a contact channel\` server action can accept
  their inquiry. The exact same shared Zod schema runs in the browser and
  server. The server rejects omitted, false or string-substituted consent.
- The notice describes the current form fields: name and email required,
  optional phone/company/message, and the purpose of allowing the company's
  investment team to review and respond to the inquiry.
- The notice exposes \`info@alostool.com.sa\` for questions or requests to
  correct or delete submitted details. Such requests are **requests**, not an
  automated deletion function; the company must handle them appropriately.
- The existing form only inserts specified contact fields into its protected
  \`investment_inquiries\` table through a server function with a service-role
  client. It does **not** save the checkmark, a notice version or a consent
  timestamp to the current table; no DB migration was silently applied.
- After a successful save, the visitor may initiate a separate email or
  WhatsApp composition. No automatic message is sent by this site.
- The existing spam honeypot, form length limits, local submission admission,
  optional database quota and read restrictions remain unchanged.

## Why this is not a final privacy-policy certification

The current project source does not include a company-approved comprehensive
privacy notice, an approved personal-data retention period, details of any
processors/transfers or a documented deletion-service workflow. We do not
invent these facts or claim that the new checkbox alone constitutes full
legal/regulatory compliance.

Before public collection of real investment leads, the responsible company
must review and publish an appropriate privacy notice and:
1. Confirm the actual controller and contact details and whether the current
   contact email is monitored for privacy requests.
2. Approve why/where/how long data is retained, who can access it, and how
   correction/deletion requests are fulfilled. Implement DB retention safely
   only after that period is formally approved.
3. Decide whether a durable record of notice version, consent timestamp and
   evidence is required; that needs a reviewed additive migration and separate
   access policy. **No such record is currently stored.**
4. Verify access to the specific Supabase project in \`supabase/config.toml\`,
   review existing RLS and storage, and confirm the optional shared quota
   migration has been applied before enabling its server flag.
5. Test the form in an authorized staging environment with **synthetic only**
   lead details. Read-only browser CI intentionally never saves actual PII.
6. Privately audit any historic tracked \`.env\` values and rotate secrets if
   compromised; do not disclose contents in issues, PRs or logs.

## Sign-off status

- [x] Client and server deny missing or unchecked consent
- [x] Clear bilingual purpose and optional/required field disclosure
- [x] Accessible label, focus indicator and error message
- [x] Read-only browser checks that never submit actual contact details
- [ ] Authorized privacy notice/retention procedure issued by company
- [x] Production database technical controls verified (RLS, client grants and privileged RPC access)
- [ ] Operational privacy-request process verified by company
- [ ] Real-device/browser launch sign-off
