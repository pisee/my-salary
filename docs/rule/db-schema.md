# DB 스키마 변경 규칙

DB 스키마를 변경할 때 반드시 다음 절차를 따르자. SQL 을 직접 작성하거나 코드에 하드코딩 금지.

## 금지 사항

- `CREATE TABLE`, `ALTER TABLE`, `DROP TABLE` 같은 SQL 을 코드에 직접 작성 금지
- `src/main/index.ts` 의 `initDatabase()` 함수에 SQL 추가 금지
- 마이그레이션 SQL 파일(`migrations/*.sql`)을 직접 수정 금지

## 필수 절차

DB 스키마 변경 시 항상 이 순서로 작업:

### 1. TypeScript 스키마 파일 수정

- 위치: `src/core/db/schema/`
- `drizzle-orm/sqlite-core` 의 `sqliteTable` API 사용
- 컬럼 추가/수정/삭제는 스키마 파일에서만 작업

```typescript
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const employees = sqliteTable('employees', {
  // ... 기존 컬럼
  phoneNumber: text('phone_number'),  // 새 컬럼 추가
});
```

### 2. 마이그레이션 SQL 생성

```bash
npm run db:generate
```

- `migrations/` 폴더에 새 SQL 파일 자동 생성
- 생성된 SQL 파일 내용 반드시 확인

### 3. 로컬 DB 적용 (선택, 빠른 확인용)

```bash
npm run db:migrate
```

### 4. 빌드

```bash
npm run build
```

- 빌드 시 마이그레이션 SQL 이 `dist-electron/migrations/` 에 자동 복사

## 참고 문서

자세한 내용은 `docs/guide/migrations.md` 참조.
