import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import { JSDOM } from "jsdom";
import * as bookmarklet from "../src/bookmarklet.js";

const fixtureDirectory = path.join(import.meta.dirname, "fixtures");
const libraryHtml = readFileSync(path.join(fixtureDirectory, "notebook-library.html"), "utf8");
const pageOneHtml = readFileSync(path.join(fixtureDirectory, "notebook-annotations-page-1.html"), "utf8");
const pageTwoHtml = readFileSync(path.join(fixtureDirectory, "notebook-annotations-page-2.html"), "utf8");

test("createProgressOverlay renders progress, errors, and cleanup controls", () => {
  const document = new JSDOM("<!DOCTYPE html><html><body></body></html>").window.document;

  assert.equal(typeof bookmarklet.createProgressOverlay, "function");

  const overlay = bookmarklet.createProgressOverlay(document);
  const root = document.querySelector("[data-clippings-progress]");

  assert.ok(root);
  assert.equal(root.style.position, "fixed");

  overlay.update("Fetching book 3 of 24...", 3, 24);

  assert.match(root.textContent, /Fetching book 3 of 24\.\.\./);
  assert.match(root.textContent, /3 \/ 24/);

  overlay.showError("Skipped Deep Work");

  const dismissButton = root.querySelector("button");
  assert.match(root.textContent, /Skipped Deep Work/);
  assert.equal(dismissButton?.textContent, "Dismiss");

  dismissButton.click();
  assert.equal(document.querySelector("[data-clippings-progress]"), null);
});

test("runClippingsBookmarklet exports books and removes the overlay on success", async () => {
  const window = new JSDOM(libraryHtml).window;
  const { document } = window;
  const clicks = [];

  assert.equal(typeof bookmarklet.runClippingsBookmarklet, "function");

  class FakeJsZip {
    static instances = [];

    constructor() {
      this.files = [];
      FakeJsZip.instances.push(this);
    }

    file(name, content) {
      this.files.push({ name, content });
    }

    async generateAsync() {
      return new Blob(["zip"]);
    }
  }

  window.HTMLAnchorElement.prototype.click = function click() {
    clicks.push({ download: this.download, href: this.href });
  };

  const result = await bookmarklet.runClippingsBookmarklet({
    document,
    exportDate: new Date("2026-04-16T12:00:00Z"),
    fetchImpl: async (url) => {
      const parsedUrl = new URL(url);
      const asin = parsedUrl.searchParams.get("asin");
      const token = parsedUrl.searchParams.get("token");

      if (asin === "B07VRS84D1" && token === "") {
        return new Response(pageOneHtml, { status: 200 });
      }

      if (asin === "B07VRS84D1" && token === "TOKEN_2") {
        return new Response(pageTwoHtml, { status: 200 });
      }

      if (asin === "B08DMXZMB3") {
        return new Response(pageTwoHtml, { status: 200 });
      }

      throw new Error(`Unexpected request: ${url}`);
    },
    jszipCtor: FakeJsZip,
    urlApi: {
      createObjectURL() {
        return "blob:clippings";
      },
      revokeObjectURL() {}
    }
  });

  assert.equal(result.books.length, 2);
  assert.deepEqual(result.errors, []);
  assert.equal(clicks[0].download, "kindle-highlights-2026-04-16.zip");
  assert.equal(document.querySelector("[data-clippings-progress]"), null);
  assert.deepEqual(
    FakeJsZip.instances[0].files.map((file) => file.name),
    ["the-pragmatic-programmer.md", "deep-work.md"]
  );
});

test("runClippingsBookmarklet leaves the overlay visible with an error when every book fails", async () => {
  const window = new JSDOM(libraryHtml).window;
  const { document } = window;

  const result = await bookmarklet.runClippingsBookmarklet({
    document,
    fetchImpl: async () => {
      throw new Error("Request failed");
    },
    jszipCtor: class FakeJsZip {},
    urlApi: {
      createObjectURL() {
        return "blob:clippings";
      },
      revokeObjectURL() {}
    }
  });

  const overlay = document.querySelector("[data-clippings-progress]");

  assert.equal(result.books.length, 0);
  assert.deepEqual(result.errors, [
    {
      asin: "B07VRS84D1",
      title: "The Pragmatic Programmer",
      message: "Request failed"
    },
    {
      asin: "B08DMXZMB3",
      title: "Deep Work",
      message: "Request failed"
    }
  ]);
  assert.ok(overlay);
  assert.match(overlay.textContent, /Request failed/);
  assert.equal(overlay.querySelector("button")?.textContent, "Dismiss");
});
