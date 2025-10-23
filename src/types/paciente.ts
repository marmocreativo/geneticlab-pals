export interface Paciente {
  id: string;
  nombre_completo: string;
  telefono: string | null;
  numero_pm: string | null;
  created_at: string;
}

export interface PacienteFormData {
  nombre_completo: string;
  telefono?: string;
  numero_pm?: string;
}