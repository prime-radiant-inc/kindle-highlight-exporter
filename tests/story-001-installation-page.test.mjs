import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";

test("build writes a static installation page with a bookmarklet link", () => {
  execFileSync("node", ["scripts/build.mjs"]);
  const html = readFileSync("index.html", "utf8");

  assert.match(html, /Export Kindle Highlights/);
  assert.match(html, /href="javascript:/);
});
