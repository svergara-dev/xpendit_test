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
