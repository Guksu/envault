# @guksu/envault

> 🇰🇷 [한국어 문서](./README.ko.md)

**Type-safe config validation toolkit — manage env and JSON with a single schema.**

[![npm version](https://img.shields.io/npm/v/@guksu/envault)](https://www.npmjs.com/package/@guksu/envault)
[![license](https://img.shields.io/npm/l/@guksu/envault)](./LICENSE)

---

## Why envault?

Most Node.js apps manage configuration like this:

```typescript
// ❌ No types, no validation
const port = process.env.PORT;           // string | undefined
const debug = process.env.DEBUG;         // "false" is truthy 😱
const config = require('./config.json'); // untyped object
```

Three pain points repeat over and over:

| Problem | Impact |
|---------|--------|
| **env values have no types** | `"false"` is truthy, `"3000"` is a string |
| **env and JSON config are managed separately** | `dotenv` for env, manual `fs.readFile` for JSON, separate validation — config management is fragmented |
| **Sensitive values leak into logs** | `console.log(config)` exposes API keys and passwords |

### The solution

envault gives you one schema to rule them all:

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

config.PORT         // ✅ number (not string)
config.DATABASE_URL // ✅ string (required, never undefined)
config.print()      // ✅ DATABASE_URL: post****@localhost/db
```

---

## vs. Other Libraries

| Feature | envalid | zod | t3-env | **envault** |
|---------|---------|-----|--------|-------------|
| env validation | ✅ | ✅ | ✅ | ✅ |
| JSON config validation | ❌ | ✅ | ❌ | ✅ |
| Multiple source merging | ❌ | ❌ | ❌ | ✅ |
| Sensitive value masking | ❌ | ❌ | ❌ | ✅ |
| CLI: check | ❌ | ❌ | ❌ | ✅ |
| CLI: generate `.env.example` | ❌ | ❌ | ❌ | ✅ |
| CLI: diff two env files | ❌ | ❌ | ❌ | ✅ |
| CLI: audit for secrets | ❌ | ❌ | ❌ | ✅ |
| Full TypeScript inference | △ | ✅ | ✅ | ✅ |
| Bundle size | small | large | medium | small |

**Key differentiators:**

- **Multi-source** — merge `process.env`, JSON files, and async sources (Vault, AWS Secrets Manager) under one schema
- **Sensitive masking** — mark fields as `.sensitive()` and `config.print()` automatically masks them
- **Built-in CLI** — validate, generate, diff, and audit without writing any extra code

---

## Installation

```bash
npm install @guksu/envault
# or
pnpm add @guksu/envault
# or
yarn add @guksu/envault
```

---

## Quick Start

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

## API Reference

### `defineConfig(options)`

The main entry point. Parses and validates all sources according to the schema.

```typescript
const config = defineConfig({
  sources: {
    env:  process.env,              // environment variables (default when omitted)
    json: './config.json',          // JSON file path
  },
  schema: { ... },
  options: {
    throwOnError: true,  // throw on validation failure (default: true)
    logErrors:    true,  // log errors to stderr (default: true)
  },
});
```

**Returns** an object with:
- All schema keys as typed properties (`config.PORT`, `config.API_KEY`, ...)
- `config.print()` — print all values with sensitive fields masked
- `config.toObject()` — return a plain object (no methods attached)
- `config.validate()` — re-run validation, returns `{ valid: boolean; errors: string[] }`

---

### Type Builders (`t`)

#### Basic Types

```typescript
t.string()   // string
t.number()   // number  ("3000" → 3000)
t.boolean()  // boolean ("true"/"1"/"yes" → true, "false"/"0"/"no" → false)
t.array()    // string[] ("a,b,c" → ["a", "b", "c"])
t.json()     // unknown (parses JSON string, or passes through already-parsed objects)
```

#### Format Types

```typescript
t.url()                              // validates URL format
t.email()                            // validates email format
t.enum(['a', 'b', 'c'] as const)     // validates against allowed values
```

#### Chaining Methods

```typescript
t.string()
  .required()       // field must be present; throws if missing
  .default('value') // fallback value when field is absent
  .sensitive()      // mask the value in config.print() output
  .from('json')     // read from a specific named source
  .validate(fn)     // custom validation: (value) => boolean
  .transform(fn)    // custom transform:  (value) => newValue
```

#### Type Inference

`required()` and `default()` narrow the output type at compile time — no manual casting needed.

```typescript
const config = defineConfig({
  schema: {
    PORT:    t.number().default(3000),  // → number          (has default)
    DEBUG:   t.boolean(),               // → boolean | undefined
    API_KEY: t.string().required(),     // → string           (required)
  },
});

config.PORT    // number
config.DEBUG   // boolean | undefined
config.API_KEY // string
```

---

### Sources

#### Environment variables (default)

```typescript
// process.env is used by default when sources is omitted
const config = defineConfig({ schema: { ... } });

// or explicitly:
defineConfig({
  sources: { env: process.env },
  schema:  { ... },
});
```

#### JSON file

```typescript
defineConfig({
  sources: { json: './config.json' },
  schema: {
    featureFlags: t.json().from('json'),
    appName:      t.string().from('json'),
  },
});
```

#### Custom / in-memory source

Use `.from('sourceName')` to read a field from any named source. Every field defaults to `env` if `.from()` is not specified.

```typescript
defineConfig({
  sources: {
    env:    process.env,
    remote: { FEATURE_X: true },  // in-memory object
  },
  schema: {
    PORT:      t.number().default(3000),   // reads from env
    FEATURE_X: t.boolean().from('remote'), // reads from remote
  },
});
```

---

### Type Conversion Table

| Type | Raw value | Parsed result |
|------|-----------|---------------|
| `t.string()` | `"hello"` | `"hello"` |
| `t.number()` | `"3000"` | `3000` |
| `t.boolean()` | `"true"` / `"1"` / `"yes"` | `true` |
| `t.boolean()` | `"false"` / `"0"` / `"no"` | `false` |
| `t.array()` | `"a,b,c"` | `["a", "b", "c"]` |
| `t.array().separator("\|")` | `"a\|b\|c"` | `["a", "b", "c"]` |
| `t.json()` | `'{"a":1}'` | `{ a: 1 }` |
| `t.enum(["a","b"])` | `"a"` | `"a"` (validated) |
| `t.url()` | `"https://..."` | `"https://..."` (validated) |
| `t.email()` | `"a@b.com"` | `"a@b.com"` (validated) |

---

## CLI

envault ships with a CLI for common config operations.

### `envault check`

Validate the current environment against your config file.

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

| Flag | Default | Description |
|------|---------|-------------|
| `-c, --config <path>` | `envault.config.js` | Path to config file |
| `-e, --env <path>` | — | Path to `.env` file to check |

### `envault generate`

Auto-generate a `.env.example` from your config.

```bash
npx envault generate
npx envault generate --output .env.example
```

```
Generated .env.example with 4 variable(s)
```

| Flag | Default | Description |
|------|---------|-------------|
| `-c, --config <path>` | `envault.config.js` | Path to config file |
| `-o, --output <path>` | `.env.example` | Output file path |

### `envault diff <file1> <file2>`

Compare two environment files side by side.

```bash
npx envault diff .env.development .env.production
```

```
+----------------+-----------------+-----------------+
| Variable       | .env.development | .env.production |
+----------------+-----------------+-----------------+
| PORT           | 3000            | 8080            |
| DEBUG          | true            | false           |
| SENTRY_DSN     | (not set)       | https://...     |
+----------------+-----------------+-----------------+
3 difference(s) found.
```

### `envault audit [files...]`

Detect potential secret exposure in env files.

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

## Examples

### Basic (env only)

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

### With sensitive fields

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

// Safe to log — secrets are automatically masked
config.print();
// PORT: 3000
// DATABASE_URL: post****@localhost/db
// API_KEY: sk-1****cdef
// JWT_SECRET: ****
```

### With JSON source

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
config.featureFlags  // unknown (cast as needed)
```

### With custom validation & transform

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

## Tech Stack

| Area | Tool | Reason |
|------|------|--------|
| Language | TypeScript | Type inference is the core feature |
| Build | tsup | Optimized for library bundling, ESM/CJS dual output |
| Test | Vitest | Fast, TypeScript-native |
| CLI | Commander.js | Lightweight and intuitive |

---

## License

MIT © [Guksu](https://github.com/Guksu)
