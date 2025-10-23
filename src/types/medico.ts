export interface Medico {
  id: string;
  nombre_completo: string;
  telefono: string | null;
  numero_pm: string | null;
  especialidad: string | null;
  created_at: string;
}

export interface MedicoFormData {
  nombre_completo: string;
  telefono?: string;
  numero_pm?: string;
  especialidad?: string;
}