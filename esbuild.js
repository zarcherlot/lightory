const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

/** Extension version read from package.json at build time, inlined via esbuild `define`. */
const pkgVersion = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'package.json'), 'utf-8'),
).version;
const versionDefine = {
  'process.env.LIGHTORY_VERSION': JSON.stringify(pkgVersion),
};

/**
 * Copy assets folder to dist/assets
 */
function copyAssets() {
  const srcDir = path.join(__dirname, 'webview-ui', 'public', 'assets');
  const dstDir = path.join(__dirname, 'dist', 'assets');

  if (fs.existsSync(srcDir)) {
    // Remove existing dist/assets if present
    if (fs.existsSync(dstDir)) {
      fs.rmSync(dstDir, { recursive: true });
    }

    // Copy recursively
    fs.cpSync(srcDir, dstDir, { recursive: true });
    console.log('✓ Copied assets/ → dist/assets/');
  } else {
    console.log('ℹ️  assets/ folder not found (optional)');
  }
}

function copyRoleTasks() {
  const srcDir = path.join(__dirname, 'roles');
  const dstDir = path.join(__dirname, 'dist', 'roles');

  if (fs.existsSync(srcDir)) {
    if (fs.existsSync(dstDir)) {
      fs.rmSync(dstDir, { recursive: true });
    }
    fs.cpSync(srcDir, dstDir, { recursive: true });
    console.log('✓ Copied roles/ → dist/roles/');
  }
}

/**
 * Bundle hook scripts (TypeScript) to dist/hooks via esbuild.
 * Produces self-contained CJS files with shebangs for agent CLIs to execute.
 */
function buildHooks() {
  const entries = [
    path.join(__dirname, 'server', 'src', 'providers', 'hook', 'claude', 'hooks', 'claude-hook.ts'),
    path.join(__dirname, 'server', 'src', 'providers', 'hook', 'codex', 'hooks', 'codex-hook.ts'),
  ].filter((entry) => fs.existsSync(entry));
  if (entries.length === 0) return;
  require('esbuild').buildSync({
    entryPoints: entries,
    bundle: true,
    platform: 'node',
    target: 'node18',
    format: 'cjs',
    outdir: path.join(__dirname, 'dist', 'hooks'),
    entryNames: '[name]',
    banner: { js: '#!/usr/bin/env node' },
  });
  console.log('✓ Built hooks/ → dist/hooks/');
}

/**
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
  name: 'esbuild-problem-matcher',

  setup(build) {
    build.onStart(() => {
      console.log('[watch] build started');
    });
    build.onEnd((result) => {
      result.errors.forEach(({ text, location }) => {
        console.error(`✘ [ERROR] ${text}`);
        console.error(`    ${location.file}:${location.line}:${location.column}:`);
      });
      console.log('[watch] build finished');
    });
  },
};

async function main() {
  if (watch) {
    const ctx = await esbuild.context({
      entryPoints: ['server/src/cli.ts'],
      bundle: true,
      format: 'cjs',
      minify: production,
      sourcemap: !production,
      sourcesContent: false,
      platform: 'node',
      outfile: 'dist/cli.js',
      external: ['fastify', '@fastify/websocket', '@fastify/static', '@fastify/cors'],
      define: versionDefine,
      logLevel: 'silent',
      plugins: [esbuildProblemMatcherPlugin],
    });
    await ctx.watch();
  } else {
    // Copy assets and hooks after build
    copyAssets();
    copyRoleTasks();
    buildHooks();
    await buildCli();
  }
}

/** Bundle the standalone CLI entry point. */
async function buildCli() {
  await esbuild.build({
    entryPoints: ['server/src/cli.ts'],
    bundle: true,
    format: 'cjs',
    minify: production,
    sourcemap: !production,
    platform: 'node',
    outfile: 'dist/cli.js',
    external: ['fastify', '@fastify/websocket', '@fastify/static', '@fastify/cors'],
    define: versionDefine,
    logLevel: 'silent',
  });
  if (!production) {
    console.log('[build] CLI bundled: dist/cli.js');
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
