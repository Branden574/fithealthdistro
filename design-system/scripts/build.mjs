// Fit Health Distributing design system: build script.
//   node scripts/build.mjs              tokens.css, site-copy.md, components/bundle.js, components/index.d.ts
//   node scripts/build.mjs tokens       tokens.css only
//   node scripts/build.mjs copy         site-copy.md only
//   node scripts/build.mjs components   bundle.js and index.d.ts only
// Source of truth: tokens.json, site-copy.json, components/src/*.tsx, components/bundle.css (hand-written).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = process.env.DS_ROOT ? path.resolve(process.env.DS_ROOT) : path.resolve(here, '..');
const only = process.argv[2];

/* ---------- tokens.json -> tokens.css ---------- */
const NAME = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,63}$/;
const COLOR = /^(#[0-9a-f]{3,4}|#[0-9a-f]{6}|#[0-9a-f]{8}|(rgb|rgba|hsl|hsla|oklch|oklab|lab|lch|color)\([0-9a-z%.,/ +-]+\))$/i;
const ALIAS = /^\{([A-Za-z0-9][A-Za-z0-9_.-]*)\}$/;

export function compileTokens(tokens) {
  const problems = [];
  const themes = tokens.color.themes.map((t) => t.id);
  const first = themes[0];
  const seen = new Set();
  const claim = (name, family) => {
    if (!NAME.test(name)) problems.push(`${family}: bad name "${name}"`);
    if (seen.has(name)) problems.push(`${family}: duplicate name "${name}"`);
    seen.add(name);
  };
  const colorNames = new Set(tokens.color.tokens.map((t) => t.name));
  const perTheme = (t, theme) => (typeof t.value === 'string' ? t.value : t.value[theme] ?? t.value[first]);

  const themeBlocks = Object.fromEntries(themes.map((id) => [id, []]));
  for (const t of tokens.color.tokens) {
    claim(t.name, 'color');
    if (!t.usage) problems.push(`color: "${t.name}" has no usage note`);
    for (const id of themes) {
      const v = perTheme(t, id);
      const alias = ALIAS.exec(v);
      if (alias) {
        if (!colorNames.has(alias[1]) || alias[1] === t.name) problems.push(`color: "${t.name}" aliases missing token "${alias[1]}"`);
        themeBlocks[id].push(`  --${t.name}: var(--${alias[1]});`);
      } else {
        if (!COLOR.test(v)) problems.push(`color: "${t.name}" has unreadable value "${v}" in ${id}`);
        themeBlocks[id].push(`  --${t.name}: ${v.toLowerCase()};`);
      }
    }
  }
  for (const t of tokens.shadow?.tokens ?? []) {
    claim(t.name, 'shadow');
    if (!t.usage) problems.push(`shadow: "${t.name}" has no usage note`);
    for (const id of themes) themeBlocks[id].push(`  --${t.name}: ${perTheme(t, id)};`);
  }

  const root = [];
  for (const [family, group] of Object.entries(tokens)) {
    if (['name', 'version', 'meta', 'color', 'type', 'shadow'].includes(family)) continue;
    if (!group || !Array.isArray(group.tokens)) continue;
    for (const t of group.tokens) {
      claim(t.name, family);
      if (!t.usage) problems.push(`${family}: "${t.name}" has no usage note`);
      root.push(`  --${t.name}: ${t.value};`);
    }
  }
  for (const [key, stack] of Object.entries(tokens.type.families)) root.push(`  --font-${key}: ${stack};`);

  const classes = [];
  const styleNames = new Set();
  for (const group of tokens.type.groups) {
    for (const s of group.styles) {
      if (!NAME.test(s.name) || styleNames.has(s.name)) problems.push(`type: bad or duplicate style "${s.name}"`);
      styleNames.add(s.name);
      const decl = [`font-family: var(--font-${s.family ?? group.family});`, `font-size: ${s.fontSize};`];
      if (s.lineHeight != null) decl.push(`line-height: ${s.lineHeight};`);
      if (s.fontWeight != null) decl.push(`font-weight: ${s.fontWeight};`);
      if (s.letterSpacing != null) decl.push(`letter-spacing: ${s.letterSpacing};`);
      if (s.fontStyle != null) decl.push(`font-style: ${s.fontStyle};`);
      if (s.opticalSize != null) decl.push(`font-variation-settings: 'opsz' ${s.opticalSize};`);
      classes.push(`.${s.name} { ${decl.join(' ')} }`);
    }
  }

  const faces = tokens.type.fonts.map((f) => {
    const file = f.file.includes('/') ? f.file : `fonts/${f.file}`;
    const ext = path.extname(file).slice(1).toLowerCase();
    const format = { woff2: 'woff2', woff: 'woff', ttf: 'truetype', otf: 'opentype' }[ext] ?? ext;
    return `@font-face { font-family: "${f.family}"; src: url("${file}") format("${format}"); font-weight: ${f.weight ?? '400'}; font-style: ${f.style ?? 'normal'}; font-display: swap; }`;
  });

  const css = [
    `/* ${tokens.name} — generated from tokens.json */`,
    `:root, [data-theme="${first}"] {`, ...themeBlocks[first], `}`,
    ...themes.slice(1).flatMap((id) => [`[data-theme="${id}"] {`, ...themeBlocks[id], `}`]),
    `:root {`, ...root, `}`,
    ...classes,
    ...faces,
    '',
  ].join('\n');
  return { css, problems };
}

function buildTokens() {
  const tokens = JSON.parse(fs.readFileSync(path.join(ROOT, 'tokens.json'), 'utf8'));
  const { css, problems } = compileTokens(tokens);
  if (problems.length) {
    console.error('tokens.json problems:\n  ' + problems.join('\n  '));
    process.exit(1);
  }
  fs.writeFileSync(path.join(ROOT, 'tokens.css'), css);
  console.log(`tokens.css  ${css.length} bytes`);
}

/* ---------- site-copy.json -> site-copy.md ---------- */
function buildCopy() {
  const file = path.join(ROOT, 'site-copy.json');
  if (!fs.existsSync(file)) return;
  const { slots } = JSON.parse(fs.readFileSync(file, 'utf8'));
  const keys = new Set();
  for (const slot of slots) {
    if (keys.has(slot.key)) throw new Error(`site-copy.json: duplicate key ${slot.key}`);
    keys.add(slot.key);
    if (slot.text.length > slot.max) throw new Error(`site-copy.json: ${slot.key} is longer than its own max`);
  }
  const cell = (text) => text.replace(/\|/g, '\\|');
  const md = [
    '# Site copy',
    '',
    'The text the storefront ships with, slot by slot. The admin’s Site content page edits these, and Restore original puts back what is written here. The same list is in `site-copy.json`, which seeds the content store.',
    '',
    '- Every heading, paragraph, button label and note on the storefront is a slot with a key. Read it from the content store; never type it into a page.',
    '- Product names, descriptions and prices are not slots. They are edited under Products, and category names under Categories.',
    '- Max is the longest the text can run before it breaks the layout it sits in. The editor warns past it and does not block typing.',
    '- New text follows the Voice rules: short, verb first, no exclamation marks. Type it in sentence case; the capitals come from CSS.',
    '',
    '| Slot | Where | Original text | Max |',
    '| --- | --- | --- | --- |',
    ...slots.map((s) => `| \`${s.key}\` | ${cell([s.page, s.section, s.label].join(' · '))} | ${cell(s.text)} | ${s.max} |`),
    '',
  ].join('\n');
  fs.writeFileSync(path.join(ROOT, 'site-copy.md'), md);
  console.log(`site-copy.md ${slots.length} slots`);
}

/* ---------- components/src -> components/bundle.js + index.d.ts ---------- */
async function buildComponents() {
  const esbuild = await import('esbuild');
  const ts = (await import('typescript')).default;
  const srcDir = path.join(ROOT, 'components', 'src');
  const entry = path.join(srcDir, 'index.ts');

  // Component names, in the order index.ts exports them.
  const indexText = fs.readFileSync(entry, 'utf8');
  const names = [...indexText.matchAll(/export \{ (\w+) \} from/g)].map((m) => m[1]);
  const NAMESPACE = 'FHD';

  const globals = {
    name: 'globals',
    setup(build) {
      build.onResolve({ filter: /^react(-dom)?$/ }, (args) => ({ path: args.path, namespace: 'global' }));
      build.onLoad({ filter: /.*/, namespace: 'global' }, (args) => ({
        contents: `module.exports = window.${args.path === 'react' ? 'React' : 'ReactDOM'};`,
        loader: 'js',
      }));
    },
  };
  const result = await esbuild.build({
    stdin: {
      contents: `import * as all from './index';\nvar w = window; w.${NAMESPACE} = Object.assign(w.${NAMESPACE} || {}, all);\n`,
      resolveDir: srcDir,
      loader: 'ts',
    },
    bundle: true,
    format: 'iife',
    minify: true,
    target: 'es2019',
    jsx: 'transform',
    jsxFactory: 'React.createElement',
    jsxFragment: 'React.Fragment',
    define: { 'process.env.NODE_ENV': '"production"' },
    plugins: [globals],
    logOverride: { 'module-level-directive': 'silent' },
    write: false,
    legalComments: 'none',
  });
  const header = `/* @ds-bundle: ${JSON.stringify({ format: 4, namespace: NAMESPACE, components: names.map((name) => ({ name })) })} */\n`;
  const js = header + result.outputFiles[0].text;
  if (/<\/script|<!--/i.test(js)) throw new Error('bundle.js contains a literal </script or <!--');
  fs.writeFileSync(path.join(ROOT, 'components', 'bundle.js'), js);
  console.log(`bundle.js   ${js.length} bytes, ${names.length} components`);

  // Types: emit declarations in memory, then fold them into one index.d.ts.
  const files = fs.readdirSync(srcDir).filter((f) => /\.tsx?$/.test(f)).map((f) => path.join(srcDir, f));
  const options = {
    declaration: true,
    emitDeclarationOnly: true,
    jsx: ts.JsxEmit.React,
    strict: true,
    target: ts.ScriptTarget.ES2019,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    skipLibCheck: true,
    removeComments: false,
    types: [],
  };
  const emitted = new Map();
  const host = ts.createCompilerHost(options);
  host.writeFile = (name, text) => emitted.set(path.basename(name), text);
  const program = ts.createProgram(files, options, host);
  const diagnostics = ts.getPreEmitDiagnostics(program);
  program.emit();
  if (diagnostics.length) {
    const fmt = ts.formatDiagnosticsWithColorAndContext(diagnostics, {
      getCanonicalFileName: (f) => f,
      getCurrentDirectory: () => ROOT,
      getNewLine: () => '\n',
    });
    console.error(fmt);
    process.exit(1);
  }
  const order = ['types.d.ts', 'icons.d.ts', ...names.map((n) => `${n}.d.ts`)];
  const body = order
    .filter((f) => emitted.has(f))
    .map((f) =>
      emitted
        .get(f)
        .split('\n')
        .filter((line) => !/^import /.test(line) && !/^export \{\};?$/.test(line) && !/^export declare const ICONS\b/.test(line))
        .join('\n')
        .trim(),
    )
    .join('\n\n');
  const dts = [
    `// Fit Health Distributing components. Generated from components/src by scripts/build.mjs.`,
    `import type * as React from 'react';`,
    '',
    body,
    '',
    `declare global { interface Window { ${NAMESPACE}: { ${names.map((n) => `${n}: typeof ${n}`).join('; ')} } } }`,
    '',
  ].join('\n');
  fs.writeFileSync(path.join(ROOT, 'components', 'index.d.ts'), dts);
  console.log(`index.d.ts  ${dts.length} bytes`);
}

if (!only || only === 'tokens') buildTokens();
if (!only || only === 'copy') buildCopy();
if (!only || only === 'components') await buildComponents();
