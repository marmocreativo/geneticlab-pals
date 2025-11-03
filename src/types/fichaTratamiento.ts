// src/types/fichaTratamiento.ts

export interface FichaTratamiento {
  id: string;
  contacto_id: string;
  nombre_paciente: string;
  nombre_medico: string;
  institucion_id: string;
  sector_id: string | null;
  diagnostico_id: string | null;
  terapia_id: string | null;
  dosis: string | null;
  periodicidad: 'semanal' | 'bisemanal';
  fecha_inicio: string; // YYYY-MM-DD
  fecha_fin: string; // YYYY-MM-DD
  created_at?: string;
}

export interface FechaTratamiento {
  id: string;
  ficha_tratamiento_id: string;
  fecha_programada: string; // YYYY-MM-DD
  asistencia: boolean;
  notas: string | null;
  created_at?: string;
}

export interface FichaTratamientoFormData {
  contacto_id: string;
  nombre_paciente: string;
  nombre_medico: string;
  institucion_id: string;
  sector_id?: string | undefined;     
  diagnostico_id?: string | undefined;
  terapia_id?: string | undefined;    
  dosis?: string | undefined;         
  periodicidad: 'semanal' | 'bisemanal';
  fecha_inicio: string;
  fecha_fin: string;
}

export interface FichaTratamientoConRelaciones extends FichaTratamiento {
  contacto?: {
    id: string;
    pal_id: string;
  };
  institucion?: {
    id: string;
    nombre: string;
  };
  sector?: {
    id: string;
    nombre: string;
  };
  diagnostico?: {
    id: string;
    nombre: string;
  };
  terapia?: {
    id: string;
    nombre: string;
  };
  fechas_tratamiento?: FechaTratamiento[];
}