export interface Politica {
  moneda_base: string;
  limite_antiguedad: {
    pendiente_dias: number;
    rechazado_dias: number;
  };
  limites_por_categoria: {
    [categoria: string]: {
      aprobado_hasta: number;
      pendiente_hasta: number;
    };
  };
  reglas_centro_costo: {
    cost_center: string;
    categoria_prohibida: string;
  }[];
}
