import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './migrations',
  schema: './src/core/db/schema/index.ts',
  dialect: 'sqlite',
  dbCredentials: {
    url: './data/payroll.db',
  },
});
