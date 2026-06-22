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
| 2025-06-21 | Part 3 | Moved gastos_historicos.csv to data/ folder for better organization | Yes |
| 2025-06-21 | Security | API key was hardcoded in commit ea6f715, fixed in 10892c4 to use .env. Decision: keep history as-is (Option 1). Key should be regenerated in Open Exchange Rates. | Yes |
| 2025-06-21 | Part 1 | Documented categories without limits auto-approve behavior in README as business rule to validate with product team | Yes |
| 2025-06-21 | Part 3 | Made policy dynamic in ANALISIS.md - added PolicyConfig interface, policy field in AnalysisOutput, and dynamic metadata generation | Yes |
| 2025-06-21 | Part 1 | Optimized Big O: evaluarReglaCentroCosto O(R)→O(1) with Map cache, state counting O(3N)→O(N) with single loop | Yes |
| 2025-06-22 | Part 1 | Fixed bug: negative amounts were incorrectly APPROVED. Added validation in validation-engine.ts to RECHAZADO negative amounts before rule evaluation. Tests: 61→63 | Yes |
| 2025-06-22 | Part 3 | Added percentage column and rule breakdown tables (PENDIENTE/RECHAZADO) to ANALISIS.md | Yes |
| 2025-06-22 | Part 3 | Refactored scripts/analyze.ts: extracted 11 helper functions, reduced generateAnalysisMd from 125 to 20 lines, added ALERT_CODES constant | Yes |
| 2025-06-22 | Part 1 | Fixed bug: future dates were incorrectly APPROVED. Added validation in validation-engine.ts to RECHAZADO expenses with future dates. Tests: 63→65 | Yes |
| 2025-06-22 | Part 3 | Added OTROS row to RECHAZADO breakdown table in ANALISIS.md for edge case alerts (MONTO_NEGATIVO, FECHA_FUTURA) | Yes |
| 2025-06-22 | Part 3 | Added Fecha column to "Detalle por Gasto" table in ANALISIS.md for better traceability | Yes |

---
