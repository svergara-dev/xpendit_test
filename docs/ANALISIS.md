# Análisis de Gastos Históricos

**Fecha de ejecución:** 2026-06-22
**Política aplicada:** CONFIGURACIÓN PERSONALIZADA

| Parámetro                     | Valor                                                                                                               |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Moneda base                   | USD                                                                                                                 |
| Límite antigüedad (PENDIENTE) | ≤30 días                                                                                                            |
| Límite antigüedad (RECHAZADO) | >60 días                                                                                                            |
| Límites por categoría         | food: ≤100 APROBADO, 100-150 PENDIENTE, >150 RECHAZADO; transport: ≤200 APROBADO, 200-200 PENDIENTE, >200 RECHAZADO |
| Reglas cruzadas               | core_engineering + food → RECHAZADO                                                                                 |

---

## Resumen por Estado

| Estado    | Cantidad | Porcentaje | Monto Total (USD) |
| --------- | -------- | ---------- | ----------------- |
| APROBADO  | 11       | 22%        | $1165.00          |
| PENDIENTE | 14       | 28%        | $1655.86          |
| RECHAZADO | 25       | 50%        | $2568.03          |
| **Total** | **50**   | **100%**   | **$5388.89**      |

---

## Desglose por Regla

### PENDIENTE (14 gastos)

| Regla             | Cantidad | Porcentaje |
| ----------------- | -------- | ---------- |
| LIMITE_ANTIGUEDAD | 13       | 93%        |
| LIMITE_CATEGORIA  | 5        | 36%        |

### RECHAZADO (25 gastos)

| Regla                 | Cantidad | Porcentaje |
| --------------------- | -------- | ---------- |
| LIMITE_ANTIGUEDAD     | 21       | 84%        |
| LIMITE_CATEGORIA      | 8        | 32%        |
| POLITICA_CENTRO_COSTO | 4        | 16%        |
| OTROS                 | 0        | 0%         |

## Anomalías Detectadas

### Duplicados Exactos

- **g_001, g_011**: 50 USD, 2026-06-04
- **g_002, g_012**: 120 USD, 2026-05-30
- **g_025, g_029**: 120 USD, 2026-03-16
- **g_036, g_041**: 70 USD, 2026-06-04
- **g_037, g_039, g_047**: 150 USD, 2026-03-16
- **g_038, g_050**: 130 EUR, 2026-04-25
- **g_042, g_043, g_044**: 90 USD, 2026-06-09

### Montos Negativos

- Ninguno detectado

## Optimización de API

- **Llamadas realizadas:** 25
- **Sin optimización:** 50
- **Ahorro:** 50%

## Detalle por Gasto

| ID    | Empleado   | Original   | USD     | Estado    | Alertas                                                    |
| ----- | ---------- | ---------- | ------- | --------- | ---------------------------------------------------------- |
| g_001 | Bruno Soto | 50 USD     | $50.00  | APROBADO  | -                                                          |
| g_002 | Bruno Soto | 120 USD    | $120.00 | PENDIENTE | LIMITE_CATEGORIA                                           |
| g_003 | Bruno Soto | 160 USD    | $160.00 | RECHAZADO | LIMITE_CATEGORIA                                           |
| g_004 | Eva Luna   | 81000 CLP  | $90.18  | PENDIENTE | LIMITE_ANTIGUEDAD                                          |
| g_005 | Eva Luna   | 126000 CLP | $140.28 | PENDIENTE | LIMITE_ANTIGUEDAD, LIMITE_CATEGORIA                        |
| g_006 | Eva Luna   | 144000 CLP | $158.56 | RECHAZADO | LIMITE_ANTIGUEDAD, LIMITE_CATEGORIA                        |
| g_007 | Carla Mora | 1750 MXN   | $101.64 | PENDIENTE | LIMITE_ANTIGUEDAD, LIMITE_CATEGORIA                        |
| g_008 | Carla Mora | 2100 MXN   | $121.11 | PENDIENTE | LIMITE_ANTIGUEDAD, LIMITE_CATEGORIA                        |
| g_009 | Carla Mora | 3500 MXN   | $200.43 | RECHAZADO | LIMITE_ANTIGUEDAD, LIMITE_CATEGORIA                        |
| g_010 | David Paz  | 92 EUR     | $107.85 | PENDIENTE | LIMITE_ANTIGUEDAD, LIMITE_CATEGORIA                        |
| g_011 | Ana Reyes  | 50 USD     | $50.00  | RECHAZADO | POLITICA_CENTRO_COSTO                                      |
| g_012 | Ana Reyes  | 120 USD    | $120.00 | RECHAZADO | LIMITE_CATEGORIA, POLITICA_CENTRO_COSTO                    |
| g_013 | Ana Reyes  | 45000 CLP  | $50.16  | RECHAZADO | POLITICA_CENTRO_COSTO                                      |
| g_014 | Ana Reyes  | 75 USD     | $75.00  | PENDIENTE | LIMITE_ANTIGUEDAD                                          |
| g_015 | Ana Reyes  | 150 USD    | $150.00 | PENDIENTE | LIMITE_ANTIGUEDAD                                          |
| g_016 | Bruno Soto | 50 USD     | $50.00  | RECHAZADO | LIMITE_ANTIGUEDAD                                          |
| g_017 | Carla Mora | 50 USD     | $50.00  | RECHAZADO | LIMITE_ANTIGUEDAD                                          |
| g_018 | David Paz  | 50 USD     | $50.00  | RECHAZADO | LIMITE_ANTIGUEDAD                                          |
| g_019 | Eva Luna   | 50 USD     | $50.00  | RECHAZADO | LIMITE_ANTIGUEDAD                                          |
| g_020 | Ana Reyes  | 50 USD     | $50.00  | RECHAZADO | LIMITE_ANTIGUEDAD                                          |
| g_021 | Bruno Soto | 50 USD     | $50.00  | RECHAZADO | LIMITE_ANTIGUEDAD                                          |
| g_022 | Carla Mora | 50 USD     | $50.00  | RECHAZADO | LIMITE_ANTIGUEDAD                                          |
| g_023 | David Paz  | 50 USD     | $50.00  | RECHAZADO | LIMITE_ANTIGUEDAD                                          |
| g_024 | Ana Reyes  | 50 USD     | $50.00  | APROBADO  | -                                                          |
| g_025 | Bruno Soto | 120 USD    | $120.00 | RECHAZADO | LIMITE_ANTIGUEDAD, LIMITE_CATEGORIA                        |
| g_026 | Bruno Soto | 160 USD    | $160.00 | RECHAZADO | LIMITE_ANTIGUEDAD, LIMITE_CATEGORIA                        |
| g_027 | Bruno Soto | 80 USD     | $80.00  | RECHAZADO | LIMITE_ANTIGUEDAD                                          |
| g_028 | Bruno Soto | 120 USD    | $120.00 | RECHAZADO | LIMITE_ANTIGUEDAD, LIMITE_CATEGORIA                        |
| g_029 | Ana Reyes  | 120 USD    | $120.00 | RECHAZADO | LIMITE_ANTIGUEDAD, LIMITE_CATEGORIA, POLITICA_CENTRO_COSTO |
| g_030 | Carla Mora | 500 MXN    | $28.88  | RECHAZADO | LIMITE_ANTIGUEDAD                                          |
| g_031 | David Paz  | 180 USD    | $180.00 | APROBADO  | -                                                          |
| g_032 | Eva Luna   | 75 USD     | $75.00  | APROBADO  | -                                                          |
| g_033 | Carla Mora | 200 USD    | $200.00 | RECHAZADO | LIMITE_ANTIGUEDAD                                          |
| g_034 | David Paz  | 85 USD     | $85.00  | PENDIENTE | LIMITE_ANTIGUEDAD                                          |
| g_035 | Ana Reyes  | 120 USD    | $120.00 | PENDIENTE | LIMITE_ANTIGUEDAD                                          |
| g_036 | Bruno Soto | 70 USD     | $70.00  | APROBADO  | -                                                          |
| g_037 | Eva Luna   | 150 USD    | $150.00 | RECHAZADO | LIMITE_ANTIGUEDAD                                          |
| g_038 | Carla Mora | 130 EUR    | $152.40 | PENDIENTE | LIMITE_ANTIGUEDAD                                          |
| g_039 | David Paz  | 150 USD    | $150.00 | RECHAZADO | LIMITE_ANTIGUEDAD                                          |
| g_040 | Ana Reyes  | 90 USD     | $90.00  | PENDIENTE | LIMITE_ANTIGUEDAD                                          |
| g_041 | Eva Luna   | 70 USD     | $70.00  | APROBADO  | -                                                          |
| g_042 | Bruno Soto | 90 USD     | $90.00  | APROBADO  | -                                                          |
| g_043 | Bruno Soto | 90 USD     | $90.00  | APROBADO  | -                                                          |
| g_044 | Bruno Soto | 90 USD     | $90.00  | APROBADO  | -                                                          |
| g_045 | Bruno Soto | 100 USD    | $100.00 | APROBADO  | -                                                          |
| g_046 | David Paz  | 150 USD    | $150.00 | PENDIENTE | LIMITE_ANTIGUEDAD                                          |
| g_047 | David Paz  | 150 USD    | $150.00 | RECHAZADO | LIMITE_ANTIGUEDAD                                          |
| g_048 | David Paz  | 150 USD    | $150.00 | RECHAZADO | LIMITE_ANTIGUEDAD                                          |
| g_049 | Ana Reyes  | 300 USD    | $300.00 | APROBADO  | -                                                          |
| g_050 | Carla Mora | 130 EUR    | $152.40 | PENDIENTE | LIMITE_ANTIGUEDAD                                          |
