function getTextContent(element) {
  return element?.textContent?.trim() ?? "";
}

export function scrapeBookList(document) {
  return Array.from(document.querySelectorAll("#kp-notebook-library > div")).map((bookCard) => {
    const authorText = getTextContent(bookCard.querySelector("p.kp-notebook-searchable"));
    const lastAnnotatedInput = bookCard.querySelector("[id^='kp-notebook-annotated-date']");

    return {
      asin: bookCard.id,
      title: getTextContent(bookCard.querySelector("h2.kp-notebook-searchable")),
      author: authorText.replace(/^By:\s*/, ""),
      lastAnnotated: lastAnnotatedInput?.value?.trim() ?? ""
    };
  });
}

export function runClippingsBookmarklet() {
  window.alert("Clippings bookmarklet placeholder");
}
