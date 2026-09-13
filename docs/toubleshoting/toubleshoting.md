# Troubleshooting

## 1. npm install

### 오류: Electron 바이너리가 설치되지 않음

```
Error: Electron failed to install correctly, please delete node_modules/electron and try installing again
```

`npm run dev` / `npm start` 시 발생. `node_modules/electron/` 에 `dist/` 와
`path.txt` 가 없으면 postinstall 다운로드가 실패한 것이다.

**원인:** `@electron/get` 5.x 는 `got` 대신 Node 전역 `fetch`(undici)를 사용한다.
undici 는 npm 의 `proxy` / `strict-ssl=false` 설정을 따르지 않으므로 사내 프록시
구간에서 TLS 검증이 실패한다.

```
TypeError: fetch failed
  → Error: CA certificate key too weak (UNSPECIFIED)
```

프록시가 제시하는 CA 키가 Node 24 OpenSSL 기본 보안 레벨(≥112비트)에 미달한다.
npm 자체는 `strict-ssl=false` 로 우회되므로 `npm install` 은 성공하고 Electron
바이너리만 조용히 누락된다.

**해결 (권장): `@electron/get` 캐시에 바이너리를 미리 넣는다.**
curl 은 Windows 인증서 저장소를 사용하므로 같은 프록시에서 정상 동작한다. 캐시에
있으면 이후 모든 `npm install` 이 네트워크 없이 cache hit 으로 처리된다.

```bash
# 캐시 디렉터리명 = sha256(릴리스 URL 의 디렉터리 부분)
VER=44.3.0
BASE="https://github.com/electron/electron/releases/download/v$VER"
CACHE="$LOCALAPPDATA/electron/Cache/$(node -e "
const c=require('crypto'),p=require('path');
const u=new URL('$BASE/electron-v$VER-win32-x64.zip');
u.hash='';u.search='';u.pathname=p.posix.dirname(u.pathname);
process.stdout.write(c.createHash('sha256').update(u.toString()).digest('hex'));")"

mkdir -p "$CACHE"
export https_proxy=http://70.10.15.10:8080 http_proxy=http://70.10.15.10:8080
curl -sSL -o "$CACHE/SHASUMS256.txt" "$BASE/SHASUMS256.txt"
curl -L  -o "$CACHE/electron-v$VER-win32-x64.zip" "$BASE/electron-v$VER-win32-x64.zip"

node node_modules/electron/install.js   # → "Cache hit", dist/ + path.txt 생성
```

**대안:** TLS 검증을 끄고 postinstall 을 직접 실행한다. 인증서 검증을 무력화하므로
이 단계에서만 사용할 것.

```bash
NODE_TLS_REJECT_UNAUTHORIZED=0 ELECTRON_GET_USE_PROXY=true   HTTPS_PROXY=http://70.10.15.10:8080 HTTP_PROXY=http://70.10.15.10:8080   node node_modules/electron/install.js
```

**확인:**
```bash
node_modules/electron/dist/electron.exe --version   # v44.3.0
```

---

## 2. npm run build

### 오류 1: `tsc` 명령어 help 출력 후 종료
**원인:** `tsconfig.json` 미존재

**해결:** `tsconfig.json` 생성 (ESM + bundler target 설정)

---

### 오류 2: `Cannot find module 'dist-electron/main/index.js'`
**원인:** `package.json`의 `main` 경로 불일치

**해결:** 빌드 출력 경로와 일치하도록 수정 (`dist-electron/index.mjs`)

---

## 3. npm start

### 오류 1: `spawn electron.exe ENOENT`
**원인:** `node_modules/electron/dist/` 가 없다. postinstall 다운로드가 실패한 상태.

**해결:** §1 참고 (캐시에 바이너리를 넣고 `node node_modules/electron/install.js` 실행)

---

### 오류 2: sql.js WASM 파일 로드 실패
```
Error: Cannot find module 'sql.js'
```

**원인:** sql.js 의 WASM 파일(`sql-wasm.wasm`) 이 `node_modules/sql.js/dist/` 에 없음

**해결:** `npm install` 로 sql.js 패키지가 정상 설치되었는지 확인

---

## 최종 빌드 구조

```
dist/                          # Renderer (HTML, JS, CSS)
dist-electron/
  index.mjs                    # Main process (순수 ESM)
  preload/
    index.mjs                  # Preload (ESM)
  migrations/
    0000_curvy_hawkeye.sql     # 마이그레이션 SQL (빌드 시 자동 복사)
```

## 핵심 변경사항

| 파일 | 변경 내용 |
|------|----------|
| `package.json` | `electron@44.3.0`, `sql.js` 추가, `better-sqlite3` 제거, `@electron/rebuild` 제거 |
| `vite.config.mjs` | esbuild로 main/preload 직접 빌드, schema CJS 빌더 제거, `sql.js` external |
| `src/main/index.ts` | 순수 ESM import (`electron`, `sql.js`, `drizzle-orm/sql.js`), `createRequire` 제거 |

## 주요 아키텍처 변경

### better-sqlite3 → sql.js (WASM) 교체

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| **DB 엔진** | `better-sqlite3` (CJS 네이티브) | `sql.js` (WASM, ESM) |
| **빌드 고통** | `electron-rebuild` 필수 | **불필요** |
| **ESM 호환성** | `createRequire` 필요 | **순수 `import`** |
| **마이그레이션** | `drizzle-orm/better-sqlite3/migrator` | 수동 SQL 실행 (앱 시작 시) |

### Electron 33.x → 44.x 업그레이드

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| **Electron** | 33.3.1 (Node v20.19.1) | **44.3.0** (Node v24.20.0, Chromium 152) |
| **import from electron** | `createRequire` 필요 | **순수 `import`** |
| **esbuild target** | node20 | **node24** |
| **@types/node** | ^22.13.4 | **^24.13.4** |
| **바이너리 설치** | `postinstall` 자동 | **`install-electron` 명시 실행** (43+ 에서 스크립트 제거됨) |

### 삭제된 패키지

- `better-sqlite3`, `@types/better-sqlite3` — WASM 기반 sql.js 로 교체
- `@electron/rebuild` — 네이티브 리빌드 불필요
- `concurrently` — 미사용
- `autoprefixer` — TailwindCSS 4 가 벤더 프리픽스를 내장 처리

### 삭제된 빌드 산출물

- `dist-electron/schema/` — CJS 스키마 번들 불필요 (마이그레이션 SQL 만 사용)
