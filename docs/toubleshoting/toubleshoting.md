# Troubleshooting

## 1. npm install

### 오류: Electron 바이너리 다운로드 타임아웃
```
ETIMEDOUT 20.200.245.247:443
```

**해결:** `--ignore-scripts` 옵션으로 설치 후 Electron 바이너리 수동 다운로드
```bash
npm install --ignore-scripts
```
- URL: `https://github.com/electron/electron/releases/download/v33.3.1/electron-v33.3.1-win32-x64.zip`
- 압축 해제 후 `node_modules/electron/dist/` 에 전체 복사
- `node_modules/electron/path.txt` 파일 생성 (내용: `electron.exe`, 줄바꿈 없음)

---

## 2. npm run build

### 오류 1: `tsc` 명령어 help 출력 후 종료
**원인:** `tsconfig.json` 미존재

**해결:** `tsconfig.json` 생성 (ESM + bundler target 설정)

---

### 오류 2: `Cannot find module 'dist-electron/main/index.js'`
**원인:** `package.json`의 `main` 경로 불일치

**해결:** 빌드 출력 경로와 일치하도록 수정

---

### 오류 3: Electron 34.x ESM-first 문제
**원인:** Electron 34.x에서 `require('electron')`는 npm 패키지(string)를 반환하고, `import`는 ESM→CJS interop 충돌 발생

**해결:** Electron 33.x로 다운그레이드
- `package.json`: `"electron": "^33.3.1"`
- 33.x에서는 `require('electron')`이 내장 모듈을 정상 반환

---

### 오류 4: Schema CJS 빌드가 빈 객체 `{}` 반환
**원인 1:** esbuild의 `__toCommonJS` 패턴이 변수 초기화 전에 `module.exports` 할당
**원인 2:** `package.json`에 `"type": "module"` 설정으로 `.js` 파일이 ESM로 파싱됨

**해결:**
- Schema를 `.cjs` 확장자로 출력 (esbuild 빌드 후 `.js` → `.cjs` rename)
- `__toCommonJS` 패턴 제거 후 명시적 `module.exports = { ... }` 추가

---

### 오류 5: `Cannot read properties of undefined (reading 'exports')` at cjsPreparseModuleExports
**원인:** ESM `.mjs` 파일에서 `import { ipcMain } from "electron"` 시, `electron` npm 패키지가 CJS-only (string export)여서 ESM→CJS interop 충돌

**해결:** Electron 33.x로 다운그레이드 + `createRequire` 사용

---

### 오류 6: CJS 빌드에 `import.meta` / `export default` 포함
**원인:** `import.meta.url`은 CJS에서 사용 불가, `vite-plugin-electron`이 CJS 빌드에 ESM 코드 주입

**해결:** esbuild로 직접 빌드 (Vite plugin 대신)

---

## 3. npm start

### 오류 1: `Cannot read properties of undefined (reading 'exports')` at cjsPreparseModuleExports
**원인:** `drizzle-orm/sqlite-core` CJS 파일의 `__toCommonJS` 패턴이 ESM→CJS interop에서 충돌

**해결:**
- `drizzle-orm`, `drizzle-orm/*`를 Vite external로 설정
- Main process에서 `createRequire`를 사용하여 `require('drizzle-orm/better-sqlite3')`로 로딩
- Schema는 `require('./schema/index.cjs')`로 로딩

---

### 오류 2: `spawn electron.exe ENOENT`
**원인:** `npm install` 시 Electron 바이너리 삭제됨

**해결:** Electron 바이너리 수동 다운로드 후 `node_modules/electron/dist/` 에 전체 복사

---

### 오류 3: `Cannot read properties of undefined (reading 'whenReady')`
**원인:** Electron 34.x에서 `require('electron')`이 npm 패키지(string) 반환  
https://github.com/electron/electron/releases/download/v34.5.8/electron-v34.5.8-win32-x64.zip

**해결:** Electron 33.x로 다운그레이드  
https://github.com/electron/electron/releases/download/v33.3.1/electron-v33.3.1-win32-x64.zip

---

### 오류 4: `export default` SyntaxError in CJS
**원인:** `vite-plugin-electron-renderer`가 CJS 빌드에 ESM `export default` 주입

**해결:** `vite-plugin-electron` 제거 후 esbuild로 직접 빌드

---

## 최종 빌드 구조

```
dist/                          # Renderer (HTML, JS, CSS)
dist-electron/
  index.mjs                    # Main process (ESM + createRequire)
  preload/
    index.mjs                  # Preload (ESM)
  schema/
    index.cjs                  # DB Schema (CJS)
```

## 핵심 변경사항

| 파일 | 변경 내용 |
|------|----------|
| `package.json` | `electron@33.3.1`, `"main": "dist-electron/index.mjs"` |
| `vite.config.mjs` | esbuild로 main/preload/schema 직접 빌드, `drizzle-orm` external |
| `src/main/index.ts` | `createRequire`로 `electron`, `better-sqlite3`, `drizzle-orm` 로딩 |
