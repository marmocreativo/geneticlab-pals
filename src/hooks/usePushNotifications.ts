import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return new Uint8Array(Uint8Array.from([...rawData].map(char => char.charCodeAt(0))).buffer)
}

export function usePushNotifications() {
  const [suscrito, setSuscrito] = useState(false)
  const [soportado, setSoportado] = useState(false)

  useEffect(() => {
    setSoportado('Notification' in window && 'PushManager' in window)
    verificarSuscripcion()
  }, [])

  const verificarSuscripcion = async () => {
    if (!('serviceWorker' in navigator)) return
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      setSuscrito(!!subscription)
    } catch {
      setSuscrito(false)
    }
  }

  const suscribir = async () => {
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') return false

      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      })

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return false

      const { error } = await supabase
        .from('push_subscriptions')
        .upsert({
          user_id: user.id,
          subscription: subscription.toJSON(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' })

      if (error) throw error

      setSuscrito(true)
      return true
    } catch (error) {
      console.error('Error al suscribirse a notificaciones:', error)
      return false
    }
  }

  const desuscribir = async () => {
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      if (subscription) await subscription.unsubscribe()

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await supabase
          .from('push_subscriptions')
          .delete()
          .eq('user_id', user.id)
      }

      setSuscrito(false)
      return true
    } catch (error) {
      console.error('Error al desuscribirse:', error)
      return false
    }
  }

  return { suscrito, soportado, suscribir, desuscribir }
}