// components/contactos/ContactoQuickForm.tsx
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

import { contactosService } from '@/services/contactosService'
import { useAuth } from '@/contexts/AuthContext'
import type { Contacto, ContactoInsert } from '@/types/contacto'

const contactoSchema = z.object({
  tipo_contacto: z.enum(['medico', 'paciente', 'familiar', 'cuidador', 'enfermera', 'enfermero', 'kam', 'otro'], {
    message: 'Selecciona el tipo de contacto'
  }),
  nombre: z.string().min(1, 'El nombre es requerido'),
  apellido_pat: z.string().optional(),
  apellido_mat: z.string().optional(),
  telefono: z.string().optional(),
  fecha_nacimiento: z.string().optional(),
  relacion_con_paciente: z.string().optional()
})

type ContactoFormData = z.infer<typeof contactoSchema>

interface ContactoQuickFormProps {
  institucionId?: string
  onSuccess: (contacto: Contacto) => void
  onCancel: () => void
}

export function ContactoQuickForm({ institucionId, onSuccess, onCancel }: ContactoQuickFormProps) {
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()

  const form = useForm<ContactoFormData>({
    resolver: zodResolver(contactoSchema),
    defaultValues: {
      tipo_contacto: 'paciente',
      nombre: '',
      apellido_pat: '',
      apellido_mat: '',
      telefono: '',
      fecha_nacimiento: '',
      relacion_con_paciente: ''
    }
  })

  const tipoContacto = form.watch('tipo_contacto')

  const onSubmit = async (data: ContactoFormData) => {
    if (!user?.id) return

    try {
      setLoading(true)
      
      const contactoData: ContactoInsert = {
        ...data,
        pal_id: user.id,
        institucion_id: institucionId ?? null,
        // Limpiar campos opcionales vacíos
        apellido_pat: data.apellido_pat || undefined,
        apellido_mat: data.apellido_mat || undefined,
        telefono: data.telefono || undefined,
        fecha_nacimiento: data.fecha_nacimiento || undefined,
        relacion_con_paciente: data.relacion_con_paciente || undefined
      }

      const newContacto = await contactosService.createContacto(contactoData)
      toast.success('Contacto creado exitosamente')
      onSuccess(newContacto)
    } catch (error) {
      console.error('Error al crear contacto:', error)
      toast.error('Error al crear contacto')
    } finally {
      setLoading(false)
    }
  }

  const getTipoContactoLabel = (tipo: string) => {
    const labels: Record<string, string> = {
      'medico': 'Médico',
      'paciente': 'Paciente',
      'familiar': 'Familiar',
      'cuidador': 'Cuidador',
      'enfermera': 'Enfermera',
      'enfermero': 'Enfermero',
      'kam': 'KAM',
      'otro': 'Otro'
    }
    return labels[tipo] || tipo
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Nuevo Contacto
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Tipo de contacto */}
            <FormField
              control={form.control}
              name="tipo_contacto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Contacto *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona el tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="medico">Médico</SelectItem>
                      <SelectItem value="paciente">Paciente</SelectItem>
                      <SelectItem value="familiar">Familiar</SelectItem>
                      <SelectItem value="cuidador">Cuidador</SelectItem>
                      <SelectItem value="enfermera">Enfermera</SelectItem>
                      <SelectItem value="enfermero">Enfermero</SelectItem>
                      <SelectItem value="kam">KAM</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Nombre */}
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre del contacto" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Apellidos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="apellido_pat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apellido Paterno</FormLabel>
                    <FormControl>
                      <Input placeholder="Apellido paterno" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="apellido_mat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Apellido Materno</FormLabel>
                    <FormControl>
                      <Input placeholder="Apellido materno" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Teléfono */}
            <FormField
              control={form.control}
              name="telefono"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Número de teléfono" 
                      type="tel" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Fecha de nacimiento - solo para pacientes */}
            {tipoContacto === 'paciente' && (
              <FormField
                control={form.control}
                name="fecha_nacimiento"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha de Nacimiento</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Relación con paciente - solo para familiares y cuidadores */}
            {(tipoContacto === 'familiar' || tipoContacto === 'cuidador') && (
              <FormField
                control={form.control}
                name="relacion_con_paciente"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Relación con Paciente</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ej: Madre, Esposo, Hijo, etc." 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Vista previa */}
            {form.watch('nombre') && (
              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm font-medium">Vista previa:</p>
                <p className="text-sm text-muted-foreground mt-1">
                  <strong>
                    {[form.watch('nombre'), form.watch('apellido_pat'), form.watch('apellido_mat')]
                      .filter(Boolean)
                      .join(' ')}
                  </strong>
                </p>
                <p className="text-xs text-muted-foreground">
                  {getTipoContactoLabel(tipoContacto)}
                  {form.watch('telefono') && ` • ${form.watch('telefono')}`}
                </p>
              </div>
            )}

            {/* Botones */}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Guardando...' : 'Crear Contacto'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}