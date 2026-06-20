import { ExpenseStatus } from '../enums/status.enum';
import { Alerta } from './alerta.interface';

export interface ValidationResult {
  gasto_id: string;
  status: ExpenseStatus;
  alertas: Alerta[];
}
