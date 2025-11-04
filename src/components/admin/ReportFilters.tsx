// src/components/admin/ReportFilters.tsx

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, RotateCcw } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export interface FiltrosReporte {
  fechaInicio?: string;
  fechaFin?: string;
  palId?: string;
  institucionId?: string;
  estado?: string;
  tipoContacto?: string;
}

interface ReportFiltersProps {
  onAplicarFiltros: (filtros: FiltrosReporte) => void;
  loading?: boolean;
}

interface Pal {
  id: string;
  nombre_completo: string;
}

interface Institucion {
  id: string;
  nombre: string;
}

const TODOS_VALUE = '__todos__';

export const ReportFilters = ({ onAplicarFiltros, loading }: ReportFiltersProps) => {
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [palId, setPalId] = useState(TODOS_VALUE);
  const [institucionId, setInstitucionId] = useState(TODOS_VALUE);
  const [estado, setEstado] = useState(TODOS_VALUE);
  const [tipoContacto, setTipoContacto] = useState(TODOS_VALUE);

  const [pals, setPals] = useState<Pal[]>([]);
  const [instituciones, setInstituciones] = useState<Institucion[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoadingData(true);

      const [palsResponse, institucionesResponse] = await Promise.all([
        supabase
          .from('users')
          .select('id, nombre_completo')
          .eq('role', 'pal')
          .eq('activo', true)
          .order('nombre_completo'),
        supabase
          .from('instituciones')
          .select('id, nombre')
          .order('nombre'),
      ]);

      if (palsResponse.data) {
        setPals(palsResponse.data);
      }

      if (institucionesResponse.data) {
        setInstituciones(institucionesResponse.data);
      }
    } catch (error) {
      console.error('Error cargando datos:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const aplicarFiltros = () => {
    const filtros: FiltrosReporte = {};

    if (fechaInicio) filtros.fechaInicio = fechaInicio;
    if (fechaFin) filtros.fechaFin = fechaFin;
    if (palId && palId !== TODOS_VALUE) filtros.palId = palId;
    if (institucionId && institucionId !== TODOS_VALUE) filtros.institucionId = institucionId;
    if (estado && estado !== TODOS_VALUE) filtros.estado = estado;
    if (tipoContacto && tipoContacto !== TODOS_VALUE) filtros.tipoContacto = tipoContacto;

    onAplicarFiltros(filtros);
  };

  const limpiarFiltros = () => {
    setFechaInicio('');
    setFechaFin('');
    setPalId(TODOS_VALUE);
    setInstitucionId(TODOS_VALUE);
    setEstado(TODOS_VALUE);
    setTipoContacto(TODOS_VALUE);
    onAplicarFiltros({});
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filtros Avanzados
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Fecha Inicio */}
          <div className="space-y-2">
            <Label htmlFor="fechaInicio">Fecha Inicio</Label>
            <Input
              id="fechaInicio"
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Fecha Fin */}
          <div className="space-y-2">
            <Label htmlFor="fechaFin">Fecha Fin</Label>
            <Input
              id="fechaFin"
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              disabled={loading}
            />
          </div>

          {/* PAL */}
          <div className="space-y-2">
            <Label htmlFor="pal">PAL</Label>
            <Select value={palId} onValueChange={setPalId} disabled={loading || loadingData}>
              <SelectTrigger id="pal">
                <SelectValue placeholder="Todos los PALs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS_VALUE}>Todos los PALs</SelectItem>
                {pals.map((pal) => (
                  <SelectItem key={pal.id} value={pal.id}>
                    {pal.nombre_completo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Institución */}
          <div className="space-y-2">
            <Label htmlFor="institucion">Institución</Label>
            <Select 
              value={institucionId} 
              onValueChange={setInstitucionId} 
              disabled={loading || loadingData}
            >
              <SelectTrigger id="institucion">
                <SelectValue placeholder="Todas las instituciones" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS_VALUE}>Todas las instituciones</SelectItem>
                {instituciones.map((inst) => (
                  <SelectItem key={inst.id} value={inst.id}>
                    {inst.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Estado */}
          <div className="space-y-2">
            <Label htmlFor="estado">Estado</Label>
            <Select value={estado} onValueChange={setEstado} disabled={loading}>
              <SelectTrigger id="estado">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS_VALUE}>Todos los estados</SelectItem>
                <SelectItem value="programado">Programado</SelectItem>
                <SelectItem value="confirmado">Confirmado</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tipo de Contacto */}
          <div className="space-y-2">
            <Label htmlFor="tipoContacto">Tipo de Contacto</Label>
            <Select value={tipoContacto} onValueChange={setTipoContacto} disabled={loading}>
              <SelectTrigger id="tipoContacto">
                <SelectValue placeholder="Todos los tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TODOS_VALUE}>Todos los tipos</SelectItem>
                <SelectItem value="presencial">Presencial</SelectItem>
                <SelectItem value="telefonico">Telefónico</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Botones */}
        <div className="flex gap-2 mt-4">
          <Button onClick={aplicarFiltros} disabled={loading} className="flex-1">
            Aplicar Filtros
          </Button>
          <Button 
            onClick={limpiarFiltros} 
            variant="outline"
            disabled={loading}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Limpiar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};