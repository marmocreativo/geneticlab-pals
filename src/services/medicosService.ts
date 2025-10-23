import { supabase } from '@/lib/supabase';

export interface Medico {
  id: string;
  nombre_completo: string;
  telefono: string | null;
  numero_pm: string | null;
  especialidad: string | null;
  created_at: string;
}

export interface MedicoInput {
  nombre_completo: string;
  telefono?: string;
  numero_pm?: string;
  especialidad?: string;
}

export const medicosService = {
  async getAll() {
    const { data, error } = await supabase
      .from('medicos')
      .select('*')
      .order('nombre_completo', { ascending: true });

    if (error) throw error;
    return data as Medico[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('medicos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Medico;
  },

  async create(medico: MedicoInput) {
    const { data, error } = await supabase
      .from('medicos')
      .insert([medico])
      .select()
      .single();

    if (error) throw error;
    return data as Medico;
  },

  async update(id: string, medico: Partial<MedicoInput>) {
    const { data, error } = await supabase
      .from('medicos')
      .update(medico)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Medico;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('medicos')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async search(query: string) {
    const { data, error } = await supabase
      .from('medicos')
      .select('*')
      .or(`nombre_completo.ilike.%${query}%,numero_pm.ilike.%${query}%,telefono.ilike.%${query}%`)
      .order('nombre_completo', { ascending: true });

    if (error) throw error;
    return data as Medico[];
  }
};