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
      .maybeSingle(); // ← Cambiar de .single() a .maybeSingle()

    if (error) throw error;
    return data;
  },

  /**
   * Obtiene la distancia máxima permitida para validación GPS
   * @returns Distancia en metros (default: 100)
   */
  async getDistanciaMaximaGPS(): Promise<number> {
    try {
      const config = await this.getByKey('distancia_maxima_gps');
      
      if (!config) {
        console.warn('Configuración distancia_maxima_gps no encontrada, usando default 100m');
        return 100;
      }

      const distancia = parseInt(config.valor, 10);
      
      if (isNaN(distancia) || distancia <= 0) {
        console.warn('Valor de distancia_maxima_gps inválido, usando default 100m');
        return 100;
      }

      return distancia;
    } catch (error) {
      console.error('Error al obtener distancia máxima GPS:', error);
      return 100; // Default en caso de error
    }
  },
};