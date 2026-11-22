/** Splits plain text into paragraphs on blank lines. Single line breaks stay inside a paragraph. Never renders HTML. */
export function paragraphs(text: string): string[] {
  return text
    .replace(/\r\n?/g, '\n')
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
}
