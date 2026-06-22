# Xpendit Motor de Reglas

Motor de validación de gastos empresariales con reglas configurables, integración
con API de tasas de cambio y análisis de lotes.

## Requisitos Previos

- **Node.js** v16+ (recomendado v18+)
- **npm** (incluido con Node.js)
- **API Key** de [Open Exchange Rates](https://openexchangerates.org/) (gratuita)

## Instalación

```bash
npm install
```

## Configuración

1. Copia el archivo de ejemplo de variables de entorno:
```bash
cp .env.example .env
```

2. Obtén tu API Key de [Open Exchange Rates](https://openexchangerates.org/)
   y agrégala al archivo `.env`:
```
OPEN_EXCHANGE_RATES_APP_ID=tu_api_key_aqui
```

## Ejecutar el servidor (desarrollo)

```bash
npm run start:dev
```

El servidor iniciará en `http://localhost:3000`.

## Ejecutar pruebas unitarias

```bash
npm test
```

Para pruebas con cobertura:
```bash
npm run test:cov
```

## Ejecutar analizador de lotes

```bash
npm run analyze
```

Esto procesará el archivo `gastos_historicos.csv` y generará:
- `ANALISIS.md` — Reporte de hallazgos
- `scripts/results.json` — Resultados detallados

### Nota sobre el caso por defecto (PENDIENTE)

La especificación del desafío indica que el estado por defecto debe ser PENDIENTE cuando
"no aplica ninguna regla anterior". Sin embargo, con las reglas actuales este
caso es inalcanzable porque:

- `evaluarAntiguedad` SIEMPRE retorna un status (todo gasto tiene fecha válida)
- `evaluarLimiteCategoria` retorna APROBADO si no hay límite definido para la categoría
- `evaluarReglaCentroCosto` retorna APROBADO si no hay regla aplicable para el centro de costo

Por lo tanto, siempre habrá al menos un APROBADO en los resultados, y la
condición "ninguna regla aplica" nunca se cumple. El default PENDIENTE solo
sería alcanzable si se agregaran reglas que puedan retornar un estado "no aplica".

## Arquitectura

```
src/
├── modules/
│   ├── politicas/engine/     # Motor de reglas (validación)
│   ├── exchange-rate/        # Cliente API de tasas de cambio
│   ├── gastos/dto/           # DTOs de gastos
│   └── empleados/dto/        # DTOs de empleados
└── shared/                   # Enums, interfaces compartidas

scripts/
├── analyze.ts                # Analizador de lotes
├── types.ts                  # Tipos para análisis
└── policy.ts                 # Política por defecto
```

## Stack

- **Runtime:** Node.js + TypeScript 4.9.5
- **Framework:** NestJS
- **Testing:** Jest
- **API:** Open Exchange Rates (tasas de cambio)

## Challenge Structure

### Part 1: Rules Engine (Logic)

Core validation logic without external dependencies.

| File | Description |
|------|-------------|
| `src/shared/enums/status.enum.ts` | ExpenseStatus enum (APROBADO, PENDIENTE, RECHAZADO) |
| `src/shared/interfaces/*.ts` | Interfaces: Gasto, Empleado, Politica, ValidationResult, Alerta |
| `src/modules/politicas/engine/validation-engine.ts` | Pure function `validarGasto()` |
| `src/modules/politicas/engine/validation-engine.service.ts` | NestJS injectable wrapper |
| `src/modules/politicas/engine/rules/antiguedad.rule.ts` | Age rule (0-30 APROBADO, 31-60 PENDIENTE, >60 RECHAZADO) |
| `src/modules/politicas/engine/rules/limite-categoria.rule.ts` | Category limit rule |
| `src/modules/politicas/engine/rules/regla-centro-costo.rule.ts` | Cost center cross rule |
| `src/modules/politicas/engine/__tests__/validation-engine.spec.ts` | Engine tests (61 tests) |
| `src/modules/politicas/engine/rules/__tests__/*.spec.ts` | Individual rule tests |

### Part 2: Exchange Rate API

External API integration with caching.

| File | Description |
|------|-------------|
| `src/modules/exchange-rate/exchange-rate.service.ts` | API client with in-memory cache |
| `src/modules/exchange-rate/exchange-rate.module.ts` | NestJS module |
| `src/modules/exchange-rate/dto/exchange-rate-response.dto.ts` | Response DTO |
| `src/modules/exchange-rate/__tests__/exchange-rate.service.spec.ts` | Tests (12 tests) |

### Part 3: Batch Analyzer

CSV processing and anomaly detection.

| File | Description |
|------|-------------|
| `scripts/analyze.ts` | Main analyzer script |
| `scripts/types.ts` | TypeScript types for analysis |
| `scripts/policy.ts` | Default policy configuration |
| `gastos_historicos.csv` | Input data (multi-currency) |
| `docs/ANALISIS.md` | Generated analysis report |

## Licencia

MIT
