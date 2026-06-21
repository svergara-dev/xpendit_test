# Stack de Desarrollo - Xpendit Motor de Reglas

## Lenguaje y Runtime

| Tecnología | Versión | Propósito |
|---|---|---|
| **TypeScript** | ^5.x | Lenguaje principal con tipado estático |
| **Node.js** | ^20 LTS | Runtime de ejecución |

## Framework Principal

| Tecnología | Propósito |
|---|---|
| **NestJS** | Framework modular y escalable para la lógica de negocio y API |

## Arquitectura

```
src/
├── modules/
│   ├── gastos/          # Modelo y lógica de gastos
│   ├── empleados/       # Modelo y lógica de empleados
│   ├── politicas/       # Motor de reglas y validación
│   └── exchange-rate/   # Cliente API Open Exchange Rates
├── shared/
│   ├── dto/             # Data Transfer Objects (class-validator)
│   ├── enums/           # Estados (APROBADO, PENDIENTE, RECHAZADO)
│   ├── interfaces/      # Tipos e interfaces compartidas
│   └── utils/           # Funciones auxiliares
├── config/              # Configuración centralizada
└── scripts/             # Scripts de análisis de lotes (Parte 3)
```

## Dependencias Principales

| Paquete | Propósito |
|---|---|
| `@nestjs/common` | Core de NestJS |
| `@nestjs/config` | Gestión de variables de entorno (.env) |
| `@nestjs/axios` | Cliente HTTP para integración con APIs externas |
| `axios` | Cliente HTTP subyacente |
| `class-validator` | Validación de DTOs con decoradores |
| `class-transformer` | Transformación y serialización de datos |
| `csv-parse` | Parsing de archivos CSV (Parte 3) |
| `reflect-metadata` | Metadatos para decoradores NestJS |
| `rxjs` | Programación reactiva (dependencia de NestJS) |

## Dependencias de Desarrollo

| Paquete | Propósito |
|---|---|
| `typescript` | Compilador TypeScript |
| `@types/node` | Tipos de Node.js |
| `jest` | Framework de testing |
| `@nestjs/testing` | Utilidades de testing para NestJS |
| `ts-jest` | Integración de Jest con TypeScript |
| `eslint` + `@typescript-eslint/*` | Análisis estático de código |
| `prettier` | Formateo de código |

## Testing

| Tipo | Herramienta | Comando |
|---|---|---|
| Unit Tests | Jest + ts-jest | `npm run test` |
| Test Watch | Jest | `npm run test:watch` |
| Coverage | Jest | `npm run test:cov` |

## Gestión de Secretos

- **`.env`** - Archivo de variables de entorno (no commiteado al repo)
- **`@nestjs/config`** - Inyección de configuración vía `ConfigModule`
- **`.env.example`** - Plantilla de variables requeridas (commiteada)

**Variable requerida:** `OPEN_EXCHANGE_RATES_APP_ID=tu_api_key_aqui`

## Scripts del Proyecto

| Comando | Descripción |
|---|---|
| `npm run build` | Compilar el proyecto TypeScript |
| `npm run start` | Iniciar el servidor NestJS |
| `npm run start:dev` | Iniciar en modo desarrollo con hot-reload |
| `npm run test` | Ejecutar todos los tests unitarios |
| `npm run lint` | Ejecutar ESLint |
| `npm run format` | Formatear código con Prettier |
| `npm run analyze` | Ejecutar script de análisis de lotes (Parte 3) |

## Justificación de Decisiones

### ¿Por qué NestJS sobre Express/Fastify directo?
- **Inyección de dependencias** nativa facilita testing y desacoplamiento.
- **Arquitectura modular** natural: cada dominio (gastos, empleados, políticas) es un módulo independiente.
- **Guards, Interceptors, Pipes** permiten manejo centralizado de errores, validación y logging.
- **Testing integrado** con `@nestjs/testing` para inyectar mocks fácilmente.

### ¿Por qué class-validator sobre Zod?
- Se integra directamente con los DTOs de NestJS usando decoradores.
- Mantiene un estilo consistente con el ecosistema NestJS.
- Permite validación automática a través de pipes de NestJS.

### ¿Por qué csv-parse sobre Papa Parse?
- Nativo de Node.js, sin dependencias del navegador.
- Streaming eficiente para archivos grandes.
- TypeScript-first con tipos integrados.
