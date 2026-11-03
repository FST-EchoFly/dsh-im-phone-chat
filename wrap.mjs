// Wrap an already-built CJS bundle into the Harness module-loader registration.
// Used where the sandbox cannot let esbuild's Node API spawn its binary (run
// `esbuild.exe src/plugin.js --bundle ... --outfile=.build/plugin.bundle.cjs`
// first). The canonical build is `node build.mjs`.
import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const packageName = 'dsh-im-phone-chat';
const bundled = await readFile(resolve(here, '.build/plugin.bundle.cjs'), 'utf8');
const outputPath = resolve(here, 'client.js');

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
