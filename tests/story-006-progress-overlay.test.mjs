import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

import { JSDOM } from "jsdom";
import * as bookmarklet from "../src/bookmarklet.js";

const fixtureDirectory = path.join(import.meta.dirname, "fixtures");
const libraryHtml = readFileSync(path.join(fixtureDirectory, "notebook-library.html"), "utf8");
const libraryPageTwoHtml = readFileSync(path.join(fixtureDirectory, "notebook-library-page-2.html"), "utf8");
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

  const dismissButton = root.querySelector("[data-clippings-dismiss]");
  assert.match(root.textContent, /Skipped Deep Work/);
  assert.equal(dismissButton?.textContent, "Dismiss");

  dismissButton.click();
  assert.equal(document.querySelector("[data-clippings-progress]"), null);
});

test("runClippingsBookmarklet exports books and removes the overlay on success", async () => {
  const window = new JSDOM(libraryHtml).window;
  const { document } = window;
  const clicks = [];
  const library = document.querySelector("#kp-notebook-library");

  assert.equal(typeof bookmarklet.runClippingsBookmarklet, "function");

  library.insertAdjacentHTML(
    "beforeend",
    '<input type="hidden" class="kp-notebook-library-next-page-start" value="TOKEN_LIBRARY_2">'
  );

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
      const libraryMode = parsedUrl.searchParams.get("library");
      const asin = parsedUrl.searchParams.get("asin");
      const token = parsedUrl.searchParams.get("token");

      if (libraryMode === "list" && token === "TOKEN_LIBRARY_2") {
        return new Response(libraryPageTwoHtml, { status: 200 });
      }

      if (asin === "B07VRS84D1" && token === "") {
        return new Response(pageOneHtml, { status: 200 });
      }

      if (asin === "B07VRS84D1" && token === "TOKEN_2") {
        return new Response(pageTwoHtml, { status: 200 });
      }

      if (asin === "B08DMXZMB3") {
        return new Response(pageTwoHtml, { status: 200 });
      }

      if (asin === "B09VCR9Q12") {
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

  assert.equal(result.books.length, 3);
  assert.deepEqual(result.errors, []);
  assert.equal(clicks.length, 0);

  const overlay = document.querySelector("[data-clippings-progress]");
  assert.ok(overlay);
  assert.match(overlay.textContent, /Found 3 books\./);

  const downloadButton = overlay.querySelector("[data-clippings-download]");
  assert.ok(downloadButton);
  assert.equal(downloadButton.textContent, "Download zip");

  await downloadButton.onclick();

  assert.equal(clicks[0].download, "kindle-highlights-2026-04-16.zip");
  assert.equal(downloadButton.textContent, "Downloaded");

  const copyButton = overlay.querySelector("[data-clippings-copy]");
  assert.ok(copyButton);
  assert.equal(copyButton.textContent, "Copy markdown");

  const clipboardWrites = [];
  Object.defineProperty(window.navigator, "clipboard", {
    configurable: true,
    value: {
      async writeText(text) {
        clipboardWrites.push(text);
      }
    }
  });

  await copyButton.onclick();

  assert.equal(clipboardWrites.length, 1);
  assert.match(clipboardWrites[0], /# The Pragmatic Programmer/);
  assert.match(clipboardWrites[0], /# Deep Work/);
  assert.match(clipboardWrites[0], /# Working in Public/);
  assert.match(clipboardWrites[0], /Care about your craft\./);
  assert.equal(copyButton.textContent, "Copied!");

  assert.deepEqual(
    FakeJsZip.instances[0].files.map((file) => file.name),
    [
      "kindle-highlights/David Thomas, Andrew Hunt/the-pragmatic-programmer.md",
      "kindle-highlights/Cal Newport/deep-work.md",
      "kindle-highlights/Nadia Eghbal/working-in-public.md"
    ]
  );
  assert.match(FakeJsZip.instances[0].files[0].content, /Care about your craft\./);
  assert.match(FakeJsZip.instances[0].files[0].content, /Core thesis\. Revisit when motivation dips\./);

  overlay.querySelector("[data-clippings-dismiss]").click();
  assert.equal(document.querySelector("[data-clippings-progress]"), null);
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
  assert.equal(
    overlay.querySelector("[data-clippings-dismiss]")?.textContent,
    "Dismiss"
  );
});

test("runClippingsBookmarklet respects a dev max-book cap", async () => {
  const window = new JSDOM(libraryHtml).window;
  const { document } = window;
  const fetchCalls = [];

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

  const result = await bookmarklet.runClippingsBookmarklet({
    document,
    devMaxBooks: 1,
    fetchImpl: async (url) => {
      fetchCalls.push(url);
      const parsedUrl = new URL(url);
      const asin = parsedUrl.searchParams.get("asin");
      const token = parsedUrl.searchParams.get("token");

      if (asin === "B07VRS84D1" && token === "") {
        return new Response(pageOneHtml, { status: 200 });
      }

      if (asin === "B07VRS84D1" && token === "TOKEN_2") {
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

  const overlay = document.querySelector("[data-clippings-progress]");
  await overlay.querySelector("[data-clippings-download]").onclick();

  assert.deepEqual(
    FakeJsZip.instances[0].files.map((file) => file.name),
    ["kindle-highlights/David Thomas, Andrew Hunt/the-pragmatic-programmer.md"]
  );
  assert.deepEqual(result.errors, []);
  assert.equal(fetchCalls.length, 2);
  assert.ok(fetchCalls.every((url) => url.includes("asin=B07VRS84D1")));
});
