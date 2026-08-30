import { sqliteTable, integer, real } from 'drizzle-orm/sqlite-core';
import { payrollPeriods } from './payrollPeriods';
import { employees } from './employees';

export const insuranceAssessments = sqliteTable('insurance_assessments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  periodId: integer('period_id').references(() => payrollPeriods.id).notNull(),
  employeeId: integer('employee_id').references(() => employees.id).notNull(),
  nationalPension: real('national_pension').notNull().default(0),
  healthInsurance: real('health_insurance').notNull().default(0),
  longTermCare: real('long_term_care').notNull().default(0),
  employmentInsurance: real('employment_insurance').notNull().default(0)
});
