# DB 마이그레이션 가이드

## 개요

MySalary 는 **Drizzle ORM**과 **Drizzle Kit**를 사용하여 SQLite 데이터베이스 스키마를 관리합니다.

### 사용하는 오픈소스

| 라이브러리 | 역할 |
|-----------|------|
| [Drizzle ORM](https://orm.drizzle.team) | TypeScript 로 작성한 스키마 정의를 SQL 쿼리로 변환하는 타입 안전 ORM |
| [Drizzle Kit](https://orm.drizzle.team/docs/kit) | Drizzle 의 CLI 도구. 스키마 변경사항을 마이그레이션 SQL 파일로 생성 |
| [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) | SQLite 의 Node.js 바인딩. 동기식 API 로 고성능 DB 접근 |

---

## 핵심 개념

### 전통적인 방식 vs 마이그레이션 방식

**전통적인 방식 (X)** — 코드에 SQL 을 직접 작성:

```typescript
// 나쁜 예: 코드에 SQL 하드코딩
db.exec(`CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT)`);
```

문제점: 스키마 변경 이력 추적 불가, 팀원 간 동기화 어려움, 롤백 불가능

**마이그레이션 방식 (O)** — TypeScript 스키마 → SQL 마이그레이션 파일:

```
TypeScript 스키마 정의 → drizzle-kit → SQL 마이그레이션 파일 → DB 에 적용
```

장점: 변경 이력 관리, 버전 관리 가능, 팀원 간 동기화 용이

---

## 전체 흐름 (End-to-End)

```
┌─────────────────────────────────────────────────────────────────────┐
│                        개발자 작업                                   │
│                                                                     │
│  1. 스키마 파일 수정 (TypeScript)                                   │
│     src/core/db/schema/employees.ts                                 │
│     → 새로운 컬럼 추가                                              │
│                                                                     │
│  2. 마이그레이션 SQL 생성                                           │
│     $ npm run db:generate                                           │
│     → migrations/0001_add_column.sql 생성                           │
│                                                                     │
│  3. 로컬 DB 에 적용 (선택)                                         │
│     $ npm run db:migrate                                            │
│     → data/payroll.db 에 SQL 적용                                   │
│                                                                     │
│  4. 빌드                                                            │
│     $ npm run build                                                 │
│     → 마이그레이션 SQL 이 dist-electron/migrations/ 에 복사         │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                       앱 실행 시 (자동)                              │
│                                                                     │
│  1. better-sqlite3 로 SQLite DB 연결                                │
│  2. dist-electron/migrations/ 의 SQL 파일 읽기                      │
│  3. 아직 적용되지 않은 마이그레이션만 실행                           │
│  4. drizzle_$schema_migrations 테이블에 적용 이력 기록              │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 디렉터리 구조

```
my-salary/
├── src/core/db/schema/          # TypeScript 스키마 정의 (입력)
│   ├── index.ts                 # 모든 스키마 재export
│   ├── workCenters.ts           # 워크센터 테이블
│   ├── employees.ts             # 사원 테이블
│   ├── payrollPeriods.ts        # 급여 기간 테이블
│   ├── attendanceRecords.ts     # 근태 기록 테이블
│   ├── insuranceAssessments.ts  # 4대 보험 테이블
│   └── payrollItems.ts          # 급여 명세 테이블
│
├── migrations/                  # 마이그레이션 SQL 파일 (출력)
│   ├── 0000_curvy_hawkeye.sql   # 초기 스키마
│   ├── 0001_new_migration.sql   # (새로운 변경사항 시 생성)
│   └── ...
│
├── drizzle.config.mjs           # Drizzle Kit 설정 파일
│
├── dist-electron/migrations/    # 빌드 시 복사된 마이그레이션 SQL
│   └── 0000_curvy_hawkeye.sql
│
└── data/payroll.db              # 실제 SQLite 데이터베이스 파일
```

---

## 스키마 파일 이해하기

### 예: `employees.ts`

```typescript
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { workCenters } from './workCenters';

export const employees = sqliteTable('employees', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  employeeNo: text('employee_no').notNull().unique(),
  name: text('name').notNull(),
  employmentType: text('employment_type', {
    enum: ['SALARY', 'HOURLY_PRODUCTION']
  }).notNull(),
  workCenterId: integer('work_center_id')
    .references(() => workCenters.id).notNull(),
  bankName: text('bank_name').notNull(),
  accountNumber: text('account_number').notNull(),
  baseSalary: real('base_salary').notNull(),
  isActive: integer('is_active', { mode: 'boolean' })
    .notNull().default(true)
});
```

### 매핑 관계

| TypeScript 코드 | SQLite 컬럼 | 설명 |
|----------------|-------------|------|
| `sqliteTable('employees', {...})` | `CREATE TABLE employees` | 테이블 이름 |
| `integer('id').primaryKey({ autoIncrement: true })` | `id INTEGER PRIMARY KEY AUTOINCREMENT` | 자동 증가 기본키 |
| `text('name').notNull()` | `name TEXT NOT NULL` | 필수 텍스트 |
| `text('employee_no').notNull().unique()` | `employee_no TEXT NOT NULL UNIQUE` | 고유 제약 |
| `real('base_salary').notNull()` | `base_salary REAL NOT NULL` | 실수형 |
| `integer('is_active', { mode: 'boolean' }).default(true)` | `is_active INTEGER DEFAULT true` | 불리언 (SQLite 에는 BOOLEAN 타입 없음) |
| `.references(() => workCenters.id)` | `FOREIGN KEY (...) REFERENCES work_centers(id)` | 외래키 |

---

## 명령어 사용법

### 1. `npm run db:generate` — 마이그레이션 SQL 생성

**목적:** TypeScript 스키마 변경사항을 SQL 마이그레이션 파일로 변환

**동작 과정:**

```
1. drizzle.config.mjs 읽기
2. src/core/db/schema/index.ts 의 스키마 정의 분석
3. 기존 migrations/ 폴더의 SQL 파일들과 비교
4. 변경된 부분만 추출하여 새 SQL 파일 생성
```

**입력:**
- `src/core/db/schema/` — TypeScript 스키마 파일
- `migrations/` — 기존 마이그레이션 SQL 파일 (변경 기준점)

**출력:**
- `migrations/0001_이름.sql` — 새로운 마이그레이션 SQL 파일

**실제 예:**

```bash
$ npm run db:generate

> npx drizzle-kit generate --config=drizzle.config.mjs

Reading config file 'drizzle.config.mjs'
6 tables
work_centers 5 columns 1 indexes 0 fks
employees 9 columns 1 indexes 1 fks
...
[✓] Your SQL migration file ➜ migrations/0000_curvy_hawkeye.sql 🚀
```

**생성된 SQL 예:**

```sql
-- migrations/0000_curvy_hawkeye.sql
CREATE TABLE `employees` (
    `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    `employee_no` text NOT NULL,
    `name` text NOT NULL,
    `employment_type` text NOT NULL,
    `work_center_id` integer NOT NULL,
    ...
    FOREIGN KEY (`work_center_id`) REFERENCES `work_centers`(`id`)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `employees_employee_no_unique` ON `employees` (`employee_no`);
```

> `--> statement-breakpoint`는 Drizzle Kit 이 각 SQL 문을 구분하는 마커입니다. 마이그레이션 시 이 마커 기준으로 문을 분리하여 순차적으로 실행합니다.

---

### 2. `npm run db:migrate` — 로컬 DB 에 마이그레이션 적용

**목적:** 생성된 마이그레이션 SQL 을 로컬 SQLite DB 에 적용

**동작 과정:**

```
1. data/payroll.db SQLite 파일 열기 (없으면 생성)
2. migrations/ 폴더의 SQL 파일 목록 읽기
3. drizzle_$schema_migrations 테이블에서 이미 적용된 마이그레이션 확인
4. 아직 적용되지 않은 SQL 파일만 순차적으로 실행
5. 적용 완료 후 drizzle_$schema_migrations 에 기록
```

**입력:**
- `migrations/*.sql` — 마이그레이션 SQL 파일
- `data/payroll.db` — SQLite 데이터베이스

**출력:**
- `data/payroll.db` — 테이블이 생성되거나 변경된 DB
- `drizzle_$schema_migrations` 테이블 — 적용된 마이그레이션 이력

**실제 예:**

```bash
$ npm run db:migrate

[✓] Migration executed successfully: 0000_curvy_hawkeye.sql
```

---

## 앱 실행 시 DB 구성 과정

앱(`npm start` 또는 `npm run dev`)을 실행하면 자동으로 마이그레이션이 적용됩니다.

### 동작 과정 (`src/main/index.ts`)

```typescript
function initDatabase(dbPath = 'payroll.db') {
  const Database = require('better-sqlite3');
  const { drizzle } = require('drizzle-orm/better-sqlite3');
  const { migrate } = require('drizzle-orm/better-sqlite3/migrator');
  const schema = require(path.join(__dirname, './schema/index.cjs'));

  // 1. SQLite DB 연결 (파일 없으면 자동 생성)
  const sqliteInstance = new Database(dbPath);

  // 2. WAL 모드 + 외래키 활성화
  sqliteInstance.pragma('journal_mode = WAL');
  sqliteInstance.pragma('foreign_keys = ON');

  // 3. 빌드된 마이그레이션 SQL 적용
  const migrationsFolder = path.join(__dirname, './migrations');
  if (fs.existsSync(migrationsFolder)) {
    migrate(drizzle(sqliteInstance), { migrationsFolder });
  }

  // 4. Drizzle DB 인스턴스 반환
  return drizzle(sqliteInstance, { schema });
}
```

### 단계별 설명

| 단계 | 동작 | 결과 |
|------|------|------|
| 1 | `new Database(dbPath)` | SQLite 파일 열기 또는 생성 |
| 2 | `journal_mode = WAL` | Write-Ahead Logging 활성화 (성능 향상) |
| 2 | `foreign_keys = ON` | 외래키 제약 활성화 |
| 3 | `migrate()` | `dist-electron/migrations/` 의 SQL 파일 순차 적용 |
| 4 | `drizzle(sqliteInstance, { schema })` | 타입 안전 쿼리 객체 반환 |

### 마이그레이션 적용 로직

```
dist-electron/migrations/
├── 0000_curvy_hawkeye.sql    ← 이미 적용됨 (건너뜀)
├── 0001_add_column.sql       ← 아직 미적용 → 실행
└── 0002_rename_table.sql     ← 아직 미적용 → 실행
```

`migrate()` 함수는 `drizzle_$schema_migrations` 테이블을 확인하여 **이미 적용된 마이그레이션은 건너뛰고**, 미적용 파일만 순차적으로 실행합니다.

---

## 스키마 변경 워크플로우

### 새로운 컬럼 추가하기

**1. 스키마 파일 수정**

```typescript
// src/core/db/schema/employees.ts
export const employees = sqliteTable('employees', {
  // ... 기존 컬럼 ...
  phoneNumber: text('phone_number'),  // ← 새 컬럼 추가
});
```

**2. 마이그레이션 SQL 생성**

```bash
npm run db:generate
```

```
[✓] Your SQL migration file ➜ migrations/0001_add_phone.sql 🚀
```

**3. 생성된 SQL 확인**

```sql
-- migrations/0001_add_phone.sql
ALTER TABLE `employees` ADD `phone_number` text;
```

**4. 로컬 DB 적용**

```bash
npm run db:migrate
```

**5. 빌드**

```bash
npm run build
```

빌드 시 마이그레이션 SQL 이 `dist-electron/migrations/` 에 자동으로 복사됩니다.

---

## drizzle_$schema_migrations 테이블

마이그레이션 이력을 추적하는 내부 테이블입니다. 사용자가 직접 조작할 필요는 없지만, 구조는 다음과 같습니다:

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | INTEGER PRIMARY KEY | 자동 증가 ID |
| `version` | TEXT NOT NULL | 마이그레이션 파일 이름 (`0000_curvy_hawkeye`) |
| `applied_at` | INTEGER DEFAULT CURRENT_TIMESTAMP | 적용 시각 |

이 테이블이 존재하지 않으면 첫 실행 시 자동으로 생성됩니다.

---

## drizzle.config.mjs 설정 파일

```javascript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './migrations',              // 마이그레이션 SQL 출력 디렉터리
  schema: './src/core/db/schema/index.ts',  // 스키마 파일 위치
  dialect: 'sqlite',                // 데이터베이스 종류
  dbCredentials: {
    url: './data/payroll.db',       // 로컬 DB 경로 (migrate 명령어용)
  },
});
```

---

## 자주 묻는 질문

### Q: 마이그레이션 SQL 파일을 직접 수정해도 되나요?

**가능하지만 권장하지 않습니다.** 스키마 파일과 SQL 이 불일치할 수 있습니다. 항상 TypeScript 스키마 파일을 수정하고 `db:generate` 로 SQL 을 재생성하세요.

### Q: 마이그레이션을 롤백할 수 있나요?

Drizzle Kit 은 현재 **다운 마이그레이션(롤백) 을 공식 지원하지 않습니다.** 롤백이 필요한 경우:
1. `drizzle_$schema_migrations` 테이블에서 해당 마이그레이션 기록 삭제
2. 수동으로 컬럼/테이블 삭제 또는 복원

### Q: `npm run db:migrate`를 매번 실행해야 하나요?

**아닙니다.** 앱 실행 시 자동으로 마이그레이션이 적용됩니다. `db:migrate`는 개발 중 빠른 확인을 위한 것입니다.

### Q: 기존 DB 데이터가 마이그레이션 시 삭제되나요?

**DELETE/DROP 이 없는 마이그레이션은 데이터를 보존합니다.** 컬럼 추가, 인덱스 생성 등은 기존 데이터를 유지합니다. 하지만 테이블 삭제나 컬럼 타입 변경은 데이터 손실로 이어질 수 있으므로 주의하세요.

### Q: 빌드 시 마이그레이션 SQL 이 어떻게 복사되나요?

`vite.config.mjs`의 `schemaPlugin()`이 빌드 시 `migrations/` 폴더의 `.sql` 파일을 `dist-electron/migrations/` 에 복사합니다. 별도의 추가 작업이 필요 없습니다.
