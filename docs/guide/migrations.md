# DB 마이그레이션 가이드

## 개요

MySalary 는 **Drizzle ORM**과 **Drizzle Kit**를 사용하여 SQLite 데이터베이스 스키마를 관리합니다.

### 사용하는 오픈소스

| 라이브러리 | 역할 |
|-----------|------|
| [Drizzle ORM](https://orm.drizzle.team) | TypeScript 로 작성한 스키마 정의를 SQL 쿼리로 변환하는 타입 안전 ORM |
| [Drizzle Kit](https://orm.drizzle.team/docs/kit) | Drizzle 의 CLI 도구. 스키마 변경사항을 마이그레이션 SQL 파일로 생성 |
| [sql.js](https://github.com/sql-js/sql.js) | WebAssembly 기반 SQLite. 네이티브 빌드 불필요, ESM 완벽 지원 |

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
│  3. 빌드                                                            │
│     $ npm run build                                                 │
│     → 마이그레이션 SQL 이 dist-electron/migrations/ 에 복사         │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│                       앱 실행 시 (자동)                              │
│                                                                     │
│  1. sql.js 로 WASM SQLite 초기화                                    │
│  2. 기존 DB 파일 로드 (파일 없으면 새 DB 생성)                       │
│  3. dist-electron/migrations/ 의 SQL 파일 순차 실행                  │
│  4. DB 파일 저장                                                    │
└─────────────────────────────────────────────────────────────────────┘
```

> **참고:** sql.js 는 better-sqlite3 와 달리 빌트인 migrator 가 없습니다. 마이그레이션 SQL 은 앱 시작 시 `sqliteInstance.run()` 으로 직접 실행됩니다.

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

### `npm run db:generate` — 마이그레이션 SQL 생성

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

> `--> statement-breakpoint`는 Drizzle Kit 이 각 SQL 문을 구분하는 마커입니다. 앱 실행 시 이 마커 기준으로 문을 분리하여 순차적으로 실행합니다.

---

## 앱 실행 시 DB 구성 과정

앱(`npm start` 또는 `npm run dev`)을 실행하면 자동으로 마이그레이션이 적용됩니다.

### 동작 과정 (`src/main/index.ts`)

```typescript
async function initDatabase(dbPath = 'payroll.db') {
  // 1. sql.js WASM 초기화
  const SQL = await initSqlJs({
    locateFile: (file) => path.join(__dirname, '../../node_modules/sql.js/dist/', file)
  });

  // 2. 기존 DB 파일 로드 (없으면 새 DB 생성)
  let dbData;
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    dbData = new Uint8Array(buffer);
  }

  const sqliteInstance = new SQL.Database(dbData);

  // 3. 마이그레이션 SQL 파일 순차 실행
  const migrationsFolder = path.join(__dirname, './migrations');
  if (fs.existsSync(migrationsFolder)) {
    const migrationFiles = fs.readdirSync(migrationsFolder)
      .filter(f => f.endsWith('.sql'))
      .sort();

    for (const file of migrationFiles) {
      const sql = fs.readFileSync(path.join(migrationsFolder, file), 'utf8');
      const statements = sql.split('--> statement-breakpoint').filter(s => s.trim());
      for (const stmt of statements) {
        if (stmt.trim()) {
          sqliteInstance.run(stmt.trim());
        }
      }
    }
  }

  // 4. DB 파일 저장
  const data = sqliteInstance.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}
```

### 단계별 설명

| 단계 | 동작 | 결과 |
|------|------|------|
| 1 | `initSqlJs()` | WASM SQLite 엔진 초기화 |
| 2 | 기존 DB 파일 로드 | 기존 데이터 유지, 없으면 빈 DB 생성 |
| 3 | 마이그레이션 SQL 실행 | `dist-electron/migrations/` 의 SQL 파일 순차 실행 |
| 4 | `sqliteInstance.export()` | 변경사항을 파일에 저장 |

### ⚠️ sql.js 마이그레이션 특성

better-sqlite3 의 `migrate()` 함수와 달리, sql.js 는 **빌트인 migrator 가 없습니다.** 따라서:

- **모든 마이그레이션 SQL 이 매 실행 시 순차 실행됨**
- `CREATE TABLE IF NOT EXISTS` 패턴이 아닌 경우, 기존 테이블이 있으면 에러 발생
- Drizzle Kit 이 생성한 SQL 은 `CREATE TABLE` / `CREATE INDEX` 문으로, **중복 실행 시 에러**가 발생할 수 있음

**해결:** Drizzle Kit 이 생성한 SQL 은 `CREATE TABLE` 문만 포함하므로, 기존 테이블이 있으면 에러가 발생합니다. 이를 방지하기 위해 앱은 **기존 DB 파일을 로드**하므로, 이미 테이블이 생성된 상태라면 마이그레이션 실행 시 에러가 발생할 수 있습니다.

> 현재 초기 마이그레이션(`0000_curvy_hawkeye.sql`)은 `CREATE TABLE` 문만 포함하므로, **첫 실행 시에만 테이블이 생성**됩니다. 이후 실행 시에는 기존 DB 파일에서 테이블이 로드되므로 마이그레이션 SQL 이 중복 실행되지 않도록 주의해야 합니다.

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

**4. 빌드**

```bash
npm run build
```

빌드 시 마이그레이션 SQL 이 `dist-electron/migrations/` 에 자동으로 복사됩니다.

**5. 앱 실행 시 자동 적용**

앱을 실행하면 마이그레이션 SQL 이 자동으로 실행됩니다.

---

## drizzle.config.mjs 설정 파일

```javascript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './migrations',              // 마이그레이션 SQL 출력 디렉터리
  schema: './src/core/db/schema/index.ts',  // 스키마 파일 위치
  dialect: 'sqlite',                // 데이터베이스 종류
  dbCredentials: {
    url: './data/payroll.db',       // 로컬 DB 경로 (참용도)
  },
});
```

---

## 자주 묻는 질문

### Q: 마이그레이션 SQL 파일을 직접 수정해도 되나요?

**가능하지만 권장하지 않습니다.** 스키마 파일과 SQL 이 불일치할 수 있습니다. 항상 TypeScript 스키마 파일을 수정하고 `db:generate` 로 SQL 을 재생성하세요.

### Q: 마이그레이션을 롤백할 수 있나요?

Drizzle Kit 은 **다운 마이그레이션(롤백) 을 공식 지원하지 않습니다.** 롤백이 필요한 경우:
1. `migrations/` 에서 해당 SQL 파일 삭제
2. 스키마 파일에서 변경사항 되돌리기
3. 새 마이그레이션 SQL 생성

### Q: 기존 DB 데이터가 마이그레이션 시 삭제되나요?

**ALTER TABLE 은 데이터를 보존합니다.** 컬럼 추가, 인덱스 생성 등은 기존 데이터를 유지합니다. 하지만 테이블 삭제나 컬럼 타입 변경은 데이터 손실로 이어질 수 있으므로 주의하세요.

### Q: 빌드 시 마이그레이션 SQL 이 어떻게 복사되나요?

`vite.config.mjs`의 `migrationsPlugin()`이 빌드 시 `migrations/` 폴더의 `.sql` 파일을 `dist-electron/migrations/` 에 복사합니다. 별도의 추가 작업이 필요 없습니다.

### Q: `npm run db:migrate` 명령어는 없나요?

sql.js 는 빌트인 migrator 가 없어 `db:migrate` 명령어는 제공되지 않습니다. 앱 실행 시 마이그레이션이 자동으로 적용됩니다.
