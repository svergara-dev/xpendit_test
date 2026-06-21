# AGENTS.md

## Project

NestJS + TypeScript app: **Xpendit Motor de Reglas** (expense rule engine). Three-part challenge: (1) pure logic validator, (2) exchange rate API, (3) CSV batch analyzer. Language: Spanish business domain, English code.

## Commands

```bash
npm run lint        # ESLint + auto-fix
npm run format      # Prettier
npm run build       # nest build (compiles to dist/)
npm run test        # Jest unit tests (49 tests, all should pass)
npm run test:cov    # Jest with coverage
npm run start:dev   # Hot-reload dev server on port 3000
npm run analyze     # Part 3 batch script (currently stub)
```

**Verification order:** `npm run lint && npm run build && npm run test`

## Architecture

```
src/
├── main.ts                          # Bootstrap, port 3000 hardcoded
├── app.module.ts                    # Root module, imports ConfigModule + 5 domain modules
├── shared/                          # Enums, interfaces, shared module
│   ├── enums/status.enum.ts         # ExpenseStatus: APROBADO | PENDIENTE | RECHAZADO
│   └── interfaces/                  # Gasto, Empleado, Politica, ValidationResult, Alerta
└── modules/
    ├── gastos/dto/                  # CreateGastoDto
    ├── empleados/dto/               # CreateEmpleadoDto
    ├── politicas/                   # CORE MODULE
    │   ├── engine/
    │   │   ├── validation-engine.ts           # Pure function validarGasto()
    │   │   ├── validation-engine.service.ts   # NestJS injectable wrapper
    │   │   └── rules/                         # Individual rule functions
    │   └── dto/create-politica.dto.ts
    ├── exchange-rate/               # ExchangeRateService with in-memory cache
    │   ├── exchange-rate.service.ts
    │   ├── exchange-rate.module.ts
    │   └── dto/
```

## Key Conventions

- **Rules are pure functions**, not NestJS services. Only `ValidationEngineService` is injectable.
- **Test strings in Spanish** (e.g., `'debería devolver APROBADO si...'`).
- **TypeScript 4.9.5** pinned — do NOT upgrade to 5.x (breaks class-validator decorators).
- **Path alias `@/*`** defined in tsconfig but unused — all imports use relative paths.
- **DTOs enforce API validation**; batch analyzer (Part 3) handles raw CSV data separately.
- **Priority logic:** RECHAZADO > PENDIENTE > APROBADO > default PENDIENTE.

## Commit Conventions

**Format:** `type(scope): description`

**Types:**
- `feat` — new feature or capability
- `fix` — bug fix
- `refactor` — code restructure without behavior change
- `test` — adding or updating tests
- `docs` — documentation only
- `chore` — config, dependencies, CI, non-code changes

**Rules:**
- **Only commit when explicitly instructed by the user** — never auto-commit
- Language: **English** for commit messages (even though business domain is Spanish)
- Scope: optional, use module name (e.g., `politicas`, `exchange-rate`, `gastos`)
- Keep description under 72 characters
- Use imperative mood: "add feature" not "added feature"

**Examples:**
```
feat: implement Part 1 - Rules Engine with unit tests
fix(politicas): correct priority logic for RECHAZADO over PENDIENTE
test(politicas): add edge cases for expired expenses
chore: update TypeScript to 4.9.5 for class-validator compatibility
```

## Quirks

- `dist/` is in .gitignore but may exist from previous builds.
- `test/` directory doesn't exist — `npm run test:e2e` will fail (no e2e tests yet).
- `scripts/analyze.ts` is a stub (`export {}`) — Part 3 not implemented.
- `ExchangeRateModule` has service with in-memory cache (Map by date).
- `ValidationEngineService.validar()` is now async (converts to USD before validation).
- Port 3000 is hardcoded in `main.ts` (not configurable via env).
- Empty `src/modules/politicas/interfaces/` directory is a leftover — ignore it.
- `.env.example` contains `OPEN_EXCHANGE_RATES_APP_ID` — copy to `.env` for Part 2+.

## Files to Read First

1. `DESAFIO.md` — Original challenge requirements (Spanish)
2. `STACK.md` — Stack decisions and architecture (Spanish)
3. `src/modules/politicas/engine/validation-engine.ts` — Core business logic
4. `src/modules/politicas/engine/__tests__/validation-engine.spec.ts` — Test patterns
5. `gastos_historicos.csv` — Sample data for Part 3 (multi-currency: USD, CLP, MXN, EUR)

## Completion Status

| Part | Status |
|---|---|
| Part 1: Rules Engine | ✅ Complete (3 rules, 37 tests) |
| Part 2: Exchange Rate API | ✅ Complete (12 tests, in-memory cache) |
| Part 3: Batch Analyzer | ❌ Not started |
| README.md | ❌ Not created (required by DESAFIO.md) |
| ANALISIS.md | ❌ Not created (required by Part 3) |

## Memory

See `MEMORY.md` for corrections and feedback log.
