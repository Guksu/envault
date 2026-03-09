# @guksu/envault

> 🇺🇸 [English Docs](./README.md)

**타입 세이프 설정 검증 툴킷 — env와 JSON을 하나의 스키마로 관리하세요.**

[![npm version](https://img.shields.io/npm/v/@guksu/envault)](https://www.npmjs.com/package/@guksu/envault)
[![license](https://img.shields.io/npm/l/@guksu/envault)](./LICENSE)

---

## 왜 envault인가?

대부분의 Node.js 앱은 이런 방식으로 설정을 관리합니다:

```typescript
// ❌ 타입도 없고, 검증도 없음
const port = process.env.PORT;           // string | undefined
const debug = process.env.DEBUG;         // "false"도 truthy로 동작 😱
const config = require('./config.json'); // 타입 없는 객체
```

세 가지 문제가 반복됩니다:

| 문제 | 영향 |
|------|------|
| **env 값에 타입이 없다** | `"false"`가 truthy, `"3000"`이 문자열 |
| **env와 JSON 설정이 따로 관리된다** | env는 dotenv로, JSON은 직접 파싱, 검증은 또 따로 — 설정이 파편화됨 |
| **민감정보가 로그에 노출된다** | `console.log(config)`로 API 키와 비밀번호가 그대로 출력 |

### 해결책

envault는 하나의 스키마로 모든 것을 해결합니다:

```typescript
import { defineConfig, t } from '@guksu/envault';

const config = defineConfig({
  sources: {
    env:  process.env,
    json: './config.json',
  },
  schema: {
    PORT:         t.number().default(3000),
    DATABASE_URL: t.string().required().sensitive(),
    API_KEY:      t.string().required().sensitive(),
    NODE_ENV:     t.enum(['development', 'production', 'test'] as const).required(),
  },
});

config.PORT         // ✅ number (문자열이 아님)
config.DATABASE_URL // ✅ string (required이므로 undefined 없음)
config.print()      // ✅ DATABASE_URL: post****@localhost/db
```

---

## 다른 라이브러리와의 비교

| 기능 | envalid | zod | t3-env | **envault** |
|------|---------|-----|--------|-------------|
| env 검증 | ✅ | ✅ | ✅ | ✅ |
| JSON 설정 검증 | ❌ | ✅ | ❌ | ✅ |
| 다중 소스 통합 | ❌ | ❌ | ❌ | ✅ |
| 민감정보 자동 마스킹 | ❌ | ❌ | ❌ | ✅ |
| CLI: 환경 검증 | ❌ | ❌ | ❌ | ✅ |
| CLI: `.env.example` 생성 | ❌ | ❌ | ❌ | ✅ |
| CLI: env 파일 비교 | ❌ | ❌ | ❌ | ✅ |
| CLI: 민감정보 감지 | ❌ | ❌ | ❌ | ✅ |
| 완전한 TypeScript 추론 | △ | ✅ | ✅ | ✅ |
| 번들 사이즈 | 작음 | 큼 | 중간 | 작음 |

**핵심 차별점:**

- **다중 소스 통합** — `process.env`, JSON 파일, 비동기 소스(Vault, AWS Secrets Manager)를 하나의 스키마로 관리
- **민감정보 자동 마스킹** — `.sensitive()`로 표시하면 `config.print()` 시 자동으로 마스킹
- **내장 CLI** — 코드 없이 검증, 생성, 비교, 감사 가능

---

## 설치

```bash
npm install @guksu/envault
# 또는
pnpm add @guksu/envault
# 또는
yarn add @guksu/envault
```

---

## 빠른 시작

```typescript
import { defineConfig, t } from '@guksu/envault';

const config = defineConfig({
  schema: {
    PORT:     t.number().default(3000),
    NODE_ENV: t.enum(['development', 'production', 'test'] as const).default('development'),
    API_KEY:  t.string().required().sensitive(),
  },
});

console.log(config.PORT);     // 3000
console.log(config.NODE_ENV); // "development"
config.print();               // API_KEY: sk-****xxxx
```

---

## API 레퍼런스

### `defineConfig(options)`

메인 진입점입니다. 스키마에 따라 모든 소스를 파싱하고 검증합니다.

```typescript
const config = defineConfig({
  sources: {
    env:  process.env,       // 환경변수 (생략 시 기본값)
    json: './config.json',   // JSON 파일 경로
  },
  schema: { ... },
  options: {
    throwOnError: true,  // 검증 실패 시 에러 throw (기본값: true)
    logErrors:    true,  // 에러를 stderr에 출력 (기본값: true)
  },
});
```

**반환 객체:**
- 스키마 키를 타입이 추론된 속성으로 포함 (`config.PORT`, `config.API_KEY`, ...)
- `config.print()` — 민감정보를 마스킹해서 모든 값 출력
- `config.toObject()` — 메서드 없이 순수 객체로 반환
- `config.validate()` — 검증 재실행, `{ valid: boolean; errors: string[] }` 반환

---

### 타입 빌더 (`t`)

#### 기본 타입

```typescript
t.string()   // string
t.number()   // number  ("3000" → 3000)
t.boolean()  // boolean ("true"/"1"/"yes" → true, "false"/"0"/"no" → false)
t.array()    // string[] ("a,b,c" → ["a", "b", "c"])
t.json()     // unknown (JSON 문자열 파싱, 또는 이미 파싱된 객체 그대로 통과)
```

#### 포맷 타입

```typescript
t.url()                              // URL 형식 검증
t.email()                            // 이메일 형식 검증
t.enum(['a', 'b', 'c'] as const)     // 허용 값 목록 검증
```

#### 체이닝 메서드

```typescript
t.string()
  .required()       // 필수값. 없으면 에러 throw
  .default('value') // 값이 없을 때 사용할 기본값
  .sensitive()      // config.print() 시 마스킹
  .from('json')     // 특정 소스에서 읽기
  .validate(fn)     // 커스텀 검증: (value) => boolean
  .transform(fn)    // 커스텀 변환: (value) => newValue
```

#### 타입 추론

`required()`와 `default()`는 컴파일 타임에 출력 타입을 좁혀줍니다 — 수동 타입 단언 불필요.

```typescript
const config = defineConfig({
  schema: {
    PORT:    t.number().default(3000),  // → number          (기본값 있음)
    DEBUG:   t.boolean(),               // → boolean | undefined
    API_KEY: t.string().required(),     // → string           (필수값)
  },
});

config.PORT    // number
config.DEBUG   // boolean | undefined
config.API_KEY // string
```

---

### 소스(Sources)

#### 환경변수 (기본값)

```typescript
// sources 생략 시 process.env가 기본으로 사용됨
const config = defineConfig({ schema: { ... } });

// 명시적으로:
defineConfig({
  sources: { env: process.env },
  schema:  { ... },
});
```

#### JSON 파일

```typescript
defineConfig({
  sources: { json: './config.json' },
  schema: {
    featureFlags: t.json().from('json'),
    appName:      t.string().from('json'),
  },
});
```

#### 커스텀 소스

`.from('sourceName')`으로 특정 소스에서 값을 읽을 수 있습니다. 지정하지 않으면 기본적으로 `env`에서 읽습니다.

```typescript
defineConfig({
  sources: {
    env:    process.env,
    remote: { FEATURE_X: true },  // 인메모리 객체
  },
  schema: {
    PORT:      t.number().default(3000),   // env에서 읽음
    FEATURE_X: t.boolean().from('remote'), // remote에서 읽음
  },
});
```

---

### 타입 변환 표

| 타입 | 원본 값 | 변환 결과 |
|------|---------|----------|
| `t.string()` | `"hello"` | `"hello"` |
| `t.number()` | `"3000"` | `3000` |
| `t.boolean()` | `"true"` / `"1"` / `"yes"` | `true` |
| `t.boolean()` | `"false"` / `"0"` / `"no"` | `false` |
| `t.array()` | `"a,b,c"` | `["a", "b", "c"]` |
| `t.array().separator("\|")` | `"a\|b\|c"` | `["a", "b", "c"]` |
| `t.json()` | `'{"a":1}'` | `{ a: 1 }` |
| `t.enum(["a","b"])` | `"a"` | `"a"` (검증됨) |
| `t.url()` | `"https://..."` | `"https://..."` (검증됨) |
| `t.email()` | `"a@b.com"` | `"a@b.com"` (검증됨) |

---

## CLI

envault는 설정 관련 작업을 위한 CLI를 내장하고 있습니다.

### `envault check`

현재 환경이 설정 파일 스키마를 충족하는지 검증합니다.

```bash
npx envault check
npx envault check --config envault.config.js --env .env.production
```

```
✓ PORT: 3000 (default)
✓ NODE_ENV: development
✓ DATABASE_URL: [set]
✗ API_KEY: Required but not provided

Validation failed: 1 error(s)
```

| 플래그 | 기본값 | 설명 |
|--------|--------|------|
| `-c, --config <path>` | `envault.config.js` | 설정 파일 경로 |
| `-e, --env <path>` | — | 검사할 `.env` 파일 경로 |

### `envault generate`

설정 스키마에서 `.env.example`을 자동 생성합니다.

```bash
npx envault generate
npx envault generate --output .env.example
```

```
Generated .env.example with 4 variable(s)
```

| 플래그 | 기본값 | 설명 |
|--------|--------|------|
| `-c, --config <path>` | `envault.config.js` | 설정 파일 경로 |
| `-o, --output <path>` | `.env.example` | 출력 파일 경로 |

### `envault diff <file1> <file2>`

두 환경 파일을 나란히 비교합니다.

```bash
npx envault diff .env.development .env.production
```

```
+----------------+------------------+------------------+
| Variable       | .env.development | .env.production  |
+----------------+------------------+------------------+
| PORT           | 3000             | 8080             |
| DEBUG          | true             | false            |
| SENTRY_DSN     | (not set)        | https://...      |
+----------------+------------------+------------------+
3 difference(s) found.
```

### `envault audit [files...]`

env 파일에서 민감정보 노출 가능성을 감지합니다.

```bash
npx envault audit
npx envault audit .env .env.local
```

```
Potential secrets found in .env:

  Line 3: API_KEY
    -> Contains 'KEY' pattern

  Line 7: DATABASE_URL
    -> Contains password in connection string

  Line 12: JWT_SECRET
    -> Contains 'SECRET' pattern

Tip: Add .env to .gitignore and use .env.example for documentation
```

---

## 예제

### 기본 (env만 사용)

```typescript
import { defineConfig, t } from '@guksu/envault';

export default defineConfig({
  schema: {
    PORT:     t.number().default(3000),
    NODE_ENV: t.enum(['development', 'production', 'test'] as const).default('development'),
    DEBUG:    t.boolean().default(false),
  },
});
```

### 민감정보 마스킹

```typescript
import { defineConfig, t } from '@guksu/envault';

const config = defineConfig({
  schema: {
    PORT:         t.number().default(3000),
    DATABASE_URL: t.string().required().sensitive(),
    API_KEY:      t.string().required().sensitive(),
    JWT_SECRET:   t.string().required().sensitive(),
  },
});

// 안전하게 로그 출력 — 민감정보 자동 마스킹
config.print();
// PORT: 3000
// DATABASE_URL: post****@localhost/db
// API_KEY: sk-1****cdef
// JWT_SECRET: ****
```

### JSON 소스 통합

```typescript
// config.json → { "featureFlags": { "darkMode": true, "betaUI": false } }

import { defineConfig, t } from '@guksu/envault';

const config = defineConfig({
  sources: {
    env:  process.env,
    json: './config.json',
  },
  schema: {
    PORT:         t.number().default(3000),
    featureFlags: t.json().from('json'),
  },
});

config.PORT          // number
config.featureFlags  // unknown (필요시 타입 단언)
```

### 커스텀 검증 & 변환

```typescript
const config = defineConfig({
  schema: {
    PORT: t.number()
      .default(3000)
      .validate((v) => v >= 1024 && v <= 65535),

    ALLOWED_ORIGINS: t.array()
      .separator(',')
      .transform((arr) => arr.map((s) => s.toLowerCase())),

    NODE_ENV: t.string()
      .required()
      .transform((v) => v.trim().toLowerCase()),
  },
});
```

---

## 기술 스택

| 영역 | 기술 | 이유 |
|------|------|------|
| 언어 | TypeScript | 타입 추론이 핵심 기능 |
| 빌드 | tsup | 라이브러리 번들링에 최적화, ESM/CJS 동시 지원 |
| 테스트 | Vitest | 빠르고 TypeScript 친화적 |
| CLI | Commander.js | 가볍고 직관적 |

---

## 라이선스

MIT © [Guksu](https://github.com/Guksu)
