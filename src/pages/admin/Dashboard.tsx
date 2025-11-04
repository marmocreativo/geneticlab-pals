// src/pages/admin/Dashboard.tsx

import { useState } from 'react';
import { useEstadisticas } from '@/hooks/useEstadisticas';
import { StatCards } from '@/components/admin/StatCards';
import { ContactosPorPalChart } from '@/components/admin/ContactosPorPalChart';
import { ContactosPorInstitucionChart } from '@/components/admin/ContactosPorInstitucionChart';
import { TiposContactoChart } from '@/components/admin/TiposContactoChart';
import { ContactosMapAdvanced } from '@/components/admin/ContactosMapAdvanced';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar, RotateCcw } from 'lucide-react';

export default function Dashboard() {
  const [fechaInicio, setFechaInicio] = useState<string>('');
  const [fechaFin, setFechaFin] = useState<string>('');
  const [filtrosAplicados, setFiltrosAplicados] = useState<{
    fechaInicio?: string;
    fechaFin?: string;
  }>({});

  const {
    estadisticasGenerales,
    contactosPorPal,
    contactosPorInstitucion,
    contactosPorTipo,
    loading,
    error,
  } = useEstadisticas(filtrosAplicados);

  const aplicarFiltros = () => {
    setFiltrosAplicados({
      fechaInicio: fechaInicio || undefined,
      fechaFin: fechaFin || undefined,
    });
  };

  const limpiarFiltros = () => {
    setFechaInicio('');
    setFechaFin('');
    setFiltrosAplicados({});
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600">Estadísticas y reportes del sistema</p>
      </div>

      {/* Filtros de Fecha */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="fechaInicio">Fecha Inicio</Label>
              <Input
                id="fechaInicio"
                type="date"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fechaFin">Fecha Fin</Label>
              <Input
                id="fechaFin"
                type="date"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
              />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={aplicarFiltros} className="flex-1">
                Aplicar
              </Button>
              <Button 
                onClick={limpiarFiltros} 
                variant="outline"
                size="icon"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mensaje de Error */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <p className="text-red-600">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Tarjetas de Estadísticas */}
      <StatCards estadisticas={estadisticasGenerales} loading={loading} />

      {/* Gráficas */}
      <div className="grid gap-6 md:grid-cols-2">
        <ContactosPorPalChart data={contactosPorPal} loading={loading} />
        <TiposContactoChart data={contactosPorTipo} loading={loading} />
      </div>

      <ContactosPorInstitucionChart data={contactosPorInstitucion} loading={loading} />

      {/* Mapa Avanzado de Contactos */}
      <ContactosMapAdvanced />
    </div>
  );
}