import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlaceSearchInput } from './PlaceSearchInput';
import { catalogosService } from '@/services/catalogosService';
import type { Catalogo } from '@/types/catalogo';

const formSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  direccion: z.string().min(1, 'La dirección es requerida'),
  latitud: z.number(),
  longitud: z.number(),
  sector_id: z.string().optional(),
  google_place_id: z.string().nullable().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface InstitucionFormProps {
  initialData?: FormValues & { id?: string };
  onSubmit: (data: FormValues) => void;
  onCancel: () => void;
}

export function InstitucionForm({
  initialData,
  onSubmit,
  onCancel,
}: InstitucionFormProps) {
  const [sectores, setSectores] = useState<Catalogo[]>([]);
  const [showManualInput, setShowManualInput] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData ? {
      ...initialData,
      latitud: Number(initialData.latitud),
      longitud: Number(initialData.longitud),
      google_place_id: initialData.google_place_id ?? '',
    } : {
      nombre: '',
      direccion: '',
      latitud: 0,
      longitud: 0,
      sector_id: '',
      google_place_id: '',
    },
  });

  useEffect(() => {
    loadSectores();
  }, []);

  const loadSectores = async () => {
    try {
      const data = await catalogosService.getByTipo('sector');
      setSectores(data);
    } catch (error) {
      console.error('Error loading sectores:', error);
    }
  };

  const handlePlaceSelect = (place: google.maps.places.PlaceResult) => {
    if (place.geometry?.location && place.name && place.formatted_address) {
      form.setValue('nombre', place.name);
      form.setValue('direccion', place.formatted_address);
      form.setValue('latitud', place.geometry.location.lat());
      form.setValue('longitud', place.geometry.location.lng());
      form.setValue('google_place_id', place.place_id || '');
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((data) => {
        onSubmit(data)
      })} className="space-y-4">
        {!initialData && !showManualInput && (
          <div className="space-y-4">
            <PlaceSearchInput onPlaceSelect={handlePlaceSelect} />
            <div className="text-center">
              <Button
                type="button"
                variant="link"
                onClick={() => setShowManualInput(true)}
              >
                O ingresar manualmente
              </Button>
            </div>
          </div>
        )}

        {(showManualInput || initialData) && (
          <>
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Hospital General"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="direccion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dirección</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Av. Principal #123"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="latitud"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Latitud</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="any"
                        placeholder="19.432608"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="longitud"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Longitud</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="any"
                        placeholder="-99.133209"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="sector_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sector</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar sector" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {sectores.map((sector) => (
                        <SelectItem key={sector.id} value={sector.id}>
                          {sector.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit">
            {initialData ? 'Actualizar' : 'Crear'}
          </Button>
        </div>
      </form>
    </Form>
  );
}