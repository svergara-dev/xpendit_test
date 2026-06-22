import { ExpenseStatus } from '../../../shared/enums/status.enum';
import { Gasto } from '../../../shared/interfaces/gasto.interface';
import { Empleado } from '../../../shared/interfaces/empleado.interface';
import { Politica } from '../../../shared/interfaces/politica.interface';
import { ValidationResult } from '../../../shared/interfaces/validation-result.interface';
import { Alerta } from '../../../shared/interfaces/alerta.interface';
import { RuleResult } from './interfaces/rule-result.interface';
import { evaluarAntiguedad } from './rules/antiguedad.rule';
import { evaluarLimiteCategoria } from './rules/limite-categoria.rule';
import { evaluarReglaCentroCosto } from './rules/regla-centro-costo.rule';

export function validarGasto(
  gasto: Gasto,
  empleado: Empleado,
  politica: Politica,
): ValidationResult {
  if (gasto.monto < 0) {
    return {
      gasto_id: gasto.id,
      status: ExpenseStatus.RECHAZADO,
      alertas: [
        {
          codigo: 'MONTO_NEGATIVO',
          mensaje: `El monto ${gasto.monto} ${gasto.moneda} es inválido. No se permiten montos negativos.`,
        },
      ],
    };
  }

  if (new Date(gasto.fecha) > new Date()) {
    return {
      gasto_id: gasto.id,
      status: ExpenseStatus.RECHAZADO,
      alertas: [
        {
          codigo: 'FECHA_FUTURA',
          mensaje: `El gasto tiene una fecha futura (${gasto.fecha}). No se permiten gastos con fecha posterior a hoy.`,
        },
      ],
    };
  }

  const resultados: RuleResult[] = [];

  resultados.push(evaluarAntiguedad(gasto, politica));
  resultados.push(evaluarLimiteCategoria(gasto, politica));
  resultados.push(evaluarReglaCentroCosto(gasto, empleado, politica));

  const todasAlertas: Alerta[] = resultados.flatMap((r) => r.alertas);

  const tieneRechazado = resultados.some((r) => r.status === ExpenseStatus.RECHAZADO);
  const tienePendiente = resultados.some((r) => r.status === ExpenseStatus.PENDIENTE);
  const tieneAprobado = resultados.some((r) => r.status === ExpenseStatus.APROBADO);

  let statusFinal: ExpenseStatus;

  if (tieneRechazado) {
    statusFinal = ExpenseStatus.RECHAZADO;
  } else if (tienePendiente) {
    statusFinal = ExpenseStatus.PENDIENTE;
  } else if (tieneAprobado) {
    statusFinal = ExpenseStatus.APROBADO;
  } else {
    statusFinal = ExpenseStatus.PENDIENTE;
  }

  return {
    gasto_id: gasto.id,
    status: statusFinal,
    alertas: todasAlertas,
  };
}
