import { ExpenseStatus } from '../../../../shared/enums/status.enum';
import { Alerta } from '../../../../shared/interfaces/alerta.interface';

export interface RuleResult {
  status: ExpenseStatus;
  alertas: Alerta[];
}
