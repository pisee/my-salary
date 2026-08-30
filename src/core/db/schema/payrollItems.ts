import { sqliteTable, integer, real } from 'drizzle-orm/sqlite-core';
import { payrollPeriods } from './payrollPeriods';
import { employees } from './employees';
import { workCenters } from './workCenters';

export const payrollItems = sqliteTable('payroll_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  periodId: integer('period_id').references(() => payrollPeriods.id).notNull(),
  employeeId: integer('employee_id').references(() => employees.id).notNull(),
  workCenterId: integer('work_center_id').references(() => workCenters.id).notNull(),
  grossPay: real('gross_pay').notNull(),
  basePay: real('base_pay').notNull(),
  overtimeAllowance: real('overtime_allowance').notNull().default(0),
  mealAllowance: real('meal_allowance').notNull().default(0),
  totalDeductions: real('total_deductions').notNull().default(0),
  netPay: real('net_pay').notNull(),
  usBillingAmount: real('us_billing_amount').notNull().default(0)
});
