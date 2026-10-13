import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { PlaceSearchInput } from './PlaceSearchInput';
import { institucionesService } from '@/services/institucionesService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ESTADOS_MX, matchEstado } from '@/constants/estados';
import type { Institucion } from '@/types/institucion';

interface InstitucionQuickFormProps {
  onSuccess: (institucion: Institucion) => void;
  onCancel: () => void;
}

interface FormData {
  nombre: string;
  direccion: string;
  latitud: number;
  longitud: number;
  ciudad?: string;
  estado?: string;
  google_place_id?: string;
  photo_reference?: string;
}

export function InstitucionQuickForm({ onSuccess, onCancel }: InstitucionQuickFormProps) {
  const [loading, setLoading] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<google.maps.places.PlaceResult | null>(null);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormData>();

  const handlePlaceSelect = (place: google.maps.places.PlaceResult & { photo_reference?: string }) => {
    if (!place.geometry?.location) {
      toast.error('No se pudo obtener la ubicación del lugar');
      return;
    }

    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();

    let ciudad = ''
    let estado = ''
    if (place.address_components) {
      for (const component of place.address_components) {
        if (
          component.types.includes('locality') ||
          component.types.includes('sublocality_level_1') ||
          component.types.includes('administrative_area_level_2')
        ) {
          if (!ciudad) ciudad = component.long_name
        }
        if (component.types.includes('administrative_area_level_1')) {
          estado = matchEstado(component.long_name)
        }
      }
    }

    setSelectedPlace(place);
    setValue('nombre', place.name || '');
    setValue('direccion', place.formatted_address || '');
    setValue('latitud', lat);
    setValue('longitud', lng);
    setValue('google_place_id', place.place_id);
    setValue('photo_reference', place.photo_reference);
    setValue('ciudad', ciudad);
    setValue('estado', estado);

    toast.success('Datos cargados automáticamente');
  };

  const onSubmit = async (data: FormData) => {
    if (!data.estado) {
      toast.error('Selecciona el estado');
      return;
    }
    
    try {
      setLoading(true);
      const newInstitucion = await institucionesService.create({
        nombre: data.nombre,
        direccion: data.direccion,
        latitud: data.latitud,
        longitud: data.longitud,
        google_place_id: data.google_place_id,
        ciudad: data.ciudad,
        estado: data.estado,
      });
      toast.success('Institución creada exitosamente');
      onSuccess(newInstitucion);
    } catch (error) {
      console.error('Error al crear institución:', error);
      toast.error('Error al crear institución');
    } finally {
      setLoading(false);
    }
  };

  const nombre = watch('nombre');
  const direccion = watch('direccion');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Nueva Institución
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">

          <div className="space-y-2">
            <Label>Buscar Institución en Google Maps</Label>
            <PlaceSearchInput onPlaceSelect={handlePlaceSelect} />
            <p className="text-xs text-muted-foreground">
              Busca la institución para autocompletar los datos
            </p>
          </div>

          {selectedPlace && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3 flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-800">Lugar seleccionado</p>
                <p className="text-sm text-green-700">{selectedPlace.name}</p>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre *</Label>
            <Input
              {...register('nombre', { required: true })}
              placeholder="Nombre de la institución"
            />
            {errors.nombre && <p className="text-sm text-red-500">Campo requerido</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="direccion">Dirección *</Label>
            <Input
              {...register('direccion', { required: true })}
              placeholder="Dirección completa"
            />
            {errors.direccion && <p className="text-sm text-red-500">Campo requerido</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Estado *</Label>
              <Select
                value={watch('estado') || ''}
                onValueChange={(v) => setValue('estado', v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona el estado" />
                </SelectTrigger>
                <SelectContent>
                  {ESTADOS_MX.map((e) => (
                    <SelectItem key={e} value={e}>{e}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ciudad</Label>
              <Input
                {...register('ciudad')}
                readOnly
                className="bg-muted text-muted-foreground cursor-not-allowed"
                placeholder="Se carga automáticamente"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Latitud</Label>
              <Input
                {...register('latitud', { required: true, valueAsNumber: true })}
                readOnly
                className="bg-muted text-muted-foreground cursor-not-allowed"
                placeholder="Se carga automáticamente"
              />
              {errors.latitud && <p className="text-sm text-red-500">Campo requerido</p>}
            </div>
            <div className="space-y-2">
              <Label>Longitud</Label>
              <Input
                {...register('longitud', { required: true, valueAsNumber: true })}
                readOnly
                className="bg-muted text-muted-foreground cursor-not-allowed"
                placeholder="Se carga automáticamente"
              />
              {errors.longitud && <p className="text-sm text-red-500">Campo requerido</p>}
            </div>
          </div>

          {nombre && direccion && (
            <div className="bg-muted p-3 rounded-md space-y-0.5">
              <p className="text-sm font-medium">Vista previa</p>
              <p className="text-sm font-semibold">{nombre}</p>
              <p className="text-xs text-muted-foreground">{direccion}</p>
            </div>
          )}

        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : 'Crear Institución'}
        </Button>
      </div>
    </form>
  );
}