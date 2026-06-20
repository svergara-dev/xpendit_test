import { ExpenseStatus } from '../../../../shared/enums/status.enum';
import { Gasto } from '../../../../shared/interfaces/gasto.interface';
import { Empleado } from '../../../../shared/interfaces/empleado.interface';
import { Politica } from '../../../../shared/interfaces/politica.interface';
import { RuleResult } from '../interfaces/rule-result.interface';

export function evaluarReglaCentroCosto(
  gasto: Gasto,
  empleado: Empleado,
  politica: Politica,
): RuleResult {
  const regla = politica.reglas_centro_costo.find(
    (r) => r.cost_center === empleado.cost_center && r.categoria_prohibida === gasto.categoria,
  );

  if (regla) {
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
