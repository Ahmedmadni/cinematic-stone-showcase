# AL SOMMAN — Arabic / English and quarry-only assistant

## Language
- The site keeps its original one-page route \`/\`, with Arabic as the default SSR language. A persistent floating AR/EN control changes \`html[lang]\`, document direction, major copy, sourced site/fleet/permit facts, maps text, gallery captions and contact message drafts.
- Selected language is stored in local browser storage when available. If unavailable, the site stays functional and defaults to Arabic on reload.
- Permit numbers, certificate identifiers, actual source figures and warnings about historical licence status **never change meaning** with translation. The site is not a licensed survey or confirmation of current certificates.
- Site font choices: Cairo for headings, Noto Kufi Arabic for body, Manrope for English, preserving logo artwork unchanged.

## Brand
- The original \`alostool-official-logo.png.asset.json\` supplied in the project is reused. Do not regenerate or approximate the trademark or substitute an AI-made logo.
- Styling aligns to the supplied brand-use palette: gold \`#F5B51B\`, charcoal \`#252525\`, graphite \`#444444\`, white \`#FFFFFF\`, silver \`#F3F3F3\`. On light backgrounds, a deeper gold is used to maintain legible contrast.
- Any final claim of *exact* corporate brand-guide compliance requires a signed/current style guide and authorized logo variants; there is no separate approved brand manual in this repository.

## Floating assistant
- The floating specialist chat only handles questions about Al Somman quarry and crusher: documented equipment, operational workflow, locations, quarry areas, referenced licences and certificates, and investor contact information.
- The API runs a deterministic domain/off-topic check **on the server before the paid AI gateway**. Clearly unrelated or instruction-override questions get a polite Arabic or English response. The upstream developer prompt strictly limits facts and disallows sharing nonpublic financial values.
- This is defense-in-depth, not a formal guarantee against every adversarial question. Keep API gateway keys server-side, privately monitor abuse and add rate limiting before a large public launch.
- There is no external request when an off-topic question is refused. The front end does not automatically submit real investor contact forms or send email/WhatsApp messages in tests.

## Publication checks
- [ ] Approve brand styling against the latest official brand standards and source logo on real desktop and mobile screens.
- [ ] Verify English pages manually for idiomatic wording and accessibility, including forms and dynamic captions.
- [ ] Verify on-topic assistant answers on the deployed, properly configured gateway with non-sensitive test questions; never put a private API key in client code.
- [ ] Test cross-browser Safari/Firefox, actual mobiles, Google satellite imagery and performance.
- [ ] Privately inspect tracked \`.env\` in Git history for actual secrets and rotate them if any were committed; do not expose file contents during audit.
