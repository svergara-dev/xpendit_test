import { ExpenseStatus } from '../../../../shared/enums/status.enum';
import { Gasto } from '../../../../shared/interfaces/gasto.interface';
import { Empleado } from '../../../../shared/interfaces/empleado.interface';
import { Politica } from '../../../../shared/interfaces/politica.interface';
import { RuleResult } from '../interfaces/rule-result.interface';

let reglasCache = new Map<string, boolean>();
let cachedPolicy: Politica | null = null;

function buildReglasKey(costCenter: string, categoria: string): string {
  return `${costCenter}:${categoria}`;
}

function ensureReglasIndexed(politica: Politica): void {
  if (cachedPolicy !== politica) {
    reglasCache = new Map<string, boolean>();
    for (const regla of politica.reglas_centro_costo) {
      reglasCache.set(buildReglasKey(regla.cost_center, regla.categoria_prohibida), true);
    }
    cachedPolicy = politica;
  }
}

export function evaluarReglaCentroCosto(
  gasto: Gasto,
  empleado: Empleado,
  politica: Politica,
): RuleResult {
  ensureReglasIndexed(politica);

  const key = buildReglasKey(empleado.cost_center, gasto.categoria);

  if (reglasCache.has(key)) {
    return {
      status: ExpenseStatus.RECHAZADO,
      alertas: [
        {
          codigo: 'POLITICA_CENTRO_COSTO',
          mensaje: `El C.C. '${empleado.cost_center}' no puede reportar '${gasto.categoria}'.`,
        },
      ],
    };
  }

  return { status: ExpenseStatus.APROBADO, alertas: [] };
}
