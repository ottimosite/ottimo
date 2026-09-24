import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const stylesDir = join(root, 'src', 'styles');
const mainPath = join(root, 'src', 'main.tsx');

const expectedStyles = [
  'tokens.css',
  'base.css',
  'shell.css',
  'shared-components.css',
  'public-site.css',
  'components.css',
  'recommendations.css',
  'dashboard.css',
  'platform-pages.css',
  'concepts.css',
  'lead-home.css',
  'public-refresh.css',
  'public-services.css',
  'audit.css',
  'standards.css',
  'performance-metrics.css',
  'onboarding.css',
  'quality.css',
];

const retiredStyles = ['global.css', 'platform.css', 'overrides.css', 'menu-overrides.css'];
const authoritativePrimitives = new Map([
  ['.btn', 'shared-components.css'],
  ['.card', 'shared-components.css'],
  ['.eyebrow', 'shared-components.css'],
  ['.muted', 'shared-components.css'],
  ['.section-head', 'shared-components.css'],
]);
const maxImportant = 4;

function stripComments(source) {
  return source.replace(/\/\*[\\s\\S]*?\*\//g, '');
}

function selectors(source) {
  const clean = stripComments(source);
  return [...clean.matchAll(/([^{}]+)\{/g)]
    .map(match => match[1].trim())
    .filter(selector => selector && !selector.startsWith('@'))
    .flatMap(selector => selector.split(',').map(part => part.trim()))
    .filter(Boolean);
}

function metrics(source) {
  const clean = stripComments(source);
  return {
    bytes: source.length,
    rules: selectors(source).length,
    mediaQueries: (clean.match(/@media\\b/g) ?? []).length,
    important: (clean.match(/!important\\b/g) ?? []).length,
  };
}

const main = readFileSync(mainPath, 'utf8');
const imports = [...main.matchAll(/import ['"]\.\/styles\/([^'"]+)['"];?/g)].map(match => match[1]);
const failures = [];

if (JSON.stringify(imports) !== JSON.stringify(expectedStyles)) {
  failures.push(`src/main.tsx stylesheet order changed. Expected: ${expectedStyles.join(', ')}; found: ${imports.join(', ')}`);
}

for (const file of retiredStyles) {
  if (existsSync(join(stylesDir, file))) failures.push(`Retired stylesheet still exists: src/styles/${file}`);
}

const files = readdirSync(stylesDir).filter(file => file.endsWith('.css')).sort();
const owners = new Map();
let total = { bytes: 0, rules: 0, mediaQueries: 0, important: 0 };

for (const file of files) {
  const source = readFileSync(join(stylesDir, file), 'utf8');
  const current = metrics(source);
  total = {
    bytes: total.bytes + current.bytes,
    rules: total.rules + current.rules,
    mediaQueries: total.mediaQueries + current.mediaQueries,
    important: total.important + current.important,
  };

  for (const selector of selectors(source)) {
    if (authoritativePrimitives.has(selector)) {
      const owner = owners.get(selector) ?? [];
      owner.push(file);
      owners.set(selector, owner);
    }
  }
}

for (const [selector, ownerFiles] of owners) {
  const unique = [...new Set(ownerFiles)];
  const expected = authoritativePrimitives.get(selector);
  if (unique.length !== 1 || unique[0] !== expected) {
    failures.push(`Authoritative primitive ${selector} is defined outside ${expected}: ${unique.join(', ')}`);
  }
}

if (total.important > maxImportant) {
  failures.push(`!important budget exceeded: ${total.important} declarations (maximum ${maxImportant})`);
}

console.log('CSS architecture inventory');
console.log(JSON.stringify({ files: files.length, ...total }, null, 2));
console.log('Authoritative primitives');
for (const [selector, owner] of authoritativePrimitives) console.log(`- ${selector} -> ${owner}`);

if (failures.length) {
  console.error('CSS architecture checks failed:');
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('CSS architecture checks passed.');
