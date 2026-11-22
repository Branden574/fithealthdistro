// Contrast audit for tokens.json: every text, edge and fill pair the components paint, in every theme.
//   node scripts/check.mjs      exits 1 if a pair misses its WCAG 2 floor
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = process.env.DS_ROOT ? path.resolve(process.env.DS_ROOT) : path.resolve(here, '..');
const tokens = JSON.parse(fs.readFileSync(path.join(ROOT, 'tokens.json'), 'utf8'));
const themes = tokens.color.themes.map((t) => t.id);
const byName = Object.fromEntries(tokens.color.tokens.map((t) => [t.name, t]));

function resolve(name, theme, depth = 0) {
  const t = byName[name];
  if (!t || depth > 16) throw new Error(`cannot resolve ${name}`);
  const v = typeof t.value === 'string' ? t.value : t.value[theme] ?? t.value[themes[0]];
  const alias = /^\{(.+)\}$/.exec(v);
  return alias ? resolve(alias[1], theme, depth + 1) : v;
}
const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const lum = ([r, g, b]) => {
  const f = (c) => ((c /= 255) <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a, b) => {
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
const over = (fg, bg, alpha) => fg.map((c, i) => Math.round(c * alpha + bg[i] * (1 - alpha)));

const GROUNDS = ['bg', 'bg-subtle', 'bg-raised'];
const pairs = [];
const add = (fg, bg, floor, what, alpha = 1) => pairs.push({ fg, bg, floor, what, alpha });
for (const g of GROUNDS) {
  for (const t of ['ink', 'ink-muted', 'ink-faint', 'accent-ink', 'success', 'warning', 'danger', 'info']) add(t, g, 4.5, 'text');
  for (const t of ['line-strong', 'focus', 'accent-ink']) add(t, g, 3, 'edge or mark');
}
add('on-accent', 'accent', 4.5, 'label on volt');
add('on-accent', 'accent-hover', 4.5, 'label on volt, hover');
add('accent', 'on-accent', 4.5, 'count on the current sidebar item');
add('bg', 'ink', 4.5, 'label on a solid fill');
add('bg', 'ink-muted', 4.5, 'label on a solid fill, hover');
add('ink', 'line', 4.5, 'neutral badge, count pill, ghost hover');
add('ink', 'accent-soft', 4.5, 'selected row');
add('ink-muted', 'accent-soft', 4.5, 'selected row, secondary');
add('on-danger', 'danger', 4.5, 'label on a danger fill');
for (const s of ['success', 'warning', 'danger', 'info']) {
  add(s, `${s}-soft`, 4.5, 'status badge');
  add('ink', `${s}-soft`, 4.5, 'alert body');
}
add('bg-raised', 'line-strong', 3, 'switch thumb on its off track');
add('line-strong', 'bg-subtle', 3, 'placeholder glyph on a product card');
add('ink', 'bg', 4.5, 'chip count at 72%', 0.72);
add('bg', 'ink', 4.5, 'selected chip count at 72%', 0.72);

let failed = 0;
for (const theme of themes) {
  for (const p of pairs) {
    const bg = rgb(resolve(p.bg, theme));
    const fg = p.alpha < 1 ? over(rgb(resolve(p.fg, theme)), bg, p.alpha) : rgb(resolve(p.fg, theme));
    const r = ratio(fg, bg);
    if (r < p.floor) {
      failed++;
      console.log(`FAIL ${theme.padEnd(6)} ${p.fg} on ${p.bg}: ${r.toFixed(2)} (needs ${p.floor}) - ${p.what}`);
    }
  }
}
console.log(`${pairs.length * themes.length} pairs checked across ${themes.length} themes, ${failed} below the floor`);
process.exit(failed ? 1 : 0);
