import { useState, useEffect } from 'react'
import { Activity, User, MapPin, Calendar, Filter, Eye } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useActividades } from '@/hooks/useActividades'
import { useUsers } from '@/hooks/useUsers'
import { useInstituciones } from '@/hooks/useInstituciones'
import { useCatalogos } from '@/hooks/useCatalogos'
import type { Actividad } from '@/types/actividad'

export default function AdminActividadesPage() {
  const currentDate = new Date()
  const [filtroInstitucion, setFiltroInstitucion] = useState<string>('todos')
  const [filtroPal, setFiltroPal] = useState<string>('todos')
  const [filtroActividad, setFiltroActividad] = useState<string>('todos')
  const [filtroFechaInicio, setFiltroFechaInicio] = useState<string>(
    `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-01`
  )
  const [filtroFechaFin, setFiltroFechaFin] = useState<string>(
    new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString().split('T')[0]
  )
  const [selectedActividad, setSelectedActividad] = useState<Actividad | null>(null)
  const [showDetail, setShowDetail] = useState(false)

  const { actividades, loading, fetchAllActividades, formatearFechaHora, formatearNombreContacto, getTipoContactoLabel } = useActividades()
  const { users } = useUsers()
  const { instituciones } = useInstituciones()
  const { catalogos } = useCatalogos()

  const pals = users.filter(user => user.role === 'pal')
  const tiposActividad = catalogos.filter(cat => cat.tipo === 'descripcion_actividad')

  const actividadesFiltradas = actividades?.filter(actividad => {
    if (filtroInstitucion !== 'todos' && actividad.institucion?.id !== filtroInstitucion) return false
    if (filtroPal !== 'todos' && actividad.pal?.id !== filtroPal) return false
    if (filtroActividad !== 'todos' && actividad.entrega_sobres_id !== filtroActividad) return false
    if (filtroFechaInicio && actividad.fecha_actividad < filtroFechaInicio) return false
    if (filtroFechaFin && actividad.fecha_actividad > filtroFechaFin) return false
    return true
  }) || []

  useEffect(() => {
    fetchAllActividades()
  }, [fetchAllActividades])

  const handleViewActivity = (actividad: Actividad) => {
    setSelectedActividad(actividad)
    setShowDetail(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Actividades</h1>
          <p className="text-muted-foreground">Administra todas las actividades</p>
        </div>
      </div>

      <Card>
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filtros:</span>
            </div>

            <Select value={filtroInstitucion} onValueChange={setFiltroInstitucion}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Institución" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas las instituciones</SelectItem>
                {instituciones.map((institucion) => (
                  <SelectItem key={institucion.id} value={institucion.id}>
                    {institucion.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filtroPal} onValueChange={setFiltroPal}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="PAL" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los PALs</SelectItem>
                {pals.map((pal) => (
                  <SelectItem key={pal.id} value={pal.id}>
                    {pal.nombre_completo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filtroActividad} onValueChange={setFiltroActividad}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Tipo de Actividad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas las actividades</SelectItem>
                {tiposActividad.map((tipo) => (
                  <SelectItem key={tipo.id} value={tipo.id}>
                    {tipo.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex flex-wrap items-center gap-2 w-full">
              <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-sm text-muted-foreground">Desde:</span>
              <input
                type="date"
                value={filtroFechaInicio}
                onChange={(e) => setFiltroFechaInicio(e.target.value)}
                className="text-sm border rounded px-2 py-1 h-9 flex-1 min-w-0"
              />
              <span className="text-sm text-muted-foreground">Hasta:</span>
              <input
                type="date"
                value={filtroFechaFin}
                onChange={(e) => setFiltroFechaFin(e.target.value)}
                className="text-sm border rounded px-2 py-1 h-9 flex-1 min-w-0"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Actividades ({actividadesFiltradas.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Cargando actividades...</div>
          ) : actividadesFiltradas.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No se encontraron actividades</p>
            </div>
          ) : (
            <>
              {/* Móvil — cards */}
              <div className="flex flex-col gap-3 lg:hidden">
                {actividadesFiltradas.map((actividad) => (
                  <button
                    key={actividad.id}
                    onClick={() => handleViewActivity(actividad)}
                    className="w-full text-left border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors"
                  >
                    {/* PAL + tipo */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-semibold text-sm">
                        <User className="w-4 h-4 text-muted-foreground shrink-0" />
                        <span>{actividad.pal?.nombre_completo || 'N/A'}</span>
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {actividad.tipo_actividad === 'presencial' ? 'Presencial' : 'Telefónica'}
                      </Badge>
                    </div>

                    {/* Institución + fecha */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="font-medium">{actividad.institucion?.nombre || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3 shrink-0" />
                        <span>{formatearFechaHora(actividad)}</span>
                      </div>
                    </div>

                    {/* Descripción completa */}
                    {actividad.descripcion_actividad && (
                      <p className="text-sm leading-snug">{actividad.descripcion_actividad}</p>
                    )}

                    {/* Temas */}
                    {actividad.temas_impartidos && (
                      <p className="text-xs text-muted-foreground leading-snug">
                        <span className="font-medium">Temas:</span> {actividad.temas_impartidos}
                      </p>
                    )}

                    {/* Contacto */}
                    {actividad.contacto && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span>{formatearNombreContacto(actividad.contacto)}</span>
                        <Badge variant="outline" className="text-[10px] px-1 py-0">
                          {getTipoContactoLabel(actividad.contacto.tipo_contacto)}
                        </Badge>
                      </div>
                    )}

                    {/* Entregas */}
                    {(actividad.entrega_sobres || actividad.entrega_kit_rash) && (
                      <div className="flex flex-wrap gap-1">
                        {actividad.entrega_sobres && (
                          <Badge variant="secondary" className="text-xs">
                            Sobres: {actividad.entrega_sobres.nombre}
                          </Badge>
                        )}
                        {actividad.entrega_kit_rash && (
                          <Badge variant="secondary" className="text-xs">
                            Kit RASH: {actividad.entrega_kit_rash.nombre}
                          </Badge>
                        )}
                      </div>
                    )}
                  </button>
                ))}
              </div>

              {/* Desktop — tabla */}
              <div className="hidden lg:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fecha</TableHead>
                      <TableHead>PAL / Institución / Contacto</TableHead>
                      <TableHead>Actividad</TableHead>
                      <TableHead>Temas</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {actividadesFiltradas.map((actividad) => (
                      <TableRow key={actividad.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-muted-foreground" />
                            <div className="text-sm">{formatearFechaHora(actividad)}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-1 text-sm font-medium">
                              <User className="w-3 h-3 text-muted-foreground shrink-0" />
                              <span className="truncate">{actividad.pal?.nombre_completo || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="w-3 h-3 shrink-0" />
                              <span className="truncate">{actividad.institucion?.nombre || 'N/A'}</span>
                            </div>
                            {actividad.contacto && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <span className="truncate">{formatearNombreContacto(actividad.contacto)}</span>
                                <Badge variant="outline" className="text-[10px] px-1 py-0 shrink-0">
                                  {getTipoContactoLabel(actividad.contacto.tipo_contacto)}
                                </Badge>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm truncate max-w-48" title={actividad.descripcion_actividad || ''}>
                              {actividad.descripcion_actividad || 'Sin descripción'}
                            </div>
                            {actividad.entrega_sobres && (
                              <Badge variant="secondary" className="text-xs">
                                Entrega de sobres <b>{actividad.entrega_sobres.nombre}</b>
                              </Badge>
                            )}
                            {actividad.entrega_kit_rash && (
                              <Badge variant="secondary" className="text-xs">
                                Entrega de Kit RASH <b>{actividad.entrega_kit_rash.nombre}</b>
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm max-w-40 truncate" title={actividad.temas_impartidos || ''}>
                            {actividad.temas_impartidos || 'Sin temas'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" onClick={() => handleViewActivity(actividad)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle de Actividad</DialogTitle>
          </DialogHeader>

          {selectedActividad && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Información General</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Fecha y Hora</label>
                      <p className="text-sm">{formatearFechaHora(selectedActividad)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Tipo de Actividad</label>
                      <Badge variant="outline" className="ml-2">
                        {selectedActividad.tipo_actividad === 'presencial' ? 'Presencial' : 'Telefónica'}
                      </Badge>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">PAL Responsable</label>
                      <p className="text-sm">{selectedActividad.pal?.nombre_completo || 'N/A'}</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Ubicación y Contacto</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Institución</label>
                      <p className="text-sm">{selectedActividad.institucion?.nombre || 'N/A'}</p>
                      <p className="text-xs text-muted-foreground">{selectedActividad.institucion?.direccion}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Contacto</label>
                      {selectedActividad.contacto ? (
                        <div>
                          <p className="text-sm">{formatearNombreContacto(selectedActividad.contacto)}</p>
                          <Badge variant="outline" className="text-xs">
                            {getTipoContactoLabel(selectedActividad.contacto.tipo_contacto)}
                          </Badge>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">Sin contacto asignado</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {selectedActividad.descripcion_actividad && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Descripción de la Actividad</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{selectedActividad.descripcion_actividad}</p>
                  </CardContent>
                </Card>
              )}

              {selectedActividad.temas_impartidos && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Temas Impartidos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{selectedActividad.temas_impartidos}</p>
                  </CardContent>
                </Card>
              )}

              {(selectedActividad.entrega_sobres || selectedActividad.entrega_kit_rash) && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Entregas Realizadas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-2">
                      {selectedActividad.entrega_sobres && (
                        <Badge variant="secondary">{selectedActividad.entrega_sobres.nombre}</Badge>
                      )}
                      {selectedActividad.entrega_kit_rash && (
                        <Badge variant="secondary">{selectedActividad.entrega_kit_rash.nombre}</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {selectedActividad.notas && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Notas Adicionales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{selectedActividad.notas}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}