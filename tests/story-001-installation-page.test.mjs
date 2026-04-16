import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";

test("build writes a static installation page with a bookmarklet link", () => {
  execFileSync("node", ["scripts/build.mjs"]);
  const html = readFileSync("index.html", "utf8");

  assert.match(html, /Clippings/);
  assert.match(html, /Kindle highlights to markdown/);
  assert.match(html, /Export Kindle Highlights/);
  assert.match(html, /href="javascript:/);
  assert.match(html, /draggable="true"/);
  assert.match(html, /Open Kindle Notebook/);
  assert.match(html, /https:\/\/read\.amazon\.com\/notebook/);
  assert.match(html, /Click the bookmarklet/);
  assert.match(html, /Download your zip/);
  assert.match(html, /&lt;highlight&gt;/);
  assert.match(html, /&lt;note&gt;/);
});
