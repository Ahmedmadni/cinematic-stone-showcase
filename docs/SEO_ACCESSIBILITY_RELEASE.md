# AL SOMMAN — Search, sharing and accessibility release boundary

## Implemented and verified in source

- The root SSR fallback and the single `/` route both describe the **English-first**
  Al Somman investment presentation. Arabic remains available through the
  persistent language control; this does not create duplicate language URLs.
- Search robots may crawl the public presentation but are asked not to crawl
  `/api/`, which is a request endpoint rather than public page content.
- The page emits a conservative robots directive `index,follow,max-image-preview:large`
  and Al Ostool site-name metadata.
- The official company identity remains textually attributed to
  **Al Ostool Alaali Contracting Company**. The page does not claim that
  illustrative quarry images are official site photography.
- A bilingual keyboard **Skip to main content** control is visually hidden
  until focused, uses the Al Ostool dark/gold identity, and has a
  reduced-motion fallback.
- Existing JSON-LD stays limited to a WebPage/Place/Organization description.
  It does not claim ratings, prices, permit validity, financial valuation or
  availability that the source material does not verify.

## Deliberately not invented

A production hostname has not been approved in repository configuration.
Therefore this branch does **not** invent:
- an absolute canonical hostname,
- a Sitemap URL in robots.txt,
- OpenGraph/social URLs pointing at an assumed domain,
- a Search Console verification token,
- a production analytics identifier.

The route currently uses relative `/` canonical/OpenGraph references. Replace
them with the final absolute HTTPS URL only after the public domain is known.

## Social preview image

No dedicated approved social-share image is shipped by this phase. Current
quarry/equipment photography remains explicitly illustrative, so it should not
be silently promoted as a real-site OpenGraph hero. A future approved social
card should use the official Al Ostool identity and either approved real
photography or clearly labelled illustrative artwork.

## Production launch checks

- [ ] Confirm final HTTPS hostname and redirects (www/non-www if applicable).
- [ ] Replace relative canonical/OG URL with that exact canonical origin.
- [ ] Generate sitemap for the approved origin and add its absolute URL to robots.txt.
- [ ] Add an approved OpenGraph/Twitter image and verify its public 200 URL.
- [ ] Validate rendered metadata in the deployed HTML, not only localhost.
- [ ] Test keyboard skip navigation, 200% zoom and visible focus on a physical device/browser combination.
- [ ] Verify indexing choice with the company before exposing the investment presentation to public search engines.

Automated localhost tests are evidence of implementation behavior only; they
cannot certify search-engine indexing or a production CDN configuration.
