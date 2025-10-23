// src/types/configuracion.ts
export interface Configuracion {
  id: string;
  clave: string;
  valor: string;
  tipo: 'numero' | 'texto' | 'boolean';
  descripcion: string | null;
  updated_at: string;
}

export type ConfiguracionValor = string | number | boolean;