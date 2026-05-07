import { useState, useCallback } from 'react'
import { logsService } from '@/services/logsService'
import type { Log } from '@/types/log'

export function useLogs() {
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchLogs = useCallback(async (filtros?: Parameters<typeof logsService.getLogs>[0]) => {
    try {
      setLoading(true)
      setError(null)
      const data = await logsService.getLogs(filtros)
      setLogs(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar logs')
    } finally {
      setLoading(false)
    }
  }, [])

  return { logs, loading, error, fetchLogs }
}