import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const workCenters = sqliteTable('work_centers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  accountCode: text('account_code').notNull(),
  usBillingCode: text('us_billing_code')
});
