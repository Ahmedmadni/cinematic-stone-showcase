import test from "node:test";
import assert from "node:assert/strict";
import { readdir, stat } from "node:fs/promises";

const directory = new URL("../src/assets/", import.meta.url);
const allowedImage = /\.(?:jpe?g|webp|avif|png)$/i;

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
