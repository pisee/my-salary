import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import path from 'node:path';
import fs from 'node:fs';

const isDev = process.env.NODE_ENV === 'development';

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

function migrationsPlugin() {
  return {
    name: 'migrations-copier',
    async buildStart() {
      copyMigrations();
    },
    async configureServer() {
      copyMigrations();
    },
  };
}

// ─── Config ───

export default defineConfig({
  plugins: isDev
    ? [
        react(),
        migrationsPlugin(),
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
                    'drizzle-orm',
                    'drizzle-orm/*',
                    'sql.js',
                    'node:*',
                  ],
                },
              },
            },
          },
          {
            entry: 'src/preload/index.ts',
            onstart: ({ reload }) => reload(),
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
        react(),
        migrationsPlugin(),
        {
          name: 'electron-build',
          async buildEnd() {
            const { build } = await import('esbuild');
            copyMigrations();

            // Main process - ESM
            await build({
              entryPoints: ['src/main/index.ts'],
              bundle: true,
              platform: 'node',
              target: 'node24',
              format: 'esm',
              outfile: 'dist-electron/index.mjs',
              external: ['electron', 'drizzle-orm', 'drizzle-orm/*', 'sql.js'],
              sourcemap: true,
            });

            // Preload - ESM
            await build({
              entryPoints: ['src/preload/index.ts'],
              bundle: true,
              platform: 'node',
              target: 'node24',
              format: 'esm',
              outfile: 'dist-electron/preload/index.mjs',
              external: ['electron'],
              sourcemap: true,
            });
          },
        },
      ],
  root: '.',
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
});