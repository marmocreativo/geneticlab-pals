import { useState, useEffect, useCallback } from 'react'; // ← Agregar useCallback
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
import { Badge } from '@/components/ui/badge';
import { GPSValidation } from './GPSValidation';
import type { ContactoConfirmData } from '@/types/contacto';
import type { Contacto } from '@/types/contacto';
import type { Catalogo } from '@/types/catalogo';
import type { ResultadoGPS } from '@/lib/geolocation';
import { useCatalogos } from '@/hooks/useCatalogos';
import { configuracionesService } from '@/services/configuracionesService';
import { Upload, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ContactoConfirmFormProps {
  contacto: Contacto;
  onSubmit: (data: ContactoConfirmData, fotos: File[]) => Promise<void>;
  onCancel: () => void;
}

export function ContactoConfirmForm({
  contacto,
  onSubmit,
  onCancel,
}: ContactoConfirmFormProps) {
  const [fotos, setFotos] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [datosModificados, setDatosModificados] = useState(false);
  const [distanciaMaxima, setDistanciaMaxima] = useState<number>(100);
  const [validacionGPS, setValidacionGPS] = useState<ResultadoGPS | null>(null);

  const { catalogos } = useCatalogos();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ContactoConfirmData>({
    defaultValues: {
      tipo_contacto: contacto.tipo_contacto || 'presencial',
      contacto_con: contacto.contacto_con,
      nombre: contacto.nombre,
      apellido_paterno: contacto.apellido_paterno,
      apellido_materno: contacto.apellido_materno,
      telefono: contacto.telefono,
      numero_pm: contacto.numero_pm,
    },
  });

  const tipoContacto = watch('tipo_contacto');
  const esPresencial = tipoContacto === 'presencial';

  // Cargar distancia máxima GPS
  useEffect(() => {
    const cargarDistancia = async () => {
      try {
        const distancia = await configuracionesService.getDistanciaMaximaGPS();
        setDistanciaMaxima(distancia);
      } catch (error) {
        console.error('Error al cargar distancia máxima:', error);
      }
    };
    cargarDistancia();
  }, []);

  // Detectar cambios en los datos originales
  useEffect(() => {
    const subscription = watch((value) => {
      const cambio =
        value.nombre !== contacto.nombre ||
        value.apellido_paterno !== contacto.apellido_paterno ||
        value.apellido_materno !== contacto.apellido_materno ||
        value.telefono !== contacto.telefono ||
        value.numero_pm !== contacto.numero_pm ||
        value.contacto_con !== contacto.contacto_con ||
        value.tipo_contacto !== contacto.tipo_contacto;

      setDatosModificados(cambio);
    });
    return () => subscription.unsubscribe();
  }, [watch, contacto]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFotos((prev) => [...prev, ...newFiles]);
    }
  };

  const removePhoto = (index: number) => {
    setFotos((prev) => prev.filter((_, i) => i !== index));
  };

  // ✅ SOLUCIÓN: Envolver con useCallback
  const handleValidacionGPS = useCallback((resultado: ResultadoGPS) => {
    setValidacionGPS(resultado);
  }, []);

  const onSubmitForm = async (data: ContactoConfirmData) => {
    // Validar GPS para contactos presenciales
    if (esPresencial) {
      if (!validacionGPS) {
        toast.error('Por favor espera a que se valide tu ubicación');
        return;
      }

      if (!validacionGPS.dentroRango) {
        toast.error('Debes estar dentro del rango permitido para confirmar la visita');
        return;
      }
    }

    try {
      setLoading(true);
      
      // Agregar datos de GPS si es presencial
      const dataConGPS = esPresencial && validacionGPS ? {
        ...data,
        validacion_gps: validacionGPS.dentroRango,
        latitud_registro: validacionGPS.coordenadas.latitud,
        longitud_registro: validacionGPS.coordenadas.longitud,
        distancia_metros: validacionGPS.distanciaMetros,
      } : data;

      await onSubmit(dataConGPS, fotos);
    } finally {
      setLoading(false);
    }
  };

  const getCatalogosByTipo = (tipo: string): Catalogo[] => {
    return catalogos.filter((c) => c.tipo === tipo && c.activo);
  };

  return (
    <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
      {datosModificados && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-800">
              Datos modificados
            </p>
            <p className="text-sm text-yellow-700">
              Los administradores serán notificados de los cambios realizados
            </p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Confirmar Visita
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-md space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Fecha programada:</span>
              <span className="font-medium">
                {new Date(contacto.fecha_contacto).toLocaleString('es-MX', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Estado:</span>
              <Badge variant="outline">{contacto.estado || 'Programado'}</Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo_contacto">Tipo de Contacto *</Label>
              <Select
                defaultValue={contacto.tipo_contacto || 'presencial'}
                onValueChange={(value) =>
                  setValue('tipo_contacto', value as 'presencial' | 'telefonico')
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="presencial">Presencial</SelectItem>
                  <SelectItem value="telefonico">Telefónico</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contacto_con">Contacto Con *</Label>
              <Select
                defaultValue={contacto.contacto_con}
                onValueChange={(value) => setValue('contacto_con', value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="medico">Médico</SelectItem>
                  <SelectItem value="enfermera">Enfermera</SelectItem>
                  <SelectItem value="cuidador">Cuidador</SelectItem>
                  <SelectItem value="paciente">Paciente</SelectItem>
                </SelectContent>
              </Select>
              {errors.contacto_con && (
                <p className="text-sm text-red-500">Campo requerido</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Validación GPS - Solo para contactos presenciales */}
      {esPresencial && contacto.instituciones && (
        <GPSValidation
          institucionCoordenadas={{
            latitud: contacto.instituciones.latitud,
            longitud: contacto.instituciones.longitud,
          }}
          institucionNombre={contacto.instituciones.nombre}
          distanciaMaxima={distanciaMaxima}
          onValidacionCompletada={handleValidacionGPS}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Datos del Contacto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                {...register('nombre', { required: true })}
                placeholder="Nombre"
              />
              {errors.nombre && (
                <p className="text-sm text-red-500">Campo requerido</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="apellido_paterno">Apellido Paterno *</Label>
              <Input
                {...register('apellido_paterno', { required: true })}
                placeholder="Apellido paterno"
              />
              {errors.apellido_paterno && (
                <p className="text-sm text-red-500">Campo requerido</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="apellido_materno">Apellido Materno *</Label>
              <Input
                {...register('apellido_materno', { required: true })}
                placeholder="Apellido materno"
              />
              {errors.apellido_materno && (
                <p className="text-sm text-red-500">Campo requerido</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                {...register('telefono')}
                placeholder="Teléfono"
                type="tel"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="numero_pm">Número PM</Label>
              <Input {...register('numero_pm')} placeholder="Número PM" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Información de la Visita</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Entrega de Sobres</Label>
              <Select
                onValueChange={(value) => setValue('entrega_sobres_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {getCatalogosByTipo('entrega_sobres').map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Entrega Kit RASH</Label>
              <Select
                onValueChange={(value) => setValue('entrega_kit_rash_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {getCatalogosByTipo('kit_rash').map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Torre de Control</Label>
              <Select
                onValueChange={(value) => setValue('torre_control_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {getCatalogosByTipo('torre_control').map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Descripción de Actividad</Label>
              <Select
                onValueChange={(value) =>
                  setValue('descripcion_actividad_id', value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {getCatalogosByTipo('descripcion_actividad').map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Tema Impartido</Label>
              <Select
                onValueChange={(value) => setValue('tema_impartido_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tema" />
                </SelectTrigger>
                <SelectContent>
                  {getCatalogosByTipo('temas_impartidos').map((tema) => (
                    <SelectItem key={tema.id} value={tema.id}>
                      {tema.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Fotos de Evidencia</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fotos" className="cursor-pointer">
              <div className="border-2 border-dashed rounded-md p-6 text-center hover:bg-gray-50">
                <Upload className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-600">
                  Click para subir fotos de evidencia
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Puedes subir múltiples fotos
                </p>
              </div>
            </Label>
            <Input
              id="fotos"
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {fotos.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {fotos.map((foto, index) => (
                <div key={index} className="relative">
                  <img
                    src={URL.createObjectURL(foto)}
                    alt={`Foto ${index + 1}`}
                    className="w-full h-32 object-cover rounded-md"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-1 right-1 h-6 w-6"
                    onClick={() => removePhoto(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Confirmando...' : 'Confirmar Visita'}
        </Button>
      </div>
    </form>
  );
}