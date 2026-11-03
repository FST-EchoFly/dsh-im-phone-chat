// Build the browser client bundle for the phone-chat mirror.
// Bundles the plugin source with katex + markdown-it and wraps it in the
// Harness module-loader registration format (React stays an external provided
// by the Web client's platform module table).
import { build } from 'esbuild';
import { writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const packageName = 'dsh-im-phone-chat';
const outputPath = resolve(here, 'client.js');

const result = await build({
  entryPoints: [resolve(here, 'src/plugin.js')],
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  target: ['chrome100'],
  external: ['react'],
  write: false,
  minify: true,
  legalComments: 'none',
});

const bundled = result.outputFiles?.[0]?.text;
if (!bundled) throw new Error('esbuild produced no client bundle');

const wrapped = `window.__ModuleLoader__.load({
  id: ${JSON.stringify(packageName)},
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
${bundled}
    return module.exports;
  }
});
`;
await writeFile(outputPath, wrapped, 'utf8');
console.log(`Wrote ${outputPath} (${wrapped.length} bytes)`);
