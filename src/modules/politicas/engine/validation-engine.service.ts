import { Injectable } from '@nestjs/common';
import { Gasto } from '../../../shared/interfaces/gasto.interface';
import { Empleado } from '../../../shared/interfaces/empleado.interface';
import { Politica } from '../../../shared/interfaces/politica.interface';
import { ValidationResult } from '../../../shared/interfaces/validation-result.interface';
import { ExchangeRateService } from '../../exchange-rate/exchange-rate.service';
import { validarGasto } from './validation-engine';

@Injectable()
export class ValidationEngineService {
  constructor(private readonly exchangeRateService: ExchangeRateService) {}

  async validar(gasto: Gasto, empleado: Empleado, politica: Politica): Promise<ValidationResult> {
    const gastoConvertido = await this.convertirAMonedaBase(gasto, politica.moneda_base);
    return validarGasto(gastoConvertido, empleado, politica);
  }

  private async convertirAMonedaBase(gasto: Gasto, monedaBase: string): Promise<Gasto> {
    if (gasto.moneda === monedaBase) {
      return gasto;
    }

    const montoConvertido = await this.exchangeRateService.convert(
      gasto.monto,
      gasto.moneda,
      monedaBase,
      gasto.fecha,
    );

    return {
      ...gasto,
      monto: Math.round(montoConvertido * 100) / 100,
      moneda: monedaBase,
    };
  }
}
