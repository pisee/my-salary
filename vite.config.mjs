import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import path from 'node:path';
import fs from 'node:fs';
import { build } from 'esbuild';

const isDev = process.env.NODE_ENV === 'development';

// ─── Schema builder (shared by dev and build) ───

async function buildSchema() {
  await build({
    entryPoints: ['src/core/db/schema/index.ts'],
    bundle: true,
    platform: 'node',
    target: 'node20',
    format: 'cjs',
    outdir: 'dist-electron/schema',
    external: ['drizzle-orm', 'drizzle-orm/*'],
    sourcemap: !isDev,
  });

  const jsPath = path.join('dist-electron/schema/index.js');
  const cjsPath = path.join('dist-electron/schema/index.cjs');
  fs.renameSync(jsPath, cjsPath);

  let content = fs.readFileSync(cjsPath, 'utf8');
  content = content.replace(/module\.exports = __toCommonJS\(schema_exports\);/, '');
  content = content.replace(/__export\(schema_exports, \{[^}]*\}\);/, '');
  const explicitExports = `
// Explicit CJS exports
module.exports = {
  workCenters: workCenters,
  employees: employees,
  payrollPeriods: payrollPeriods,
  attendanceRecords: attendanceRecords,
  insuranceAssessments: insuranceAssessments,
  payrollItems: payrollItems
};
`;
  content = content.replace(/\/\/# sourceMappingURL=/, explicitExports + '//# sourceMappingURL=');
  fs.writeFileSync(cjsPath, content, 'utf8');
}

// ─── Copy migrations to dist-electron ───

function copyMigrations() {
  const src = path.resolve('migrations');
  const dest = path.resolve('dist-electron/migrations');
  if (fs.existsSync(src)) {
    fs.mkdirSync(dest, { recursive: true });
    const files = fs.readdirSync(src).filter(f => f.endsWith('.sql'));
    for (const file of files) {
      fs.copyFileSync(path.join(src, file), path.join(dest, file));
    }
  }
}

function schemaPlugin() {
  return {
    name: 'schema-builder',
    // Build mode: buildStart is called during vite build
    async buildStart() {
      await buildSchema();
      copyMigrations();
    },
    // Dev mode: configureServer is called when dev server starts
    async configureServer() {
      await buildSchema();
      copyMigrations();
    },
  };
}

// ─── Build-mode esbuild plugins ───

function mainBuilder() {
  return {
    name: 'main-builder',
    async buildEnd() {
      await build({
        entryPoints: ['src/main/index.ts'],
        bundle: true,
        platform: 'node',
        target: 'node20',
        format: 'esm',
        outfile: 'dist-electron/index.mjs',
        external: ['electron', 'better-sqlite3', 'drizzle-orm', 'drizzle-orm/*'],
        sourcemap: true,
      });
    },
  };
}

function preloadBuilder() {
  return {
    name: 'preload-builder',
    async buildEnd() {
      await build({
        entryPoints: ['src/preload/index.ts'],
        bundle: true,
        platform: 'node',
        target: 'node20',
        format: 'esm',
        outfile: 'dist-electron/preload/index.mjs',
        external: ['electron'],
        sourcemap: true,
      });
    },
  };
}

// ─── Config ───

export default defineConfig({
  plugins: isDev
    ? [
        react(),
        schemaPlugin(),
        // Dev mode: vite-plugin-electron handles main/preload build + electron launch + HMR
        electron([
          {
            entry: 'src/main/index.ts',
            vite: {
              build: {
                outDir: 'dist-electron',
                lib: {
                  entry: 'src/main/index.ts',
                  formats: ['es'],
                  fileName: () => 'index.mjs',
                },
                rollupOptions: {
                  external: [
                    'electron',
                    'better-sqlite3',
                    'drizzle-orm',
                    'drizzle-orm/*',
                    'node:*',
                  ],
                },
              },
            },
          },
          {
            entry: 'src/preload/index.ts',
            onstart: (dev) => dev(),
            vite: {
              build: {
                outDir: 'dist-electron/preload',
                lib: {
                  entry: 'src/preload/index.ts',
                  formats: ['es'],
                  fileName: () => 'index.mjs',
                },
                rollupOptions: {
                  external: ['electron', 'node:*'],
                },
              },
            },
          },
        ]),
        renderer(),
      ]
    : [
        // Build mode: custom esbuild plugins
        react(),
        schemaPlugin(),
        mainBuilder(),
        preloadBuilder(),
      ],
  root: '.',
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
