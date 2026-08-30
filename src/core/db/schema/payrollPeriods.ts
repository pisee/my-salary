import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const payrollPeriods = sqliteTable('payroll_periods', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  yearMonth: text('year_month').notNull().unique(),
  status: text('status', { enum: ['DRAFT', 'ATTENDANCE_VERIFIED', 'CALCULATED', 'FINALIZED'] }).notNull().default('DRAFT'),
  createdAt: integer('created_at').notNull(),
  finalizedAt: integer('finalized_at')
});
