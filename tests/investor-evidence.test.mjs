import test from "node:test";
import assert from "node:assert/strict";
import {
  diligenceChecklist,
  evidenceDisclaimers,
  evidenceIssuer,
  investorJourney,
  isoEvidence,
} from "../src/data/investor-evidence.ts";

test("ISO reference display follows three recorded standards with document source caveats", () => {
  assert.deepEqual(
    isoEvidence.map((entry) => entry.standard),
    ["ISO 9001:2015", "ISO 14001:2015", "ISO 45001:2018"],
  );
  assert.equal(new Set(isoEvidence.map((entry) => entry.number)).size, 3);
  assert.ok(isoEvidence.every((entry) => entry.issue === "18/08/2025"));
  assert.ok(isoEvidence.every((entry) => entry.expires === "17/08/2028"));
  assert.match(evidenceIssuer, /QCC/);
  assert.match(evidenceDisclaimers.iso, /ليست نسخًا أصلية/);
  assert.match(evidenceDisclaimers.iso, /يلزم/);
});

test("permit and due diligence warnings do not present historic records as verified today", () => {
  assert.match(evidenceDisclaimers.permits, /الاستعلام الرسمي/);
  assert.match(evidenceDisclaimers.permits, /حقوق النقل/);
  assert.match(evidenceDisclaimers.documents, /لا تفيد/);
  assert.equal(new Set(diligenceChecklist.map((item) => item.id)).size, 5);
  assert.ok(diligenceChecklist.every((item) => item.title.length > 3 && item.detail.length > 30));
});

test("investor journey routes only to existing public anchors without downloads or private values", () => {
  assert.deepEqual(
    investorJourney.map((step) => step.href),
    ["#الفرصة", "#الوثائق", "#التواصل"],
  );
  const safe = JSON.stringify({ diligenceChecklist, isoEvidence, investorJourney, evidenceDisclaimers });
  assert.doesNotMatch(safe, /23,?702,?791|9,?195,?278|23\.7\s*مليون/);
  assert.doesNotMatch(safe, /\.pdf|\.docx|storage\/v1\/object|signedUrl|https?:\/\/[^"]+\.(pdf|docx)/i);
});
