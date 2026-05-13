import { useState, useEffect, useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { AlertCircle, Info, AlertTriangle, Search, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useLogs } from '@/hooks/useLogs'
import { useUsers } from '@/hooks/useUsers'

const NIVEL_CONFIG = {
  error: {
    label: 'Error',
    icon: AlertCircle,
    class: 'bg-red-50 text-red-700 border-red-200',
  },
  warn: {
    label: 'Advertencia',
    icon: AlertTriangle,
    class: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  },
  info: {
    label: 'Info',
    icon: Info,
    class: 'bg-blue-50 text-blue-700 border-blue-200',
  },
}

export default function AdminLogsPage() {
  const { logs, loading, fetchLogs } = useLogs()
  const { users } = useUsers()

  const [selectedUserId, setSelectedUserId] = useState<string>('todos')
  const [selectedNivel, setSelectedNivel] = useState<string>('todos')
  const [contextoSearch, setContextoSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const palUsers = useMemo(() => users.filter((u) => u.activo), [users])

  const userMap = useMemo(() => {
    const map: Record<string, string> = {}
    users.forEach(u => { map[u.id] = u.nombre_completo })
    return map
    }, [users])

  useEffect(() => {
    fetchLogs({ limit: 300 })
  }, [])

  const logsFiltrados = useMemo(() => {
    return logs.filter((log) => {
      if (selectedUserId !== 'todos' && log.user_id !== selectedUserId) return false
      if (selectedNivel !== 'todos' && log.nivel !== selectedNivel) return false
      if (contextoSearch && !log.contexto.toLowerCase().includes(contextoSearch.toLowerCase())) return false
      return true
    })
  }, [logs, selectedUserId, selectedNivel, contextoSearch])

  const clearFiltros = () => {
    setSelectedUserId('todos')
    setSelectedNivel('todos')
    setContextoSearch('')
  }

  const hayFiltros = selectedUserId !== 'todos' || selectedNivel !== 'todos' || contextoSearch

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Logs del Sistema</h1>
        <p className="text-sm text-muted-foreground">
          Registro de errores y eventos de los usuarios
        </p>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Todos los usuarios" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los usuarios</SelectItem>
                {palUsers.map((u) => (
                  <SelectItem key={u.id} value={u.id}>
                    {u.nombre_completo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedNivel} onValueChange={setSelectedNivel}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Todos los niveles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los niveles</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="warn">Advertencia</SelectItem>
                <SelectItem value="info">Info</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por contexto..."
                value={contextoSearch}
                onChange={(e) => setContextoSearch(e.target.value)}
                className="pl-9"
              />
            </div>

            {hayFiltros && (
              <button
                onClick={clearFiltros}
                className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
                Limpiar
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            {loading ? 'Cargando...' : `${logsFiltrados.length} registros`}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              Cargando logs...
            </div>
          ) : logsFiltrados.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              No hay registros
            </div>
          ) : (
            <div className="divide-y">
              {logsFiltrados.map((log) => {
                const config = NIVEL_CONFIG[log.nivel]
                const Icon = config.icon
                const isExpanded = expandedId === log.id

                return (
                  <div
                    key={log.id}
                    className="px-4 py-3 hover:bg-muted/30 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : log.id)}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={cn('h-4 w-4 mt-0.5 flex-shrink-0',
                        log.nivel === 'error' && 'text-red-500',
                        log.nivel === 'warn' && 'text-yellow-500',
                        log.nivel === 'info' && 'text-blue-500',
                      )} />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className={cn('text-xs', config.class)}>
                            {config.label}
                          </Badge>
                          <span className="text-xs font-mono text-muted-foreground">
                            {log.contexto}
                          </span>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {format(parseISO(log.created_at), "d MMM yyyy 'a las' HH:mm", { locale: es })}
                          </span>
                        </div>

                        <p className="text-sm mt-1 text-foreground">{log.mensaje}</p>

                        <p className="text-xs text-muted-foreground mt-0.5">
                          {userMap[log.user_id ?? ''] || 'Usuario desconocido'}
                        </p>

                        {isExpanded && log.detalle && (
                          <div className="relative mt-2">
                            <button
                              onClick={e => {
                                e.stopPropagation()
                                navigator.clipboard.writeText(JSON.stringify(log.detalle, null, 2))
                              }}
                              className="absolute top-1 right-1 text-xs text-muted-foreground hover:text-foreground px-1.5 py-0.5 rounded bg-background border"
                            >
                              Copiar
                            </button>
                            <pre className="text-xs bg-muted rounded p-2 overflow-x-auto text-muted-foreground pr-14">
                              {JSON.stringify(log.detalle, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}