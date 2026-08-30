# Salary & Attendance Automation System - Architecture & Design Specification

- **Date**: 2026-08-30
- **Status**: Approved by User
- **Author**: Antigravity & User

---

## 1. Executive Summary & Goals

본 프로젝트는 사내 급여 담당자의 업무 효율을 극대화하기 위해 출퇴근 근태 원천 데이터 수집부터 이상치 검증, 연봉직/생산직 급여 및 4대보험 자동 계산, 위아고(WEHAGO) 대량 업로드 엑셀, 은행 이체 파일, 미국 본사 청구서, 상급자 보고용 요약 리포트까지 원스톱으로 처리하는 **로컬 독립형 데스크톱 애플리케이션(Desktop GUI App)**을 구축하는 것입니다.

### Key Objectives
1. **완벽한 로컬 격리 및 보안**: 개인 PC에서 독립적으로 실행되며, SQLite 단일 파일로 데이터를 안전하게 관리.
2. **5단계 표준 파이프라인**: 인풋 수집 -> 근태 교차 검증 -> 급여 계산 -> 산출물 생성 -> DB 확정 및 이력 관리.
3. **테스트 가능한 모듈형 아키텍처**: 순수 비즈니스 로직(`src/core`)을 UI/Electron과 분리하여 100% 독립 단위 테스트 지원.
4. **유연한 확장성**: 향후 회사 차원의 시스템 도입이나 웹 서비스로의 전환이 용이하도록 레이어드 설계 적용.

---

## 2. Technology Stack

- **Runtime / Framework**: Electron (Desktop Application)
- **Frontend / Renderer**: React, TypeScript, Vite, TailwindCSS, Lucide Icons
- **Local Database**: SQLite (`better-sqlite3`) + Drizzle ORM (Type-safe query & schema migration)
- **Data & Excel Processing**: `exceljs` (템플릿 서식 보존 및 수식 처리), `xlsx` (빠른 파싱)
- **State Management & Query**: Zustand (UI State), TanStack Query (Local DB Caching)
- **Testing**: Vitest (Core domain logic unit & integration tests)

---

## 3. Directory & Module Architecture

```text
my-salary/
├── src/
│   ├── main/                  # Electron Main Process
│   │   ├── index.ts           # Window lifecycle & app initialization
│   │   ├── ipc/               # IPC handlers (DB operations, File Dialogs, Excel tasks)
│   │   └── menu.ts            # Application menu & shortcuts
│   ├── preload/               # Electron Preload Scripts
│   │   ├── index.ts           # ContextBridge API exposure (window.electronAPI)
│   │   └── types.ts           # Type-safe IPC interface definitions
│   ├── core/                  # Pure Business Logic Engine (UI-independent)
│   │   ├── db/                # Drizzle schema, SQLite connection, migration runners
│   │   │   ├── schema/        # Table definitions (employees, attendance, payroll, work_centers)
│   │   │   └── client.ts      # SQLite & Drizzle instance factory
│   │   ├── parsers/           # Raw attendance & insurance Excel parsers
│   │   ├── calculators/       # Salary calculation engines (Salary vs Production, Overtime, Insurance)
│   │   ├── validators/        # Attendance cross-check and anomaly detection rules
│   │   └── exporters/         # File generators (WEHAGO xlsx, Bank transfer, US Billing, Summary)
│   ├── renderer/              # Vite + React UI
│   │   ├── src/
│   │   │   ├── components/    # Reusable UI components (Sidebar, Tables, Modals, FileUploader)
│   │   │   ├── features/      # Feature modules matching the 5 pipeline steps
│   │   │   │   ├── attendance/  # Step 1~2: Ingestion & Anomaly Validation UI
│   │   │   │   ├── payroll/     # Step 3: Calculation & Sheet Split UI
│   │   │   │   ├── export/      # Step 4: Output File Generator UI
│   │   │   │   └── history/     # Step 5: Master Management & Historical Sessions
│   │   │   ├── hooks/         # Custom React hooks
│   │   │   ├── store/         # Zustand global store (Current session state)
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   └── index.html
│   └── shared/                # Shared Types & Constants
│       ├── types/             # Domain DTOs and Interfaces
│       └── constants/         # Calculation rates, account codes, default mappings
├── tests/                     # Vitest test suite for src/core
├── drizzle.config.ts          # Drizzle configuration
├── electron-builder.yml       # Windows installer package configuration
├── vite.config.ts
└── package.json
```

---

## 4. Database Schema (Drizzle ORM & SQLite)

### 4.1 `work_centers`
- `id`: integer, primary key, autoincrement
- `code`: text, not null, unique (e.g., "WC-PROD-01")
- `name`: text, not null (e.g., "생산1팀", "경영지원팀")
- `account_code`: text, not null (회계 계정 코드)
- `us_billing_code`: text, nullable (미국 본사 청구 매핑 코드)

### 4.2 `employees`
- `id`: integer, primary key, autoincrement
- `employee_no`: text, not null, unique
- `name`: text, not null
- `employment_type`: text, not null (`SALARY` | `HOURLY_PRODUCTION`)
- `work_center_id`: integer, references `work_centers.id`
- `bank_name`: text, not null
- `account_number`: text, not null
- `base_salary`: real, not null (월 기본급 또는 기본 시급)
- `is_active`: integer (boolean), default 1

### 4.3 `payroll_periods`
- `id`: integer, primary key, autoincrement
- `year_month`: text, not null, unique (e.g., "2026-08")
- `status`: text, not null (`DRAFT` | `ATTENDANCE_VERIFIED` | `CALCULATED` | `FINALIZED`)
- `created_at`: integer (timestamp)
- `finalized_at`: integer (timestamp), nullable

### 4.4 `attendance_records`
- `id`: integer, primary key, autoincrement
- `period_id`: integer, not null, references `payroll_periods.id`
- `employee_id`: integer, not null, references `employees.id`
- `regular_hours`: real, default 0
- `overtime_hours`: real, default 0
- `night_hours`: real, default 0
- `holiday_hours`: real, default 0
- `is_anomalous`: integer, default 0
- `anomaly_details`: text, nullable (이상 사유 설명)
- `adjustment_reason`: text, nullable (수동 보정 내역)

### 4.5 `insurance_assessments`
- `id`: integer, primary key, autoincrement
- `period_id`: integer, not null, references `payroll_periods.id`
- `employee_id`: integer, not null, references `employees.id`
- `national_pension`: real, default 0
- `health_insurance`: real, default 0
- `long_term_care`: real, default 0
- `employment_insurance`: real, default 0

### 4.6 `payroll_items`
- `id`: integer, primary key, autoincrement
- `period_id`: integer, not null, references `payroll_periods.id`
- `employee_id`: integer, not null, references `employees.id`
- `work_center_id`: integer, not null, references `work_centers.id`
- `gross_pay`: real, not null (총 지급액)
- `base_pay`: real, not null (기본급)
- `overtime_allowance`: real, default 0 (연장/야간/휴일 수당)
- `meal_allowance`: real, default 0 (비과세 식대)
- `total_deductions`: real, not null (총 공제액: 4대보험 + 소득세 + 지방소득세)
- `net_pay`: real, not null (차인지급액 / 은행 이체액)
- `us_billing_amount`: real, default 0 (미국 본사 청구 금액)

---

## 5. The 5-Stage Data Pipeline Details

1. **Stage 1: Input Ingestion & Master Mapping**
   - Excel drag-and-drop parser reads attendance clock-in/out raw files and monthly 4-major insurance notification files.
   - Name & Employee Number reconciliation against the master database.
2. **Stage 2: Attendance Cross-Validation & Anomaly Rectification**
   - Rule checks: Weekend work without pre-approval, missing punches (in without out), excessive overtime exceeding limits.
   - Anomaly correction grid UI allowing inline edits before passing to calculation.
3. **Stage 3: Payroll Calculation Engine**
   - Salary employees: Monthly contract base pay + standard tax-free allowances.
   - Hourly/Production employees: Regular hours base + weekly holiday pay + overtime (1.5x) + night (0.5x) + holiday (1.5x~2.0x).
   - Deductions: Actual 4-major insurance assessment values + simplified income tax deduction.
   - Cost assignment: Allocation to specific `work_centers` and account codes.
4. **Stage 4: Multi-format Exporters**
   - WEHAGO bulk upload `.xlsx` generation matching WEHAGO's strict schema.
   - Bank transfer payroll payment files (formatted `.xlsx` / `.txt`).
   - US Headquarters billing summary sheet.
   - Executive report dashboard summary.
5. **Stage 5: Finalization & Historical Archives**
   - Snapshots saved in SQLite with timestamp, locked against accidental edits, queryable for past period comparisons.

---

## 6. Incremental Development Roadmap

- **Phase 1 (Current Target)**: Core Boilerplate & Desktop Shell Setup
  - Git repository initialization & feature branch `feat/initial-boilerplate`
  - Electron + Vite + React + TypeScript + TailwindCSS scaffolding
  - SQLite (`better-sqlite3`) + Drizzle ORM configuration & base schema
  - `src/core` business logic directory isolation & Vitest test runner
  - Modern desktop UI shell with 5-stage navigation tabs and sample data test
- **Phase 2**: Employee/Work Center Master Management & Excel Parsers
- **Phase 3**: Anomaly Validation Grid & Payroll Calculation Engine
- **Phase 4**: Output Exporters (WEHAGO, Bank, US Billing)
- **Phase 5**: Polish, Local DB Backup/Restore & Windows `.exe` Packaging
