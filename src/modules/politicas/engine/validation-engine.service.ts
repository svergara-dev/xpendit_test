import { Injectable } from '@nestjs/common';
import { Gasto } from '../../../shared/interfaces/gasto.interface';
import { Empleado } from '../../../shared/interfaces/empleado.interface';
import { Politica } from '../../../shared/interfaces/politica.interface';
import { ValidationResult } from '../../../shared/interfaces/validation-result.interface';
import { validarGasto } from './validation-engine';

@Injectable()
export class ValidationEngineService {
  validar(gasto: Gasto, empleado: Empleado, politica: Politica): ValidationResult {
    return validarGasto(gasto, empleado, politica);
  }
}
