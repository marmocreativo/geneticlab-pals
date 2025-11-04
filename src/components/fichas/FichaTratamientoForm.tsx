// src/components/fichas/FichaTratamientoForm.tsx

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { FichaTratamientoFormData } from '@/types/fichaTratamiento';
import { useCatalogos } from '@/hooks/useCatalogos';
import { Calendar, Pill, User, X } from 'lucide-react';

interface FichaTratamientoFormProps {
  onSubmit: (data: FichaTratamientoFormData) => Promise<void>;
  onCancel: () => void;
  initialData?: Partial<FichaTratamientoFormData>;
  contactoId?: string;
  institucionId?: string;
}

export function FichaTratamientoForm({
  onSubmit,
  onCancel,
  initialData,
  contactoId,
  institucionId,
}: FichaTratamientoFormProps) {
  const [submitting, setSubmitting] = useState(false);
  const { catalogos } = useCatalogos();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FichaTratamientoFormData>({
    defaultValues: {
      contacto_id: contactoId || initialData?.contacto_id || '',
      nombre_paciente: initialData?.nombre_paciente || '',
      nombre_medico: initialData?.nombre_medico || '',
      institucion_id: institucionId || initialData?.institucion_id || '',
      sector_id: initialData?.sector_id || '',
      diagnostico_id: initialData?.diagnostico_id || '',
      terapia_id: initialData?.terapia_id || '',
      dosis: initialData?.dosis || '',
      periodicidad: initialData?.periodicidad || 'semanal',
      fecha_inicio: initialData?.fecha_inicio || '',
      fecha_fin: initialData?.fecha_fin || '',
    },
  });

  const periodicidad = watch('periodicidad');
  const fechaInicio = watch('fecha_inicio');
  const fechaFin = watch('fecha_fin');

  // Calcular número aproximado de citas
  const calcularCitas = () => {
    if (!fechaInicio || !fechaFin) return 0;
    
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);
    const diferenciaDias = Math.floor((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24));
    
    const incremento = periodicidad === 'semanal' ? 7 : 14;
    const citas = Math.floor(diferenciaDias / incremento) + 1;
    
    return Math.min(citas, 20); // Máximo 20
  };

    const handleFormSubmit = async (data: FichaTratamientoFormData) => {
        setSubmitting(true);
        try {
            console.log('📝 Datos del formulario RAW:', data);
            
            // Limpiar los campos opcionales antes de enviar
            const cleanedData: FichaTratamientoFormData = {
            ...data,
            sector_id: data.sector_id && data.sector_id.trim() !== '' ? data.sector_id : undefined,
            diagnostico_id: data.diagnostico_id && data.diagnostico_id.trim() !== '' ? data.diagnostico_id : undefined,
            terapia_id: data.terapia_id && data.terapia_id.trim() !== '' ? data.terapia_id : undefined,
            dosis: data.dosis && data.dosis.trim() !== '' ? data.dosis : undefined,
            };
            
            console.log('✅ Datos LIMPIADOS:', cleanedData);
            
            await onSubmit(cleanedData);
        } finally {
            setSubmitting(false);
        }
        };

  const sectores = catalogos.filter((c) => c.tipo === 'sector' && c.activo);
  const diagnosticos = catalogos.filter((c) => c.tipo === 'diagnostico' && c.activo);
  const terapias = catalogos.filter((c) => c.tipo === 'terapia' && c.activo);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Pill className="h-5 w-5" />
          {initialData ? 'Editar Ficha de Tratamiento' : 'Nueva Ficha de Tratamiento'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Información del Paciente */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              Datos del Paciente
            </h3>
            
            <div>
              <Label htmlFor="nombre_paciente">Nombre del Paciente *</Label>
              <Input
                id="nombre_paciente"
                {...register('nombre_paciente', { required: 'Nombre requerido' })}
                placeholder="Nombre completo del paciente"
              />
              {errors.nombre_paciente && (
                <span className="text-sm text-red-500">{errors.nombre_paciente.message}</span>
              )}
            </div>
          </div>

          {/* Información del Médico */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <User className="h-4 w-4" />
              Datos del Médico
            </h3>
            
            <div>
              <Label htmlFor="nombre_medico">Nombre del Médico *</Label>
              <Input
                id="nombre_medico"
                {...register('nombre_medico', { required: 'Nombre requerido' })}
                placeholder="Nombre completo del médico"
              />
              {errors.nombre_medico && (
                <span className="text-sm text-red-500">{errors.nombre_medico.message}</span>
              )}
            </div>
          </div>

          {/* Información de Tratamiento */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Pill className="h-4 w-4" />
              Información del Tratamiento
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sector_id">Sector</Label>
                <Select
                  value={watch('sector_id')}
                  onValueChange={(value) => setValue('sector_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar sector" />
                  </SelectTrigger>
                  <SelectContent>
                    {sectores.map((sector) => (
                      <SelectItem key={sector.id} value={sector.id}>
                        {sector.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="diagnostico_id">Diagnóstico</Label>
                <Select
                  value={watch('diagnostico_id')}
                  onValueChange={(value) => setValue('diagnostico_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar diagnóstico" />
                  </SelectTrigger>
                  <SelectContent>
                    {diagnosticos.map((diag) => (
                      <SelectItem key={diag.id} value={diag.id}>
                        {diag.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="terapia_id">Terapia</Label>
                <Select
                  value={watch('terapia_id')}
                  onValueChange={(value) => setValue('terapia_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar terapia" />
                  </SelectTrigger>
                  <SelectContent>
                    {terapias.map((terapia) => (
                      <SelectItem key={terapia.id} value={terapia.id}>
                        {terapia.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="dosis">Dosis</Label>
                <Input
                  id="dosis"
                  {...register('dosis')}
                  placeholder="ej. 500mg"
                />
              </div>
            </div>
          </div>

          {/* Programación */}
        <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Programación de Citas
            </h3>

            {/* Primera fila - Solo periodicidad */}
            <div>
                <Label htmlFor="periodicidad">Periodicidad *</Label>
                <Select
                value={watch('periodicidad')}
                onValueChange={(value: 'semanal' | 'bisemanal') => setValue('periodicidad', value)}
                >
                <SelectTrigger>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="semanal">Semanal (cada 7 días)</SelectItem>
                    <SelectItem value="bisemanal">Bisemanal (cada 14 días)</SelectItem>
                </SelectContent>
                </Select>
            </div>

            {/* Segunda fila - Fechas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                <Label htmlFor="fecha_inicio">Fecha Inicio *</Label>
                <Input
                    id="fecha_inicio"
                    type="date"
                    {...register('fecha_inicio', { required: 'Fecha requerida' })}
                />
                {errors.fecha_inicio && (
                    <span className="text-sm text-red-500">{errors.fecha_inicio.message}</span>
                )}
                </div>

                <div>
                <Label htmlFor="fecha_fin">Fecha Fin *</Label>
                <Input
                    id="fecha_fin"
                    type="date"
                    {...register('fecha_fin', { required: 'Fecha requerida' })}
                />
                {errors.fecha_fin && (
                    <span className="text-sm text-red-500">{errors.fecha_fin.message}</span>
                )}
                </div>
            </div>

            {fechaInicio && fechaFin && (
                <div className="bg-blue-50 p-3 rounded-md text-sm">
                <p className="text-blue-700">
                    Se generarán aproximadamente <strong>{calcularCitas()}</strong> citas{' '}
                    ({periodicidad === 'semanal' ? 'semanales' : 'bisemanales'})
                </p>
                </div>
            )}
            </div>

          {/* Botones */}
          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Guardando...' : initialData ? 'Actualizar' : 'Crear Ficha'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}