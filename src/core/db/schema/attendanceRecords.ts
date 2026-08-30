import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { payrollPeriods } from './payrollPeriods';
import { employees } from './employees';

export const attendanceRecords = sqliteTable('attendance_records', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  periodId: integer('period_id').references(() => payrollPeriods.id).notNull(),
  employeeId: integer('employee_id').references(() => employees.id).notNull(),
  regularHours: real('regular_hours').notNull().default(0),
  overtimeHours: real('overtime_hours').notNull().default(0),
  nightHours: real('night_hours').notNull().default(0),
  holidayHours: real('holiday_hours').notNull().default(0),
  isAnomalous: integer('is_anomalous', { mode: 'boolean' }).notNull().default(false),
  anomalyDetails: text('anomaly_details'),
  adjustmentReason: text('adjustment_reason')
});
