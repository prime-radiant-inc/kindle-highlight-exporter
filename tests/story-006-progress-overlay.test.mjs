import assert from "node:assert/strict";
import test from "node:test";

import { JSDOM } from "jsdom";
import * as bookmarklet from "../src/bookmarklet.js";

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
