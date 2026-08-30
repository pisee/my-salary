import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { workCenters } from './workCenters';

export const employees = sqliteTable('employees', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  employeeNo: text('employee_no').notNull().unique(),
  name: text('name').notNull(),
  employmentType: text('employment_type', { enum: ['SALARY', 'HOURLY_PRODUCTION'] }).notNull(),
  workCenterId: integer('work_center_id').references(() => workCenters.id).notNull(),
  bankName: text('bank_name').notNull(),
  accountNumber: text('account_number').notNull(),
  baseSalary: real('base_salary').notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true)
});
