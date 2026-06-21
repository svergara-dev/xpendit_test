export interface CsvRow {
  gasto_id: string;
  empleado_id: string;
  empleado_nombre: string;
  empleado_apellido: string;
  empleado_cost_center: string;
  categoria: string;
  monto: number;
  moneda: string;
  fecha: string;
}

export interface GastoResult {
  gasto_id: string;
  empleado: string;
  cost_center: string;
  categoria: string;
  monto_original: number;
  moneda: string;
  monto_usd: number;
  fecha: string;
  status: 'APROBADO' | 'PENDIENTE' | 'RECHAZADO';
  alertas: Alerta[];
  es_duplicado: boolean;
  es_negativo: boolean;
}

export interface Alerta {
  codigo: string;
  mensaje: string;
}

export interface DuplicateGroup {
  gastos: string[];
  monto: number;
  moneda: string;
  fecha: string;
}

export interface AnalysisSummary {
  total: number;
  aprobados: number;
  pendientes: number;
  rechazados: number;
  duplicados: number;
  negativos: number;
  monto_total_usd: number;
}

export interface AnalysisOutput {
  summary: AnalysisSummary;
  results: GastoResult[];
  anomalies: {
    duplicates: DuplicateGroup[];
    negatives: string[];
  };
  apiOptimization: {
    totalCalls: number;
    withoutOptimization: number;
    savingsPercent: number;
  };
}
