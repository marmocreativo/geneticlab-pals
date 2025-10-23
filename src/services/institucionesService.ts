import { supabase } from '@/lib/supabase';
import type { Institucion } from '@/types/institucion';

export const institucionesService = {
  async getAll() {
    const { data, error } = await supabase
      .from('instituciones')
      .select('*, catalogos!sector_id(id, nombre)')
      .order('nombre');

    if (error) throw error;
    return data as Institucion[];
  },

  async getBySector(sectorId: string) {
    const { data, error } = await supabase
      .from('instituciones')
      .select('*, catalogos!sector_id(id, nombre)')
      .eq('sector_id', sectorId)
      .order('nombre');

    if (error) throw error;
    return data as Institucion[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('instituciones')
      .select('*, catalogos!sector_id(id, nombre)')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Institucion;
  },

  async create(institucion: Omit<Institucion, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('instituciones')
      .insert(institucion)
      .select()
      .single();

    if (error) throw error;
    return data as Institucion;
  },

  async update(id: string, institucion: Partial<Institucion>) {
    const { data, error } = await supabase
      .from('instituciones')
      .update(institucion)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Institucion;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('instituciones')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};