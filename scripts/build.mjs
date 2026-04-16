import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDirectory, "..");
const templatePath = path.join(projectRoot, "src", "index.template.html");
const bookmarkletPath = path.join(projectRoot, "src", "bookmarklet.js");
const outputPath = path.join(projectRoot, "index.html");

function parseDevMaxBooks(value) {
  if (!value) {
    return null;
  }

  const parsedValue = Number.parseInt(value, 10);

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

function buildBookmarkletHref(source, options) {
  const { devMaxBooks } = options;
  const runtimeSource = source.replace(/^export /gm, "").trim();
  const payload = `(function(){${runtimeSource};runClippingsBookmarklet({ document: window.document, fetchImpl: window.fetch.bind(window), urlApi: window.URL, devMaxBooks: ${devMaxBooks ?? "null"} });})()`;
  return `javascript:${encodeURIComponent(payload)}`;
}

async function main() {
  const devMaxBooks = parseDevMaxBooks(process.env.DEV_MAX_BOOKS);
  const [template, bookmarkletSource] = await Promise.all([
    readFile(templatePath, "utf8"),
    readFile(bookmarkletPath, "utf8")
  ]);
  const html = template.replace(
    "__BOOKMARKLET_HREF__",
    buildBookmarkletHref(bookmarkletSource, { devMaxBooks })
  );

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, html);
}

main();
