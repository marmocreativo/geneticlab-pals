export type TipoCatalogo =
  | 'diagnostico'
  | 'terapia'
  | 'sector'
  | 'kit_rash'
  | 'torre_control'
  | 'descripcion_actividad'
  | 'temas_impartidos'
  | 'entrega_sobres';

export interface Catalogo {
  id: string;
  tipo: TipoCatalogo;
  nombre: string;
  activo: boolean;
  orden: number;
  created_at: string;
}

export interface CatalogoInput {
  tipo: TipoCatalogo;
  nombre: string;
  orden?: number;
}