import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Catalogo, CatalogoInput, TipoCatalogo } from '@/types/catalogo';

export function useCatalogos(tipo?: TipoCatalogo) {
  const [catalogos, setCatalogos] = useState<Catalogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCatalogos();
  }, [tipo]);

  const fetchCatalogos = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let query = supabase
        .from('catalogos')
        .select('*')
        .eq('activo', true)
        .order('orden', { ascending: true });

      if (tipo) {
        query = query.eq('tipo', tipo);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setCatalogos(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar catálogos');
    } finally {
      setLoading(false);
    }
  };

  const createCatalogo = async (input: CatalogoInput) => {
    try {
      const { data, error: createError } = await supabase
        .from('catalogos')
        .insert(input)
        .select()
        .single();

      if (createError) throw createError;

      await fetchCatalogos();
      return { data, error: null };
    } catch (err) {
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Error al crear catálogo' 
      };
    }
  };

  const updateCatalogo = async (id: string, input: Partial<CatalogoInput>) => {
    try {
      const { data, error: updateError } = await supabase
        .from('catalogos')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (updateError) throw updateError;

      await fetchCatalogos();
      return { data, error: null };
    } catch (err) {
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Error al actualizar catálogo' 
      };
    }
  };

  const toggleActivo = async (id: string, activo: boolean) => {
    try {
      const { error: toggleError } = await supabase
        .from('catalogos')
        .update({ activo })
        .eq('id', id);

      if (toggleError) throw toggleError;

      await fetchCatalogos();
      return { error: null };
    } catch (err) {
      return { 
        error: err instanceof Error ? err.message : 'Error al cambiar estado' 
      };
    }
  };

  return {
    catalogos,
    loading,
    error,
    refetch: fetchCatalogos,
    createCatalogo,
    updateCatalogo,
    toggleActivo,
  };
}