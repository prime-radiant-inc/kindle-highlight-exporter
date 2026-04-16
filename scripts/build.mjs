import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDirectory, "..");
const templatePath = path.join(projectRoot, "src", "index.template.html");
const bookmarkletPath = path.join(projectRoot, "src", "bookmarklet.js");
const outputPath = path.join(projectRoot, "index.html");

function buildBookmarkletHref(source) {
  const runtimeSource = source.replace(/^export /gm, "").trim();
  const payload = `(function(){${runtimeSource};runClippingsBookmarklet();})()`;
  return `javascript:${encodeURIComponent(payload)}`;
}

async function main() {
  const [template, bookmarkletSource] = await Promise.all([
    readFile(templatePath, "utf8"),
    readFile(bookmarkletPath, "utf8")
  ]);
  const html = template.replace("__BOOKMARKLET_HREF__", buildBookmarkletHref(bookmarkletSource));

  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, html);
}

main();
