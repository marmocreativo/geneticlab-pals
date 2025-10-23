// src/services/configuracionesService.ts
import { supabase } from '@/lib/supabase';
import type { Configuracion } from '@/types/configuracion';

export const configuracionesService = {
  async getAll(): Promise<Configuracion[]> {
    const { data, error } = await supabase
      .from('configuraciones')
      .select('*')
      .order('clave');

    if (error) throw error;
    return data || [];
  },

  async update(id: string, valor: string): Promise<void> {
    const { error } = await supabase
      .from('configuraciones')
      .update({ 
        valor,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;
  },

  async getByKey(clave: string): Promise<Configuracion | null> {
    const { data, error } = await supabase
      .from('configuraciones')
      .select('*')
      .eq('clave', clave)
      .single();

    if (error) throw error;
    return data;
  }
};