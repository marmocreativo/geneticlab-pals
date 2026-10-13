import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { mantenimientoService, type ParDuplicado, type InstitucionCoordInvalida, type InstitucionSinCiudad } from '@/services/mantenimientoService'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AlertCircle, Search, ArrowRight, Loader2, MapPin, Building2 } from 'lucide-react'
import { toast } from 'sonner'
import { ESTADOS_MX } from '@/constants/estados'

const MOTIVO_LABEL: Record<ParDuplicado['motivo'], string> = {
  nombre_exacto: 'Nombre exacto',
  nombre_similar: 'Nombre similar',
  coordenadas: 'Coordenadas cercanas',
}

const MOTIVO_VARIANT: Record<ParDuplicado['motivo'], 'destructive' | 'secondary' | 'outline'> = {
  nombre_exacto: 'destructive',
  nombre_similar: 'secondary',
  coordenadas: 'outline',
}


// ─── Tab 1: Duplicados ───────────────────────────────────────────────

function TabDuplicados() {
  const navigate = useNavigate()
  const [duplicados, setDuplicados] = useState<ParDuplicado[]>([])
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [buscado, setBuscado] = useState(false)

  const buscar = async () => {
    try {
      setLoading(true)
      setSeleccionados(new Set())
      const pares = await mantenimientoService.detectarDuplicados()
      setDuplicados(pares)
      setBuscado(true)
      if (pares.length === 0) toast.success('No se encontraron duplicados')
    } catch {
      toast.error('Error al buscar duplicados')
    } finally {
      setLoading(false)
    }
  }

  const toggleSeleccion = (key: string) => {
    setSeleccionados(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const toggleTodos = () => {
    if (seleccionados.size === duplicados.length) setSeleccionados(new Set())
    else setSeleccionados(new Set(duplicados.map(p => `${p.id_a}|${p.id_b}`)))
  }

  const continuar = () => {
    const paresSeleccionados = duplicados.filter(p => seleccionados.has(`${p.id_a}|${p.id_b}`))
    navigate('/admin/mantenimiento/fusionar', { state: { pares: paresSeleccionados } })
  }

  return (
    <div className="space-y-4">
      <Button onClick={buscar} disabled={loading}>
        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
        Buscar duplicados
      </Button>

      {buscado && duplicados.length === 0 && (
        <p className="text-sm text-muted-foreground">No se encontraron posibles duplicados.</p>
      )}

      {duplicados.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Checkbox checked={seleccionados.size === duplicados.length} onCheckedChange={toggleTodos} />
              <span className="text-sm text-muted-foreground">
                {seleccionados.size} de {duplicados.length} seleccionados
              </span>
            </div>
            <Button disabled={seleccionados.size === 0} onClick={continuar}>
              Revisar seleccionados
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>

          <div className="divide-y border rounded-lg">
            {duplicados.map(par => {
              const key = `${par.id_a}|${par.id_b}`
              return (
                <div
                  key={key}
                  className="flex items-start gap-3 p-4 hover:bg-muted/50 cursor-pointer"
                  onClick={() => toggleSeleccion(key)}
                >
                  <Checkbox
                    checked={seleccionados.has(key)}
                    onCheckedChange={() => toggleSeleccion(key)}
                    onClick={e => e.stopPropagation()}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={MOTIVO_VARIANT[par.motivo]}>{MOTIVO_LABEL[par.motivo]}</Badge>
                      {par.motivo === 'coordenadas' && (
                        <span className="text-xs text-muted-foreground">{par.distancia_metros}m de distancia</span>
                      )}
                    </div>
                    <p className="text-sm font-medium truncate">{par.nombre_a}</p>
                    <p className="text-xs text-muted-foreground">{par.ciudad_a ?? '—'}, {par.estado_a ?? '—'}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <AlertCircle className="w-3 h-3" />
                      <span className="truncate">{par.nombre_b}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{par.ciudad_b ?? '—'}, {par.estado_b ?? '—'}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Tab 2: Coordenadas inválidas ────────────────────────────────────

function TabCoordenadasInvalidas() {
  const navigate = useNavigate()
  const [instituciones, setInstituciones] = useState<InstitucionCoordInvalida[]>([])
  const [loading, setLoading] = useState(false)
  const [buscado, setBuscado] = useState(false)

  const buscar = async () => {
    try {
      setLoading(true)
      const data = await mantenimientoService.detectarCoordenadasInvalidas()
      setInstituciones(data)
      setBuscado(true)
      if (data.length === 0) toast.success('No se encontraron coordenadas inválidas')
    } catch {
      toast.error('Error al buscar coordenadas inválidas')
    } finally {
      setLoading(false)
    }
  }

  const editar = (inst: InstitucionCoordInvalida) => {
    navigate('/admin/mantenimiento/coordenadas', { state: { institucion: inst } })
  }

  return (
    <div className="space-y-4">
      <Button onClick={buscar} disabled={loading}>
        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
        Buscar coordenadas inválidas
      </Button>

      {buscado && instituciones.length === 0 && (
        <p className="text-sm text-muted-foreground">No se encontraron instituciones con coordenadas inválidas.</p>
      )}

      {instituciones.length > 0 && (
        <div className="divide-y border rounded-lg">
          {instituciones.map(inst => (
            <div key={inst.id} className="flex items-start justify-between gap-3 p-4">
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium truncate">{inst.nombre}</p>
                  {inst.tieneVisitasLejanas && (
                    <Badge variant="secondary">Visitas lejanas</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{inst.ciudad ?? '—'}, {inst.estado ?? '—'}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  <span>
                    {inst.latitud ?? 'null'}, {inst.longitud ?? 'null'}
                  </span>
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => editar(inst)}>
                Editar
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Tab 3: Sin ciudad / estado ──────────────────────────────────────

function TabSinCiudad() {
  const [instituciones, setInstituciones] = useState<InstitucionSinCiudad[]>([])
  const [ediciones, setEdiciones] = useState<Record<string, { ciudad: string; estado: string }>>({})
  const [guardando, setGuardando] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [buscado, setBuscado] = useState(false)

  const buscar = async () => {
    try {
      setLoading(true)
      const data = await mantenimientoService.detectarSinCiudad()
      setInstituciones(data)
      setBuscado(true)
      const init: Record<string, { ciudad: string; estado: string }> = {}
      data.forEach(inst => {
        init[inst.id] = { ciudad: inst.ciudad ?? '', estado: inst.estado ?? '' }
      })
      setEdiciones(init)
      if (data.length === 0) toast.success('Todas las instituciones tienen ciudad y estado')
    } catch {
      toast.error('Error al buscar instituciones')
    } finally {
      setLoading(false)
    }
  }

  const setField = (id: string, field: 'ciudad' | 'estado', value: string) => {
    setEdiciones(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }))
  }

  const guardar = async (id: string) => {
    const ed = ediciones[id]
    if (!ed?.ciudad || !ed?.estado) {
      toast.error('Ciudad y estado son requeridos')
      return
    }
    try {
      setGuardando(prev => new Set(prev).add(id))
      await mantenimientoService.actualizarCiudadEstado(id, ed.ciudad, ed.estado)
      setInstituciones(prev => prev.filter(i => i.id !== id))
      toast.success('Institución actualizada')
    } catch {
      toast.error('Error al guardar')
    } finally {
      setGuardando(prev => { const next = new Set(prev); next.delete(id); return next })
    }
  }

  return (
    <div className="space-y-4">
      <Button onClick={buscar} disabled={loading}>
        {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
        Buscar sin ciudad / estado
      </Button>

      {buscado && instituciones.length === 0 && (
        <p className="text-sm text-muted-foreground">No se encontraron instituciones sin ciudad o estado.</p>
      )}

      {instituciones.length > 0 && (
        <div className="divide-y border rounded-lg">
          {instituciones.map(inst => {
            const ed = ediciones[inst.id] ?? { ciudad: '', estado: '' }
            const isGuardando = guardando.has(inst.id)
            return (
              <div key={inst.id} className="p-4 space-y-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm font-medium">{inst.nombre}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 ml-6">{inst.direccion}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 ml-6">
                  <select
                    value={ed.estado}
                    onChange={e => setField(inst.id, 'estado', e.target.value)}
                    className="col-span-1 text-sm border rounded-md px-2 py-1.5 bg-background"
                  >
                    <option value="">Seleccionar estado</option>
                    {ESTADOS_MX.map(e => (
                      <option key={e} value={e}>{e}</option>
                    ))}
                  </select>

                  <input
                    type="text"
                    placeholder="Ciudad"
                    value={ed.ciudad}
                    onChange={e => setField(inst.id, 'ciudad', e.target.value)}
                    className="col-span-1 text-sm border rounded-md px-2 py-1.5 bg-background"
                  />

                  <Button
                    size="sm"
                    onClick={() => guardar(inst.id)}
                    disabled={isGuardando}
                    className="col-span-1"
                  >
                    {isGuardando ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar'}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Page principal ──────────────────────────────────────────────────

export default function MantenimientoPage() {
  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Mantenimiento</h1>
        <p className="text-sm text-muted-foreground">Herramientas para mantener la calidad de los datos</p>
      </div>

      <Tabs defaultValue="duplicados">
        <TabsList className="w-full">
          <TabsTrigger value="duplicados" className="flex-1">Duplicados</TabsTrigger>
          <TabsTrigger value="coordenadas" className="flex-1">Coordenadas</TabsTrigger>
          <TabsTrigger value="ciudad" className="flex-1">Sin ciudad</TabsTrigger>
        </TabsList>
        <TabsContent value="duplicados" className="pt-4">
          <TabDuplicados />
        </TabsContent>
        <TabsContent value="coordenadas" className="pt-4">
          <TabCoordenadasInvalidas />
        </TabsContent>
        <TabsContent value="ciudad" className="pt-4">
          <TabSinCiudad />
        </TabsContent>
      </Tabs>
    </div>
  )
}