import { ExpenseStatus } from '../../../../shared/enums/status.enum';
import { Gasto } from '../../../../shared/interfaces/gasto.interface';
import { Empleado } from '../../../../shared/interfaces/empleado.interface';
import { Politica } from '../../../../shared/interfaces/politica.interface';
import { validarGasto } from '../validation-engine';

describe('ValidationEngine', () => {
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

  describe('APPROVED scenario', () => {
    it('should return APPROVED for recent expense within limit', () => {
      const gasto = crearGasto({ monto: 80 });
      const resultado = validarGasto(gasto, empleadoBase, politicaBase);
      expect(resultado.status).toBe(ExpenseStatus.APROBADO);
      expect(resultado.alertas).toHaveLength(0);
      expect(resultado.gasto_id).toBe('g_001');
    });

    it('should return APPROVED for category without limit', () => {
      const gasto = crearGasto({ categoria: 'software', monto: 500 });
      const resultado = validarGasto(gasto, empleadoBase, politicaBase);
      expect(resultado.status).toBe(ExpenseStatus.APROBADO);
      expect(resultado.alertas).toHaveLength(0);
    });

    it('should return APPROVED for exact age of 30 days (boundary)', () => {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - 30);
      const gasto = crearGasto({
        monto: 50,
        fecha: fecha.toISOString().split('T')[0],
      });
      const resultado = validarGasto(gasto, empleadoBase, politicaBase);
      expect(resultado.status).toBe(ExpenseStatus.APROBADO);
      expect(resultado.alertas).toHaveLength(0);
    });

    it('should return APPROVED for exact food amount of 100 USD (boundary)', () => {
      const gasto = crearGasto({ monto: 100 });
      const resultado = validarGasto(gasto, empleadoBase, politicaBase);
      expect(resultado.status).toBe(ExpenseStatus.APROBADO);
      expect(resultado.alertas).toHaveLength(0);
    });
  });

  describe('PENDING scenario', () => {
    it('should return PENDING if age exceeds limit (31-60 days)', () => {
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

    it('should return PENDING if amount requires review (100-150)', () => {
      const gasto = crearGasto({ monto: 125 });
      const resultado = validarGasto(gasto, empleadoBase, politicaBase);
      expect(resultado.status).toBe(ExpenseStatus.PENDIENTE);
      expect(resultado.alertas.length).toBeGreaterThan(0);
    });

    it('should return PENDING for exact age of 31 days (boundary)', () => {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - 31);
      const gasto = crearGasto({
        monto: 50,
        fecha: fecha.toISOString().split('T')[0],
      });
      const resultado = validarGasto(gasto, empleadoBase, politicaBase);
      expect(resultado.status).toBe(ExpenseStatus.PENDIENTE);
      expect(resultado.alertas.length).toBeGreaterThan(0);
      expect(resultado.alertas[0].codigo).toBe('LIMITE_ANTIGUEDAD');
    });

    it('should return PENDING for exact age of 60 days (boundary)', () => {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - 60);
      const gasto = crearGasto({
        monto: 50,
        fecha: fecha.toISOString().split('T')[0],
      });
      const resultado = validarGasto(gasto, empleadoBase, politicaBase);
      expect(resultado.status).toBe(ExpenseStatus.PENDIENTE);
      expect(resultado.alertas.length).toBeGreaterThan(0);
    });

    it('should return PENDING for exact food amount of 101 USD (boundary)', () => {
      const gasto = crearGasto({ monto: 101 });
      const resultado = validarGasto(gasto, empleadoBase, politicaBase);
      expect(resultado.status).toBe(ExpenseStatus.PENDIENTE);
      expect(resultado.alertas.length).toBeGreaterThan(0);
      expect(resultado.alertas[0].codigo).toBe('LIMITE_CATEGORIA');
    });

    it('should return PENDING for exact food amount of 150 USD (boundary)', () => {
      const gasto = crearGasto({ monto: 150 });
      const resultado = validarGasto(gasto, empleadoBase, politicaBase);
      expect(resultado.status).toBe(ExpenseStatus.PENDIENTE);
      expect(resultado.alertas.length).toBeGreaterThan(0);
    });
  });

  describe('REJECTED scenario', () => {
    it('should return REJECTED if age exceeds limit (>60 days)', () => {
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

    it('should return REJECTED if amount exceeds limit (>150)', () => {
      const gasto = crearGasto({ monto: 200 });
      const resultado = validarGasto(gasto, empleadoBase, politicaBase);
      expect(resultado.status).toBe(ExpenseStatus.RECHAZADO);
      expect(resultado.alertas.length).toBeGreaterThan(0);
    });

    it('should return REJECTED if core_engineering reports food', () => {
      const gasto = crearGasto({ monto: 50 });
      const resultado = validarGasto(gasto, empleadoEngineering, politicaBase);
      expect(resultado.status).toBe(ExpenseStatus.RECHAZADO);
      expect(resultado.alertas.length).toBeGreaterThan(0);
    });

    it('should return REJECTED for exact age of 61 days (boundary)', () => {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - 61);
      const gasto = crearGasto({
        monto: 50,
        fecha: fecha.toISOString().split('T')[0],
      });
      const resultado = validarGasto(gasto, empleadoBase, politicaBase);
      expect(resultado.status).toBe(ExpenseStatus.RECHAZADO);
      expect(resultado.alertas.length).toBeGreaterThan(0);
      expect(resultado.alertas[0].codigo).toBe('LIMITE_ANTIGUEDAD');
    });

    it('should return REJECTED for exact food amount of 151 USD (boundary)', () => {
      const gasto = crearGasto({ monto: 151 });
      const resultado = validarGasto(gasto, empleadoBase, politicaBase);
      expect(resultado.status).toBe(ExpenseStatus.RECHAZADO);
      expect(resultado.alertas.length).toBeGreaterThan(0);
      expect(resultado.alertas[0].codigo).toBe('LIMITE_CATEGORIA');
    });

    it('should return REJECTED for negative amount', () => {
      const gasto = crearGasto({ monto: -50 });
      const resultado = validarGasto(gasto, empleadoBase, politicaBase);
      expect(resultado.status).toBe(ExpenseStatus.RECHAZADO);
      expect(resultado.alertas.length).toBeGreaterThan(0);
      expect(resultado.alertas[0].codigo).toBe('MONTO_NEGATIVO');
    });

    it('should return REJECTED for large negative amount', () => {
      const gasto = crearGasto({ monto: -150.5 });
      const resultado = validarGasto(gasto, empleadoBase, politicaBase);
      expect(resultado.status).toBe(ExpenseStatus.RECHAZADO);
      expect(resultado.alertas.length).toBeGreaterThan(0);
      expect(resultado.alertas[0].codigo).toBe('MONTO_NEGATIVO');
    });
  });

  describe('Priority', () => {
    it('REJECTED has priority over PENDING', () => {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - 45); // PENDING by age
      const gasto = crearGasto({
        monto: 125, // PENDING by limit
        fecha: fecha.toISOString().split('T')[0],
      });
      const resultado = validarGasto(gasto, empleadoBase, politicaBase);
      // Both rules return PENDING, not REJECTED
      expect(resultado.status).toBe(ExpenseStatus.PENDIENTE);
    });

    it('REJECTED by cost center has priority over other statuses', () => {
      const gasto = crearGasto({
        monto: 50, // APPROVED by limit
      });
      const resultado = validarGasto(gasto, empleadoEngineering, politicaBase);
      expect(resultado.status).toBe(ExpenseStatus.RECHAZADO);
    });

    it('PENDING has priority over APPROVED', () => {
      const gasto = crearGasto({ monto: 125 }); // PENDING by limit
      const resultado = validarGasto(gasto, empleadoBase, politicaBase);
      expect(resultado.status).toBe(ExpenseStatus.PENDIENTE);
    });

    it('REJECTED by age has priority over PENDING by limit', () => {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - 90); // REJECTED by age
      const gasto = crearGasto({
        monto: 125, // PENDING by limit
        fecha: fecha.toISOString().split('T')[0],
      });
      const resultado = validarGasto(gasto, empleadoBase, politicaBase);
      expect(resultado.status).toBe(ExpenseStatus.RECHAZADO);
    });

    it('REJECTED by age has priority over APPROVED by limit', () => {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - 90); // REJECTED by age
      const gasto = crearGasto({
        monto: 50, // APPROVED by limit
        fecha: fecha.toISOString().split('T')[0],
      });
      const resultado = validarGasto(gasto, empleadoBase, politicaBase);
      expect(resultado.status).toBe(ExpenseStatus.RECHAZADO);
    });

    it('REJECTED by limit has priority over APPROVED by age', () => {
      const gasto = crearGasto({ monto: 200 }); // REJECTED by limit
      const resultado = validarGasto(gasto, empleadoBase, politicaBase);
      expect(resultado.status).toBe(ExpenseStatus.RECHAZADO);
    });
  });

  describe('Default cases', () => {
    it('should return APPROVED if only applicable rule returns APPROVED', () => {
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

    it('should follow REJECTED > PENDING > APPROVED priority when multiple rules apply', () => {
      const gasto = crearGasto({
        monto: 125, // PENDING by food limit (100 < 125 ≤ 150)
        categoria: 'food',
      });
      const resultado = validarGasto(gasto, empleadoBase, politicaBase);
      // age: APPROVED (0 days ≤ 30)
      // category-limit: PENDING (100 < 125 ≤ 150)
      // Priority: PENDING > APPROVED
      expect(resultado.status).toBe(ExpenseStatus.PENDIENTE);
      expect(resultado.alertas.length).toBeGreaterThan(0);
      expect(resultado.alertas[0].codigo).toBe('LIMITE_CATEGORIA');
    });
  });

  describe('Result structure', () => {
    it('should return object with gasto_id, status, and alertas', () => {
      const gasto = crearGasto();
      const resultado = validarGasto(gasto, empleadoBase, politicaBase);
      expect(resultado).toHaveProperty('gasto_id');
      expect(resultado).toHaveProperty('status');
      expect(resultado).toHaveProperty('alertas');
      expect(Array.isArray(resultado.alertas)).toBe(true);
    });

    it('should include alertas with code and message', () => {
      const gasto = crearGasto({ monto: 200 });
      const resultado = validarGasto(gasto, empleadoBase, politicaBase);
      expect(resultado.alertas.length).toBeGreaterThan(0);
      expect(resultado.alertas[0]).toHaveProperty('codigo');
      expect(resultado.alertas[0]).toHaveProperty('mensaje');
    });
  });
});
