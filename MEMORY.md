# MEMORY.md

## Corrections & Feedback Log

Registro de correcciones y feedback del usuario durante el desarrollo.

---

| Date | Part | Description | Applied |
|---|---|---|---|
| 2025-06-20 | Setup | TypeScript 4.9.5 required (not 5.x) for class-validator compatibility | Yes |
| 2025-06-20 | Setup | tsconfig.build.json must extend tsconfig.json for decorators | Yes |
| 2025-06-20 | Part 1 | test/e2e directory does not exist - npm run test:e2e will fail | Known |
| 2025-06-20 | Part 3 | scripts/analyze.ts implemented and tested - generates ANALISIS.md + results.json | Yes |
| 2025-06-20 | Commit | Fixed autonomous commits - agents must run lint/build/test before committing | Yes |
| 2025-06-20 | Config | opencode.json needs plugin registration for verify-before-commit | Pending |
| 2025-06-21 | Part 1 | Added boundary tests for antigüedad (30, 31, 60, 61 days) and monto food (100, 101, 150, 151 USD) | Yes |
| 2025-06-21 | Part 1 | Added priority combination tests (RECHAZADO > PENDIENTE, RECHAZADO > APROBADO) | Yes |
| 2025-06-21 | Part 1 | Default PENDIENTE case documented as unreachable in README | Yes |
| 2025-06-21 | Part 3 | Added dotenv support for automatic .env loading in scripts/analyze.ts | Yes |
| 2025-06-21 | Part 3 | Added API key validation using /usage.json (free endpoint, no quota consumption) | Yes |
| 2025-06-21 | Part 3 | Removed hardcoded API key from scripts/analyze.ts | Yes |
| 2025-06-21 | Part 1 | Translated validation-engine.spec.ts test descriptions from Spanish to English | Yes |

---
