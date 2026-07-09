import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const source = resolve(root, 'dist/webview');
const target = resolve(root, 'android-pad/app/src/main/assets/www');

if (!existsSync(source)) {
  throw new Error(
    'Missing dist/webview. Run npm run build:webview before syncing Android Pad assets.',
  );
}

rmSync(target, { force: true, recursive: true });
mkdirSync(target, { recursive: true });
cpSync(source, target, {
  filter: (path) => !path.endsWith('.DS_Store'),
  recursive: true,
});

console.log(`Synced ${source} -> ${target}`);
