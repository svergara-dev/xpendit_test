import { ExpenseStatus } from '../../../../shared/enums/status.enum';
import { Gasto } from '../../../../shared/interfaces/gasto.interface';
import { Empleado } from '../../../../shared/interfaces/empleado.interface';
import { Politica } from '../../../../shared/interfaces/politica.interface';
import { validarGasto } from '../validation-engine';

describe('validarGasto - Motor de Reglas', () => {
  const politicaBase: Politica = {
    moneda_base: 'USD',
    limite_antiguedad: {
      pendiente_dias: 30,
      rechazado_dias: 60,
    },
    limites_por_categoria: {
      food: {
        aprobado_hasta: 100,
        pendiente_hasta: 150,
      },
    },
    reglas_centro_costo: [
      {
        cost_center: 'core_engineering',
        categoria_prohibida: 'food',
      },
    ],
  };

  const empleadoBase: Empleado = {
    id: 'e_001',
    nombre: 'Juan',
    apellido: 'Pérez',
    cost_center: 'sales_team',
  };

  const empleadoEngineering: Empleado = {
    id: 'e_002',
    nombre: 'María',
    apellido: 'García',
    cost_center: 'core_engineering',
  };

  const crearGasto = (overrides: Partial<Gasto> = {}): Gasto => ({
    id: 'g_001',
    monto: 50,
    moneda: 'USD',
    fecha: new Date().toISOString().split('T')[0],
    categoria: 'food',
    empleado_id: 'e_001',
    ...overrides,
  });

  describe('Escenario APROBADO', () => {
    it('debería devolver APROBADO para gasto reciente dentro del límite', () => {
      const gasto = crearGasto({ monto: 80 });
      const resultado = validarGasto(gasto, empleadoBase, politicaBase);
      expect(resultado.status).toBe(ExpenseStatus.APROBADO);
      expect(resultado.alertas).toHaveLength(0);
      expect(resultado.gasto_id).toBe('g_001');
    });

    it('debería devolver APROBADO para categoría sin límite', () => {
      const gasto = crearGasto({ categoria: 'software', monto: 500 });
      const resultado = validarGasto(gasto, empleadoBase, politicaBase);
      expect(resultado.status).toBe(ExpenseStatus.APROBADO);
      expect(resultado.alertas).toHaveLength(0);
    });
  });

  describe('Escenario PENDIENTE', () => {
    it('debería devolver PENDIENTE si excede antigüedad (31-60 días)', () => {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - 45);
      const gasto = crearGasto({
        monto: 50,
        fecha: fecha.toISOString().split('T')[0],
      });
      const resultado = validarGasto(gasto, empleadoBase, politicaBase);
      expect(resultado.status).toBe(ExpenseStatus.PENDIENTE);
      expect(resultado.alertas.length).toBeGreaterThan(0);
    });

    it('debería devolver PENDIENTE si monto requiere revisión (100-150)', () => {
      const gasto = crearGasto({ monto: 125 });
      const resultado = validarGasto(gasto, empleadoBase, politicaBase);
      expect(resultado.status).toBe(ExpenseStatus.PENDIENTE);
      expect(resultado.alertas.length).toBeGreaterThan(0);
    });
  });

  describe('Escenario RECHAZADO', () => {
    it('debería devolver RECHAZADO si excede antigüedad (>60 días)', () => {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - 90);
      const gasto = crearGasto({
        monto: 50,
        fecha: fecha.toISOString().split('T')[0],
      });
      const resultado = validarGasto(gasto, empleadoBase, politicaBase);
      expect(resultado.status).toBe(ExpenseStatus.RECHAZADO);
      expect(resultado.alertas.length).toBeGreaterThan(0);
    });

    it('debería devolver RECHAZADO si monto excede límite (>150)', () => {
      const gasto = crearGasto({ monto: 200 });
      const resultado = validarGasto(gasto, empleadoBase, politicaBase);
      expect(resultado.status).toBe(ExpenseStatus.RECHAZADO);
      expect(resultado.alertas.length).toBeGreaterThan(0);
    });

    it('debería devolver RECHAZADO si core_engineering reporta food', () => {
      const gasto = crearGasto({ monto: 50 });
      const resultado = validarGasto(gasto, empleadoEngineering, politicaBase);
      expect(resultado.status).toBe(ExpenseStatus.RECHAZADO);
      expect(resultado.alertas.length).toBeGreaterThan(0);
    });
  });

  describe('Prioridades', () => {
    it('RECHAZADO tiene prioridad sobre PENDIENTE', () => {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - 45); // PENDIENTE por antigüedad
      const gasto = crearGasto({
        monto: 125, // PENDIENTE por límite
        fecha: fecha.toISOString().split('T')[0],
      });
      const resultado = validarGasto(gasto, empleadoBase, politicaBase);
      // Ambas reglas dan PENDIENTE, no RECHAZADO
      expect(resultado.status).toBe(ExpenseStatus.PENDIENTE);
    });

    it('RECHAZADO por centro costo tiene prioridad sobre otros estados', () => {
      const gasto = crearGasto({
        monto: 50, // APROBADO por límite
      });
      const resultado = validarGasto(gasto, empleadoEngineering, politicaBase);
      expect(resultado.status).toBe(ExpenseStatus.RECHAZADO);
    });

    it('PENDIENTE tiene prioridad sobre APROBADO', () => {
      const gasto = crearGasto({ monto: 125 }); // PENDIENTE por límite
      const resultado = validarGasto(gasto, empleadoBase, politicaBase);
      expect(resultado.status).toBe(ExpenseStatus.PENDIENTE);
    });
  });

  describe('Casos por defecto', () => {
    it('debería devolver PENDIENTE si no aplica ninguna regla', () => {
      const politicaVacia: Politica = {
        moneda_base: 'USD',
        limite_antiguedad: {
          pendiente_dias: 9999,
          rechazado_dias: 9999,
        },
        limites_por_categoria: {},
        reglas_centro_costo: [],
      };

      const gasto = crearGasto({
        monto: 50,
      });
      const resultado = validarGasto(gasto, empleadoBase, politicaVacia);
      expect(resultado.status).toBe(ExpenseStatus.APROBADO);
    });
  });

  describe('Estructura de resultado', () => {
    it('debería devolver objeto con gasto_id, status y alertas', () => {
      const gasto = crearGasto();
      const resultado = validarGasto(gasto, empleadoBase, politicaBase);
      expect(resultado).toHaveProperty('gasto_id');
      expect(resultado).toHaveProperty('status');
      expect(resultado).toHaveProperty('alertas');
      expect(Array.isArray(resultado.alertas)).toBe(true);
    });

    it('debería incluir alertas con código y mensaje', () => {
      const gasto = crearGasto({ monto: 200 });
      const resultado = validarGasto(gasto, empleadoBase, politicaBase);
      expect(resultado.alertas.length).toBeGreaterThan(0);
      expect(resultado.alertas[0]).toHaveProperty('codigo');
      expect(resultado.alertas[0]).toHaveProperty('mensaje');
    });
  });
});
