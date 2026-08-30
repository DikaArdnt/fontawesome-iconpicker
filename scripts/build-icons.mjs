#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const argv = Object.fromEntries(
   process.argv.slice(2).map((arg) => {
      const match = arg.match(/^--([^=]+)(?:=(.*))?$/);
      return match ? [match[1], match[2] ?? '1'] : [arg, '1'];
   }),
);

const version = argv.version || '7.x';
const input = argv.input || '';
const source = argv.source || `https://raw.githubusercontent.com/FortAwesome/Font-Awesome/${version}/metadata/icons.json`;
const styles = new Set(
   (argv.styles || 'solid,regular,brands')
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean),
);
const withSearch = argv.search === '1' || argv.search === 'true';
const proVersion = argv.pro === '1' || argv.pro === 'true';
const format = argv.format || 'json';
const output = argv.output || (format === 'js' ? 'dist/icons/fontawesome-icons.js' : 'dist/icons/fontawesome-icons.json');

async function loadMetadata() {
   if (input) {
      return JSON.parse(await fs.readFile(input, 'utf8'));
   }
   const response = await fetch(source, { redirect: 'follow' });
   if (!response.ok) {
      throw new Error(`Unable to download Font Awesome metadata: HTTP ${response.status}`);
   }
   return response.json();
}

function getStyles(meta) {
   // Font Awesome metadata exposes `free` for styles available in the free package.
   const available = (proVersion && meta.styles ? meta.styles : meta.free) || meta.free || [];
   return available.filter((style) => styles.has(String(style).toLowerCase()));
}

const metadata = await loadMetadata();
const icons = [];
const seen = new Set();

for (const name of Object.keys(metadata).sort()) {
   const meta = metadata[name] || {};
   const terms = meta.search && Array.isArray(meta.search.terms) ? meta.search.terms : [];

   for (const rawStyle of getStyles(meta)) {
      const style = String(rawStyle).toLowerCase();
      const title = `fa-${style} fa-${name}`;
      if (seen.has(title)) continue;
      seen.add(title);

      if (withSearch && terms.length) {
         icons.push([title, terms.join(' ')]);
      } else {
         icons.push(title);
      }
   }
}

await fs.mkdir(path.dirname(output), { recursive: true });

if (format === 'js') {
   const payload = JSON.stringify(icons);
   const code = `(function(w){var i=${payload};w.FontAwesomeIconPickerIcons=i;if(w.jQuery&&w.jQuery.iconpicker&&w.jQuery.iconpicker.setIcons){w.jQuery.iconpicker.setIcons(i);}})(window);`;
   await fs.writeFile(output, code);
} else {
   await fs.writeFile(output, JSON.stringify(icons));
}

const bytes = (await fs.stat(output)).size;
console.log(`Generated ${icons.length} icons -> ${output} (${bytes} bytes)`);
console.log(`Styles: ${[...styles].join(', ')}; search terms: ${withSearch ? 'included' : 'omitted'}`);
