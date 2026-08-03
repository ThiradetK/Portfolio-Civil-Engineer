/**
 * Simple text splitter for character / word animations.
 * Returns an array of span elements as HTML string or can be used with refs.
 */
export function splitTextToChars(text) {
  return text.split("").map((char, i) =>
    char === " "
      ? `<span class="char space" data-index="${i}">&nbsp;</span>`
      : `<span class="char" data-index="${i}">${char}</span>`
  ).join("");
}

export function splitTextToWords(text) {
  return text.split(" ").map((word, i) =>
    `<span class="word" data-index="${i}">${word}</span>`
  ).join(" ");
}
