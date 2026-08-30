# Phase 1: Core Boilerplate & Desktop Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish the foundational Electron + Vite + React + TypeScript + SQLite (Drizzle ORM) desktop application boilerplate with isolated core domain modules, full Vitest test suite, and a modern 5-stage workflow UI shell.

**Architecture:** Layered modular desktop architecture where pure business logic (`src/core`) is decoupled from Electron (`src/main`, `src/preload`) and UI (`src/renderer`), allowing fast automated unit testing and seamless future migrations.

**Tech Stack:** Electron, Vite, React 18, TypeScript, TailwindCSS, Lucide Icons, SQLite (`better-sqlite3`), Drizzle ORM, Vitest, ExcelJS (`exceljs`), SheetJS (`xlsx`), Zustand.

**Spec:** [docs/superpowers/specs/2026-08-30-salary-attendance-automation-design.md](file:///c:/00-development/repository/github/pisee/my-salary/docs/superpowers/specs/2026-08-30-salary-attendance-automation-design.md)

## Global Constraints
- Node.js >= 18, TypeScript >= 5.0
- Interfaces MUST be used over inline types across all codebases (`AGENTS.md` 2.1)
- Conventional Commits format for all commits (`feat:`, `fix:`, `chore:`, `test:`)
- Pure business logic in `src/core` must not import from `electron` or `react`
- Full Windows cross-platform path handling (`path.join`) and native SQLite support

---

### Task 1: Project Scaffolding & Configuration

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `vitest.config.ts`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `drizzle.config.ts`
- Create: `.gitignore`

**Interfaces:**
- Produces: Base build, dev, test, and lint scripts in `package.json`

- [ ] **Step 1: Create `.gitignore`**

```gitignore
node_modules/
dist/
dist-electron/
release/
*.db
*.db-journal
*.db-wal
.DS_Store
Thumbs.db
```

- [ ] **Step 2: Create `package.json` with all required dependencies**

```json
{
  "name": "my-salary",
  "version": "1.0.0",
  "description": "Salary and Attendance Automation Desktop Application",
  "main": "dist-electron/main/index.js",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "test": "vitest run",
    "test:watch": "vitest",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate"
  },
  "dependencies": {
    "better-sqlite3": "^11.8.1",
    "clsx": "^2.1.1",
    "drizzle-orm": "^0.38.4",
    "exceljs": "^4.4.0",
    "lucide-react": "^0.475.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "tailwind-merge": "^3.0.1",
    "xlsx": "^0.18.5",
    "zustand": "^5.0.3"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.12",
    "@types/node": "^22.13.4",
    "@types/react": "^18.3.18",
    "@types/react-dom": "^18.3.5",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "drizzle-kit": "^0.30.4",
    "electron": "^34.2.0",
    "electron-builder": "^25.1.8",
    "postcss": "^8.5.2",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.7.3",
    "vite": "^6.1.0",
    "vite-plugin-electron": "^0.29.0",
    "vite-plugin-electron-renderer": "^0.14.6",
    "vitest": "^3.0.5"
  }
}
```

- [ ] **Step 3: Create TypeScript configs (`tsconfig.json`, `tsconfig.node.json`)**

`tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@core/*": ["src/core/*"],
      "@shared/*": ["src/shared/*"],
      "@renderer/*": ["src/renderer/src/*"]
    }
  },
  "include": ["src", "tests"]
}
```

- [ ] **Step 4: Create Vite and Vitest configs (`vite.config.ts`, `vitest.config.ts`, `tailwind.config.js`, `postcss.config.js`)**

`vite.config.ts`:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@core': path.resolve(__dirname, './src/core'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@renderer': path.resolve(__dirname, './src/renderer/src')
    }
  },
  root: path.resolve(__dirname, './src/renderer'),
  build: {
    outDir: path.resolve(__dirname, './dist')
  }
});
```

`vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts']
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@core': path.resolve(__dirname, './src/core'),
      '@shared': path.resolve(__dirname, './src/shared')
    }
  }
});
```

`tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/renderer/index.html",
    "./src/renderer/src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          900: '#0c4a6e',
        }
      }
    },
  },
  plugins: [],
}
```

`postcss.config.js`:
```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

`drizzle.config.ts`:
```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/core/db/schema/*.ts',
  out: './drizzle',
  dialect: 'sqlite',
  dbCredentials: {
    url: './payroll.db'
  }
});
```

- [ ] **Step 5: Run `npm install`**

Run: `npm install`
Expected: Dependencies installed successfully with `package-lock.json` created.

- [ ] **Step 6: Commit configuration**

```bash
git add .
git commit -m "chore: setup project configuration, tsconfig, vite, vitest, and drizzle"
```

---

### Task 2: Shared Domain Types & Interfaces

**Files:**
- Create: `src/shared/types/models.ts`
- Create: `src/shared/types/ipc.ts`
- Create: `src/shared/constants/index.ts`
- Create: `src/shared/types/index.ts`

**Interfaces:**
- Produces: `IEmployee`, `IWorkCenter`, `IPayrollPeriod`, `IAttendanceRecord`, `IPayrollItem`, `IInsuranceAssessment`, `IElectronAPI`

- [ ] **Step 1: Write `src/shared/types/models.ts`**

```typescript
export type EmploymentType = 'SALARY' | 'HOURLY_PRODUCTION';
export type PayrollStatus = 'DRAFT' | 'ATTENDANCE_VERIFIED' | 'CALCULATED' | 'FINALIZED';

export interface IWorkCenter {
  id: number;
  code: string;
  name: string;
  accountCode: string;
  usBillingCode?: string | null;
}

export interface IEmployee {
  id: number;
  employeeNo: string;
  name: string;
  employmentType: EmploymentType;
  workCenterId: number;
  bankName: string;
  accountNumber: string;
  baseSalary: number;
  isActive: boolean;
}

export interface IPayrollPeriod {
  id: number;
  yearMonth: string;
  status: PayrollStatus;
  createdAt: number;
  finalizedAt?: number | null;
}

export interface IAttendanceRecord {
  id: number;
  periodId: number;
  employeeId: number;
  regularHours: number;
  overtimeHours: number;
  nightHours: number;
  holidayHours: number;
  isAnomalous: boolean;
  anomalyDetails?: string | null;
  adjustmentReason?: string | null;
}

export interface IInsuranceAssessment {
  id: number;
  periodId: number;
  employeeId: number;
  nationalPension: number;
  healthInsurance: number;
  longTermCare: number;
  employmentInsurance: number;
}

export interface IPayrollItem {
  id: number;
  periodId: number;
  employeeId: number;
  workCenterId: number;
  grossPay: number;
  basePay: number;
  overtimeAllowance: number;
  mealAllowance: number;
  totalDeductions: number;
  netPay: number;
  usBillingAmount: number;
}
```

- [ ] **Step 2: Write `src/shared/types/ipc.ts`**

```typescript
import { IEmployee, IWorkCenter, IPayrollPeriod, IPayrollItem, IAttendanceRecord } from './models';

export interface IDbStatus {
  connected: boolean;
  version: string;
  path: string;
}

export interface IElectronAPI {
  getDbStatus: () => Promise<IDbStatus>;
  getEmployees: () => Promise<IEmployee[]>;
  getWorkCenters: () => Promise<IWorkCenter[]>;
  getPayrollPeriods: () => Promise<IPayrollPeriod[]>;
  createPayrollPeriod: (yearMonth: string) => Promise<IPayrollPeriod>;
  openFileDialog: (options?: { filters?: { name: string; extensions: string[] }[] }) => Promise<string | null>;
}
```

- [ ] **Step 3: Write `src/shared/constants/index.ts` & `src/shared/types/index.ts`**

`src/shared/constants/index.ts`:
```typescript
export const WORKFLOW_STAGES = [
  { id: 1, name: '인풋 등록', key: 'input' },
  { id: 2, name: '근태 검증', key: 'verify' },
  { id: 3, name: '급여 산출', key: 'calculate' },
  { id: 4, name: '산출물 생성', key: 'export' },
  { id: 5, name: 'DB 확정/이력', key: 'history' }
] as const;

export const DEFAULT_MEAL_ALLOWANCE_LIMIT = 200000; // 월 비과세 식대 한도 (20만원)
```

`src/shared/types/index.ts`:
```typescript
export * from './models';
export * from './ipc';
```

- [ ] **Step 4: Commit shared types**

```bash
git add src/shared
git commit -m "feat: add domain model interfaces and shared IPC types"
```

---

### Task 3: SQLite Database Layer & Drizzle Schema

**Files:**
- Create: `src/core/db/schema/workCenters.ts`
- Create: `src/core/db/schema/employees.ts`
- Create: `src/core/db/schema/payrollPeriods.ts`
- Create: `src/core/db/schema/attendanceRecords.ts`
- Create: `src/core/db/schema/insuranceAssessments.ts`
- Create: `src/core/db/schema/payrollItems.ts`
- Create: `src/core/db/schema/index.ts`
- Create: `src/core/db/client.ts`
- Test: `tests/core/db.test.ts`

**Interfaces:**
- Produces: `initDatabase(dbPath?: string)`, `getDb()`

- [ ] **Step 1: Write the failing DB test `tests/core/db.test.ts`**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { initDatabase, getDb } from '../../src/core/db/client';
import * as schema from '../../src/core/db/schema';

describe('Database Layer Initialization & Schema', () => {
  beforeEach(() => {
    initDatabase(':memory:');
  });

  it('should initialize sqlite in-memory db and insert work centers', async () => {
    const db = getDb();
    expect(db).toBeDefined();

    const inserted = db.insert(schema.workCenters).values({
      code: 'WC-01',
      name: '생산1팀',
      accountCode: '50100',
      usBillingCode: 'US-PROD-01'
    }).returning().get();

    expect(inserted.id).toBeGreaterThan(0);
    expect(inserted.name).toBe('생산1팀');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/core/db.test.ts`
Expected: FAIL (client and schemas not implemented)

- [ ] **Step 3: Implement Drizzle Schema and Client**

`src/core/db/schema/workCenters.ts`:
```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const workCenters = sqliteTable('work_centers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  code: text('code').notNull().unique(),
  name: text('name').notNull(),
  accountCode: text('account_code').notNull(),
  usBillingCode: text('us_billing_code')
});
```

`src/core/db/schema/employees.ts`:
```typescript
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
```

`src/core/db/schema/payrollPeriods.ts`:
```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const payrollPeriods = sqliteTable('payroll_periods', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  yearMonth: text('year_month').notNull().unique(),
  status: text('status', { enum: ['DRAFT', 'ATTENDANCE_VERIFIED', 'CALCULATED', 'FINALIZED'] }).notNull().default('DRAFT'),
  createdAt: integer('created_at').notNull(),
  finalizedAt: integer('finalized_at')
});
```

`src/core/db/schema/attendanceRecords.ts`:
```typescript
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
```

`src/core/db/schema/insuranceAssessments.ts`:
```typescript
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
```

`src/core/db/schema/payrollItems.ts`:
```typescript
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
```

`src/core/db/schema/index.ts`:
```typescript
export * from './workCenters';
export * from './employees';
export * from './payrollPeriods';
export * from './attendanceRecords';
export * from './insuranceAssessments';
export * from './payrollItems';
```

`src/core/db/client.ts`:
```typescript
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/core/db.test.ts`
Expected: PASS

- [ ] **Step 5: Commit DB module**

```bash
git add src/core/db tests/core/db.test.ts
git commit -m "feat: implement SQLite database layer and Drizzle ORM schema with in-memory test"
```

---

### Task 4: Core Business Engine Skeletons & Unit Tests

**Files:**
- Create: `src/core/calculators/salaryCalculator.ts`
- Create: `src/core/calculators/hourlyCalculator.ts`
- Create: `src/core/validators/attendanceValidator.ts`
- Test: `tests/core/calculators.test.ts`
- Test: `tests/core/validators.test.ts`

**Interfaces:**
- Produces: `calculateSalaryPay(baseSalary, mealAllowance, deductions)`, `calculateHourlyPay(baseHourlyRate, regularHours, overtimeHours, nightHours, holidayHours, mealAllowance, deductions)`, `validateAttendance(record)`

- [ ] **Step 1: Write failing calculator & validator tests**

`tests/core/calculators.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { calculateSalaryPay } from '../../src/core/calculators/salaryCalculator';
import { calculateHourlyPay } from '../../src/core/calculators/hourlyCalculator';

describe('Salary & Hourly Calculation Engines', () => {
  it('should calculate salary employee net pay accurately', () => {
    const result = calculateSalaryPay({
      baseSalary: 3500000,
      mealAllowance: 200000,
      totalDeductions: 350000
    });

    expect(result.grossPay).toBe(3700000);
    expect(result.netPay).toBe(3350000);
  });

  it('should calculate production hourly employee overtime and net pay', () => {
    const result = calculateHourlyPay({
      baseHourlyRate: 10000,
      regularHours: 160,
      overtimeHours: 20, // 20 * 10000 * 1.5 = 300,000
      nightHours: 0,
      holidayHours: 8,   // 8 * 10000 * 1.5 = 120,000
      mealAllowance: 200000,
      totalDeductions: 200000
    });

    expect(result.basePay).toBe(1600000);
    expect(result.overtimeAllowance).toBe(420000);
    expect(result.grossPay).toBe(2220000);
    expect(result.netPay).toBe(2020000);
  });
});
```

`tests/core/validators.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { validateAttendanceRecord } from '../../src/core/validators/attendanceValidator';

describe('Attendance Validator Engine', () => {
  it('should flag anomaly if overtime exceeds 52 hours per week standard limit', () => {
    const validation = validateAttendanceRecord({
      regularHours: 160,
      overtimeHours: 60,
      nightHours: 0,
      holidayHours: 0
    });

    expect(validation.isAnomalous).toBe(true);
    expect(validation.reason).toContain('연장근무 한도 초과');
  });

  it('should pass normal attendance record', () => {
    const validation = validateAttendanceRecord({
      regularHours: 160,
      overtimeHours: 12,
      nightHours: 0,
      holidayHours: 0
    });

    expect(validation.isAnomalous).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/core/calculators.test.ts tests/core/validators.test.ts`
Expected: FAIL

- [ ] **Step 3: Implement minimal calculator and validator logic**

`src/core/calculators/salaryCalculator.ts`:
```typescript
export interface ISalaryCalculationInput {
  baseSalary: number;
  mealAllowance: number;
  totalDeductions: number;
}

export interface ISalaryCalculationResult {
  grossPay: number;
  basePay: number;
  mealAllowance: number;
  totalDeductions: number;
  netPay: number;
}

export function calculateSalaryPay(input: ISalaryCalculationInput): ISalaryCalculationResult {
  const grossPay = input.baseSalary + input.mealAllowance;
  const netPay = grossPay - input.totalDeductions;
  return {
    grossPay,
    basePay: input.baseSalary,
    mealAllowance: input.mealAllowance,
    totalDeductions: input.totalDeductions,
    netPay
  };
}
```

`src/core/calculators/hourlyCalculator.ts`:
```typescript
export interface IHourlyCalculationInput {
  baseHourlyRate: number;
  regularHours: number;
  overtimeHours: number;
  nightHours: number;
  holidayHours: number;
  mealAllowance: number;
  totalDeductions: number;
}

export interface IHourlyCalculationResult {
  grossPay: number;
  basePay: number;
  overtimeAllowance: number;
  mealAllowance: number;
  totalDeductions: number;
  netPay: number;
}

export function calculateHourlyPay(input: IHourlyCalculationInput): IHourlyCalculationResult {
  const basePay = input.baseHourlyRate * input.regularHours;
  const overtimePay = input.baseHourlyRate * input.overtimeHours * 1.5;
  const nightPay = input.baseHourlyRate * input.nightHours * 0.5;
  const holidayPay = input.baseHourlyRate * input.holidayHours * 1.5;
  const overtimeAllowance = overtimePay + nightPay + holidayPay;

  const grossPay = basePay + overtimeAllowance + input.mealAllowance;
  const netPay = grossPay - input.totalDeductions;

  return {
    grossPay,
    basePay,
    overtimeAllowance,
    mealAllowance: input.mealAllowance,
    totalDeductions: input.totalDeductions,
    netPay
  };
}
```

`src/core/validators/attendanceValidator.ts`:
```typescript
export interface IAttendanceValidationInput {
  regularHours: number;
  overtimeHours: number;
  nightHours: number;
  holidayHours: number;
}

export interface IAttendanceValidationResult {
  isAnomalous: boolean;
  reason?: string;
}

export function validateAttendanceRecord(input: IAttendanceValidationInput): IAttendanceValidationResult {
  if (input.overtimeHours > 52) {
    return {
      isAnomalous: true,
      reason: '월간 연장근무 한도 초과 (52시간 이상)'
    };
  }
  if (input.regularHours < 0 || input.overtimeHours < 0) {
    return {
      isAnomalous: true,
      reason: '근무 시간에 음수값이 포함되어 있습니다.'
    };
  }
  return {
    isAnomalous: false
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/core/calculators.test.ts tests/core/validators.test.ts`
Expected: PASS

- [ ] **Step 5: Commit calculator & validator engines**

```bash
git add src/core/calculators src/core/validators tests/core/calculators.test.ts tests/core/validators.test.ts
git commit -m "feat: implement salary, hourly calculation and attendance validator core engines with tests"
```

---

### Task 5: Electron Main Process & Preload IPC Bridge

**Files:**
- Create: `src/main/index.ts`
- Create: `src/main/ipc/dbIpc.ts`
- Create: `src/preload/index.ts`

**Interfaces:**
- Produces: `window.electronAPI` bridge for Renderer

- [ ] **Step 1: Implement Main IPC Handlers `src/main/ipc/dbIpc.ts`**

```typescript
import { ipcMain, dialog } from 'electron';
import { getDb, initDatabase } from '../../core/db/client';
import * as schema from '../../core/db/schema';
import { IDbStatus } from '../../shared/types';

export function registerIpcHandlers(): void {
  ipcMain.handle('db:getStatus', async (): Promise<IDbStatus> => {
    try {
      getDb();
      return {
        connected: true,
        version: 'SQLite 3 via better-sqlite3',
        path: 'payroll.db'
      };
    } catch {
      return {
        connected: false,
        version: 'Unknown',
        path: ''
      };
    }
  });

  ipcMain.handle('db:getEmployees', async () => {
    const db = getDb();
    return db.select().from(schema.employees).all();
  });

  ipcMain.handle('db:getWorkCenters', async () => {
    const db = getDb();
    return db.select().from(schema.workCenters).all();
  });

  ipcMain.handle('db:getPayrollPeriods', async () => {
    const db = getDb();
    return db.select().from(schema.payrollPeriods).all();
  });

  ipcMain.handle('dialog:openFile', async (_event, options) => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: options?.filters || [{ name: 'Excel Files', extensions: ['xlsx', 'xls', 'csv'] }]
    });
    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }
    return result.filePaths[0];
  });
}
```

- [ ] **Step 2: Implement Main entry `src/main/index.ts`**

```typescript
import { app, BrowserWindow } from 'electron';
import path from 'path';
import { registerIpcHandlers } from './ipc/dbIpc';
import { initDatabase } from '../core/db/client';

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    title: 'MySalary - 급여 및 근태 자동화 시스템',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(() => {
  initDatabase(path.join(app.getPath('userData'), 'payroll.db'));
  registerIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
```

- [ ] **Step 3: Implement Preload Bridge `src/preload/index.ts`**

```typescript
import { contextBridge, ipcRenderer } from 'electron';
import { IElectronAPI } from '../shared/types';

const api: IElectronAPI = {
  getDbStatus: () => ipcRenderer.invoke('db:getStatus'),
  getEmployees: () => ipcRenderer.invoke('db:getEmployees'),
  getWorkCenters: () => ipcRenderer.invoke('db:getWorkCenters'),
  getPayrollPeriods: () => ipcRenderer.invoke('db:getPayrollPeriods'),
  createPayrollPeriod: (yearMonth: string) => ipcRenderer.invoke('db:createPayrollPeriod', yearMonth),
  openFileDialog: (options) => ipcRenderer.invoke('dialog:openFile', options)
};

contextBridge.exposeInMainWorld('electronAPI', api);
```

- [ ] **Step 4: Commit Main & Preload**

```bash
git add src/main src/preload
git commit -m "feat: implement Electron main lifecycle and contextBridge preload script"
```

---

### Task 6: React Desktop UI Shell with 5-Stage Navigation

**Files:**
- Create: `src/renderer/index.html`
- Create: `src/renderer/src/index.css`
- Create: `src/renderer/src/main.tsx`
- Create: `src/renderer/src/App.tsx`
- Create: `src/renderer/src/components/Sidebar.tsx`
- Create: `src/renderer/src/components/Header.tsx`
- Create: `src/renderer/src/features/attendance/AttendanceView.tsx`
- Create: `src/renderer/src/features/payroll/PayrollView.tsx`
- Create: `src/renderer/src/features/export/ExportView.tsx`
- Create: `src/renderer/src/features/history/HistoryView.tsx`

**Interfaces:**
- Produces: Interactive React Desktop UI with 5-stage tab routing and status cards

- [ ] **Step 1: Create `src/renderer/index.html` and `src/renderer/src/index.css`**

`src/renderer/index.html`:
```html
<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>MySalary - 급여 및 근태 자동화 시스템</title>
  </head>
  <body class="bg-slate-900 text-slate-100 antialiased select-none">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`src/renderer/src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans KR', sans-serif;
}
```

- [ ] **Step 2: Create `src/renderer/src/components/Sidebar.tsx` & `Header.tsx`**

`src/renderer/src/components/Sidebar.tsx`:
```tsx
import React from 'react';
import { 
  FileSpreadsheet, 
  CheckCircle2, 
  Calculator, 
  DownloadCloud, 
  History, 
  Users, 
  Settings 
} from 'lucide-react';

interface ISidebarProps {
  currentStage: number;
  onSelectStage: (stage: number) => void;
}

export function Sidebar({ currentStage, onSelectStage }: ISidebarProps) {
  const stages = [
    { id: 1, name: '1. 인풋 등록', icon: FileSpreadsheet, desc: '출퇴근/4대보험 엑셀 업로드' },
    { id: 2, name: '2. 근태 검증', icon: CheckCircle2, desc: '연장/휴일 교차검증 & 보정' },
    { id: 3, name: '3. 급여 산출', icon: Calculator, desc: '연봉직/생산직 수당 계산' },
    { id: 4, name: '4. 산출물 생성', icon: DownloadCloud, desc: '위아고/은행/미국 리포트' },
    { id: 5, name: '5. DB 확정/이력', icon: History, desc: '월별 데이터 보관 및 비교' },
  ];

  return (
    <aside className="w-64 bg-slate-950 border-r border-slate-800 flex flex-col justify-between">
      <div>
        <div className="p-5 border-b border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-sky-500 flex items-center justify-center font-bold text-white shadow-lg shadow-sky-500/30">
            S
          </div>
          <div>
            <h1 className="font-bold text-sm text-slate-100">MySalary</h1>
            <p className="text-xs text-slate-400">급여 & 근태 자동화</p>
          </div>
        </div>

        <div className="px-3 py-4">
          <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            5단계 정산 파이프라인
          </p>
          <nav className="space-y-1">
            {stages.map((stage) => {
              const Icon = stage.icon;
              const isActive = currentStage === stage.id;
              return (
                <button
                  key={stage.id}
                  onClick={() => onSelectStage(stage.id)}
                  className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                    isActive
                      ? 'bg-sky-500/10 text-sky-400 font-medium border border-sky-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                  }`}
                >
                  <Icon className={`w-5 h-5 mt-0.5 ${isActive ? 'text-sky-400' : 'text-slate-500'}`} />
                  <div>
                    <div className="text-sm leading-none">{stage.name}</div>
                    <div className="text-xs text-slate-500 mt-1">{stage.desc}</div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>로컬 SQLite 연결됨</span>
        </div>
      </div>
    </aside>
  );
}
```

`src/renderer/src/components/Header.tsx`:
```tsx
import React from 'react';
import { Calendar, UserCheck } from 'lucide-react';

interface IHeaderProps {
  currentMonth: string;
}

export function Header({ currentMonth }: IHeaderProps) {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-800 border border-slate-700 text-xs text-slate-300">
          <Calendar className="w-4 h-4 text-sky-400" />
          <span>정산 대상월: <strong className="text-white">{currentMonth}</strong></span>
        </div>
        <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
          작성중 (DRAFT)
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="text-xs text-slate-400 flex items-center gap-1.5">
          <UserCheck className="w-4 h-4 text-emerald-400" />
          <span>사원 수: <strong className="text-slate-200">12명 (연봉 4 / 생산 8)</strong></span>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 3: Create Views & `App.tsx`**

`src/renderer/src/features/attendance/AttendanceView.tsx`:
```tsx
import React from 'react';
import { Upload, FileCheck } from 'lucide-react';

export function AttendanceView() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-100">1단계: 원천 데이터 인풋 등록</h2>
        <p className="text-sm text-slate-400">출퇴근 기록 프로그램의 raw 데이터 및 4대보험 고지 내역 엑셀을 업로드하세요.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border-2 border-dashed border-slate-700 hover:border-sky-500/50 rounded-xl p-8 text-center bg-slate-900/40 cursor-pointer transition">
          <Upload className="w-10 h-10 text-sky-400 mx-auto mb-3" />
          <h3 className="font-semibold text-sm text-slate-200">출퇴근 기록 raw 파일 등록</h3>
          <p className="text-xs text-slate-400 mt-1">.xlsx, .csv 파일을 끌어다 놓거나 클릭하여 선택</p>
        </div>

        <div className="border-2 border-dashed border-slate-700 hover:border-sky-500/50 rounded-xl p-8 text-center bg-slate-900/40 cursor-pointer transition">
          <FileCheck className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
          <h3 className="font-semibold text-sm text-slate-200">4대 보험 고지 내역서 등록</h3>
          <p className="text-xs text-slate-400 mt-1">국민연금/건강보험/고용보험 고지 엑셀 파일</p>
        </div>
      </div>
    </div>
  );
}
```

`src/renderer/src/App.tsx`:
```tsx
import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { AttendanceView } from './features/attendance/AttendanceView';

export function App() {
  const [currentStage, setCurrentStage] = useState<number>(1);
  const [currentMonth] = useState<string>('2026-08');

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950">
      <Sidebar currentStage={currentStage} onSelectStage={setCurrentStage} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header currentMonth={currentMonth} />
        <main className="flex-1 overflow-y-auto p-8 bg-slate-900/40">
          {currentStage === 1 && <AttendanceView />}
          {currentStage === 2 && (
            <div className="text-slate-300">2단계: 근태 교차 검증 화면 (준비중)</div>
          )}
          {currentStage === 3 && (
            <div className="text-slate-300">3단계: 급여 산출 엔진 화면 (준비중)</div>
          )}
          {currentStage === 4 && (
            <div className="text-slate-300">4단계: 산출물(위아고/은행/미국) 생성 화면 (준비중)</div>
          )}
          {currentStage === 5 && (
            <div className="text-slate-300">5단계: DB 확정 및 이력 관리 화면 (준비중)</div>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
```

`src/renderer/src/main.tsx`:
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 4: Commit UI Shell**

```bash
git add src/renderer
git commit -m "feat: implement React desktop UI shell with 5-stage navigation and attendance view"
```

---

### Task 7: End-to-End Verification of Boilerplate

- [ ] **Step 1: Run Vitest Unit Tests**

Run: `npm run test`
Expected: ALL test suites pass (DB layer, Calculators, Validators).

- [ ] **Step 2: Run TypeScript Typecheck & Vite Build**

Run: `npm run build`
Expected: TypeScript compile and Vite bundle generated without errors.

- [ ] **Step 3: Final Phase 1 Commit**

```bash
git add .
git commit -m "chore: complete phase 1 boilerplate verification and build setup"
```
