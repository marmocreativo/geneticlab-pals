import { supabase } from '@/lib/supabase';

export interface Paciente {
  id: string;
  nombre_completo: string;
  telefono: string | null;
  numero_pm: string | null;
  created_at: string;
}

export interface PacienteInput {
  nombre_completo: string;
  telefono?: string;
  numero_pm?: string;
}

export const pacientesService = {
  async getAll() {
    const { data, error } = await supabase
      .from('pacientes')
      .select('*')
      .order('nombre_completo', { ascending: true });

    if (error) throw error;
    return data as Paciente[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('pacientes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Paciente;
  },

  async create(paciente: PacienteInput) {
    const { data, error } = await supabase
      .from('pacientes')
      .insert([paciente])
      .select()
      .single();

    if (error) throw error;
    return data as Paciente;
  },

  async update(id: string, paciente: Partial<PacienteInput>) {
    const { data, error } = await supabase
      .from('pacientes')
      .update(paciente)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Paciente;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('pacientes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async search(query: string) {
    const { data, error } = await supabase
      .from('pacientes')
      .select('*')
      .or(`nombre_completo.ilike.%${query}%,numero_pm.ilike.%${query}%,telefono.ilike.%${query}%`)
      .order('nombre_completo', { ascending: true });

    if (error) throw error;
    return data as Paciente[];
  }
};