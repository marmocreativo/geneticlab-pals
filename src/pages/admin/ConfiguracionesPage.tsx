// src/pages/admin/ConfiguracionesPage.tsx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Settings, Save, Loader2 } from 'lucide-react';
import { configuracionesService } from '@/services/configuracionesService';
import type { Configuracion } from '@/types/configuracion';
import { toast } from 'sonner';

export default function ConfiguracionesPage() {
  const [configuraciones, setConfiguraciones] = useState<Configuracion[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [valores, setValores] = useState<Record<string, string>>({});

  useEffect(() => {
    cargarConfiguraciones();
  }, []);

  const cargarConfiguraciones = async () => {
    try {
      setLoading(true);
      const data = await configuracionesService.getAll();
      setConfiguraciones(data);
      
      // Inicializar valores
      const valoresIniciales: Record<string, string> = {};
      data.forEach(config => {
        valoresIniciales[config.id] = config.valor;
      });
      setValores(valoresIniciales);
    } catch (error) {
      toast.error('No se pudieron cargar las configuraciones');
    } finally {
      setLoading(false);
    }
  };

  const handleGuardar = async (config: Configuracion, nuevoValor: string) => {
    try {
      setSaving(true);
      await configuracionesService.update(config.id, nuevoValor);
      
      setConfiguraciones(prev =>
        prev.map(c => c.id === config.id ? { ...c, valor: nuevoValor } : c)
      );

      toast.success('Configuración actualizada correctamente');
    } catch (error) {
      toast.error('No se pudo guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  const handleChangeValor = (id: string, nuevoValor: string) => {
    setValores(prev => ({
      ...prev,
      [id]: nuevoValor
    }));
  };

  const renderInput = (config: Configuracion) => {
    const valor = valores[config.id] || '';

    if (config.tipo === 'boolean') {
      return (
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <Label htmlFor={config.clave}>{getLabelFromClave(config.clave)}</Label>
            {config.descripcion && (
              <p className="text-sm text-muted-foreground mt-1">{config.descripcion}</p>
            )}
          </div>
          <Switch
            id={config.clave}
            checked={valor === 'true'}
            onCheckedChange={(checked) => {
              const nuevoValor = checked ? 'true' : 'false';
              handleChangeValor(config.id, nuevoValor);
              handleGuardar(config, nuevoValor);
            }}
          />
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <Label htmlFor={config.clave}>{getLabelFromClave(config.clave)}</Label>
        {config.descripcion && (
          <p className="text-sm text-muted-foreground">{config.descripcion}</p>
        )}
        <div className="flex gap-2">
          <Input
            id={config.clave}
            type={config.tipo === 'numero' ? 'number' : 'text'}
            value={valor}
            onChange={(e) => handleChangeValor(config.id, e.target.value)}
            className="flex-1"
          />
          <Button
            onClick={() => handleGuardar(config, valor)}
            disabled={saving || valor === config.valor}
            size="sm"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    );
  };

  const getLabelFromClave = (clave: string): string => {
    const labels: Record<string, string> = {
      distancia_maxima_gps: 'Distancia máxima GPS (metros)',
      app_nombre: 'Nombre de la aplicación',
      permitir_contacto_sin_gps: 'Permitir contacto sin GPS',
      dias_recordatorio_tratamiento: 'Días de recordatorio'
    };
    return labels[clave] || clave;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Configuraciones</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuración del Sistema</CardTitle>
          <CardDescription>
            Administra las configuraciones generales de la aplicación
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {configuraciones.map((config) => (
            <div key={config.id}>
              {renderInput(config)}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}