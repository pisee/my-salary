import Database from 'better-sqlite3';
import { drizzle, BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

let dbInstance: BetterSQLite3Database<typeof schema> | null = null;
let sqliteInstance: Database.Database | null = null;

export function initDatabase(dbPath = 'payroll.db'): BetterSQLite3Database<typeof schema> {
  sqliteInstance = new Database(dbPath);
  sqliteInstance.pragma('journal_mode = WAL');
  sqliteInstance.pragma('foreign_keys = ON');

  // Auto create tables if not existing
  sqliteInstance.exec(`
    CREATE TABLE IF NOT EXISTS work_centers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      account_code TEXT NOT NULL,
      us_billing_code TEXT
    );
    CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_no TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      employment_type TEXT NOT NULL,
      work_center_id INTEGER NOT NULL REFERENCES work_centers(id),
      bank_name TEXT NOT NULL,
      account_number TEXT NOT NULL,
      base_salary REAL NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1
    );
    CREATE TABLE IF NOT EXISTS payroll_periods (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      year_month TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'DRAFT',
      created_at INTEGER NOT NULL,
      finalized_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS attendance_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      period_id INTEGER NOT NULL REFERENCES payroll_periods(id),
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      regular_hours REAL NOT NULL DEFAULT 0,
      overtime_hours REAL NOT NULL DEFAULT 0,
      night_hours REAL NOT NULL DEFAULT 0,
      holiday_hours REAL NOT NULL DEFAULT 0,
      is_anomalous INTEGER NOT NULL DEFAULT 0,
      anomaly_details TEXT,
      adjustment_reason TEXT
    );
    CREATE TABLE IF NOT EXISTS insurance_assessments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      period_id INTEGER NOT NULL REFERENCES payroll_periods(id),
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      national_pension REAL NOT NULL DEFAULT 0,
      health_insurance REAL NOT NULL DEFAULT 0,
      long_term_care REAL NOT NULL DEFAULT 0,
      employment_insurance REAL NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS payroll_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      period_id INTEGER NOT NULL REFERENCES payroll_periods(id),
      employee_id INTEGER NOT NULL REFERENCES employees(id),
      work_center_id INTEGER NOT NULL REFERENCES work_centers(id),
      gross_pay REAL NOT NULL,
      base_pay REAL NOT NULL,
      overtime_allowance REAL NOT NULL DEFAULT 0,
      meal_allowance REAL NOT NULL DEFAULT 0,
      total_deductions REAL NOT NULL DEFAULT 0,
      net_pay REAL NOT NULL,
      us_billing_amount REAL NOT NULL DEFAULT 0
    );
  `);

  dbInstance = drizzle(sqliteInstance, { schema });
  return dbInstance;
}

export function getDb(): BetterSQLite3Database<typeof schema> {
  if (!dbInstance) {
    return initDatabase();
  }
  return dbInstance;
}
