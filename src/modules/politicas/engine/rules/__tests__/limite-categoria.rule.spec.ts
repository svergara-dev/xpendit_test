import { ExpenseStatus } from '../../../../../shared/enums/status.enum';
import { Gasto } from '../../../../../shared/interfaces/gasto.interface';
import { Politica } from '../../../../../shared/interfaces/politica.interface';
import { evaluarLimiteCategoria } from '../limite-categoria.rule';

describe('evaluarLimiteCategoria', () => {
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
      transport: {
        aprobado_hasta: 200,
        pendiente_hasta: 200,
      },
    },
    reglas_centro_costo: [],
  };

  const crearGasto = (monto: number, categoria: string): Gasto => ({
    id: 'g_001',
    monto,
    moneda: 'USD',
    fecha: '2025-01-01',
    categoria,
    empleado_id: 'e_001',
  });

  describe('categoría "food"', () => {
    it('debería devolver APROBADO si monto es 50 (≤ 100)', () => {
      const gasto = crearGasto(50, 'food');
      const resultado = evaluarLimiteCategoria(gasto, politicaBase);
      expect(resultado.status).toBe(ExpenseStatus.APROBADO);
      expect(resultado.alertas).toHaveLength(0);
    });

    it('debería devolver APROBADO si monto es 100 (exactamente)', () => {
      const gasto = crearGasto(100, 'food');
      const resultado = evaluarLimiteCategoria(gasto, politicaBase);
      expect(resultado.status).toBe(ExpenseStatus.APROBADO);
      expect(resultado.alertas).toHaveLength(0);
    });

    it('debería devolver PENDIENTE si monto es 125 (100 < 125 ≤ 150)', () => {
      const gasto = crearGasto(125, 'food');
      const resultado = evaluarLimiteCategoria(gasto, politicaBase);
      expect(resultado.status).toBe(ExpenseStatus.PENDIENTE);
      expect(resultado.alertas).toHaveLength(1);
      expect(resultado.alertas[0].codigo).toBe('LIMITE_CATEGORIA');
    });

    it('debería devolver PENDIENTE si monto es 150 (exactamente)', () => {
      const gasto = crearGasto(150, 'food');
      const resultado = evaluarLimiteCategoria(gasto, politicaBase);
      expect(resultado.status).toBe(ExpenseStatus.PENDIENTE);
      expect(resultado.alertas).toHaveLength(1);
    });

    it('debería devolver RECHAZADO si monto es 200 (> 150)', () => {
      const gasto = crearGasto(200, 'food');
      const resultado = evaluarLimiteCategoria(gasto, politicaBase);
      expect(resultado.status).toBe(ExpenseStatus.RECHAZADO);
      expect(resultado.alertas).toHaveLength(1);
      expect(resultado.alertas[0].codigo).toBe('LIMITE_CATEGORIA');
    });

    it('debería devolver RECHAZADO si monto es 1000', () => {
      const gasto = crearGasto(1000, 'food');
      const resultado = evaluarLimiteCategoria(gasto, politicaBase);
      expect(resultado.status).toBe(ExpenseStatus.RECHAZADO);
      expect(resultado.alertas).toHaveLength(1);
    });
  });

  describe('categoría "transport"', () => {
    it('debería devolver APROBADO si monto es 150 (≤ 200)', () => {
      const gasto = crearGasto(150, 'transport');
      const resultado = evaluarLimiteCategoria(gasto, politicaBase);
      expect(resultado.status).toBe(ExpenseStatus.APROBADO);
      expect(resultado.alertas).toHaveLength(0);
    });

    it('debería devolver RECHAZADO si monto es 250 (> 200)', () => {
      const gasto = crearGasto(250, 'transport');
      const resultado = evaluarLimiteCategoria(gasto, politicaBase);
      expect(resultado.status).toBe(ExpenseStatus.RECHAZADO);
      expect(resultado.alertas).toHaveLength(1);
    });
  });

  describe('categoría sin límite definido', () => {
    it('debería devolver APROBADO para categoría no definida', () => {
      const gasto = crearGasto(500, 'software');
      const resultado = evaluarLimiteCategoria(gasto, politicaBase);
      expect(resultado.status).toBe(ExpenseStatus.APROBADO);
      expect(resultado.alertas).toHaveLength(0);
    });
  });
});
