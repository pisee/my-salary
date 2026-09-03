# 💼 MySalary - 급여 및 근태 정산 자동화 시스템

> **MySalary**는 출퇴근 기록 raw 데이터 수집부터 이상치 교차 검증, 연봉직 및 생산직 수당/급여 자동 산출, 4대 보험 고지 내역 연동, 위아고(WEHAGO) 대량 업로드 엑셀, 은행 이체 파일, 미국 본사 청구서 생성까지 원스톱으로 처리하는 **로컬 독립형 데스크톱 애플리케이션(Desktop GUI App)**입니다.

---

## 📌 1. 주요 기능 및 5단계 처리 파이프라인

MySalary는 복잡한 급여 계산 업무를 직관적인 **5단계 표준 파이프라인**으로 자동화합니다.

```
[1단계: 인풋 등록]
  ├── 출퇴근 기록 프로그램 기반의 개인별 근태 raw 파일 업로드 (.xlsx, .csv)
  ├── 4대 보험 공단 고지 내역 엑셀 파일 등록
  └── 사번/이름 기준의 사원 마스터 매핑 및 동명이인/오탈자 사전 감지

[2단계: 근태 검증 및 보정]
  ├── 연장 및 휴일 근무 기록의 사전 신청 내역 대조 및 타당성 교차 검증
  ├── 결근, 지각, 미퇴근 등 이상치(Anomaly) 자동 감지
  └── 이상치 건에 대한 화면 내 실시간 수동 보정 및 승인

[3단계: 급여 산출 엔진]
  ├── 연봉직(사무직) 및 생산직 대상 급여 산출 시트 분리 운영
  ├── 생산직 실근무시간 기반 통상시급, 연장/야간/휴일/주휴수당 자동 계산
  ├── 4대 보험 고지 공제액 및 간이세액표 기반 소득세/지방소득세 자동 산출
  └── 워크센터(부서/공정)별 인건비 계정 코드 분개 및 미국 본사 청구액 산출

[4단계: 산출물 생성 및 내보내기]
  ├── ① 위아고(WEHAGO) 인사급여 대량 업로드용 엑셀 파일 (.xlsx)
  ├── ② 은행 펌뱅킹 이체용 실지급액 파일 (.xlsx / .txt)
  ├── ③ 미국 본사/법인 청구 정산 리포트 (.xlsx)
  └── ④ 상급자 보고용 월별 워크센터별 급여 요약 대시보드 및 엑셀

[5단계: DB 확정 및 이력 관리]
  ├── 정산 완료 세션의 SQLite 데이터베이스 영구 스냅샷 확정(Lock)
  └── 과거 월별 급여/근태 추이 비교 및 역추적 지원
```

---

## 🏗️ 2. 프로젝트 아키텍처 및 디렉터리 구성

UI/프레임워크 종속성 없이 비즈니스 로직을 완벽히 격리한 **레이어드 모듈형 구조(Layered Modular Architecture)**를 채택하여 높은 안정성과 테스트 가능성을 보장합니다.

```text
my-salary/
├── src/
│   ├── core/                  # [독립 도메인 엔진] UI/Electron 의존성 없는 순수 비즈니스 로직
│   │   ├── db/                # SQLite (better-sqlite3) + Drizzle ORM
│   │   │   └── schema/        # 사원, 워크센터, 근태, 4대보험, 급여명세 스키마
│   │   ├── calculators/       # 연봉직/생산직 급여 및 수당 산출 엔진
│   │   └── validators/        # 근태 이상치 및 연장근무 한도 검증 엔진
│   ├── main/                  # Electron Main Process (IPC 핸들러, 창 라이프사이클)
│   │   └── index.ts           # 데스크톱 윈도우 생성, DB 초기화, IPC 핸들러 등록
│   ├── preload/               # Electron Preload Scripts (ContextBridge 타입 안전 브릿지)
│   │   └── index.ts
│   ├── renderer/              # Vite + React 18 + TypeScript + TailwindCSS 데스크톱 UI
│   │   ├── src/
│   │   │   ├── components/    # 사이드바, 헤더, 공통 UI 컴포넌트
│   │   │   ├── features/      # 5단계 파이프라인별 화면 뷰
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   └── index.html
│   ├── shared/                # Main과 Renderer가 공유하는 Interface 및 상수
│   │   └── types.ts           # 공통 DTO 및 인터페이스 정의
│   └── assets/                # 전역 CSS
│       └── index.css
├── migrations/                # Drizzle 마이그레이션 SQL 파일
├── docs/
│   ├── guide/                 # 가이드 문서
│   │   └── migrations.md      # DB 마이그레이션 시스템 설명
│   ├── rule/                  # 개발 규칙
│   │   └── andrej-karpathy-skills.md
│   └── toubleshoting/         # 트러블슈팅 가이드
│       └── toubleshoting.md
├── tests/                     # Vitest 자동화 단위/통합 테스트 스위트
├── drizzle.config.mjs         # Drizzle Kit 설정
├── vite.config.mjs            # Vite + Electron 번들러 설정
├── tsconfig.json              # TypeScript 컴파일러 설정
├── AGENTS.md                  # AI 코드 에이전트 프로젝트 규칙
├── CLAUDE.md                  # Claude Code 전용 규칙
├── .cursorrules               # Cursor 전용 규칙
└── package.json
```

### 빌드 출력 구조

```text
dist/                          # Renderer (HTML, JS, CSS)
dist-electron/
  index.mjs                    # Main Process (ESM + createRequire)
  preload/
    index.mjs                  # Preload (ESM)
  schema/
    index.cjs                  # DB Schema (CJS)
  migrations/                  # 마이그레이션 SQL (빌드 시 자동 복사)
```

---

## 🛠️ 3. 기술 스택 (Tech Stack)

| 구분 | 기술 / 라이브러리 | 용도 |
| :--- | :--- | :--- |
| **Runtime** | Electron **33.3.1** | 로컬 PC 독립 실행 데스크톱 환경 (내장 Node.js v20.19.1) |
| **Frontend** | React 18, TypeScript, TailwindCSS, Lucide Icons | 모던 다크/라이트 대시보드 UI |
| **Build Tool** | Vite 6 (렌더러), esbuild (메인/스키마) | 고속 HMR 개발 환경 및 메인/렌더러/스키마 번들링 |
| **Local Database** | SQLite (`better-sqlite3`), Drizzle ORM | 단일 파일 기반 로컬 ACID DB 및 타입 안전 쿼리 |
| **DB Migration** | Drizzle Kit | TypeScript 스키마 기반 마이그레이션 SQL 자동 생성 |
| **Excel Processing** | `exceljs`, `xlsx` (SheetJS) | 템플릿 서식/수식 보존 및 고속 엑셀 파싱 |
| **Testing** | Vitest | 비즈니스 로직 및 DB 스키마 100% 자동화 단위 테스트 |
| **Packaging** | `electron-builder` | Windows 단독 설치 파일(`.exe` / NSIS) 생성 |

---

## 💻 4. 개발 환경 구성 방법 (Setup)

### 사전 요구사항 (Prerequisites)
- **Node.js**: v20.0.0 ~ v22.x (권장: v22.22.0)
- **npm**: v9.0.0 이상
- **OS**: Windows 10/11 (또는 macOS, Linux)

### 개발 환경 호환성 (Compatibility)

| 구성 요소 | 버전 | 비고 |
|-----------|------|------|
| **Node.js (시스템)** | v20 ~ v22 | `better-sqlite3` 네이티브 모듈 빌드용. Electron과 독립적 |
| **Electron** | **33.3.1** (강제) | 34.x 이상은 ESM-first 변경으로 `require('electron')` 불가. 반드시 33.x 사용 |
| **Electron 내부 Node.js** | v20.19.1 | Electron 33.x 번들링 버전. 메인 프로세스 실행 환경 |
| **better-sqlite3** | v11.8.1 | CJS 전용 네이티브 모듈. 시스템 Node.js로 빌드됨 |
| **drizzle-orm** | v0.38.4 | `"type": "module"` (ESM 전용). CJS `createRequire`로 간접 로딩 |
| **Vite** | v6.1.0 | 렌더러 번들링. 메인/스키마는 esbuild 직접 사용 |

#### ⚠️ Electron 버전 주의사항

- **Electron 34.x 이상은 사용 금지**: `require('electron')`이 내장 모듈 대신 npm 패키지 경로 문자열을 반환하며, `import`는 ESM→CJS interop 충돌(`cjsPreparseModuleExports`)을 발생시킵니다.
- **Electron 33.x는 `require('electron')`이 정상 동작**하므로, `better-sqlite3`(CJS 전용) 및 `drizzle-orm`(ESM 전용)과 함께 `createRequire` 패턴으로 안정적으로 혼합 로딩이 가능합니다.

#### ⚠️ better-sqlite3 네이티브 모듈

- `npm install` 시 시스템 Node.js 버전에 맞춰 네이티브 바이너리 컴파일됩니다.
- Node.js v20 ~ v22 범위 내에서 빌드된 바이너리는 Electron 33.x 내부 Node.js(v20.19.1)와 ABI 호환됩니다.
- Node.js v24 이상으로 업그레이드하면 ABI 불일치로 Electron 내부에서 `better-sqlite3` 로딩 실패할 수 있습니다.
- `npm run build` 시 `@electron/rebuild`가 자동으로 better-sqlite3를 Electron 내부 Node.js에 맞춰 리빌드합니다.

#### ⚠️ Electron 바이너리 다운로드 타임아웃 (한국 네트워크)

`npm install` 시 Electron 바이너리 다운로드가 타임아웃(`ETIMEDOUT 20.200.245.247:443`)될 수 있습니다.

```bash
# 1. --ignore-scripts로 패키지 설치 (바이너리 다운로드 생략)
npm install --ignore-scripts
```

바이너리가 누락된 경우 수동 설치:

```bash
# 1. Electron 33.3.1 ZIP 다운로드
#    https://github.com/electron/electron/releases/download/v33.3.1/electron-v33.3.1-win32-x64.zip

# 2. 압축 해제 후 node_modules/electron/dist/ 에 전체 복사

# 3. path.txt 생성 (내용: electron.exe, 줄바꿈 없음)
echo -n "electron.exe" > node_modules/electron/path.txt
```

### 설치 (Installation)
```bash
# 1. 저장소 클론
git clone https://github.com/pisee/my-salary.git
cd my-salary

# 2. 의존성 패키지 설치 (타임아웃 시 --ignore-scripts 옵션 사용)
npm install
```

---

## ▶️ 5. 실행 방법 (Running)

### 1) 개발 모드 실행 (핫 리로드 지원)
```bash
npm run dev
```
- Vite 개발 서버와 함께 **Electron 데스크톱 창이 즉시 실행**됩니다.
- React UI 코드(`src/renderer`) 수정 시 실시간 HMR(Hot Module Replacement)로 즉시 화면에 반영됩니다.
- 메인/프리로드 코드(`src/main`, `src/preload`) 수정 시에도 자동으로 리빌드되어 일렉트론 창에 적용됩니다.
- 메인 프로세스 로그는 터미널에 `[Main]` prefix 로 출력됩니다.

### 2) 코어 비즈니스 로직 단위 테스트 실행
```bash
# 단발성 테스트 실행
npm test

# 감시 모드 (Watch Mode) 테스트 실행
npm run test:watch
```
- UI나 Electron 창을 띄우지 않고도 인메모리 SQLite DB, 급여 계산기, 근태 검증 룰을 수 밀리초 내에 검증합니다.

---

## 📦 6. 빌드 및 패키징 방법 (Build & Packaging)

### 1) 프로덕션 코드 빌드
```bash
npm run build
```
- TypeScript 타입 검사(`tsc`) 수행
- React 프론트엔드 번들링 (`dist/`)
- Electron Main, Preload, Schema 번들링 (`dist-electron/`)
- 마이그레이션 SQL 복사 (`dist-electron/migrations/`)
- `better-sqlite3` 네이티브 모듈 리빌드 (Electron ABI 호환)

### 2) 빌드된 결과물로 앱 로컬 구동
```bash
npm start
```

### 3) Windows 설치 파일 (.exe) 생성
```bash
# Windows NSIS 인스톨러 (.exe) 생성
npm run dist

# 압축 해제형 단독 실행 디렉터리 생성 (테스트용)
npm run pack
```
- 빌드가 완료되면 `release/` 디렉터리에 `MySalary Setup 1.0.0.exe` 설치 파일이 생성됩니다.

---

## 🗄️ 7. 데이터베이스 마이그레이션

DB 스키마 변경 시 SQL 을 직접 작성하지 않고 **Drizzle ORM 마이그레이션**을 사용합니다.

### 명령어

```bash
# 스키마 변경 후 마이그레이션 SQL 생성
npm run db:generate

# 로컬 DB 에 마이그레이션 적용 (선택)
npm run db:migrate
```

### 워크플로우

1. `src/core/db/schema/` 의 TypeScript 스키마 파일 수정
2. `npm run db:generate` 실행 → `migrations/` 에 새 SQL 파일 생성
3. `npm run db:migrate` 실행 (선택, 빠른 확인용)
4. `npm run build` 실행 → 마이그레이션 SQL 이 `dist-electron/migrations/` 에 자동 복사
5. 앱 실행 시 마이그레이션 자동 적용

> 자세한 내용은 [DB 마이그레이션 가이드](docs/guide/migrations.md)를 참조하세요.

---

## 📂 8. 관련 문서

| 문서 | 설명 |
|------|------|
| [상세 아키텍처 설계 사양서](docs/superpowers/specs/2026-08-30-salary-attendance-automation-design.md) | 시스템 설계 전체 사양 |
| [Phase 1 구현 계획서](docs/superpowers/plans/2026-08-30-phase1-boilerplate.md) | 초기 보일러플레이트 구현 계획 |
| [DB 마이그레이션 가이드](docs/guide/migrations.md) | Drizzle ORM 마이그레이션 시스템 상세 설명 |
| [트러블슈팅 가이드](docs/toubleshoting/toubleshoting.md) | 설치/빌드/실행 중 발생한 오류 및 해결 방법 |
