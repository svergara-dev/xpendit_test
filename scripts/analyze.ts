import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { parse } from 'csv-parse/sync';
import { CsvRow, GastoResult, DuplicateGroup, AnalysisOutput } from './types';
import { DEFAULT_POLICY } from './policy';
import { validarGasto } from '../src/modules/politicas/engine/validation-engine';
import { Empleado } from '../src/shared/interfaces/empleado.interface';
import { Gasto } from '../src/shared/interfaces/gasto.interface';

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const EXCHANGE_RATES_API = 'https://openexchangerates.org/api';
const APP_ID = process.env.OPEN_EXCHANGE_RATES_APP_ID;

if (!APP_ID) {
  throw new Error(
    'OPEN_EXCHANGE_RATES_APP_ID environment variable is required. Copy .env.example to .env and add your API key.',
  );
}

const ALERT_CODES = {
  ANTIGUEDAD: 'LIMITE_ANTIGUEDAD',
  CATEGORIA: 'LIMITE_CATEGORIA',
  CENTRO_COSTO: 'POLITICA_CENTRO_COSTO',
} as const;

// --- CSV Parsing ---

function parseCsv(filePath: string): CsvRow[] {
  const content = fs.readFileSync(path.resolve(__dirname, '..', filePath), 'utf-8');
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
  return records.map((row: any) => ({
    ...row,
    monto: parseFloat(row.monto),
  }));
}

// --- Exchange Rate API ---

async function fetchRatesForDate(date: string): Promise<{ [key: string]: number }> {
  const url = `${EXCHANGE_RATES_API}/historical/${date}.json?app_id=${APP_ID}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    return data.rates;
  } catch (error) {
    console.error(`Error fetching rates for ${date}:`, error);
    return { USD: 1, CLP: 950, MXN: 17, EUR: 0.92 };
  }
}

async function validateApiKey(): Promise<boolean> {
  const url = `${EXCHANGE_RATES_API}/usage.json?app_id=${APP_ID}`;
  try {
    const response = await fetch(url);
    return response.ok;
  } catch {
    return false;
  }
}

async function fetchRatesGroupedByDate(
  rows: CsvRow[],
): Promise<Map<string, { [key: string]: number }>> {
  const uniqueDates = [...new Set(rows.map((r) => r.fecha))].sort();
  const ratesMap = new Map<string, { [key: string]: number }>();

  console.log(`Fetching exchange rates for ${uniqueDates.length} unique dates...`);

  for (const date of uniqueDates) {
    const rates = await fetchRatesForDate(date);
    ratesMap.set(date, rates);
    console.log(`  ✓ ${date}`);
  }

  return ratesMap;
}

// --- Currency Conversion ---

function convertToUSD(
  amount: number,
  fromCurrency: string,
  rates: { [key: string]: number },
): number {
  if (fromCurrency === 'USD') return amount;
  const rate = rates[fromCurrency];
  if (!rate) return amount;
  return Math.round((amount / rate) * 100) / 100;
}

// --- Anomaly Detection ---

function detectDuplicates(rows: CsvRow[]): DuplicateGroup[] {
  const groups = new Map<string, string[]>();

  for (const row of rows) {
    const key = `${row.monto}_${row.moneda}_${row.fecha}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(row.gasto_id);
  }

  const duplicates: DuplicateGroup[] = [];
  for (const [key, gastos] of groups) {
    if (gastos.length > 1) {
      const [monto, moneda, fecha] = key.split('_');
      duplicates.push({
        gastos,
        monto: parseFloat(monto),
        moneda,
        fecha,
      });
    }
  }

  return duplicates;
}

function detectNegatives(rows: CsvRow[]): string[] {
  return rows.filter((r) => r.monto < 0).map((r) => r.gasto_id);
}

// --- Builder Functions ---

function buildEmpleado(row: CsvRow): Empleado {
  return {
    id: row.empleado_id,
    nombre: row.empleado_nombre,
    apellido: row.empleado_apellido,
    cost_center: row.empleado_cost_center,
  };
}

function buildGasto(row: CsvRow, montoUsd: number): Gasto {
  return {
    id: row.gasto_id,
    monto: montoUsd,
    moneda: 'USD',
    fecha: row.fecha,
    categoria: row.categoria,
    empleado_id: row.empleado_id,
  };
}

// --- Report Generation Helpers ---

function generatePolicySection(policy: AnalysisOutput['policy']): string[] {
  const lines: string[] = [];
  lines.push('| Parámetro | Valor |');
  lines.push('|-----------|-------|');
  lines.push(`| Moneda base | ${policy.moneda_base} |`);
  lines.push(
    `| Límite antigüedad (PENDIENTE) | ≤${policy.limite_antiguedad.pendiente_dias} días |`,
  );
  lines.push(
    `| Límite antigüedad (RECHAZADO) | >${policy.limite_antiguedad.rechazado_dias} días |`,
  );

  const categoryLimits = Object.entries(policy.limites_por_categoria)
    .map(
      ([cat, limit]) =>
        `${cat}: ≤${limit.aprobado_hasta} APROBADO, ` +
        `${limit.aprobado_hasta}-${limit.pendiente_hasta} PENDIENTE, ` +
        `>${limit.pendiente_hasta} RECHAZADO`,
    )
    .join('; ');
  lines.push(`| Límites por categoría | ${categoryLimits} |`);

  const crossRules = policy.reglas_centro_costo
    .map((r) => `${r.cost_center} + ${r.categoria_prohibida} → RECHAZADO`)
    .join('; ');
  lines.push(`| Reglas cruzadas | ${crossRules} |`);

  return lines;
}

function generateSummaryTable(results: GastoResult[], total: number): string[] {
  const lines: string[] = [];
  const aprobados = results.filter((r) => r.status === 'APROBADO');
  const pendientes = results.filter((r) => r.status === 'PENDIENTE');
  const rechazados = results.filter((r) => r.status === 'RECHAZADO');

  const sumUsd = (items: GastoResult[]) => items.reduce((sum, r) => sum + r.monto_usd, 0);
  const pct = (count: number) => `${Math.round((count / total) * 100)}%`;

  lines.push('| Estado | Cantidad | Porcentaje | Monto Total (USD) |');
  lines.push('|---|---|---|---|');
  lines.push(
    `| APROBADO | ${aprobados.length} | ${pct(aprobados.length)} | $${sumUsd(aprobados).toFixed(2)} |`,
  );
  lines.push(
    `| PENDIENTE | ${pendientes.length} | ${pct(pendientes.length)} | $${sumUsd(pendientes).toFixed(2)} |`,
  );
  lines.push(
    `| RECHAZADO | ${rechazados.length} | ${pct(rechazados.length)} | $${sumUsd(rechazados).toFixed(2)} |`,
  );
  lines.push(`| **Total** | **${total}** | **100%** | **$${sumUsd(results).toFixed(2)}** |`);

  return lines;
}

function countAlerts(results: GastoResult[], status: string, alertCode: string): number {
  return results.filter((r) => r.status === status && r.alertas.some((a) => a.codigo === alertCode))
    .length;
}

function generateRuleBreakdown(results: GastoResult[]): string[] {
  const lines: string[] = [];
  const pendientes = results.filter((r) => r.status === 'PENDIENTE');
  const rechazados = results.filter((r) => r.status === 'RECHAZADO');
  const pctOf = (count: number, base: number) => `${Math.round((count / base) * 100)}%`;

  lines.push('### PENDIENTE (' + pendientes.length + ' gastos)');
  lines.push('');
  lines.push('| Regla | Cantidad | Porcentaje |');
  lines.push('|-------|----------|------------|');

  const pendAntiguedad = countAlerts(results, 'PENDIENTE', ALERT_CODES.ANTIGUEDAD);
  const pendCategoria = countAlerts(results, 'PENDIENTE', ALERT_CODES.CATEGORIA);
  lines.push(
    `| LIMITE_ANTIGUEDAD | ${pendAntiguedad} | ${pctOf(pendAntiguedad, pendientes.length)} |`,
  );
  lines.push(
    `| LIMITE_CATEGORIA | ${pendCategoria} | ${pctOf(pendCategoria, pendientes.length)} |`,
  );
  lines.push('');

  lines.push('### RECHAZADO (' + rechazados.length + ' gastos)');
  lines.push('');
  lines.push('| Regla | Cantidad | Porcentaje |');
  lines.push('|-------|----------|------------|');

  const rechAntiguedad = countAlerts(results, 'RECHAZADO', ALERT_CODES.ANTIGUEDAD);
  const rechCategoria = countAlerts(results, 'RECHAZADO', ALERT_CODES.CATEGORIA);
  const rechCentroCosto = countAlerts(results, 'RECHAZADO', ALERT_CODES.CENTRO_COSTO);
  const rechOtros = rechazados.filter(
    (r) =>
      !r.alertas.some(
        (a) =>
          a.codigo === ALERT_CODES.ANTIGUEDAD ||
          a.codigo === ALERT_CODES.CATEGORIA ||
          a.codigo === ALERT_CODES.CENTRO_COSTO,
      ),
  ).length;
  lines.push(
    `| LIMITE_ANTIGUEDAD | ${rechAntiguedad} | ${pctOf(rechAntiguedad, rechazados.length)} |`,
  );
  lines.push(
    `| LIMITE_CATEGORIA | ${rechCategoria} | ${pctOf(rechCategoria, rechazados.length)} |`,
  );
  lines.push(
    `| POLITICA_CENTRO_COSTO | ${rechCentroCosto} | ${pctOf(rechCentroCosto, rechazados.length)} |`,
  );
  lines.push(`| OTROS | ${rechOtros} | ${pctOf(rechOtros, rechazados.length)} |`);

  return lines;
}

function generateAnomaliesSection(anomalies: AnalysisOutput['anomalies']): string[] {
  const lines: string[] = [];

  lines.push('### Duplicados Exactos');
  lines.push('');
  if (anomalies.duplicates.length === 0) {
    lines.push('- Ninguno detectado');
  } else {
    for (const dup of anomalies.duplicates) {
      lines.push(`- **${dup.gastos.join(', ')}**: ${dup.monto} ${dup.moneda}, ${dup.fecha}`);
    }
  }
  lines.push('');

  lines.push('### Montos Negativos');
  lines.push('');
  if (anomalies.negatives.length === 0) {
    lines.push('- Ninguno detectado');
  } else {
    for (const id of anomalies.negatives) {
      lines.push(`- ${id}`);
    }
  }

  return lines;
}

function generateApiOptimizationSection(
  apiOptimization: AnalysisOutput['apiOptimization'],
): string[] {
  const lines: string[] = [];
  lines.push(`- **Llamadas realizadas:** ${apiOptimization.totalCalls}`);
  lines.push(`- **Sin optimización:** ${apiOptimization.withoutOptimization}`);
  lines.push(`- **Ahorro:** ${apiOptimization.savingsPercent}%`);
  return lines;
}

function generateDetailTable(results: GastoResult[]): string[] {
  const lines: string[] = [];
  lines.push('| ID | Empleado | Original | USD | Fecha | Estado | Alertas |');
  lines.push('|---|---|---|---|---|---|---|');

  for (const r of results) {
    const alertas = r.alertas.length > 0 ? r.alertas.map((a) => a.codigo).join(', ') : '-';
    lines.push(
      `| ${r.gasto_id} | ${r.empleado} | ${r.monto_original} ${r.moneda} | ` +
        `$${r.monto_usd.toFixed(2)} | ${r.fecha} | ${r.status} | ${alertas} |`,
    );
  }

  return lines;
}

function generateAnalysisMd(output: AnalysisOutput): string {
  const executionDate = new Date().toISOString().split('T')[0];
  const { policy, results, anomalies, apiOptimization } = output;
  const total = output.summary.total;

  const sections: string[] = [];

  sections.push('# Análisis de Gastos Históricos');
  sections.push('');
  sections.push(`**Fecha de ejecución:** ${executionDate}`);
  sections.push('**Política aplicada:** CONFIGURACIÓN PERSONALIZADA');
  sections.push('');
  sections.push(...generatePolicySection(policy));
  sections.push('');
  sections.push('---');
  sections.push('');
  sections.push('## Resumen por Estado');
  sections.push('');
  sections.push(...generateSummaryTable(results, total));
  sections.push('');
  sections.push('---');
  sections.push('');
  sections.push('## Desglose por Regla');
  sections.push('');
  sections.push(...generateRuleBreakdown(results));
  sections.push('');
  sections.push('## Anomalías Detectadas');
  sections.push('');
  sections.push(...generateAnomaliesSection(anomalies));
  sections.push('');
  sections.push('## Optimización de API');
  sections.push('');
  sections.push(...generateApiOptimizationSection(apiOptimization));
  sections.push('');
  sections.push('## Detalle por Gasto');
  sections.push('');
  sections.push(...generateDetailTable(results));

  return sections.join('\n');
}

// --- Expense Processing ---

function processExpenses(
  rows: CsvRow[],
  ratesByDate: Map<string, { [key: string]: number }>,
  duplicateIds: Set<string>,
  negativeIds: Set<string>,
): GastoResult[] {
  return rows.map((row) => {
    const rates = ratesByDate.get(row.fecha) || { USD: 1 };
    const montoUsd = convertToUSD(row.monto, row.moneda, rates);
    const empleado = buildEmpleado(row);
    const gasto = buildGasto(row, montoUsd);
    const validation = validarGasto(gasto, empleado, DEFAULT_POLICY);

    return {
      gasto_id: row.gasto_id,
      empleado: `${row.empleado_nombre} ${row.empleado_apellido}`,
      cost_center: row.empleado_cost_center,
      categoria: row.categoria,
      monto_original: row.monto,
      moneda: row.moneda,
      monto_usd: montoUsd,
      fecha: row.fecha,
      status: validation.status,
      alertas: validation.alertas,
      es_duplicado: duplicateIds.has(row.gasto_id),
      es_negativo: negativeIds.has(row.gasto_id),
    };
  });
}

function calculateSummary(
  results: GastoResult[],
  duplicates: DuplicateGroup[],
  negatives: string[],
): AnalysisOutput['summary'] {
  let aprobados = 0;
  let pendientes = 0;
  let rechazados = 0;
  let montoTotalUsd = 0;

  for (const r of results) {
    montoTotalUsd += r.monto_usd;
    if (r.status === 'APROBADO') aprobados++;
    else if (r.status === 'PENDIENTE') pendientes++;
    else rechazados++;
  }

  return {
    total: results.length,
    aprobados,
    pendientes,
    rechazados,
    duplicados: duplicates.length,
    negativos: negatives.length,
    monto_total_usd: Math.round(montoTotalUsd * 100) / 100,
  };
}

function buildOutput(
  summary: AnalysisOutput['summary'],
  results: GastoResult[],
  duplicates: DuplicateGroup[],
  negatives: string[],
  rowsLength: number,
  uniqueDatesCount: number,
): AnalysisOutput {
  return {
    summary,
    policy: DEFAULT_POLICY,
    results,
    anomalies: {
      duplicates,
      negatives,
    },
    apiOptimization: {
      totalCalls: uniqueDatesCount,
      withoutOptimization: rowsLength,
      savingsPercent: Math.round(((rowsLength - uniqueDatesCount) / rowsLength) * 100),
    },
  };
}

function saveOutput(output: AnalysisOutput): void {
  const docsDir = path.resolve(__dirname, '..', 'docs');

  const jsonPath = path.join(docsDir, 'results.json');
  fs.writeFileSync(jsonPath, JSON.stringify(output, null, 2));
  console.log(`Results saved to docs/results.json`);

  const mdContent = generateAnalysisMd(output);
  const mdPath = path.join(docsDir, 'ANALISIS.md');
  fs.writeFileSync(mdPath, mdContent);
  console.log('Report saved to docs/ANALISIS.md\n');
}

function printSummary(output: AnalysisOutput): void {
  console.log('=== Summary ===');
  console.log(`Total: ${output.summary.total}`);
  console.log(`APROBADOS: ${output.summary.aprobados}`);
  console.log(`PENDIENTES: ${output.summary.pendientes}`);
  console.log(`RECHAZADOS: ${output.summary.rechazados}`);
  console.log(`Duplicate groups: ${output.summary.duplicados}`);
  console.log(`Negative amounts: ${output.summary.negativos}`);
  console.log(
    `API calls: ${output.apiOptimization.totalCalls} (vs ${output.apiOptimization.withoutOptimization} without optimization)`,
  );
}

// --- Main Entry Point ---

async function main(): Promise<void> {
  console.log('=== Xpendit Batch Analyzer ===\n');

  const isValid = await validateApiKey();
  if (!isValid) {
    console.error('API key inválida o no configurada');
    console.error('\n  Solución:');
    console.error('  1. Obtén una API key gratuita en https://openexchangerates.org');
    console.error('  2. Actualiza OPEN_EXCHANGE_RATES_APP_ID en el archivo .env');
    process.exit(1);
  }
  console.log('API key válida\n');

  const rows = parseCsv('data/gastos_historicos.csv');
  console.log(`Loaded ${rows.length} expenses from CSV\n`);

  const ratesByDate = await fetchRatesGroupedByDate(rows);
  console.log('');

  const duplicates = detectDuplicates(rows);
  console.log(`Found ${duplicates.length} duplicate group(s)`);

  const negatives = detectNegatives(rows);
  console.log(`Found ${negatives.length} negative amount(s)\n`);

  const duplicateIds = new Set(duplicates.flatMap((d) => d.gastos));
  const negativeIds = new Set(negatives);

  const results = processExpenses(rows, ratesByDate, duplicateIds, negativeIds);
  const summary = calculateSummary(results, duplicates, negatives);
  const output = buildOutput(
    summary,
    results,
    duplicates,
    negatives,
    rows.length,
    ratesByDate.size,
  );

  saveOutput(output);
  printSummary(output);
}

main().catch(console.error);
