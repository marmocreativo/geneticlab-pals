import { supabase } from '@/lib/supabase';
import type { Catalogo } from '@/types/catalogo';

export const catalogosService = {
  async getAll() {
    const { data, error } = await supabase
      .from('catalogos')
      .select('*')
      .eq('activo', true)
      .order('orden');

    if (error) throw error;
    return data as Catalogo[];
  },

  async getByTipo(tipo: string) {
    const { data, error } = await supabase
      .from('catalogos')
      .select('*')
      .eq('tipo', tipo)
      .eq('activo', true)
      .order('orden');

    if (error) throw error;
    return data as Catalogo[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('catalogos')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Catalogo;
  },

  async create(catalogo: Omit<Catalogo, 'id' | 'created_at'>) {
    const { data, error } = await supabase
      .from('catalogos')
      .insert(catalogo)
      .select()
      .single();

    if (error) throw error;
    return data as Catalogo;
  },

  async update(id: string, catalogo: Partial<Catalogo>) {
    const { data, error } = await supabase
      .from('catalogos')
      .update(catalogo)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Catalogo;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('catalogos')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};