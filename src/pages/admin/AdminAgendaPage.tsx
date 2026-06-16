import { useState, useEffect, useMemo, useRef } from 'react'
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
  MapPin,
  Clock,
  Loader2,
  Navigation,
  Camera,
} from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
  const navigate = useNavigate()

  const [selectedMonth, setSelectedMonth] = useState(now.getMonth())
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [userSearch, setUserSearch] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [searchParams] = useSearchParams()
  const [visitas, setVisitas] = useState<Visita[]>([])
  const [loading, setLoading] = useState(false)
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0)

  const { users } = useUsers()

  const palUsers = useMemo(
    () => users.filter((u) => u.role === 'pal' && u.activo),
    [users]
  )

  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return palUsers
    const search = userSearch.toLowerCase()
    return palUsers.filter(
      (u) =>
        u.nombre_completo.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search)
    )
  }, [palUsers, userSearch])

  const displayUsers = useMemo(() => {
    if (selectedUserId) {
      const found = palUsers.find((u) => u.id === selectedUserId)
      return found ? [found] : []
    }
    return filteredUsers
  }, [selectedUserId, filteredUsers, palUsers])

  const monthDays = useMemo(() => {
    const start = startOfMonth(new Date(selectedYear, selectedMonth))
    const end = endOfMonth(start)
    return eachDayOfInterval({ start, end })
  }, [selectedMonth, selectedYear])

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

  const currentWeekDays = weeks[currentWeekIndex] || []

  useEffect(() => {
    const palId = searchParams.get('pal')
    if (palId && palUsers.length > 0) {
      const pal = palUsers.find(u => u.id === palId)
      if (pal) {
        setSelectedUserId(pal.id)
        setUserSearch(pal.nombre_completo)
      }
    }
  }, [palUsers])

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const start = format(startOfMonth(new Date(selectedYear, selectedMonth)), 'yyyy-MM-dd')
        const end = format(endOfMonth(new Date(selectedYear, selectedMonth)), 'yyyy-MM-dd')
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

  useEffect(() => {
    if (currentWeekIndex === 999) {
      setCurrentWeekIndex(weeks.length - 1)
      return
    }
    if (selectedMonth === now.getMonth() && selectedYear === now.getFullYear()) {
      const todayWeekIdx = weeks.findIndex((week) => week.some((d) => isToday(d)))
      setCurrentWeekIndex(todayWeekIdx >= 0 ? todayWeekIdx : 0)
    } else {
      setCurrentWeekIndex(0)
    }
  }, [weeks])

  const getVisitasForUserDay = (userId: string, day: Date): Visita[] => {
    const dayStr = format(day, 'yyyy-MM-dd')
    return visitas.filter((v) => {
      const visitaDay = format(new Date(v.fecha_visita), 'yyyy-MM-dd')
      return v.pal_id === userId && visitaDay === dayStr
    })
  }

  const handleVisitaClick = (visita: Visita) => {
    const fecha = format(new Date(visita.fecha_visita), 'yyyy-MM-dd')
    navigate(`/admin/visitas/${visita.id}?pal=${visita.pal_id}&institucion=${visita.institucion_id}&fecha=${fecha}`)
  }

  const years = useMemo(() => {
    const current = now.getFullYear()
    return [current - 1, current, current + 1]
  }, [])

  const clearUserFilter = () => {
    setSelectedUserId(null)
    setUserSearch('')
  }
  const scrollRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = (e: React.MouseEvent) => {
    const el = scrollRef.current
    if (!el) return
    const startX = e.pageX - el.offsetLeft
    const scrollLeft = el.scrollLeft

    const handleMouseMove = (e: MouseEvent) => {
      const x = e.pageX - el.offsetLeft
      el.scrollLeft = scrollLeft - (x - startX)
    }
    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  const VistaMovil = () => {
    const hoyStr = format(new Date(), 'yyyy-MM-dd')
  const [diaAbierto, setDiaAbierto] = useState<string>(hoyStr)
  const visitasSemana = currentWeekDays.map(day => {
    const dayStr = format(day, 'yyyy-MM-dd')
    const visitasDelDia = visitas
      .filter(v => format(new Date(v.fecha_visita), 'yyyy-MM-dd') === dayStr)
      .sort((a, b) => new Date(a.fecha_visita).getTime() - new Date(b.fecha_visita).getTime())
    return { day, visitasDelDia }
  }).filter(d => d.visitasDelDia.length > 0)

  if (visitasSemana.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        Sin visitas esta semana
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {currentWeekDays.map((day) => {
        const dayStr = format(day, 'yyyy-MM-dd')
        const visitasDelDia = visitas
          .filter(v => {
            const matchDia = format(new Date(v.fecha_visita), 'yyyy-MM-dd') === dayStr
            const matchPal = selectedUserId ? v.pal_id === selectedUserId : true
            return matchDia && matchPal
          })
          .sort((a, b) => new Date(a.fecha_visita).getTime() - new Date(b.fecha_visita).getTime())

        const estaAbierto = diaAbierto === dayStr

        return (
          <div key={dayStr} className="border rounded-lg overflow-hidden">
            <button
              onClick={() => setDiaAbierto(estaAbierto ? '' : dayStr)}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2 text-sm font-semibold',
                isToday(day)
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              <span>{format(day, "EEEE d 'de' MMMM", { locale: es })}</span>
              <div className="flex items-center gap-2">
                {visitasDelDia.length > 0 && (
                  <span className={cn(
                    'text-xs px-1.5 py-0.5 rounded-full font-medium',
                    isToday(day) ? 'bg-white/20 text-white' : 'bg-background text-foreground'
                  )}>
                    {visitasDelDia.length}
                  </span>
                )}
                <ChevronRight className={cn('h-4 w-4 transition-transform', estaAbierto && 'rotate-90')} />
              </div>
            </button>

            {estaAbierto && (
              <div className="p-2 space-y-2">
                {visitasDelDia.length === 0 ? (
                  <p className="text-center text-xs text-muted-foreground py-4">Sin visitas</p>
                ) : (
                  visitasDelDia.map(v => {
                    const pal = palUsers.find(u => u.id === v.pal_id)
                    return (
                      <button
                        key={v.id}
                        onClick={() => handleVisitaClick(v)}
                        className={cn(
                          'w-full text-left rounded-lg border p-3 text-xs transition-opacity hover:opacity-80',
                          ESTADO_COLORS[v.estado] || 'bg-gray-50 border-gray-200'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          {v.fotos_evidencia && v.fotos_evidencia.length > 0 ? (
                            <img
                              src={v.fotos_evidencia[0].url_storage}
                              alt="Evidencia"
                              className="w-12 h-12 object-cover rounded shrink-0"
                            />
                          ) : null}
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1 font-semibold truncate">
                                <MapPin className="h-3 w-3 shrink-0" />
                                <span className="truncate">{v.institucion?.nombre || 'N/A'}</span>
                              </div>
                              <div className="flex items-center gap-1 text-[10px] opacity-75 shrink-0">
                                <Clock className="h-2.5 w-2.5" />
                                {format(new Date(v.fecha_visita), 'HH:mm')}
                              </div>
                            </div>
                            {!selectedUserId && (
                              <p className="text-[10px] text-muted-foreground font-medium">
                                {pal?.nombre_completo ?? '—'}
                              </p>
                            )}
                            {v.estado === 'asistio' && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                <span className={cn(
                                  'text-[10px] px-1 py-0.5 rounded border font-medium',
                                  v.validacion_gps ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
                                )}>
                                  {v.validacion_gps ? 'En rango' : 'Muy lejos'}
                                </span>
                                {v.distancia_metros != null && (
                                  <span className="text-[10px] px-1 py-0.5 rounded border font-medium bg-muted text-muted-foreground border-muted-foreground/20">
                                    {v.distancia_metros}m
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    )
                  })
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Agenda de Visitas</h1>
        <p className="text-sm text-muted-foreground">
          Vista semanal por usuario de todas las visitas
        </p>
      </div>

      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
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

            <div className="flex-1 flex gap-2">
              <Select
                value={selectedUserId ?? 'todos'}
                onValueChange={(v) => {
                  if (v === 'todos') {
                    clearUserFilter()
                  } else {
                    const pal = palUsers.find(u => u.id === v)
                    setSelectedUserId(v)
                    setUserSearch(pal?.nombre_completo ?? '')
                  }
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Todos los PALs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos los PALs</SelectItem>
                  {palUsers.map(u => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.nombre_completo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navegación de semanas */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (currentWeekIndex === 0) {
              // Ir al mes anterior, última semana
              const newMonth = selectedMonth === 0 ? 11 : selectedMonth - 1
              const newYear = selectedMonth === 0 ? selectedYear - 1 : selectedYear
              setSelectedMonth(newMonth)
              setSelectedYear(newYear)
              // Ir a la última semana — se ajusta en el useEffect de weeks
              setCurrentWeekIndex(999) // valor alto, se corregirá
            } else {
              setCurrentWeekIndex((p) => p - 1)
            }
          }}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Anterior
        </Button>

        <span className="text-sm font-medium">
          Semana {currentWeekIndex + 1} de {weeks.length}<br/>
          {currentWeekDays.length > 0 && (
            <span className="text-muted-foreground ml-2">
              ({format(currentWeekDays[0], 'd MMM', { locale: es })} —{' '}
              {format(currentWeekDays[currentWeekDays.length - 1], 'd MMM', { locale: es })})
            </span>
          )}
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (currentWeekIndex >= weeks.length - 1) {
              // Ir al mes siguiente, primera semana
              const newMonth = selectedMonth === 11 ? 0 : selectedMonth + 1
              const newYear = selectedMonth === 11 ? selectedYear + 1 : selectedYear
              setSelectedMonth(newMonth)
              setSelectedYear(newYear)
              setCurrentWeekIndex(0)
            } else {
              setCurrentWeekIndex((p) => p + 1)
            }
          }}
        >
          Siguiente
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>

      {/* Desktop */}
      <Card className="hidden lg:block py-0">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">Cargando visitas...</span>
            </div>
          ) : displayUsers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No se encontraron usuarios
            </div>
          ) : (
            <div
              ref={scrollRef}
              className="overflow-x-auto rounded-lg cursor-grab active:cursor-grabbing select-none"
              onMouseDown={handleMouseDown}
            >
              <table className="w-full border-collapse" style={{ minWidth: `${160 + currentWeekDays.length * 140}px` }}>
                <thead>
                  <tr className="border-b">
                    {/* Columna PAL — fondo sólido */}
                    <th className="text-left p-3 font-medium text-sm bg-muted border-r sticky left-0 z-20 w-40">
                      PAL
                    </th>
                    {currentWeekDays.map((day) => (
                      <th
                        key={day.toISOString()}
                        className={cn(
                          'text-center p-2 font-medium text-sm border-l',
                          isToday(day) ? 'bg-primary/8' : 'bg-muted/40'
                        )}
                        style={{ minWidth: 140 }}
                      >
                        <div className={cn(
                          'text-xs',
                          isToday(day) ? 'text-primary font-semibold' : 'text-muted-foreground'
                        )}>
                          {format(day, 'EEE', { locale: es })}
                        </div>
                        <div className={cn(
                          'text-base',
                          isToday(day) && 'text-primary font-bold'
                        )}>
                          {format(day, 'd')}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayUsers.map((user, userIdx) => (
                    <tr
                      key={user.id}
                      className={cn('border-b last:border-b-0', userIdx % 2 === 0 ? '' : 'bg-muted/20')}
                    >
                      {/* Columna nombre PAL — fondo sólido para que no se vea encimado al hacer scroll */}
                      <td
                        className={cn(
                          'p-3 border-r sticky left-0 z-10 w-40',
                          userIdx % 2 === 0 ? 'bg-muted' : 'bg-muted/80'
                        )}
                      >
                        <div className="text-sm font-medium leading-tight">
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
                            style={{ minWidth: 140 }}
                          >
                            {dayVisitas.length > 0 ? (
                              <div className="space-y-1">
                                {dayVisitas
                                  .sort((a, b) =>
                                    new Date(a.fecha_visita).getTime() - new Date(b.fecha_visita).getTime()
                                  )
                                  .map((v) => (
                                    <button
                                      key={v.id}
                                      onClick={() => handleVisitaClick(v)}
                                      className={cn(
                                        'rounded p-1.5 text-xs border w-full text-left hover:opacity-80 transition-opacity cursor-pointer',
                                        ESTADO_COLORS[v.estado] || 'bg-gray-50 border-gray-200'
                                      )}
                                    >
                                      {v.estado === 'asistio' ? (
                                        <div className="flex gap-1.5">
                                          {/* Columna 1 — foto */}
                                          <div className="flex-shrink-0 w-14">
                                            {v.fotos_evidencia && v.fotos_evidencia.length > 0 ? (
                                              <img
                                                src={v.fotos_evidencia[0].url_storage}
                                                alt="Evidencia"
                                                className="w-14 h-14 object-cover rounded"
                                              />
                                            ) : (
                                              <div className="w-14 h-14 rounded bg-muted flex items-center justify-center">
                                                <Camera className="h-4 w-4 text-muted-foreground/40" />
                                              </div>
                                            )}
                                          </div>

                                          {/* Columna 2 — datos */}
                                          <div className="flex-1 min-w-0 space-y-1">
                                            <div className="flex items-center gap-1 font-medium truncate text-xs">
                                              <MapPin className="h-3 w-3 flex-shrink-0" />
                                              <span className="truncate">{v.institucion?.nombre || 'N/A'}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-[10px] opacity-75">
                                              <Clock className="h-2.5 w-2.5" />
                                              {format(new Date(v.fecha_visita), 'HH:mm')}
                                            </div>
                                            <div className="flex flex-wrap gap-1 mt-1">
                                              <span className={cn(
                                                'text-[10px] px-1 py-0.5 rounded border font-medium',
                                                v.validacion_gps
                                                  ? 'bg-green-50 text-green-700 border-green-200'
                                                  : 'bg-red-50 text-red-700 border-red-200'
                                              )}>
                                                {v.validacion_gps ? 'En rango' : 'Muy lejos'}
                                              </span>
                                              <span className={cn(
                                                'text-[10px] px-1 py-0.5 rounded border font-medium',
                                                v.latitud_registro != null
                                                  ? 'bg-green-50 text-green-700 border-green-200'
                                                  : 'bg-red-50 text-red-700 border-red-200'
                                              )}>
                                                GPS. {v.latitud_registro != null ? 'registrado' : 'sin registro'}
                                              </span>
                                              <span className="text-[10px] px-1 py-0.5 rounded border font-medium bg-muted text-muted-foreground border-muted-foreground/20">
                                                {v.distancia_metros != null ? `${v.distancia_metros}m` : 'Sin dist.'}
                                              </span>
                                            </div>
                                          </div>
                                        </div>
                                      ) : (
                                        // Vista normal para programada / falto
                                        <>
                                          <div className="flex items-center gap-1 font-medium truncate">
                                            <MapPin className="h-3 w-3 flex-shrink-0" />
                                            <span className="truncate">{v.institucion?.nombre || 'N/A'}</span>
                                          </div>
                                          <div className="flex items-center gap-1 mt-0.5 text-[10px] opacity-75">
                                            <Clock className="h-2.5 w-2.5" />
                                            {format(new Date(v.fecha_visita), 'HH:mm')}
                                          </div>
                                        </>
                                      )}
                                    </button>
                                  ))}
                              </div>
                            ) : (
                              <div className="text-center text-muted-foreground/40 text-xs py-3">
                                —
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

      {/* Móvil */}
      <div className="lg:hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Cargando visitas...</span>
          </div>
        ) : (
          <VistaMovil />
        )}
      </div>

      {/* Leyenda */}
      <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-yellow-200 border border-yellow-300" />
          Programada
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-green-200 border border-green-300" />
          Asistió
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-red-200 border border-red-300" />
          Faltó
        </div>
        <div className="flex items-center gap-1.5">
          <Navigation className="h-3 w-3" />
          GPS validado
        </div>
        <div className="flex items-center gap-1.5">
          <Navigation className="h-3 w-3 opacity-50" />
          GPS fuera de rango
        </div>
      </div>
    </div>
  )
}