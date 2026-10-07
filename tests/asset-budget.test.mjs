import test from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";

const directory = new URL("../src/assets/", import.meta.url);
const allowedImage = /\.(?:jpe?g|webp|avif|png)$/i;

async function rasterFiles(folder) {
  const entries = await readdir(folder, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async entry => {
    const file = new URL(entry.name + (entry.isDirectory() ? "/" : ""), folder);
    return entry.isDirectory() ? rasterFiles(file) : allowedImage.test(entry.name) ? [file] : [];
  }));
  return nested.flat();
}

test("every raster asset, including nested official media, has an intact image container", async () => {
  for (const file of await rasterFiles(directory)) {
    const data = await readFile(file);
    const name = file.pathname.split("/src/assets/")[1];
    assert.ok(data.length > 32, name + ": truncated raster file (" + data.length + " bytes)");
    if (/\.webp$/i.test(name)) {
      assert.equal(data.toString("ascii", 0, 4), "RIFF", name + ": missing RIFF signature");
      assert.equal(data.toString("ascii", 8, 12), "WEBP", name + ": missing WebP signature");
      assert.equal(data.readUInt32LE(4) + 8, data.length, name + ": incomplete WebP container");
      let offset = 12;
      let hasPixels = false;
      while (offset < data.length) {
        assert.ok(offset + 8 <= data.length, name + ": truncated WebP chunk header");
        const type = data.toString("ascii", offset, offset + 4);
        const length = data.readUInt32LE(offset + 4);
        const end = offset + 8 + length + (length % 2);
        assert.ok(end <= data.length, name + ": truncated WebP " + type + " chunk");
        if (["VP8 ", "VP8L", "ANMF"].includes(type) && length > 10) hasPixels = true;
        offset = end;
      }
      assert.ok(hasPixels, name + ": WebP contains no image payload");
    } else if (/\.jpe?g$/i.test(name)) {
      assert.equal(data.readUInt16BE(0), 0xffd8, name + ": missing JPEG start marker");
      assert.equal(data.readUInt16BE(data.length - 2), 0xffd9, name + ": truncated JPEG ending");
    } else if (/\.png$/i.test(name)) {
      assert.equal(data.subarray(0, 8).toString("hex"), "89504e470d0a1a0a", name + ": missing PNG signature");
      assert.equal(data.toString("ascii", 12, 16), "IHDR", name + ": missing PNG dimensions");
      assert.equal(data.subarray(-12).toString("hex"), "0000000049454e44ae426082", name + ": truncated PNG ending");
    } else {
      assert.equal(data.toString("ascii", 4, 8), "ftyp", name + ": missing AVIF file type");
      assert.match(data.toString("ascii", 8, Math.min(data.readUInt32BE(0), data.length)), /avif|avis/, name + ": invalid AVIF brand");
    }
  }
});

test("illustrative raster assets stay within sustainable loading budgets", async () => {
  const filenames = (await readdir(directory)).filter((name) => allowedImage.test(name));
  const images = await Promise.all(filenames.map(async (name) => ({
    name,
    bytes: (await stat(new URL(name, directory))).size,
  })));
  assert.ok(images.length >= 12, "unexpected number of presentation images");
  const total = images.reduce((sum, image) => sum + image.bytes, 0);
  const largest = images.reduce((a, b) => a.bytes > b.bytes ? a : b);
  assert.ok(largest.bytes <= 512 * 1024, "single hero/gallery image exceeds 512 KiB: " + largest.name);
  assert.ok(total <= 6 * 1024 * 1024, "illustrative image set exceeds 6 MiB: " + total);
  console.log("Raster images: " + images.length + "; total " + (total / 1024 / 1024).toFixed(2) + " MiB; largest " + largest.name + " (" + (largest.bytes / 1024).toFixed(0) + " KiB)");
});

test("all 77 supplied photographs match their verified derivative hashes and delivery budgets", async () => {
  const { createHash } = await import("node:crypto");
  const manifest = JSON.parse(await readFile(new URL("../docs/official-media-source-manifest.json", import.meta.url), "utf8"));
  assert.equal(manifest.count, 77);
  assert.equal(manifest.photos.length, 77);
  assert.equal(new Set(manifest.photos.map(photo => photo.id)).size, 77);
  assert.equal(new Set(manifest.photos.map(photo => photo.source)).size, 77);
  assert.deepEqual(manifest.categories, { production: 56, facilities: 11, equipment: 8, quarry: 2 });
  let total = 0;
  for (const photo of manifest.photos) {
    assert.match(photo.source_sha256, /^[a-f0-9]{64}$/);
    const image = await readFile(new URL("../" + photo.web_path, import.meta.url));
    assert.equal(createHash("sha256").update(image).digest("hex"), photo.web_sha256, photo.id + ": derivative was changed or truncated");
    assert.equal(image.length, photo.web_bytes);
    assert.ok(image.length <= 300 * 1024, photo.id + ": full web photo exceeds 300 KiB");
    assert.ok(photo.thumbnail_bytes <= 40 * 1024, photo.id + ": thumbnail exceeds 40 KiB");
    total += image.length;
  }
  assert.ok(total <= 13 * 1024 * 1024, "77-photo web set exceeds 13 MiB");
});
