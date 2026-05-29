import webpush from 'npm:web-push'

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT')!

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

interface WebhookPayload {
  type: 'INSERT'
  table: string
  record: {
    id: string
    visita_id: string
    url_storage: string
  }
}

Deno.serve(async (req) => {
  try {
    const payload: WebhookPayload = await req.json()

    if (payload.type !== 'INSERT' || payload.table !== 'fotos_evidencia') {
      return new Response('Ignorado', { status: 200 })
    }

    // Importar supabase con service role para leer suscripciones de admins
    const { createClient } = await import('npm:@supabase/supabase-js')
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Obtener info de la visita y el PAL
    const { data: visita } = await supabase
      .from('visitas')
      .select(`
        pal:users(nombre_completo),
        institucion:instituciones(nombre)
      `)
      .eq('id', payload.record.visita_id)
      .single()

    const palNombre = visita?.pal?.nombre_completo ?? 'Un PAL'
    const institucionNombre = visita?.institucion?.nombre ?? 'una institución'

    // Obtener todas las suscripciones de admins
    const { data: suscripciones } = await supabase
      .from('push_subscriptions')
      .select('subscription, user_id, users(role)')
      .eq('users.role', 'admin')

    if (!suscripciones || suscripciones.length === 0) {
      return new Response('Sin suscripciones', { status: 200 })
    }

    const notificacion = JSON.stringify({
      title: 'Nueva validación de visita',
      body: `${palNombre} validó su visita en ${institucionNombre}`,
      url: '/admin/agenda'
    })

    // Enviar a todos los admins suscritos
    const envios = suscripciones.map(async ({ subscription }) => {
      try {
        await webpush.sendNotification(subscription, notificacion)
      } catch (err) {
        console.error('Error enviando push:', err)
      }
    })

    await Promise.all(envios)

    return new Response('Notificaciones enviadas', { status: 200 })
  } catch (err) {
    console.error('Error en edge function:', err)
    return new Response('Error interno', { status: 500 })
  }
})