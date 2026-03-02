// pages/pal/ActividadesPage.tsx
import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useActividades } from '@/hooks/useActividades'
import { useInstituciones } from '@/hooks/useInstituciones'
import { ActividadWizard } from '@/components/actividades/ActividadWizard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Plus, Search, Calendar, Building2, User, ChevronDown, ChevronUp, Filter, Clock, MapPin } from 'lucide-react'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'
import type { ActividadInsert } from '@/types/actividad'

const ITEMS_PER_PAGE = 10

export default function ActividadesPage() {
  const { user } = useAuth()
  const { 
    actividades, 
    loading, 
    fetchActividadesByPal,
    createActividad,
    formatearNombreContacto, 
    getTipoContactoLabel,
    formatearFechaHora 
  } = useActividades()
  const { instituciones, fetchInstituciones } = useInstituciones()

  // Estados para filtros
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [institucionSeleccionada, setInstitucionSeleccionada] = useState('todas')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [tipoActividad, setTipoActividad] = useState('todos')
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [showWizard, setShowWizard] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [formLoading, setFormLoading] = useState(false)

  // Inicializar fechas (último mes)
  useEffect(() => {
    const now = new Date()
    const inicio = startOfMonth(subMonths(now, 1))
    const fin = endOfMonth(now)
    
    setFechaInicio(format(inicio, 'yyyy-MM-dd'))
    setFechaFin(format(fin, 'yyyy-MM-dd'))
  }, [])

  // Cargar instituciones
  useEffect(() => {
    fetchInstituciones()
  }, [])

  // Cargar actividades del PAL
  useEffect(() => {
    if (user?.id && fechaInicio && fechaFin) {
      fetchActividadesByPal(user.id, fechaInicio, fechaFin)
    }
  }, [user?.id, fechaInicio, fechaFin])

  // Función para manejar nueva actividad desde el wizard
  const handleNuevaActividad = async (actividadData: ActividadInsert) => {
    try {
      setFormLoading(true)
      await createActividad(actividadData)
      // Recargar actividades para mostrar la nueva
      if (user?.id) {
        await fetchActividadesByPal(user.id, fechaInicio, fechaFin)
      }
    } finally {
      setFormLoading(false)
    }
  }

  // Filtrar actividades localmente
  const actividadesFiltradas = actividades.filter(actividad => {
    // Filtro por institución
    if (institucionSeleccionada !== 'todas' && actividad.institucion?.id !== institucionSeleccionada) {
      return false
    }

    // Filtro por búsqueda
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      const institucionNombre = actividad.institucion?.nombre?.toLowerCase() || ''
      const contactoNombre = formatearNombreContacto(actividad.contacto).toLowerCase()
      const descripcion = actividad.descripcion_actividad?.toLowerCase() || ''
      const temas = actividad.temas_impartidos?.toLowerCase() || ''
      
      return institucionNombre.includes(searchLower) || 
             contactoNombre.includes(searchLower) || 
             descripcion.includes(searchLower) ||
             temas.includes(searchLower)
    }

    // Filtro por tipo de actividad
    if (tipoActividad !== 'todos' && actividad.tipo_actividad !== tipoActividad) {
      return false
    }
    
    return true
  })

  // Paginación
  const totalItems = actividadesFiltradas.length
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedActividades = actividadesFiltradas.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  // Funciones para manejar expansión en móvil
  const toggleExpand = (actividadId: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(actividadId)) {
      newExpanded.delete(actividadId)
    } else {
      newExpanded.add(actividadId)
    }
    setExpandedItems(newExpanded)
  }

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
  }

  const resetFilters = () => {
    const now = new Date()
    const inicio = startOfMonth(subMonths(now, 1))
    const fin = endOfMonth(now)

    setTipoActividad('todos')
    setFechaInicio(format(inicio, 'yyyy-MM-dd'))
    setFechaFin(format(fin, 'yyyy-MM-dd'))
    setInstitucionSeleccionada('todas')
    setSearchTerm('')
    setCurrentPage(1)
  }

  const formatDateRange = () => {
    if (!fechaInicio || !fechaFin) return 'Seleccionar período'
    
    const inicio = new Date(fechaInicio)
    const fin = new Date(fechaFin)
    
    return `${format(inicio, 'd MMM', { locale: es })} - ${format(fin, 'd MMM yyyy', { locale: es })}`
  }

  return (
    <div className="p-6">
      {/* Header - Diferentes para Desktop y Mobile */}
      {/* Desktop Header */}
      <div className="hidden md:flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Mis Actividades</h1>
        <Button onClick={() => setShowWizard(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Actividad
        </Button>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden mb-6">
        <div className="mb-4">
          <h1 className="text-3xl font-bold">Mis Actividades Registradas</h1>
          <p className="text-muted-foreground mt-1">
            Historial completo de actividades realizadas en el campo
          </p>
        </div>

        {/* Botones principales - Mobile */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex-[2] justify-between"
          >
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="truncate">{formatDateRange()}</span>
            </div>
            {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          
          <Button onClick={() => setShowWizard(true)} className="flex-1">
            <Plus className="h-4 w-4 mr-1" />
            Nueva
          </Button>
        </div>
      </div>

      {/* Wizard de nueva actividad */}
      <ActividadWizard
        open={showWizard}
        onOpenChange={setShowWizard}
        onSubmit={handleNuevaActividad}
        loading={formLoading}
      />

      {/* Filtros - Desktop siempre visible, Mobile colapsable */}
      <div className="hidden md:block mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Fecha inicio */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Fecha Inicio
                </label>
                <Input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                />
              </div>

              {/* Fecha fin */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Fecha Fin
                </label>
                <Input
                  type="date"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                />
              </div>

              {/* Institución */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  Institución
                </label>
                <Select value={institucionSeleccionada} onValueChange={setInstitucionSeleccionada}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las instituciones" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas las instituciones</SelectItem>
                    {instituciones.map(institucion => (
                      <SelectItem key={institucion.id} value={institucion.id}>
                        {institucion.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Búsqueda */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-1">
                  <Search className="h-4 w-4" />
                  Buscar
                </label>
                <Input
                  placeholder="Buscar actividades..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="flex justify-between items-center mt-4">
              <Button variant="outline" size="sm" onClick={resetFilters}>
                Limpiar Filtros
              </Button>
              <div className="text-sm text-muted-foreground">
                {loading ? 'Cargando...' : `${totalItems} actividades encontradas`}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros colapsables - Solo Mobile */}
      <div className="md:hidden">
        <Collapsible open={showFilters} onOpenChange={setShowFilters}>
          <CollapsibleContent>
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="space-y-4">
                  {/* Fecha inicio */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Fecha Inicio</label>
                    <Input
                      type="date"
                      value={fechaInicio}
                      onChange={(e) => setFechaInicio(e.target.value)}
                    />
                  </div>

                  {/* Fecha fin */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Fecha Fin</label>
                    <Input
                      type="date"
                      value={fechaFin}
                      onChange={(e) => setFechaFin(e.target.value)}
                    />
                  </div>

                  {/* Institución */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Institución</label>
                    <Select value={institucionSeleccionada} onValueChange={setInstitucionSeleccionada}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todas">Todas</SelectItem>
                        {instituciones.map(institucion => (
                          <SelectItem key={institucion.id} value={institucion.id}>
                            {institucion.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Búsqueda */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Buscar</label>
                    <Input
                      placeholder="Descripción, contacto..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4 pt-4 border-t">
                  <Button variant="ghost" size="sm" onClick={resetFilters}>
                    Limpiar Filtros
                  </Button>
                  <div className="text-sm text-muted-foreground">
                    {loading ? 'Cargando...' : `${totalItems} actividades`}
                  </div>
                </div>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Vista Desktop - Tabla */}
      <div className="hidden md:block">
        <Card>
          <CardHeader>
            <CardTitle>Lista de Actividades</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Cargando actividades...</div>
            ) : paginatedActividades.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No se encontraron actividades para los filtros seleccionados
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha/Hora</TableHead>
                    <TableHead>Institución</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Actividad</TableHead>
                    <TableHead>Temas</TableHead>
                    <TableHead>Entregas</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedActividades.map(actividad => (
                    <TableRow key={actividad.id}>
                      <TableCell>
                        <div className="text-sm">
                          {formatearFechaHora(actividad)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {actividad.institucion?.nombre || 'Sin institución'}
                        </div>
                        <div className="text-sm text-muted-foreground truncate max-w-xs">
                          {actividad.institucion?.direccion}
                        </div>
                      </TableCell>
                      <TableCell>
                        {actividad.contacto ? (
                          <div>
                            <div className="font-medium">
                              {formatearNombreContacto(actividad.contacto)}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {getTipoContactoLabel(actividad.contacto.tipo_contacto)}
                            </Badge>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Sin contacto</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={actividad.tipo_actividad === 'presencial' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {actividad.tipo_actividad === 'presencial' ? 'Presencial' : 'Telefónica'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm max-w-xs">
                          {actividad.descripcion_actividad ? (
                            <span className="line-clamp-3">{actividad.descripcion_actividad}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm max-w-xs">
                          {actividad.temas_impartidos ? (
                            <span className="line-clamp-3">{actividad.temas_impartidos}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {actividad.entrega_sobres && (
                            <Badge variant="secondary" className="text-xs w-fit">
                              {actividad.entrega_sobres.nombre}
                            </Badge>
                          )}
                          {actividad.entrega_kit_rash && (
                            <Badge variant="secondary" className="text-xs w-fit">
                              {actividad.entrega_kit_rash.nombre}
                            </Badge>
                          )}
                          {!actividad.entrega_sobres && !actividad.entrega_kit_rash && (
                            <span className="text-muted-foreground text-xs">-</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Vista Mobile - Cards minimalistas */}
      <div className="md:hidden">
        <div className="space-y-3">
          {loading ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-muted-foreground">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  Cargando actividades...
                </div>
              </CardContent>
            </Card>
          ) : paginatedActividades.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <h3 className="font-medium mb-1">No hay actividades</h3>
                  <p className="text-sm">No se encontraron actividades para los filtros seleccionados</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            paginatedActividades.map(actividad => (
              <Collapsible key={actividad.id}>
                <Card className="hover:shadow-md transition-shadow">
                  <CollapsibleTrigger 
                    className="w-full"
                    onClick={() => toggleExpand(actividad.id)}
                  >
                    <CardContent className="p-4 py-0">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1 text-left space-y-2">
                          {/* 1. DESCRIPCIÓN - Más importante */}
                          <div>
                            <h3 className="font-semibold text-base leading-tight">
                              {actividad.descripcion_actividad || 'Actividad sin descripción'}
                            </h3>
                          </div>

                          {/* 2. FECHA Y HORA - Segunda importancia (misma fila) */}
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(actividad.fecha_actividad), 'd MMM yyyy', { locale: es })}
                            </div>
                            {actividad.hora_actividad && (
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {actividad.hora_actividad.slice(0, 5)}
                              </div>
                            )}
                            <Badge 
                              variant={actividad.tipo_actividad === 'presencial' ? 'default' : 'secondary'}
                              className="text-xs"
                            >
                              {actividad.tipo_actividad === 'presencial' ? 'Presencial' : 'Telefónica'}
                            </Badge>
                          </div>

                          {/* 3. INSTITUCIÓN - Fila separada */}
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <MapPin className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{actividad.institucion?.nombre || 'Sin institución'}</span>
                          </div>

                          {/* 4. CONTACTO - Tercera importancia */}
                          {actividad.contacto && (
                            <div className="flex items-center gap-2 text-sm">
                              <User className="h-3 w-3 text-muted-foreground" />
                              <span className="text-muted-foreground">
                                {formatearNombreContacto(actividad.contacto)}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {getTipoContactoLabel(actividad.contacto.tipo_contacto)}
                              </Badge>
                            </div>
                          )}
                        </div>

                        {/* Icono de expansión */}
                        <div className="flex-shrink-0">
                          {expandedItems.has(actividad.id) ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleTrigger>
                  
                  {/* Contenido expandible */}
                  <CollapsibleContent>
                    <CardContent className="pt-0 px-4 pb-4">
                      <div className="border-t pt-4 space-y-3">
                        {/* Temas impartidos */}
                        {actividad.temas_impartidos && (
                          <div>
                            <span className="text-sm font-medium">Temas Impartidos:</span>
                            <p className="text-sm text-muted-foreground mt-1">
                              {actividad.temas_impartidos}
                            </p>
                          </div>
                        )}
                        
                        {/* Entregas */}
                        {(actividad.entrega_sobres || actividad.entrega_kit_rash) && (
                          <div>
                            <span className="text-sm font-medium">Entregas:</span>
                            <div className="flex gap-2 mt-1">
                              {actividad.entrega_sobres && (
                                <Badge variant="secondary" className="text-xs">
                                  {actividad.entrega_sobres.nombre}
                                </Badge>
                              )}
                              {actividad.entrega_kit_rash && (
                                <Badge variant="secondary" className="text-xs">
                                  {actividad.entrega_kit_rash.nombre}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Notas */}
                        {actividad.notas && (
                          <div>
                            <span className="text-sm font-medium">Notas:</span>
                            <p className="text-sm text-muted-foreground mt-1">
                              {actividad.notas}
                            </p>
                          </div>
                        )}

                        {/* Dirección de la institución */}
                        {actividad.institucion?.direccion && (
                          <div>
                            <span className="text-sm font-medium">Dirección:</span>
                            <p className="text-sm text-muted-foreground mt-1">
                              {actividad.institucion.direccion}
                            </p>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            ))
          )}
        </div>
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            Anterior
          </Button>
          
          <div className="flex gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let page = i + 1
              if (totalPages > 5 && currentPage > 3) {
                page = currentPage - 2 + i
                if (page > totalPages) page = totalPages - 4 + i
              }
              return (
                <Button
                  key={page}
                  variant={page === currentPage ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(page)}
                  className="w-8 h-8 p-0"
                >
                  {page}
                </Button>
              )
            })}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  )
}