export type TipoContactoCon = 'medico' | 'enfermera' | 'cuidador' | 'paciente';
export type TipoContacto = 'presencial' | 'telefonico';
export type EstadoContacto = 'programado' | 'confirmado' | 'cancelado';

export interface Contacto {
  id: string;
  pal_id: string;
  institucion_id: string;
  fecha_contacto: string;
  contacto_con?: TipoContactoCon;
  nombre?: string;
  apellido_paterno?: string;
  apellido_materno?: string;
  telefono?: string;
  numero_pm?: string;
  tipo_contacto?: TipoContacto;
  entrega_sobres_id?: string;
  entrega_kit_rash_id?: string;
  torre_control_id?: string;
  descripcion_actividad_id?: string;
  tema_impartido_id?: string; // Cambiado a singular
  validacion_gps: boolean;
  latitud_registro?: number;
  longitud_registro?: number;
  distancia_metros?: number;
  estado: EstadoContacto;
  confirmado_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ContactoFormData {
  institucion_id: string;
  fecha_contacto: string;
  contacto_con?: TipoContactoCon;
  nombre?: string;
  apellido_paterno?: string;
  apellido_materno?: string;
  telefono?: string;
  numero_pm?: string;
  tipo_contacto?: TipoContacto;
}

export interface ContactoConfirmData {
  contacto_con?: TipoContactoCon;
  nombre?: string;
  apellido_paterno?: string;
  apellido_materno?: string;
  telefono?: string;
  numero_pm?: string;
  tipo_contacto?: TipoContacto;
  entrega_sobres_id?: string;
  entrega_kit_rash_id?: string;
  torre_control_id?: string;
  descripcion_actividad_id?: string;
  tema_impartido_id?: string;
  fotos?: File[];
}

export interface FotoEvidencia {
  id: string;
  contacto_id: string;
  url_storage: string;
  created_at: string;
}