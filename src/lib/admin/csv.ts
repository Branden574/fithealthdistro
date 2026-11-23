/**
 * Spreadsheet files (CSV) for the admin's downloads. Plain RFC 4180: every cell quoted, quotes doubled, lines ended with
 * CRLF, and a byte-order mark so Excel reads the file as UTF-8.
 */

export type Cell = string | number | boolean | null | undefined;

/**
 * A cell a spreadsheet could run as a formula (=, +, -, @, or a tab or return first) starts with an apostrophe, so a
 * name or message someone typed into the contact form is shown, never run. Numbers the admin's own data holds are
 * written as numbers.
 */
export function csvCell(value: Cell): string {
  let text = value == null ? '' : typeof value === 'boolean' ? (value ? 'Yes' : 'No') : String(value);
  if (typeof value !== 'number' && /^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export function toCsv(headers: readonly string[], rows: ReadonlyArray<readonly Cell[]>): string {
  const lines = [headers, ...rows].map((row) => row.map(csvCell).join(','));
  return `﻿${lines.join('\r\n')}\r\n`;
}
