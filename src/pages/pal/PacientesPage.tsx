import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import FichaForm from '@/components/pacientes/FichaForm'

import {Search, Filter, Users, FileText, Calendar } from 'lucide-react'
import { useFichas } from '@/hooks/useFichas'
import { useInstituciones } from '@/hooks/useInstituciones'
import { contactosService } from '@/services/contactosService'
import type { FichaPaciente } from '@/types/ficha'

export default function PacientesPage() {
  const navigate = useNavigate()
  const { fichas, loading, fetchFichas, buscarFichas } = useFichas()
  const { instituciones } = useInstituciones()
  
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedInstitucion, setSelectedInstitucion] = useState<string>('all')
  const [fechaInicio, setFechaInicio] = useState<string>('')
  const [filteredFichas, setFilteredFichas] = useState<FichaPaciente[]>([])

  

  // Aplicar filtros
  useEffect(() => {
    let result = fichas

    // Filtro por institución
    if (selectedInstitucion && selectedInstitucion !== 'all') {
      result = result.filter(ficha => ficha.institucion_id === selectedInstitucion)
    }

    // Filtro por fecha de inicio
    if (fechaInicio) {
      result = result.filter(ficha => 
        new Date(ficha.created_at) >= new Date(fechaInicio)
      )
    }

    setFilteredFichas(result)
  }, [fichas, selectedInstitucion, fechaInicio])

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
    setSearchTerm('')
    setSelectedInstitucion('all')
    setFechaInicio('')
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Censo de Pacientes</h1>
          <p className="text-muted-foreground">
            Gestión de fichas y seguimiento de pacientes
          </p>
        </div>
        <FichaForm onSuccess={fetchFichas} />
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Pacientes</p>
                <p className="text-2xl font-bold">{filteredFichas.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fichas Activas</p>
                <p className="text-2xl font-bold">{filteredFichas.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Este Mes</p>
                <p className="text-2xl font-bold">
                  {filteredFichas.filter(ficha => 
                    new Date(ficha.created_at).getMonth() === new Date().getMonth()
                  ).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros de Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
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

      {/* Tabla de fichas */}
      <Card>
        <CardHeader>
          <CardTitle>Fichas de Pacientes ({filteredFichas.length})</CardTitle>
        </CardHeader>
        <CardContent>
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
                            Ver fechas de tratamiento
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
  )
}