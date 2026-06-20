import { ExpenseStatus } from '../../../../shared/enums/status.enum';
import { Gasto } from '../../../../shared/interfaces/gasto.interface';
import { Politica } from '../../../../shared/interfaces/politica.interface';
import { RuleResult } from '../interfaces/rule-result.interface';

export function evaluarLimiteCategoria(gasto: Gasto, politica: Politica): RuleResult {
  const limite = politica.limites_por_categoria[gasto.categoria];

  if (!limite) {
    return { status: ExpenseStatus.APROBADO, alertas: [] };
  }

  if (gasto.monto <= limite.aprobado_hasta) {
    return { status: ExpenseStatus.APROBADO, alertas: [] };
  }

  if (gasto.monto <= limite.pendiente_hasta) {
    return {
      status: ExpenseStatus.PENDIENTE,
      alertas: [
        {
          codigo: 'LIMITE_CATEGORIA',
          mensaje: `Monto ${gasto.monto} ${gasto.moneda} requiere revisión para categoría '${gasto.categoria}'.`,
        },
      ],
    };
  }

  return {
    status: ExpenseStatus.RECHAZADO,
    alertas: [
      {
        codigo: 'LIMITE_CATEGORIA',
        mensaje: `Monto ${gasto.monto} ${gasto.moneda} excede límite aprobado para categoría '${gasto.categoria}'.`,
      },
    ],
  };
}
