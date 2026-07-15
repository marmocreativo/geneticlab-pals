import { useState, useEffect, useRef } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, User, ChevronDown, X, Pencil, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useInstituciones } from '@/hooks/useInstituciones'
import { supabase } from '@/lib/supabase'
import { truncarTexto } from '@/lib/utils'
import { contactosService } from '@/services/contactosService'
import { toast } from 'sonner'
import type { Contacto } from '@/types/contacto'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ContactosOffcanvasProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onFusionCompletada?: () => void
}

type Vista = 'lista' | 'editor' | 'fusion'

const TIPOS_CONTACTO = [
  { value: 'medico', label: 'Médico' },
  { value: 'paciente', label: 'Paciente' },
  { value: 'familiar', label: 'Familiar' },
  { value: 'cuidador', label: 'Cuidador' },
  { value: 'enfermera', label: 'Enfermera' },
  { value: 'enfermero', label: 'Enfermero' },
  { value: 'kam', label: 'KAM' },
  { value: 'otro', label: 'Otro' },
]

export function ContactosOffcanvas({ open, onOpenChange, onFusionCompletada }: ContactosOffcanvasProps) {
  const { user } = useAuth()
  const { instituciones: todasInstituciones } = useInstituciones()

  const [vista, setVista] = useState<Vista>('lista')
  const [contactos, setContactos] = useState<Contacto[]>([])
  const [loading, setLoading] = useState(false)
  const [busqueda, setBusqueda] = useState('')

  // Instituciones derivadas de los contactos cargados (para el filtro de la lista)
  const instituciones = Array.from(
    new Map(
      contactos
        .filter(c => c.institucion)
        .map(c => [c.institucion!.id, c.institucion!])
    ).values()
  )

  // Filtros de la lista
  const [institucionId, setInstitucionId] = useState<string>('todas')
  const [tipoContacto, setTipoContacto] = useState<string>('todos')

  // Selector de institución con buscador (collapse inline, sin portal)
  const [institucionSelectorOpen, setInstitucionSelectorOpen] = useState(false)
  const institucionSearchRef = useRef<HTMLInputElement>(null)
  const [institucionSearchTerm, setInstitucionSearchTerm] = useState('')

  const institucionSeleccionada = instituciones.find(i => i.id === institucionId)

  const institucionesFiltradas = instituciones.filter(inst =>
    inst.nombre.toLowerCase().includes(institucionSearchTerm.trim().toLowerCase())
  )

  // Duplicados
  const [grupoFusion, setGrupoFusion] = useState<Contacto[] | null>(null)
  const [contactoConservarId, setContactoConservarId] = useState<string | null>(null)
  const [fusionando, setFusionando] = useState(false)
  const [fichasPorContacto, setFichasPorContacto] = useState<Record<string, number>>({})
  const [cargandoFichas, setCargandoFichas] = useState(false)

  // Editor
  const [contactoEditando, setContactoEditando] = useState<Contacto | null>(null)
  const [guardando, setGuardando] = useState(false)

  const [institucionEditorOpen, setInstitucionEditorOpen] = useState(false)
  const [institucionEditorSearch, setInstitucionEditorSearch] = useState('')

  const institucionesEditorFiltradas = todasInstituciones.filter(inst =>
    inst.nombre.toLowerCase().includes(institucionEditorSearch.trim().toLowerCase())
  )

  useEffect(() => {
    if (open && user?.id) {
      fetchContactos()
    }
  }, [open, user?.id])

  useEffect(() => {
    if (vista === 'fusion' && grupoFusion) {
      fetchFichasPorContacto(grupoFusion.map(c => c.id))
    }
  }, [vista, grupoFusion])

  const fetchContactos = async () => {
    if (!user?.id) return
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('contactos')
        .select('*, institucion:instituciones(id, nombre)')
        .eq('pal_id', user.id)
        .order('nombre')

      if (error) throw error
      setContactos(data || [])
    } catch (err) {
      console.error('Error cargando contactos:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchFichasPorContacto = async (contactoIds: string[]) => {
    try {
      setCargandoFichas(true)
      const { data, error } = await supabase
        .from('ficha_paciente')
        .select('paciente_id')
        .in('paciente_id', contactoIds)

      if (error) throw error

      const conteo = (data || []).reduce((acc, f) => {
        acc[f.paciente_id] = (acc[f.paciente_id] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      setFichasPorContacto(conteo)
    } catch (err) {
      console.error('Error cargando fichas por contacto:', err)
    } finally {
      setCargandoFichas(false)
    }
  }

  const normalizarNombre = (c: Contacto) =>
    [c.nombre, c.apellido_pat, c.apellido_mat]
      .filter(Boolean)
      .join(' ')
      .trim()
      .toLowerCase()

  const gruposDuplicados = contactos.reduce((acc, c) => {
    const key = normalizarNombre(c)
    if (!key) return acc
    if (!acc[key]) acc[key] = []
    acc[key].push(c)
    return acc
  }, {} as Record<string, Contacto[]>)

  const esDuplicado = (c: Contacto) => {
    const grupo = gruposDuplicados[normalizarNombre(c)]
    return grupo && grupo.length > 1
  }

  const contactosFiltrados = contactos.filter(c => {
    const texto = busqueda.trim().toLowerCase()
    const nombreCompleto = normalizarNombre(c)

    const coincideTexto = !texto || nombreCompleto.includes(texto)
    const coincideInstitucion = institucionId === 'todas' || c.institucion?.id === institucionId
    const coincideTipo = tipoContacto === 'todos' || c.tipo_contacto === tipoContacto

    return coincideTexto && coincideInstitucion && coincideTipo
  })

  const resetFiltros = () => {
    setBusqueda('')
    setInstitucionId('todas')
    setTipoContacto('todos')
    setInstitucionSelectorOpen(false)
    setInstitucionSearchTerm('')
  }

  const volverALista = () => {
    setVista('lista')
    setGrupoFusion(null)
    setContactoConservarId(null)
    setFichasPorContacto({})
    setContactoEditando(null)
    setInstitucionEditorOpen(false)
    setInstitucionEditorSearch('')
  }

  const handleOpenChange = (val: boolean) => {
    onOpenChange(val)
    if (!val) {
      setVista('lista')
      resetFiltros()
      setGrupoFusion(null)
      setContactoConservarId(null)
      setFichasPorContacto({})
      setContactoEditando(null)
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-4 border-b">
          <SheetTitle>Contactos</SheetTitle>
        </SheetHeader>

        {/* VISTA: LISTA */}
        {vista === 'lista' && (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar contacto..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-8"
                />
              </div>

              <div className="flex gap-2 mt-2">
                <div className="flex-1 relative">
                  <button
                    type="button"
                    onClick={() => setInstitucionSelectorOpen(prev => !prev)}
                    className="w-full h-9 px-3 flex items-center justify-between rounded-md border bg-background text-xs"
                  >
                    <span className="truncate text-left">
                      {institucionSeleccionada
                        ? truncarTexto(institucionSeleccionada.nombre, 22)
                        : 'Todas las instituciones'}
                    </span>
                    {institucionSeleccionada && (
                      <X
                        className="h-3.5 w-3.5 shrink-0 text-muted-foreground ml-1"
                        onClick={(e) => {
                          e.stopPropagation()
                          setInstitucionId('todas')
                        }}
                      />
                    )}
                    <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  </button>

                  {institucionSelectorOpen && (
                    <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
                      <div className="p-2 border-b relative">
                        <Search className="absolute left-4 top-4.5 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                          ref={institucionSearchRef}
                          placeholder="Buscar institución..."
                          value={institucionSearchTerm}
                          onChange={(e) => setInstitucionSearchTerm(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') e.preventDefault()
                          }}
                          className="pl-7 h-8 text-xs"
                        />
                      </div>

                      <div className="max-h-48 overflow-auto py-1">
                        <button
                          type="button"
                          onClick={() => {
                            setInstitucionId('todas')
                            setInstitucionSelectorOpen(false)
                            setInstitucionSearchTerm('')
                          }}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-accent"
                        >
                          Todas las instituciones
                        </button>

                        {institucionesFiltradas.map((inst) => (
                          <button
                            key={inst.id}
                            type="button"
                            onClick={() => {
                              setInstitucionId(inst.id)
                              setInstitucionSelectorOpen(false)
                              setInstitucionSearchTerm('')
                            }}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-accent truncate"
                          >
                            {inst.nombre}
                          </button>
                        ))}

                        {institucionesFiltradas.length === 0 && (
                          <p className="px-3 py-2 text-xs text-muted-foreground">Sin resultados</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <Select value={tipoContacto} onValueChange={setTipoContacto}>
                  <SelectTrigger className="flex-1 h-9 text-xs">
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos los tipos</SelectItem>
                    {TIPOS_CONTACTO.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 space-y-2">
              {loading && (
                <p className="text-sm text-muted-foreground text-center py-8">Cargando...</p>
              )}

              {!loading && contactosFiltrados.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No se encontraron contactos
                </p>
              )}

              {!loading && contactosFiltrados.map((contacto) => {
                const duplicado = esDuplicado(contacto)
                return (
                  <div
                    key={contacto.id}
                    className="flex items-center gap-3 rounded-lg border p-3 hover:bg-accent transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        if (duplicado) {
                          setGrupoFusion(gruposDuplicados[normalizarNombre(contacto)])
                          setVista('fusion')
                        }
                      }}
                      className="flex items-center gap-3 flex-1 min-w-0 text-left"
                    >
                      <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium truncate">
                            {[contacto.nombre, contacto.apellido_pat, contacto.apellido_mat]
                              .filter(Boolean)
                              .join(' ')}
                          </p>
                          {duplicado && (
                            <Badge variant="destructive" className="text-[10px] shrink-0">
                              Posible duplicado
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {contacto.institucion?.nombre ? truncarTexto(contacto.institucion.nombre, 35) : 'Sin institución'}
                        </p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setContactoEditando(contacto)
                        setVista('editor')
                      }}
                      className="p-2 text-muted-foreground hover:text-foreground shrink-0"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* VISTA: FUSIÓN */}
        {vista === 'fusion' && grupoFusion && (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="p-4 border-b">
              <button
                type="button"
                onClick={volverALista}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                ← Volver a la lista
              </button>

              <div className="text-center mt-4 space-y-2">
                <h3 className="text-lg font-semibold">Fusión de contactos</h3>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  Selecciona el contacto que quieres conservar, el que gustes.
                  Los demás se fusionarán con él sin perder ninguna ficha ni actividad.
                </p>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-4 space-y-2">
              {cargandoFichas && (
                <p className="text-xs text-muted-foreground">Cargando información de fichas...</p>
              )}

              {grupoFusion.map((contacto) => (
                <label
                  key={contacto.id}
                  className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                    contactoConservarId === contacto.id ? 'border-primary bg-primary/5' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="conservar"
                    className="mt-1"
                    checked={contactoConservarId === contacto.id}
                    onChange={() => setContactoConservarId(contacto.id)}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {[contacto.nombre, contacto.apellido_pat, contacto.apellido_mat]
                        .filter(Boolean)
                        .join(' ')}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      Tipo: {TIPOS_CONTACTO.find(t => t.value === contacto.tipo_contacto)?.label ?? contacto.tipo_contacto}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      Institución: {contacto.institucion?.nombre ?? 'Sin institución'}
                    </p>
                    {fichasPorContacto[contacto.id] > 0 && (
                      <p className="text-xs font-medium text-amber-600 mt-1">
                        {fichasPorContacto[contacto.id]} ficha{fichasPorContacto[contacto.id] > 1 ? 's' : ''} de paciente asignada{fichasPorContacto[contacto.id] > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </label>
              ))}
            </div>

            <div className="p-4 border-t">
              <Button
                className="w-full"
                disabled={!contactoConservarId || fusionando}
                onClick={async () => {
                  if (!contactoConservarId || !grupoFusion) return
                  try {
                    setFusionando(true)
                    const aEliminar = grupoFusion.filter(c => c.id !== contactoConservarId)
                    for (const c of aEliminar) {
                      await contactosService.fusionarContactos(contactoConservarId, c.id)
                    }
                    toast.success('Contactos fusionados exitosamente')
                    volverALista()
                    await fetchContactos()
                    onFusionCompletada?.()
                  } catch (err) {
                    console.error('Error fusionando contactos:', err)
                    toast.error('Error al fusionar los contactos')
                  } finally {
                    setFusionando(false)
                  }
                }}
              >
                {fusionando ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Fusionando...
                  </>
                ) : (
                  'Fusionar contactos'
                )}
              </Button>
            </div>
          </div>
        )}

        {/* VISTA: EDITOR */}
        {vista === 'editor' && contactoEditando && (
          <div className="flex-1 flex flex-col min-h-0">
            <div className="p-4 border-b">
              <button
                type="button"
                onClick={volverALista}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                ← Volver a la lista
              </button>
            </div>

            <div className="flex-1 overflow-auto p-4 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Tipo de contacto</label>
                <Select
                  value={contactoEditando.tipo_contacto}
                  onValueChange={(val) =>
                    setContactoEditando({ ...contactoEditando, tipo_contacto: val as Contacto['tipo_contacto'] })
                  }
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_CONTACTO.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">Nombre</label>
                <Input
                  value={contactoEditando.nombre}
                  onChange={(e) => setContactoEditando({ ...contactoEditando, nombre: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Apellido paterno</label>
                  <Input
                    value={contactoEditando.apellido_pat ?? ''}
                    onChange={(e) => setContactoEditando({ ...contactoEditando, apellido_pat: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium">Apellido materno</label>
                  <Input
                    value={contactoEditando.apellido_mat ?? ''}
                    onChange={(e) => setContactoEditando({ ...contactoEditando, apellido_mat: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">Teléfono</label>
                <Input
                  value={contactoEditando.telefono ?? ''}
                  onChange={(e) => setContactoEditando({ ...contactoEditando, telefono: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">Fecha de nacimiento</label>
                <Input
                  type="date"
                  value={contactoEditando.fecha_nacimiento ?? ''}
                  onChange={(e) => setContactoEditando({ ...contactoEditando, fecha_nacimiento: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium">Institución</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setInstitucionEditorOpen(prev => !prev)}
                    className="w-full h-9 px-3 flex items-center justify-between rounded-md border bg-background text-sm"
                  >
                    <span className="truncate text-left">
                      {contactoEditando.institucion?.nombre
                        ? truncarTexto(contactoEditando.institucion.nombre, 40)
                        : 'Sin institución'}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  </button>

                  {institucionEditorOpen && (
                    <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
                      <div className="p-2 border-b relative">
                        <Search className="absolute left-4 top-4.5 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                          placeholder="Buscar institución..."
                          value={institucionEditorSearch}
                          onChange={(e) => setInstitucionEditorSearch(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') e.preventDefault()
                          }}
                          className="pl-7 h-8 text-xs"
                        />
                      </div>

                      <div className="max-h-48 overflow-auto py-1">
                        <button
                          type="button"
                          onClick={() => {
                            setContactoEditando({
                              ...contactoEditando,
                              institucion_id: undefined,
                              institucion: undefined,
                            })
                            setInstitucionEditorOpen(false)
                            setInstitucionEditorSearch('')
                          }}
                          className="w-full text-left px-3 py-2 text-xs hover:bg-accent"
                        >
                          Sin institución
                        </button>

                        {institucionesEditorFiltradas.map((inst) => (
                          <button
                            key={inst.id}
                            type="button"
                            onClick={() => {
                              setContactoEditando({
                                ...contactoEditando,
                                institucion_id: inst.id,
                                institucion: { id: inst.id, nombre: inst.nombre },
                              })
                              setInstitucionEditorOpen(false)
                              setInstitucionEditorSearch('')
                            }}
                            className="w-full text-left px-3 py-2 text-xs hover:bg-accent truncate"
                          >
                            {inst.nombre}
                          </button>
                        ))}

                        {institucionesEditorFiltradas.length === 0 && (
                          <p className="px-3 py-2 text-xs text-muted-foreground">Sin resultados</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 border-t">
              <Button
                className="w-full"
                disabled={guardando || !contactoEditando.nombre.trim()}
                onClick={async () => {
                  try {
                    setGuardando(true)
                    await contactosService.updateContacto(contactoEditando.id, {
                      tipo_contacto: contactoEditando.tipo_contacto,
                      nombre: contactoEditando.nombre,
                      apellido_pat: contactoEditando.apellido_pat || undefined,
                      apellido_mat: contactoEditando.apellido_mat || undefined,
                      telefono: contactoEditando.telefono || undefined,
                      fecha_nacimiento: contactoEditando.fecha_nacimiento || undefined,
                      institucion_id: contactoEditando.institucion_id,
                    })
                    toast.success('Contacto actualizado')
                    volverALista()
                    await fetchContactos()
                  } catch (err) {
                    console.error('Error actualizando contacto:', err)
                    toast.error('Error al actualizar el contacto')
                  } finally {
                    setGuardando(false)
                  }
                }}
              >
                {guardando ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar cambios'
                )}
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}