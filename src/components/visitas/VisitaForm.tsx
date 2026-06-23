// components/visitas/VisitaForm.tsx
import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Building, Star, ChevronDown, ChevronUp, Home } from 'lucide-react'
import { format } from 'date-fns'
import { useCatalogos } from '@/hooks/useCatalogos'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

import { useVisitas } from '@/hooks/useVisitas'
import { useInstituciones } from '@/hooks/useInstituciones'
import { useAuth } from '@/contexts/AuthContext'
import { InstitucionQuickForm } from '@/components/instituciones/InstitucionQuickForm'
import type { VisitaInsert } from '@/types/visita'
import type { Institucion } from '@/types/institucion'

const visitaSchema = z.object({
  institucion_id: z.string().optional(),
  fecha_visita: z.string().min(1, 'La fecha es requerida'),
  hora_visita: z.string().min(1, 'La hora es requerida'),
  es_home_office: z.boolean(),
}).refine(
  (data) => data.es_home_office || (data.institucion_id && data.institucion_id.length > 0),
  { message: 'Selecciona una institución', path: ['institucion_id'] }
)

type VisitaFormData = z.infer<typeof visitaSchema>

interface VisitaFormProps {
  defaultDate?: Date
  onSuccess?: () => void
  onCancel?: () => void
}

export default function VisitaForm({ defaultDate, onSuccess, onCancel }: VisitaFormProps) {

  const { catalogos: sectores } = useCatalogos('sector')
  const [loading, setLoading] = useState(false)
  const [showNewInstitucionForm, setShowNewInstitucionForm] = useState(false)
  const busquedaRef = useRef('')
  const estadoFiltroRef = useRef('')
  const ciudadFiltroRef = useRef('')
  const sectorFiltroRef = useRef('')
  const [busquedaActiva, setBusquedaActiva] = useState<{
    nombre: string
    estado: string
    ciudad: string
    sector: string
  }>({ nombre: '', estado: '', ciudad: '', sector: '' })
  const [mostrarAvanzada, setMostrarAvanzada] = useState(false)
  const [institucionOpen, setInstitucionOpen] = useState(false)

  const { createVisita } = useVisitas()
  const { instituciones, fetchInstituciones } = useInstituciones()
  const { user } = useAuth()

  const estadosUnicos = [...new Set(instituciones.map(i => i.estado).filter(Boolean))].sort()

  const form = useForm<VisitaFormData>({
    resolver: zodResolver(visitaSchema),
    defaultValues: {
      fecha_visita: defaultDate ? format(defaultDate, 'yyyy-MM-dd') : '',
      hora_visita: '09:00',
      es_home_office: false,
    }
  })


  const promedioVisitas = instituciones.length > 0
    ? instituciones.reduce((acc, i) => acc + (i.visitas_count ?? 0), 0) / instituciones.length
    : 0

const institucionesFiltradas = [...instituciones]
  .sort((a, b) => (b.visitas_count ?? 0) - (a.visitas_count ?? 0))
  .filter(i => {
    console.log('busquedaActiva:', busquedaActiva)
    console.log('i.ciudad:', i.ciudad, typeof i.ciudad)
    console.log('i.estado:', i.estado, typeof i.estado)
    console.log('i.sector_id:', i.sector_id, typeof i.sector_id)
    const matchNombre = busquedaActiva.nombre === '' ||
      i.nombre.toLowerCase().includes(busquedaActiva.nombre.toLowerCase()) ||
      i.direccion.toLowerCase().includes(busquedaActiva.nombre.toLowerCase())
    const matchEstado = busquedaActiva.estado === '' || (i.estado ?? '') === busquedaActiva.estado
    const matchCiudad = busquedaActiva.ciudad === '' ||
      (i.ciudad?.toLowerCase().includes(busquedaActiva.ciudad.toLowerCase()) ?? false)
    const matchSector = busquedaActiva.sector === '' || (i.sector_id ?? '') === busquedaActiva.sector
    return matchNombre && matchEstado && matchCiudad && matchSector
  })

  const handleBuscar = () => {
    setBusquedaActiva({
      nombre: busquedaRef.current,
      estado: estadoFiltroRef.current,
      ciudad: ciudadFiltroRef.current,
      sector: sectorFiltroRef.current
    })
  }

  const submitRef = useRef(false)

  const handleSubmit = async (data: VisitaFormData) => {
    if (submitRef.current) return
    submitRef.current = true
    if (!user?.id) return
    setLoading(true)
    try {
      const offsetMinutes = new Date().getTimezoneOffset()
      const offsetSign = offsetMinutes <= 0 ? '+' : '-'
      const absOffset = Math.abs(offsetMinutes)
      const tzOffset = `${offsetSign}${String(Math.floor(absOffset / 60)).padStart(2, '0')}:${String(absOffset % 60).padStart(2, '0')}`

      const visitaData: VisitaInsert = {
        pal_id: user.id,
        institucion_id: data.es_home_office ? null : data.institucion_id,
        fecha_visita: `${data.fecha_visita}T${data.hora_visita}:00${tzOffset}`,
        estado: data.es_home_office ? 'asistio' : 'programada',
        ...(data.es_home_office ? { validacion_gps: false, gps_dispositivo: false } : {})
      }

      await createVisita(visitaData)
      form.reset()
      onSuccess?.()
    } catch (error) {
      console.error('Error creating visita:', error)
    } finally {
      setLoading(false)
      submitRef.current = false
    }
  }

  const handleNewInstitucionSuccess = (institucion: Institucion) => {
    form.setValue('institucion_id', institucion.id)
    setShowNewInstitucionForm(false)
    fetchInstituciones()
  }

  if (showNewInstitucionForm) {
    return (
      <InstitucionQuickForm
        onSuccess={handleNewInstitucionSuccess}
        onCancel={() => setShowNewInstitucionForm(false)}
      />
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">

        {/* Fecha */}
        <FormField
          control={form.control}
          name="fecha_visita"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">Fecha</FormLabel>
              <FormControl>
                <Input type="date" className="h-9" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Hora */}
        <FormField
          control={form.control}
          name="hora_visita"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm">Hora</FormLabel>
              <FormControl>
                <Input type="time" className="h-9" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {/* Home Office */}
        <FormField
          control={form.control}
          name="es_home_office"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between rounded-md border px-3 py-2">
              <div className="flex items-center gap-2">
                <Home className="h-4 w-4 text-muted-foreground" />
                <FormLabel className="text-sm font-normal cursor-pointer">Home office</FormLabel>
              </div>
              <FormControl>
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(e) => {
                    field.onChange(e.target.checked)
                    if (e.target.checked) {
                      form.setValue('institucion_id', '')
                      setInstitucionOpen(false)
                    }
                  }}
                  className="h-4 w-4"
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Institución */}
        {!form.watch('es_home_office') && (
          <FormField
            control={form.control}
            name="institucion_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm">Institución</FormLabel>
                <div className="space-y-3 min-w-0">

                  {/* Trigger del collapse */}
                  <button
                    type="button"
                    onClick={() => setInstitucionOpen(v => !v)}
                    className="w-full flex items-center justify-between px-3 py-2 border rounded-md text-sm bg-background hover:bg-muted transition-colors h-9"
                  >
                    <span className={field.value ? 'text-foreground' : 'text-muted-foreground'}>
                      {field.value
                        ? instituciones.find(i => i.id === field.value)?.nombre ?? 'Seleccionar institución'
                        : 'Seleccionar institución'}
                    </span>
                    {institucionOpen
                      ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                      : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                  </button>

                  {/* Panel colapsable */}
                  {institucionOpen && (
                    <div className="border rounded-md overflow-hidden bg-background w-full min-w-0">
                      <div className="p-2 space-y-2 border-b bg-muted/30">
                        <div className="flex gap-1">
                          <Input
                            placeholder="Buscar por nombre..."
                            defaultValue=""
                            onChange={e => { busquedaRef.current = e.target.value }}
                            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleBuscar() } }}
                            className="h-8 text-sm flex-1"
                          />
                          <select
                            defaultValue=""
                            onChange={e => { estadoFiltroRef.current = e.target.value; handleBuscar() }}
                            className="h-8 text-xs border rounded px-1 bg-background w-20 shrink-0"
                          >
                            <option value="">Estado</option>
                            {estadosUnicos.map(estado => (
                              <option key={estado} value={estado}>{estado}</option>
                            ))}
                          </select>
                          <Button type="button" size="sm" className="h-8 px-2 shrink-0 text-xs" onClick={handleBuscar}>
                            Buscar
                          </Button>
                        </div>

                        <button
                          type="button"
                          className="text-xs text-muted-foreground hover:text-foreground w-full py-1 border rounded bg-background"
                          onClick={() => setMostrarAvanzada(v => !v)}
                        >
                          {mostrarAvanzada ? 'Ocultar filtros' : 'Búsqueda avanzada'}
                        </button>

                        {mostrarAvanzada && (
                          <div className="flex gap-1">
                            <Input
                              placeholder="Ciudad..."
                              defaultValue=""
                              onChange={e => { ciudadFiltroRef.current = e.target.value }}
                              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleBuscar() } }}
                              className="h-8 text-xs flex-1"
                            />
                            <select
                              defaultValue=""
                              onChange={e => { sectorFiltroRef.current = e.target.value; handleBuscar() }}
                              className="h-8 text-xs border rounded px-1 bg-background w-24 shrink-0"
                            >
                              <option value="">Sector</option>
                              {sectores.map(s => (
                                <option key={s.id} value={s.id}>{s.nombre}</option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>

                      <div className="overflow-y-auto" style={{ maxHeight: '240px' }}>
                        {institucionesFiltradas.length === 0 ? (
                          <p className="p-3 text-sm text-muted-foreground text-center">
                            No se encontraron instituciones
                          </p>
                        ) : (
                          institucionesFiltradas.map(institucion => (
                            <button
                              key={institucion.id}
                              type="button"
                              className="w-full flex items-start gap-2 px-3 py-2 hover:bg-muted text-left border-b last:border-0 transition-colors min-w-0"
                              onClick={() => {
                                field.onChange(institucion.id)
                                setInstitucionOpen(false)
                              }}
                            >
                              <Building className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm flex items-center gap-1">
                                  {(institucion.visitas_count ?? 0) > promedioVisitas && (
                                    <Star className="h-3 w-3 text-amber-400 fill-amber-400 shrink-0" />
                                  )}
                                  <span className="truncate">{institucion.nombre}</span>
                                </div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {institucion.direccion}
                                </div>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* Institución seleccionada */}
                  {field.value && !institucionOpen && (() => {
                    const sel = instituciones.find(i => i.id === field.value)
                    return sel ? (
                      <div className="flex items-start gap-2 p-3 bg-muted/50 rounded text-sm">
                        <Building className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{sel.nombre}</div>
                        </div>
                      </div>
                    ) : null
                  })()}

                  {/* Botón nueva institución */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowNewInstitucionForm(true)}
                    className="w-full h-8 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Agregar Nueva Institución
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        {/* Botones */}
        <div className="flex gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
            Cancelar
          </Button>
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Guardando...
              </span>
            ) : 'Programar Visita'}
          </Button>
        </div>
      </form>
    </Form>
  )
}