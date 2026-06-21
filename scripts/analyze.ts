import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import { CsvRow, GastoResult, DuplicateGroup, AnalysisOutput } from './types';
import { DEFAULT_POLICY } from './policy';
import { validarGasto } from '../src/modules/politicas/engine/validation-engine';
import { Empleado } from '../src/shared/interfaces/empleado.interface';
import { Gasto } from '../src/shared/interfaces/gasto.interface';

const EXCHANGE_RATES_API = 'https://openexchangerates.org/api';
const APP_ID = process.env.OPEN_EXCHANGE_RATES_APP_ID || '83e844e0b7654cc9ae82e0419d1d65dd';

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

async function fetchRatesGroupedByDate(rows: CsvRow[]): Promise<Map<string, { [key: string]: number }>> {
  const uniqueDates = [...new Set(rows.map(r => r.fecha))].sort();
  const ratesMap = new Map<string, { [key: string]: number }>();

  console.log(`Fetching exchange rates for ${uniqueDates.length} unique dates...`);

  for (const date of uniqueDates) {
    const rates = await fetchRatesForDate(date);
    ratesMap.set(date, rates);
    console.log(`  ✓ ${date}`);
  }

  return ratesMap;
}

function convertToUSD(amount: number, fromCurrency: string, rates: { [key: string]: number }): number {
  if (fromCurrency === 'USD') return amount;
  const rate = rates[fromCurrency];
  if (!rate) return amount;
  return Math.round((amount / rate) * 100) / 100;
}

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
  return rows.filter(r => r.monto < 0).map(r => r.gasto_id);
}

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

function generateAnalysisMd(output: AnalysisOutput): string {
  const lines: string[] = [];

  lines.push('# Análisis de Gastos Históricos');
  lines.push('');
  lines.push('## Resumen por Estado');
  lines.push('');
  lines.push('| Estado | Cantidad | Monto Total (USD) |');
  lines.push('|---|---|---|');

  const aprobados = output.results.filter(r => r.status === 'APROBADO');
  const pendientes = output.results.filter(r => r.status === 'PENDIENTE');
  const rechazados = output.results.filter(r => r.status === 'RECHAZADO');

  const sumUsd = (items: GastoResult[]) => items.reduce((sum, r) => sum + r.monto_usd, 0);

  lines.push(`| APROBADO | ${aprobados.length} | $${sumUsd(aprobados).toFixed(2)} |`);
  lines.push(`| PENDIENTE | ${pendientes.length} | $${sumUsd(pendientes).toFixed(2)} |`);
  lines.push(`| RECHAZADO | ${rechazados.length} | $${sumUsd(rechazados).toFixed(2)} |`);
  lines.push(`| **Total** | **${output.summary.total}** | **$${output.summary.monto_total_usd.toFixed(2)}** |`);
  lines.push('');

  lines.push('## Anomalías Detectadas');
  lines.push('');

  lines.push('### Duplicados Exactos');
  lines.push('');
  if (output.anomalies.duplicates.length === 0) {
    lines.push('- Ninguno detectado');
  } else {
    for (const dup of output.anomalies.duplicates) {
      lines.push(`- **${dup.gastos.join(', ')}**: ${dup.monto} ${dup.moneda}, ${dup.fecha}`);
    }
  }
  lines.push('');

  lines.push('### Montos Negativos');
  lines.push('');
  if (output.anomalies.negatives.length === 0) {
    lines.push('- Ninguno detectado');
  } else {
    for (const id of output.anomalies.negatives) {
      lines.push(`- ${id}`);
    }
  }
  lines.push('');

  lines.push('## Optimización de API');
  lines.push('');
  lines.push(`- **Llamadas realizadas:** ${output.apiOptimization.totalCalls}`);
  lines.push(`- **Sin optimización:** ${output.apiOptimization.withoutOptimization}`);
  lines.push(`- **Ahorro:** ${output.apiOptimization.savingsPercent}%`);
  lines.push('');

  lines.push('## Detalle por Gasto');
  lines.push('');
  lines.push('| ID | Empleado | Original | USD | Estado | Alertas |');
  lines.push('|---|---|---|---|---|---|');
  for (const r of output.results) {
    const alertas = r.alertas.length > 0 ? r.alertas.map(a => a.codigo).join(', ') : '-';
    lines.push(`| ${r.gasto_id} | ${r.empleado} | ${r.monto_original} ${r.moneda} | $${r.monto_usd.toFixed(2)} | ${r.status} | ${alertas} |`);
  }

  return lines.join('\n');
}

async function main() {
  console.log('=== Xpendit Batch Analyzer ===\n');

  const rows = parseCsv('gastos_historicos.csv');
  console.log(`Loaded ${rows.length} expenses from CSV\n`);

  const ratesByDate = await fetchRatesGroupedByDate(rows);
  console.log('');

  const duplicates = detectDuplicates(rows);
  console.log(`Found ${duplicates.length} duplicate group(s)`);

  const negatives = detectNegatives(rows);
  console.log(`Found ${negatives.length} negative amount(s)\n`);

  const duplicateIds = new Set(duplicates.flatMap(d => d.gastos));
  const negativeIds = new Set(negatives);

  const results: GastoResult[] = [];

  for (const row of rows) {
    const rates = ratesByDate.get(row.fecha) || { USD: 1 };
    const montoUsd = convertToUSD(row.monto, row.moneda, rates);
    const empleado = buildEmpleado(row);
    const gasto = buildGasto(row, montoUsd);
    const validation = validarGasto(gasto, empleado, DEFAULT_POLICY);

    results.push({
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
    });
  }

  const aprobados = results.filter(r => r.status === 'APROBADO').length;
  const pendientes = results.filter(r => r.status === 'PENDIENTE').length;
  const rechazados = results.filter(r => r.status === 'RECHAZADO').length;
  const montoTotalUsd = results.reduce((sum, r) => sum + r.monto_usd, 0);

  const output: AnalysisOutput = {
    summary: {
      total: results.length,
      aprobados,
      pendientes,
      rechazados,
      duplicados: duplicates.length,
      negativos: negatives.length,
      monto_total_usd: Math.round(montoTotalUsd * 100) / 100,
    },
    results,
    anomalies: {
      duplicates,
      negatives,
    },
    apiOptimization: {
      totalCalls: ratesByDate.size,
      withoutOptimization: rows.length,
      savingsPercent: Math.round(((rows.length - ratesByDate.size) / rows.length) * 100),
    },
  };

  const docsDir = path.resolve(__dirname, '..', 'docs');

  const jsonPath = path.join(docsDir, 'results.json');
  fs.writeFileSync(jsonPath, JSON.stringify(output, null, 2));
  console.log(`Results saved to docs/results.json`);

  const mdContent = generateAnalysisMd(output);
  const mdPath = path.join(docsDir, 'ANALISIS.md');
  fs.writeFileSync(mdPath, mdContent);
  console.log('Report saved to docs/ANALISIS.md\n');

  console.log('=== Summary ===');
  console.log(`Total: ${output.summary.total}`);
  console.log(`APROBADOS: ${aprobados}`);
  console.log(`PENDIENTES: ${pendientes}`);
  console.log(`RECHAZADOS: ${rechazados}`);
  console.log(`Duplicate groups: ${duplicates.length}`);
  console.log(`Negative amounts: ${negatives.length}`);
  console.log(`API calls: ${ratesByDate.size} (vs ${rows.length} without optimization)`);
}

main().catch(console.error);
