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
import { Plus, Search, Calendar, Building2, User, ChevronDown, ChevronUp } from 'lucide-react'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
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
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [showWizard, setShowWizard] = useState(false)
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
    
    setFechaInicio(format(inicio, 'yyyy-MM-dd'))
    setFechaFin(format(fin, 'yyyy-MM-dd'))
    setInstitucionSeleccionada('todas')
    setSearchTerm('')
    setCurrentPage(1)
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Mis Actividades</h1>
        <Button onClick={() => setShowWizard(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Actividad
        </Button>
      </div>

      {/* Wizard de nueva actividad */}
      <ActividadWizard
        open={showWizard}
        onOpenChange={setShowWizard}
        onSubmit={handleNuevaActividad}
        loading={formLoading}
      />

      {/* Filtros */}
      <Card className="mb-6">
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

      {/* Vista Mobile - Cards */}
      <div className="md:hidden">
        <div className="space-y-3">
          {loading ? (
            <Card>
              <CardContent className="p-4">
                <div className="text-center">Cargando actividades...</div>
              </CardContent>
            </Card>
          ) : paginatedActividades.length === 0 ? (
            <Card>
              <CardContent className="p-4">
                <div className="text-center text-muted-foreground">
                  No se encontraron actividades
                </div>
              </CardContent>
            </Card>
          ) : (
            paginatedActividades.map(actividad => (
              <Collapsible key={actividad.id}>
                <Card>
                  <CollapsibleTrigger 
                    className="w-full"
                    onClick={() => toggleExpand(actividad.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 text-left">
                          <div className="font-medium text-sm">
                            {actividad.institucion?.nombre || 'Sin institución'}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {formatearFechaHora(actividad)}
                          </div>
                          <div className="text-xs mt-1">
                            {actividad.contacto ? (
                              <div className="flex items-center gap-2">
                                <User className="h-3 w-3" />
                                {formatearNombreContacto(actividad.contacto)}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Sin contacto</span>
                            )}
                          </div>
                        </div>
                        <div className="ml-2">
                          {expandedItems.has(actividad.id) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <CardContent className="pt-0 px-4 pb-4">
                      <div className="space-y-3 border-t pt-3">
                        {actividad.contacto && (
                          <div>
                            <span className="text-xs font-medium">Tipo de Contacto:</span>
                            <div className="mt-1">
                              <Badge variant="outline" className="text-xs">
                                {getTipoContactoLabel(actividad.contacto.tipo_contacto)}
                              </Badge>
                            </div>
                          </div>
                        )}
                        
                        {actividad.descripcion_actividad && (
                          <div>
                            <span className="text-xs font-medium">Actividad:</span>
                            <p className="text-xs text-muted-foreground mt-1">
                              {actividad.descripcion_actividad}
                            </p>
                          </div>
                        )}
                        
                        {actividad.temas_impartidos && (
                          <div>
                            <span className="text-xs font-medium">Temas Impartidos:</span>
                            <p className="text-xs text-muted-foreground mt-1">
                              {actividad.temas_impartidos}
                            </p>
                          </div>
                        )}
                        
                        {(actividad.entrega_sobres || actividad.entrega_kit_rash) && (
                          <div>
                            <span className="text-xs font-medium">Entregas:</span>
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
                        
                        {actividad.notas && (
                          <div>
                            <span className="text-xs font-medium">Notas:</span>
                            <p className="text-xs text-muted-foreground mt-1">
                              {actividad.notas}
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