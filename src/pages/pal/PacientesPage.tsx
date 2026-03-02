import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import FichaForm from '@/components/pacientes/FichaForm'
import { Search, Filter, ChevronDown, ChevronUp, Building, Calendar, Phone, FileText } from 'lucide-react'
import { useFichas } from '@/hooks/useFichas'
import { useInstituciones } from '@/hooks/useInstituciones'
import { contactosService } from '@/services/contactosService'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'
import type { FichaPaciente } from '@/types/ficha'

export default function PacientesPage() {
  const navigate = useNavigate()
  const { fichas, loading, fetchFichas, buscarFichas } = useFichas()
  const { instituciones } = useInstituciones()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedInstitucion, setSelectedInstitucion] = useState<string>('all')
  const [fechaInicio, setFechaInicio] = useState<string>('')
  const [fechaFin, setFechaFin] = useState<string>('')
  const [filteredFichas, setFilteredFichas] = useState<FichaPaciente[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())

  // Inicializar fechas (último mes)
  useEffect(() => {
    const now = new Date()
    const inicio = startOfMonth(subMonths(now, 1))
    const fin = endOfMonth(now)
    
    setFechaInicio(format(inicio, 'yyyy-MM-dd'))
    setFechaFin(format(fin, 'yyyy-MM-dd'))
  }, [])

  // Aplicar filtros
  useEffect(() => {
    let result = fichas

    // Filtro por institución
    if (selectedInstitucion && selectedInstitucion !== 'all') {
      result = result.filter(ficha => ficha.institucion_id === selectedInstitucion)
    }

    // Filtro por rango de fechas
    if (fechaInicio) {
      result = result.filter(ficha => 
        new Date(ficha.created_at) >= new Date(fechaInicio)
      )
    }
    if (fechaFin) {
      result = result.filter(ficha => 
        new Date(ficha.created_at) <= new Date(fechaFin)
      )
    }

    setFilteredFichas(result)
  }, [fichas, selectedInstitucion, fechaInicio, fechaFin])

  // Buscar por texto
  const handleSearch = async () => {
    if (searchTerm.trim()) {
      await buscarFichas(searchTerm)
    } else {
      await fetchFichas()
    }
  }

  // Limpiar filtros
  const clearFilters = () => {
    const now = new Date()
    const inicio = startOfMonth(subMonths(now, 1))
    const fin = endOfMonth(now)
    
    setSearchTerm('')
    setSelectedInstitucion('all')
    setFechaInicio(format(inicio, 'yyyy-MM-dd'))
    setFechaFin(format(fin, 'yyyy-MM-dd'))
    fetchFichas()
  }

  const formatearNombre = (paciente: any) => {
    if (!paciente) return 'Sin datos'
    const partes = [
      paciente.nombre,
      paciente.apellido_pat,
      paciente.apellido_mat
    ].filter(Boolean)
    return partes.join(' ')
  }

  const calcularEdad = (fechaNacimiento: string) => {
    if (!fechaNacimiento) return null
    return contactosService.calcularEdad(fechaNacimiento)
  }

  const formatDateRange = () => {
    if (!fechaInicio || !fechaFin) return 'Seleccionar período'
    
    const inicio = new Date(fechaInicio)
    const fin = new Date(fechaFin)
    
    return `${format(inicio, 'd MMM', { locale: es })} - ${format(fin, 'd MMM yyyy', { locale: es })}`
  }

  // Funciones para manejar expansión en móvil
  const toggleExpand = (fichaId: string) => {
    const newExpanded = new Set(expandedItems)
    if (newExpanded.has(fichaId)) {
      newExpanded.delete(fichaId)
    } else {
      newExpanded.add(fichaId)
    }
    setExpandedItems(newExpanded)
  }

  // Estadísticas
  const thisMonthCount = filteredFichas.filter(ficha => 
    new Date(ficha.created_at).getMonth() === new Date().getMonth()
  ).length

  return (
    <div className="p-6 space-y-6">
      {/* Header - Desktop y Mobile diferentes */}
      <div className="hidden md:flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Censo de Pacientes</h1>
          <p className="text-muted-foreground">
            Gestión de fichas y seguimiento de pacientes
          </p>
        </div>
        <FichaForm onSuccess={fetchFichas} />
      </div>

      {/* Mobile Header */}
      <div className="md:hidden">
        <div className="mb-4">
          <h1 className="text-3xl font-bold">Censo de Pacientes</h1>
          <p className="text-muted-foreground mt-1">
            Registro y seguimiento de pacientes registrados
          </p>
        </div>
      </div>

      {/* Estadísticas híper minimalistas */}
      <div className="grid gap-4 grid-cols-3">
        <Card>
          <CardContent className="p-4 py-0">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Total Pacientes</p>
              <p className="text-3xl font-bold">{filteredFichas.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 py-0">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Fichas Activas</p>
              <p className="text-3xl font-bold">{filteredFichas.length}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 py-0">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Este Mes</p>
              <p className="text-3xl font-bold">{thisMonthCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botones principales - Desktop */}
      <div className="hidden md:block">
        <div className="flex justify-end">
          <FichaForm onSuccess={fetchFichas} />
        </div>
      </div>

      {/* Botones principales - Mobile */}
      <div className="md:hidden flex gap-3">
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
        
        <div className="flex-1">
          <FichaForm onSuccess={fetchFichas} />
        </div>
      </div>

      {/* Filtros - Desktop siempre visible */}
      <div className="hidden md:block">
        <Card>
          <CardContent className="p-6">
            <div className="grid gap-4 md:grid-cols-4">
              {/* Búsqueda por texto */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Buscar por folio</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar folio..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>
                  <Button onClick={handleSearch} variant="outline">
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Filtro por institución */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Institución</label>
                <Select value={selectedInstitucion} onValueChange={setSelectedInstitucion}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todas las instituciones" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las instituciones</SelectItem>
                    {instituciones.map(institucion => (
                      <SelectItem key={institucion.id} value={institucion.id}>
                        {institucion.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro por fecha */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Fecha desde</label>
                <Input
                  type="date"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                />
              </div>

              {/* Botón limpiar */}
              <div className="space-y-2">
                <label className="text-sm font-medium">&nbsp;</label>
                <Button variant="outline" onClick={clearFilters} className="w-full">
                  Limpiar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros colapsables - Solo Mobile */}
      <div className="md:hidden">
        <Collapsible open={showFilters} onOpenChange={setShowFilters}>
          <CollapsibleContent>
            <Card>
              <CardContent className="p-4">
                <div className="space-y-4">
                  {/* Búsqueda por texto */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Buscar por folio</label>
                    <Input
                      placeholder="Buscar folio..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                  </div>

                  {/* Filtro por institución */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Institución</label>
                    <Select value={selectedInstitucion} onValueChange={setSelectedInstitucion}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        {instituciones.map(institucion => (
                          <SelectItem key={institucion.id} value={institucion.id}>
                            {institucion.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filtros de fecha */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Fecha desde</label>
                      <Input
                        type="date"
                        value={fechaInicio}
                        onChange={(e) => setFechaInicio(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Fecha hasta</label>
                      <Input
                        type="date"
                        value={fechaFin}
                        onChange={(e) => setFechaFin(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4 pt-4 border-t">
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    Limpiar Filtros
                  </Button>
                  <div className="text-sm text-muted-foreground">
                    {loading ? 'Cargando...' : `${filteredFichas.length} pacientes`}
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
          <CardContent className="p-6">
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-lg font-semibold">Fichas de Pacientes</h2>
              <div className="text-sm text-muted-foreground">
                {loading ? 'Cargando...' : `${filteredFichas.length} pacientes encontrados`}
              </div>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Cargando fichas...</p>
              </div>
            ) : filteredFichas.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No se encontraron fichas</p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Folio</TableHead>
                      <TableHead>Paciente</TableHead>
                      <TableHead>Edad</TableHead>
                      <TableHead>Institución</TableHead>
                      <TableHead>Diagnóstico</TableHead>
                      <TableHead>Terapia</TableHead>
                      <TableHead>Fecha Registro</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFichas.map((ficha) => {
                      const edad = ficha.paciente?.fecha_nacimiento 
                        ? calcularEdad(ficha.paciente.fecha_nacimiento)
                        : null

                      return (
                        <TableRow key={ficha.id}>
                          <TableCell className="font-medium">
                            {ficha.folio}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{formatearNombre(ficha.paciente)}</p>
                              {ficha.paciente?.telefono && (
                                <p className="text-sm text-muted-foreground">
                                  {ficha.paciente.telefono}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {edad ? `${edad} años` : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {ficha.institucion?.nombre}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {ficha.diagnostico || '-'}
                          </TableCell>
                          <TableCell>
                            {ficha.terapia || '-'}
                          </TableCell>
                          <TableCell>
                            {new Date(ficha.created_at).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => navigate(`/pal/pacientes/${ficha.id}/fechas`)}
                            >
                              Ver fechas
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Vista Mobile - Cards */}
      <div className="md:hidden">
        <div className="space-y-3">
          {loading ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-muted-foreground">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  Cargando pacientes...
                </div>
              </CardContent>
            </Card>
          ) : filteredFichas.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <div className="text-center text-muted-foreground">
                  <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <h3 className="font-medium mb-1">No hay pacientes</h3>
                  <p className="text-sm">No se encontraron fichas para los filtros seleccionados</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredFichas.map(ficha => {
              const edad = ficha.paciente?.fecha_nacimiento 
                ? calcularEdad(ficha.paciente.fecha_nacimiento)
                : null

              return (
                <Collapsible key={ficha.id}>
                  <Card className="hover:shadow-md transition-shadow">
                    <CollapsibleTrigger 
                      className="w-full"
                      onClick={() => toggleExpand(ficha.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1 text-left space-y-2">
                            {/* 1. NOMBRE DEL PACIENTE - Más importante */}
                            <div>
                              <h3 className="font-semibold text-base leading-tight">
                                {formatearNombre(ficha.paciente)}
                              </h3>
                              {edad && (
                                <p className="text-sm text-muted-foreground">
                                  {edad} años
                                </p>
                              )}
                            </div>

                            {/* 2. INSTITUCIÓN - Segunda importancia */}
                            <div className="flex items-center gap-2">
                              <Building className="h-3 w-3 text-muted-foreground" />
                              <Badge variant="secondary" className="text-xs">
                                {ficha.institucion?.nombre}
                              </Badge>
                            </div>

                            {/* 3. FOLIO */}
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <FileText className="h-3 w-3" />
                              <span>Folio: {ficha.folio}</span>
                            </div>
                          </div>

                          {/* Icono de expansión */}
                          <div className="flex-shrink-0">
                            {expandedItems.has(ficha.id) ? (
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
                          {/* Teléfono */}
                          {ficha.paciente?.telefono && (
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              <span>{ficha.paciente.telefono}</span>
                            </div>
                          )}
                          
                          {/* Diagnóstico */}
                          {ficha.diagnostico && (
                            <div>
                              <span className="text-sm font-medium">Diagnóstico:</span>
                              <p className="text-sm text-muted-foreground mt-1">
                                {ficha.diagnostico}
                              </p>
                            </div>
                          )}
                          
                          {/* Terapia */}
                          {ficha.terapia && (
                            <div>
                              <span className="text-sm font-medium">Terapia:</span>
                              <p className="text-sm text-muted-foreground mt-1">
                                {ficha.terapia}
                              </p>
                            </div>
                          )}

                          {/* Fecha registro */}
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>Registrado: {new Date(ficha.created_at).toLocaleDateString()}</span>
                          </div>

                          {/* Botón de acción */}
                          <div className="pt-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => navigate(`/pal/pacientes/${ficha.id}/fechas`)}
                              className="w-full"
                            >
                              Ver fechas de tratamiento
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}