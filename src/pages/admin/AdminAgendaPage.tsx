// pages/admin/AdminAgendaPage.tsx
import { useState, useEffect, useMemo } from 'react'
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isToday,
  startOfWeek,
} from 'date-fns'
import { es } from 'date-fns/locale'
import {
  ChevronLeft,
  ChevronRight,
  Search,
  X,
  MapPin,
  Clock,
  Loader2,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { visitasService } from '@/services/visitasService'
import { useUsers } from '@/hooks/useUsers'
import type { Visita } from '@/types/visita'

// Helpers
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const ESTADO_COLORS: Record<string, string> = {
  programada: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  asistio: 'bg-green-100 text-green-800 border-green-200',
  falto: 'bg-red-100 text-red-800 border-red-200',
}

export default function AdminAgendaPage() {
  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth())
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [userSearch, setUserSearch] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [visitas, setVisitas] = useState<Visita[]>([])
  const [loading, setLoading] = useState(false)
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0)

  const { users } = useUsers()

  // Solo PALs activos
  const palUsers = useMemo(
    () => users.filter((u) => u.role === 'pal' && u.activo),
    [users]
  )

  // Filtro de usuarios por búsqueda
  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return palUsers
    const search = userSearch.toLowerCase()
    return palUsers.filter(
      (u) =>
        u.nombre_completo.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search)
    )
  }, [palUsers, userSearch])

  // Usuarios a mostrar (si seleccionó uno específico, solo ese)
  const displayUsers = useMemo(() => {
    if (selectedUserId) {
      const found = palUsers.find((u) => u.id === selectedUserId)
      return found ? [found] : []
    }
    return filteredUsers
  }, [selectedUserId, filteredUsers, palUsers])

  // Días del mes
  const monthDays = useMemo(() => {
    const start = startOfMonth(new Date(selectedYear, selectedMonth))
    const end = endOfMonth(start)
    return eachDayOfInterval({ start, end })
  }, [selectedMonth, selectedYear])

  // Agrupar días por semana
  const weeks = useMemo(() => {
    const weeksMap: Date[][] = []
    let currentWeek: Date[] = []
    let currentWeekStart: Date | null = null

    monthDays.forEach((day) => {
      const weekStart = startOfWeek(day, { locale: es })
      if (!currentWeekStart || weekStart.getTime() !== currentWeekStart.getTime()) {
        if (currentWeek.length > 0) weeksMap.push(currentWeek)
        currentWeek = [day]
        currentWeekStart = weekStart
      } else {
        currentWeek.push(day)
      }
    })
    if (currentWeek.length > 0) weeksMap.push(currentWeek)

    return weeksMap
  }, [monthDays])

  // Semana actual visible
  const currentWeekDays = weeks[currentWeekIndex] || []

  // Cargar visitas cuando cambie mes/año
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const start = format(
          startOfMonth(new Date(selectedYear, selectedMonth)),
          'yyyy-MM-dd'
        )
        const end = format(
          endOfMonth(new Date(selectedYear, selectedMonth)),
          'yyyy-MM-dd'
        )
        const data = await visitasService.getVisitasByRangoFechas(start, end)
        setVisitas(data)
      } catch (err) {
        console.error('Error cargando visitas:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [selectedMonth, selectedYear])

  // Reset semana al cambiar mes
  useEffect(() => {
    // Encontrar la semana que contiene "hoy" si estamos en el mes actual
    if (
      selectedMonth === now.getMonth() &&
      selectedYear === now.getFullYear()
    ) {
      const todayWeekIdx = weeks.findIndex((week) =>
        week.some((d) => isToday(d))
      )
      setCurrentWeekIndex(todayWeekIdx >= 0 ? todayWeekIdx : 0)
    } else {
      setCurrentWeekIndex(0)
    }
  }, [weeks])

  // Obtener visitas de un usuario en un día
  const getVisitasForUserDay = (userId: string, day: Date): Visita[] => {
    const dayStr = format(day, 'yyyy-MM-dd')
    return visitas.filter((v) => {
      const visitaDay = format(new Date(v.fecha_visita), 'yyyy-MM-dd')
      return v.pal_id === userId && visitaDay === dayStr
    })
  }

  // Años disponibles
  const years = useMemo(() => {
    const current = now.getFullYear()
    return [current - 1, current, current + 1]
  }, [])

  const clearUserFilter = () => {
    setSelectedUserId(null)
    setUserSearch('')
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Agenda de Visitas</h1>
        <p className="text-sm text-muted-foreground">
          Vista semanal por usuario de todas las visitas
        </p>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Mes */}
            <div className="flex gap-2">
              <Select
                value={String(selectedMonth)}
                onValueChange={(v) => setSelectedMonth(Number(v))}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, i) => (
                    <SelectItem key={i} value={String(i)}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={String(selectedYear)}
                onValueChange={(v) => setSelectedYear(Number(v))}
              >
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Buscador de usuario */}
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar PAL..."
                  value={userSearch}
                  onChange={(e) => {
                    setUserSearch(e.target.value)
                    setSelectedUserId(null)
                  }}
                  className="pl-9"
                />
                {(userSearch || selectedUserId) && (
                  <button
                    onClick={clearUserFilter}
                    className="absolute right-2.5 top-2.5"
                  >
                    <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                  </button>
                )}

                {/* Dropdown de resultados */}
                {userSearch && !selectedUserId && filteredUsers.length > 0 && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-background border rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {filteredUsers.map((u) => (
                      <button
                        key={u.id}
                        onClick={() => {
                          setSelectedUserId(u.id)
                          setUserSearch(u.nombre_completo)
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors"
                      >
                        {u.nombre_completo}
                        <span className="text-muted-foreground ml-2 text-xs">
                          {u.email}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navegación de semanas */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentWeekIndex((p) => Math.max(0, p - 1))}
          disabled={currentWeekIndex === 0}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Anterior
        </Button>

        <span className="text-sm font-medium">
          Semana {currentWeekIndex + 1} de {weeks.length}
          {currentWeekDays.length > 0 && (
            <span className="text-muted-foreground ml-2">
              ({format(currentWeekDays[0], 'd MMM', { locale: es })} -{' '}
              {format(currentWeekDays[currentWeekDays.length - 1], 'd MMM', {
                locale: es,
              })}
              )
            </span>
          )}
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            setCurrentWeekIndex((p) => Math.min(weeks.length - 1, p + 1))
          }
          disabled={currentWeekIndex >= weeks.length - 1}
        >
          Siguiente
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Tabla principal */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">
                Cargando visitas...
              </span>
            </div>
          ) : displayUsers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No se encontraron usuarios
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-medium text-sm bg-muted sticky left-0 z-10 min-w-[160px]">
                      PAL
                    </th>
                    {currentWeekDays.map((day) => (
                      <th
                        key={day.toISOString()}
                        className={cn(
                          'text-center p-2 font-medium text-sm min-w-[140px] border-l',
                          isToday(day) && 'bg-primary/5'
                        )}
                      >
                        <div
                          className={cn(
                            'text-xs text-muted-foreground',
                            isToday(day) && 'text-primary font-semibold'
                          )}
                        >
                          {format(day, 'EEE', { locale: es })}
                        </div>
                        <div
                          className={cn(
                            'text-base',
                            isToday(day) &&
                              'text-primary font-bold'
                          )}
                        >
                          {format(day, 'd')}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayUsers.map((user) => (
                    <tr key={user.id} className="border-b last:border-b-0">
                      <td className="p-3 bg-muted/50 sticky left-0 z-10">
                        <div className="text-sm font-medium truncate max-w-[150px]">
                          {user.nombre_completo}
                        </div>
                      </td>
                      {currentWeekDays.map((day) => {
                        const dayVisitas = getVisitasForUserDay(user.id, day)
                        return (
                          <td
                            key={day.toISOString()}
                            className={cn(
                              'p-1.5 border-l align-top',
                              isToday(day) && 'bg-primary/5'
                            )}
                          >
                            {dayVisitas.length > 0 ? (
                              <div className="space-y-1">
                                {dayVisitas
                                  .sort(
                                    (a, b) =>
                                      new Date(a.fecha_visita).getTime() -
                                      new Date(b.fecha_visita).getTime()
                                  )
                                  .map((v) => (
                                    <div
                                      key={v.id}
                                      className={cn(
                                        'rounded p-1.5 text-xs border',
                                        ESTADO_COLORS[v.estado] ||
                                          'bg-gray-50 border-gray-200'
                                      )}
                                    >
                                      <div className="flex items-center gap-1 font-medium truncate">
                                        <MapPin className="h-3 w-3 flex-shrink-0" />
                                        <span className="truncate">
                                          {v.institucion?.nombre || 'N/A'}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-1 mt-0.5 text-[10px] opacity-75">
                                        <Clock className="h-2.5 w-2.5" />
                                        {format(
                                          new Date(v.fecha_visita),
                                          'HH:mm'
                                        )}
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            ) : (
                              <div className="text-center text-muted-foreground text-xs py-2">
                                -
                              </div>
                            )}
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Leyenda */}
      <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-yellow-200 border border-yellow-300" />
          Programada
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-green-200 border border-green-300" />
          Asistio
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-red-200 border border-red-300" />
          Falto
        </div>
      </div>
    </div>
  )
}