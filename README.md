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

## Licencia

MIT
