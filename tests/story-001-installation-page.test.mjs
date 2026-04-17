import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import test from "node:test";

test.after(() => {
  execFileSync("node", ["scripts/build.mjs"]);
});

test("build writes a static installation page with a bookmarklet link", () => {
  execFileSync("node", ["scripts/build.mjs"]);
  const html = readFileSync("index.html", "utf8");
  const hrefMatch = html.match(/href="([^"]+)"/);

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
  assert.ok(hrefMatch);
  assert.match(decodeURIComponent(hrefMatch[1].replace(/^javascript:/, "")), /devMaxBooks:\s*null/);
});

test("dev build injects the max-book cap into the bookmarklet payload", () => {
  execFileSync("node", ["scripts/build.mjs"], {
    env: {
      ...process.env,
      DEV_MAX_BOOKS: "5"
    }
  });
  const html = readFileSync("index.html", "utf8");
  const hrefMatch = html.match(/href="([^"]+)"/);

  assert.ok(hrefMatch);

  const payload = decodeURIComponent(hrefMatch[1].replace(/^javascript:/, ""));

  assert.match(payload, /devMaxBooks:\s*5/);
  assert.match(payload, /fetchImpl:\s*window\.fetch\.bind\(window\)/);
});
