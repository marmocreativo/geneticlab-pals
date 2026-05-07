import { supabase } from '@/lib/supabase'

export async function logError(
  contexto: string,
  err: unknown,
  userId?: string
) {
  const mensaje = parseError(err)
  
  console.error(`[${contexto}]`, err)

  try {
    await supabase.from('logs').insert({
      user_id: userId || (await supabase.auth.getUser()).data.user?.id,
      nivel: 'error',
      contexto,
      mensaje,
      detalle: err instanceof Error 
        ? { stack: err.stack }
        : { raw: JSON.stringify(err) }
    })
  } catch {
    // Si falla el log no interrumpimos el flujo
    console.warn('No se pudo guardar el log')
  }
}

export function parseError(err: unknown): string {
  if (!err) return 'Error desconocido'
  if (err instanceof Error) return err.message
  if (typeof err === 'object') {
    const e = err as Record<string, any>
    if (e.message) return `${e.message}${e.hint ? ` — ${e.hint}` : ''}${e.code ? ` (${e.code})` : ''}`
    if (e.error_description) return e.error_description
  }
  return JSON.stringify(err)
}