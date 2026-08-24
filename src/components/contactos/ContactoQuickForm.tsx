// components/contactos/ContactoQuickForm.tsx
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { User, Search, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { useVerificarContactoDuplicado, type TipoCoincidencia } from '@/hooks/useVerificarContactoDuplicado'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  tipo_contacto: z.enum(['medico', 'paciente', 'familiar', 'cuidador', 'enfermera', 'kam', 'otro'], {
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

// Heurística simple: primera palabra = nombre, penúltima = apellido paterno, última = apellido materno
function parsearNombreCompleto(nombreCompleto: string) {
  const palabras = nombreCompleto.trim().split(/\s+/).filter(Boolean)

  if (palabras.length === 0) return { nombre: '', apellido_pat: '', apellido_mat: '' }
  if (palabras.length === 1) return { nombre: palabras[0], apellido_pat: '', apellido_mat: '' }
  if (palabras.length === 2) return { nombre: palabras[0], apellido_pat: palabras[1], apellido_mat: '' }
  if (palabras.length === 3) return { nombre: palabras[0], apellido_pat: palabras[1], apellido_mat: palabras[2] }

  const apellido_mat = palabras[palabras.length - 1]
  const apellido_pat = palabras[palabras.length - 2]
  const nombre = palabras.slice(0, palabras.length - 2).join(' ')
  return { nombre, apellido_pat, apellido_mat }
}

function getTipoContactoLabel(tipo: string) {
  const labels: Record<string, string> = {
    'medico': 'Médico',
    'paciente': 'Paciente',
    'familiar': 'Familiar',
    'cuidador': 'Cuidador',
    'enfermera': 'Enfermero (a)',
    'kam': 'KAM',
    'otro': 'Otro'
  }
  return labels[tipo] || tipo
}

export function ContactoQuickForm({ institucionId, onSuccess, onCancel }: ContactoQuickFormProps) {
  const [loading, setLoading] = useState(false)
  const { user } = useAuth()
  const { verificar, verificando } = useVerificarContactoDuplicado()

  // Paso interno: buscar nombre -> mostrar coincidencias -> formulario
  const [step, setStep] = useState<'buscar' | 'formulario'>('buscar')
  const [nombreCompleto, setNombreCompleto] = useState('')
  const [resultado, setResultado] = useState<{ tipo: TipoCoincidencia; coincidencias: Contacto[] } | null>(null)
  const [datosIniciales, setDatosIniciales] = useState({ nombre: '', apellido_pat: '', apellido_mat: '' })

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

  const handleBuscar = async () => {
    if (!nombreCompleto.trim()) return
    const partes = parsearNombreCompleto(nombreCompleto)
    setDatosIniciales(partes)

    const res = await verificar({
      nombre: partes.nombre,
      apellido_pat: partes.apellido_pat,
      apellido_mat: partes.apellido_mat,
      institucion_id: institucionId ?? null,
    })

    setResultado(res)

    if (res.tipo === 'ninguna') {
      irAFormulario(partes)
    }
  }

  const irAFormulario = (partes: { nombre: string; apellido_pat: string; apellido_mat: string }) => {
    form.reset({
      tipo_contacto: 'paciente',
      nombre: partes.nombre,
      apellido_pat: partes.apellido_pat,
      apellido_mat: partes.apellido_mat,
      telefono: '',
      fecha_nacimiento: '',
      relacion_con_paciente: ''
    })
    setStep('formulario')
  }

  const handleUsarExistente = (contacto: Contacto) => {
    toast.success('Usando el contacto existente')
    onSuccess(contacto)
  }

  const onSubmit = async (data: ContactoFormData) => {
    if (!user?.id) return

    const contactoData: ContactoInsert = {
      ...data,
      pal_id: user.id,
      institucion_id: institucionId ?? null,
      apellido_pat: data.apellido_pat || undefined,
      apellido_mat: data.apellido_mat || undefined,
      telefono: data.telefono || undefined,
      fecha_nacimiento: data.fecha_nacimiento || undefined,
      relacion_con_paciente: data.relacion_con_paciente || undefined
    }

    try {
      setLoading(true)
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

  // ---------- Paso 1: buscar ----------
  if (step === 'buscar') {
    return (
      <div className="space-y-4">
        <h3 className="font-semibold flex items-center gap-2">
          <User className="h-5 w-5" />
          Asignar Contacto
        </h3>

        <div className="space-y-2">
          <label className="text-sm font-medium">Nombre completo</label>
          <div className="flex gap-2">
            <Input
              placeholder="Ej. Juan Pérez López"
              value={nombreCompleto}
              onChange={(e) => { setNombreCompleto(e.target.value); setResultado(null) }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleBuscar() } }}
            />
            <Button type="button" onClick={handleBuscar} disabled={verificando || !nombreCompleto.trim()}>
              <Search className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {verificando && (
          <p className="text-sm text-muted-foreground">Buscando coincidencias...</p>
        )}

        {resultado && resultado.tipo !== 'ninguna' && (
          <div className="border rounded-lg p-3 bg-amber-50 border-amber-200 space-y-2 overflow-hidden">
            <p className="text-sm font-medium text-amber-800">
              {resultado.tipo === 'exacta' ? 'Contacto encontrado' : 'Coincidencias encontradas'}
            </p>
            <div className="space-y-1.5">
              {resultado.coincidencias.map((c) => (
                <div key={c.id} className="p-2 rounded border bg-white text-sm space-y-2 overflow-hidden">
                  <div className="min-w-0 max-w-full">
                    <p className="font-medium truncate max-w-full">
                      {[c.nombre, c.apellido_pat, c.apellido_mat].filter(Boolean).join(' ')}
                    </p>
                    <p className="text-xs text-muted-foreground truncate max-w-full">
                      {getTipoContactoLabel(c.tipo_contacto)}
                      {c.institucion?.nombre ? ` • ${c.institucion.nombre}` : ' • Sin institución'}
                    </p>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => handleUsarExistente(c)}
                  >
                    Asignar {resultado.tipo === 'parcial' ? c.nombre : ''}
                  </Button>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => irAFormulario(datosIniciales)}
            >
              Quiero registrar un nuevo contacto de todas formas
            </Button>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </div>
    )
  }

  // ---------- Paso 2: formulario prepoblado ----------
  return (
    <div className="space-y-4">
      <h3 className="font-semibold flex items-center gap-2">
        <User className="h-5 w-5" />
        Nuevo Contacto
      </h3>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="-ml-2 text-xs text-muted-foreground"
        onClick={() => setStep('buscar')}
      >
        <ArrowLeft className="h-3 w-3 mr-1" />
        Volver a la búsqueda
      </Button>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    <SelectItem value="enfermera">Enfermero (a)</SelectItem>
                    <SelectItem value="kam">KAM</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

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

          <FormField
            control={form.control}
            name="telefono"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Teléfono</FormLabel>
                <FormControl>
                  <Input placeholder="Número de teléfono" type="tel" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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

          {(tipoContacto === 'familiar' || tipoContacto === 'cuidador') && (
            <FormField
              control={form.control}
              name="relacion_con_paciente"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Relación con Paciente</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Madre, Esposo, Hijo, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

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
    </div>
  )
}