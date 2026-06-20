import { ExpenseStatus } from '../../../../../shared/enums/status.enum';
import { Gasto } from '../../../../../shared/interfaces/gasto.interface';
import { Empleado } from '../../../../../shared/interfaces/empleado.interface';
import { Politica } from '../../../../../shared/interfaces/politica.interface';
import { evaluarReglaCentroCosto } from '../regla-centro-costo.rule';

describe('evaluarReglaCentroCosto', () => {
  const politicaBase: Politica = {
    moneda_base: 'USD',
    limite_antiguedad: {
      pendiente_dias: 30,
      rechazado_dias: 60,
    },
    limites_por_categoria: {},
    reglas_centro_costo: [
      {
        cost_center: 'core_engineering',
        categoria_prohibida: 'food',
      },
    ],
  };

  const crearEmpleado = (cost_center: string): Empleado => ({
    id: 'e_001',
    nombre: 'Juan',
    apellido: 'Pérez',
    cost_center,
  });

  const crearGasto = (categoria: string): Gasto => ({
    id: 'g_001',
    monto: 50,
    moneda: 'USD',
    fecha: '2025-01-01',
    categoria,
    empleado_id: 'e_001',
  });

  it('debería devolver RECHAZADO si core_engineering intenta reportar food', () => {
    const empleado = crearEmpleado('core_engineering');
    const gasto = crearGasto('food');
    const resultado = evaluarReglaCentroCosto(gasto, empleado, politicaBase);
    expect(resultado.status).toBe(ExpenseStatus.RECHAZADO);
    expect(resultado.alertas).toHaveLength(1);
    expect(resultado.alertas[0].codigo).toBe('POLITICA_CENTRO_COSTO');
    expect(resultado.alertas[0].mensaje).toContain('core_engineering');
    expect(resultado.alertas[0].mensaje).toContain('food');
  });

  it('debería devolver APROBADO si core_engineering reporta transport', () => {
    const empleado = crearEmpleado('core_engineering');
    const gasto = crearGasto('transport');
    const resultado = evaluarReglaCentroCosto(gasto, empleado, politicaBase);
    expect(resultado.status).toBe(ExpenseStatus.APROBADO);
    expect(resultado.alertas).toHaveLength(0);
  });

  it('debería devolver APROBADO si sales_team reporta food', () => {
    const empleado = crearEmpleado('sales_team');
    const gasto = crearGasto('food');
    const resultado = evaluarReglaCentroCosto(gasto, empleado, politicaBase);
    expect(resultado.status).toBe(ExpenseStatus.APROBADO);
    expect(resultado.alertas).toHaveLength(0);
  });

  it('debería devolver APROBADO si sales_team reporta software', () => {
    const empleado = crearEmpleado('sales_team');
    const gasto = crearGasto('software');
    const resultado = evaluarReglaCentroCosto(gasto, empleado, politicaBase);
    expect(resultado.status).toBe(ExpenseStatus.APROBADO);
    expect(resultado.alertas).toHaveLength(0);
  });

  it('debería funcionar con múltiples reglas', () => {
    const politicaMulti: Politica = {
      ...politicaBase,
      reglas_centro_costo: [
        { cost_center: 'core_engineering', categoria_prohibida: 'food' },
        { cost_center: 'marketing', categoria_prohibida: 'software' },
      ],
    };

    const empleado1 = crearEmpleado('core_engineering');
    const gasto1 = crearGasto('food');
    expect(evaluarReglaCentroCosto(gasto1, empleado1, politicaMulti).status).toBe(
      ExpenseStatus.RECHAZADO,
    );

    const empleado2 = crearEmpleado('marketing');
    const gasto2 = crearGasto('software');
    expect(evaluarReglaCentroCosto(gasto2, empleado2, politicaMulti).status).toBe(
      ExpenseStatus.RECHAZADO,
    );

    const empleado3 = crearEmpleado('marketing');
    const gasto3 = crearGasto('food');
    expect(evaluarReglaCentroCosto(gasto3, empleado3, politicaMulti).status).toBe(
      ExpenseStatus.APROBADO,
    );
  });
});
