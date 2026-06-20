import { ExpenseStatus } from '../../../../../shared/enums/status.enum';
import { Gasto } from '../../../../../shared/interfaces/gasto.interface';
import { Politica } from '../../../../../shared/interfaces/politica.interface';
import { evaluarAntiguedad } from '../antiguedad.rule';

describe('evaluarAntiguedad', () => {
  const politicaBase: Politica = {
    moneda_base: 'USD',
    limite_antiguedad: {
      pendiente_dias: 30,
      rechazado_dias: 60,
    },
    limites_por_categoria: {},
    reglas_centro_costo: [],
  };

  const crearGastoConDias = (dias: number): Gasto => {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - dias);
    return {
      id: 'g_001',
      monto: 50,
      moneda: 'USD',
      fecha: fecha.toISOString().split('T')[0],
      categoria: 'food',
      empleado_id: 'e_001',
    };
  };

  it('debería devolver APROBADO si el gasto tiene 0 días', () => {
    const gasto = crearGastoConDias(0);
    const resultado = evaluarAntiguedad(gasto, politicaBase);
    expect(resultado.status).toBe(ExpenseStatus.APROBADO);
    expect(resultado.alertas).toHaveLength(0);
  });

  it('debería devolver APROBADO si el gasto tiene 15 días', () => {
    const gasto = crearGastoConDias(15);
    const resultado = evaluarAntiguedad(gasto, politicaBase);
    expect(resultado.status).toBe(ExpenseStatus.APROBADO);
    expect(resultado.alertas).toHaveLength(0);
  });

  it('debería devolver APROBADO si el gasto tiene exactamente 30 días', () => {
    const gasto = crearGastoConDias(30);
    const resultado = evaluarAntiguedad(gasto, politicaBase);
    expect(resultado.status).toBe(ExpenseStatus.APROBADO);
    expect(resultado.alertas).toHaveLength(0);
  });

  it('debería devolver PENDIENTE si el gasto tiene 31 días', () => {
    const gasto = crearGastoConDias(31);
    const resultado = evaluarAntiguedad(gasto, politicaBase);
    expect(resultado.status).toBe(ExpenseStatus.PENDIENTE);
    expect(resultado.alertas).toHaveLength(1);
    expect(resultado.alertas[0].codigo).toBe('LIMITE_ANTIGUEDAD');
  });

  it('debería devolver PENDIENTE si el gasto tiene 45 días', () => {
    const gasto = crearGastoConDias(45);
    const resultado = evaluarAntiguedad(gasto, politicaBase);
    expect(resultado.status).toBe(ExpenseStatus.PENDIENTE);
    expect(resultado.alertas).toHaveLength(1);
  });

  it('debería devolver PENDIENTE si el gasto tiene exactamente 60 días', () => {
    const gasto = crearGastoConDias(60);
    const resultado = evaluarAntiguedad(gasto, politicaBase);
    expect(resultado.status).toBe(ExpenseStatus.PENDIENTE);
    expect(resultado.alertas).toHaveLength(1);
  });

  it('debería devolver RECHAZADO si el gasto tiene 61 días', () => {
    const gasto = crearGastoConDias(61);
    const resultado = evaluarAntiguedad(gasto, politicaBase);
    expect(resultado.status).toBe(ExpenseStatus.RECHAZADO);
    expect(resultado.alertas).toHaveLength(1);
    expect(resultado.alertas[0].codigo).toBe('LIMITE_ANTIGUEDAD');
  });

  it('debería devolver RECHAZADO si el gasto tiene 90 días', () => {
    const gasto = crearGastoConDias(90);
    const resultado = evaluarAntiguedad(gasto, politicaBase);
    expect(resultado.status).toBe(ExpenseStatus.RECHAZADO);
    expect(resultado.alertas).toHaveLength(1);
  });

  it('debería devolver RECHAZADO si el gasto tiene 365 días', () => {
    const gasto = crearGastoConDias(365);
    const resultado = evaluarAntiguedad(gasto, politicaBase);
    expect(resultado.status).toBe(ExpenseStatus.RECHAZADO);
    expect(resultado.alertas).toHaveLength(1);
  });

  it('debería funcionar con límites personalizados', () => {
    const politicaCustom: Politica = {
      ...politicaBase,
      limite_antiguedad: {
        pendiente_dias: 15,
        rechazado_dias: 30,
      },
    };

    const gasto15Dias = crearGastoConDias(15);
    expect(evaluarAntiguedad(gasto15Dias, politicaCustom).status).toBe(ExpenseStatus.APROBADO);

    const gasto16Dias = crearGastoConDias(16);
    expect(evaluarAntiguedad(gasto16Dias, politicaCustom).status).toBe(ExpenseStatus.PENDIENTE);

    const gasto31Dias = crearGastoConDias(31);
    expect(evaluarAntiguedad(gasto31Dias, politicaCustom).status).toBe(ExpenseStatus.RECHAZADO);
  });
});
