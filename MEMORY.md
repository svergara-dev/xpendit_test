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

---
