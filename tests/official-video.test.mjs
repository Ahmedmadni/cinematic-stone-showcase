import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";

const manifest = JSON.parse(await readFile(new URL("../docs/official-video-source-manifest.json", import.meta.url), "utf8"));
test("supplied film derivatives retain verified bytes and continuous source boundaries", async () => {
  assert.equal(manifest.source.format.size, "55344203");
  assert.equal(manifest.source.format.duration, "176.984000");
  assert.deepEqual(manifest.videos.map(v => v.id), ["hero", "production", "fleet", "facilities", "quarry", "full-tour"]);
  assert.match(manifest.source_sha256, /^[a-f0-9]{64}$/);
  for (const video of manifest.videos) {
    for (const asset of [video, video.webm, video.poster]) {
      const bytes = await readFile(new URL("../" + asset.path, import.meta.url));
      assert.equal(bytes.length, asset.bytes);
      assert.equal(createHash("sha256").update(bytes).digest("hex"), asset.sha256, asset.path);
    }
    assert.ok(video.start_seconds + video.duration_seconds <= 177.1);
    assert.deepEqual(video.streams.map(s => s.codec_type), ["video"], "the supplied recording has no audio");
    assert.equal(video.streams[0].width, video.id === "full-tour" ? 960 : 1280);
    assert.equal(video.streams[0].height, video.id === "full-tour" ? 540 : 720);
    assert.equal(video.streams[0].avg_frame_rate, "24/1");
    assert.ok(video.bytes <= (video.id === "full-tour" ? 11.5 * 1024 * 1024 : 1.2 * 1024 * 1024));
    assert.ok(video.webm.bytes <= (video.id === "full-tour" ? 11.5 * 1024 * 1024 : 1.2 * 1024 * 1024));
    assert.deepEqual(video.webm.streams.map(s => s.codec_type), ["video"]);
    assert.equal(video.webm.streams[0].codec_name, "vp9");
    const webm = await readFile(new URL("../" + video.webm.path, import.meta.url));
    assert.equal(webm.subarray(0, 4).toString("hex"), "1a45dfa3");
    assert.ok(video.poster.bytes <= 200 * 1024);
  }
});

test("MP4 containers are complete and seek metadata precedes pixel payload", async () => {
  for (const video of manifest.videos) {
    const bytes = await readFile(new URL("../" + video.path, import.meta.url));
    const boxes = [];
    let offset = 0;
    while (offset < bytes.length) {
      assert.ok(offset + 8 <= bytes.length, video.id + ": truncated box");
      const size = bytes.readUInt32BE(offset);
      assert.ok(size >= 8 && offset + size <= bytes.length, video.id + ": invalid MP4 box length");
      boxes.push(bytes.toString("ascii", offset + 4, offset + 8));
      offset += size;
    }
    assert.equal(offset, bytes.length);
    assert.equal(boxes[0], "ftyp");
    assert.ok(boxes.includes("moov") && boxes.includes("mdat"));
    assert.ok(boxes.indexOf("moov") < boxes.indexOf("mdat"), video.id + ": progressive playback requires faststart");
  }
});
