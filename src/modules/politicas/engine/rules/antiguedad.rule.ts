import { ExpenseStatus } from '../../../../shared/enums/status.enum';
import { Gasto } from '../../../../shared/interfaces/gasto.interface';
import { Politica } from '../../../../shared/interfaces/politica.interface';
import { RuleResult } from '../interfaces/rule-result.interface';

export function evaluarAntiguedad(gasto: Gasto, politica: Politica): RuleResult {
  const fechaGasto = new Date(gasto.fecha);
  const hoy = new Date();
  const diasDiff = Math.floor((hoy.getTime() - fechaGasto.getTime()) / (1000 * 60 * 60 * 24));

  const { pendiente_dias, rechazado_dias } = politica.limite_antiguedad;

  if (diasDiff <= pendiente_dias) {
    return { status: ExpenseStatus.APROBADO, alertas: [] };
  }

  if (diasDiff <= rechazado_dias) {
    return {
      status: ExpenseStatus.PENDIENTE,
      alertas: [
        {
          codigo: 'LIMITE_ANTIGUEDAD',
          mensaje: `Gasto excede los ${pendiente_dias} días. Requiere revisión.`,
        },
      ],
    };
  }

  return {
    status: ExpenseStatus.RECHAZADO,
    alertas: [
      {
        codigo: 'LIMITE_ANTIGUEDAD',
        mensaje: `Gasto tiene ${diasDiff} días. Excede el límite máximo de ${rechazado_dias} días.`,
      },
    ],
  };
}
