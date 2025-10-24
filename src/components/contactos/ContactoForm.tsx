import { useState, useEffect } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { ContactoFormData } from '@/types/contacto';
import type { Institucion } from '@/types/institucion';
import { institucionesService } from '@/services/institucionesService';
import { InstitucionQuickForm } from '@/components/instituciones/InstitucionQuickForm';
import { Calendar, MapPin, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface ContactoFormProps {
  onSubmit: (data: ContactoFormData) => Promise<void>;
  onCancel: () => void;
}

export function ContactoForm({ onSubmit, onCancel }: ContactoFormProps) {
  const [instituciones, setInstituciones] = useState<Institucion[]>([]);
  const [loading, setLoading] = useState(false);
  const [showInstitucionForm, setShowInstitucionForm] = useState(false);
  const [showOptionalFields, setShowOptionalFields] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ContactoFormData>({
    defaultValues: {
      fecha_contacto: new Date().toISOString().slice(0, 16),
      tipo_contacto: 'presencial',
    },
  });

  useEffect(() => {
    loadInstituciones();
  }, []);

  const loadInstituciones = async () => {
    try {
      const data = await institucionesService.getAll();
      setInstituciones(data);
    } catch (error) {
      toast.error('Error al cargar instituciones');
    }
  };

  const handleInstitucionCreated = (institucion: Institucion) => {
    setInstituciones((prev) => [...prev, institucion]);
    setValue('institucion_id', institucion.id);
    setShowInstitucionForm(false);
    toast.success('Institución agregada');
  };

  const onSubmitForm = async (data: ContactoFormData) => {
    try {
      setLoading(true);
      await onSubmit(data);
    } finally {
      setLoading(false);
    }
  };

  const institucionSeleccionada = watch('institucion_id');

  return (
    <>
      <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Programar Visita
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fecha_contacto">Fecha y Hora de Visita *</Label>
              <Input
                type="datetime-local"
                {...register('fecha_contacto', { required: true })}
              />
              {errors.fecha_contacto && (
                <p className="text-sm text-red-500">Campo requerido</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="institucion_id">Institución *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowInstitucionForm(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Nueva
                </Button>
              </div>
              <Select
                onValueChange={(value) => setValue('institucion_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar institución" />
                </SelectTrigger>
                <SelectContent>
                  {instituciones.map((inst) => (
                    <SelectItem key={inst.id} value={inst.id}>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {inst.nombre}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.institucion_id && (
                <p className="text-sm text-red-500">Campo requerido</p>
              )}
            </div>

            {institucionSeleccionada && (
              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm font-medium">Institución seleccionada:</p>
                <p className="text-sm text-muted-foreground">
                  {instituciones.find((i) => i.id === institucionSeleccionada)?.direccion}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowOptionalFields(!showOptionalFields)}
          >
            {showOptionalFields ? '− Ocultar' : '+ Agregar'} información adicional (opcional)
          </Button>
        </div>

        {showOptionalFields && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Información del Contacto (Opcional)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tipo_contacto">Tipo de Contacto</Label>
                    <Select
                      defaultValue="presencial"
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
                    <Label htmlFor="contacto_con">Contacto Con</Label>
                    <Select
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
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre</Label>
                    <Input {...register('nombre')} placeholder="Nombre" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="apellido_paterno">Apellido Paterno</Label>
                    <Input
                      {...register('apellido_paterno')}
                      placeholder="Apellido paterno"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="apellido_materno">Apellido Materno</Label>
                    <Input
                      {...register('apellido_materno')}
                      placeholder="Apellido materno"
                    />
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
          </>
        )}

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Guardando...' : 'Programar Visita'}
          </Button>
        </div>
      </form>

      <Dialog open={showInstitucionForm} onOpenChange={setShowInstitucionForm}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Agregar Nueva Institución</DialogTitle>
          </DialogHeader>
          <InstitucionQuickForm
            onSuccess={handleInstitucionCreated}
            onCancel={() => setShowInstitucionForm(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}