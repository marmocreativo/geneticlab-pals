import { useState } from 'react'
import { supabase } from '@/lib/supabase'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

function bufferToBase64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  bytes.forEach(b => binary += String.fromCharCode(b))
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function base64urlToBuffer(base64url: string): ArrayBuffer {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=')
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

async function callEdgeFunction(name: string, body: object, token?: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body)
  })

  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Error en la función')
  return data
}

export function useWebAuthn() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isSupported = () => {
    return window.PublicKeyCredential !== undefined
  }

  // Registrar huella — el usuario ya debe estar autenticado
  const registerBiometric = async (deviceName?: string): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Debes iniciar sesión primero')

      // 1. Pedir challenge al servidor
      const options = await callEdgeFunction(
        'webauthn-register',
        { action: 'generate-challenge' },
        session.access_token
      )

      // 2. Crear credencial en el dispositivo
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: base64urlToBuffer(options.challenge),
          rp: {
            id: options.rpId,
            name: options.rpName
          },
          user: {
            id: base64urlToBuffer(options.userId),
            name: options.userName,
            displayName: options.userName
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' },  // ES256
            { alg: -257, type: 'public-key' } // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform', // Solo biométrico del dispositivo
            userVerification: 'required'
          },
          excludeCredentials: options.excludeCredentials?.map((c: any) => ({
            id: base64urlToBuffer(c.id),
            type: 'public-key'
          })),
          timeout: 60000
        }
      }) as PublicKeyCredential

      if (!credential) throw new Error('No se pudo crear la credencial')

      const response = credential.response as AuthenticatorAttestationResponse

      // 3. Verificar y guardar en el servidor
      await callEdgeFunction(
        'webauthn-register',
        {
          action: 'verify-registration',
          deviceName: deviceName || 'Mi dispositivo',
          credential: {
            id: bufferToBase64url(credential.rawId),
            response: {
              clientDataJSON: bufferToBase64url(response.clientDataJSON),
              attestationObject: bufferToBase64url(response.attestationObject)
            }
          }
        },
        session.access_token
      )

      return true
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error al registrar biométrico'
      setError(msg)
      return false
    } finally {
      setLoading(false)
    }
  }

  // Login con huella — no requiere sesión previa
  const loginWithBiometric = async (email: string): Promise<boolean> => {
    setLoading(true)
    setError(null)

    try {
      // 1. Pedir challenge para este email
      const options = await callEdgeFunction(
        'webauthn-verify',
        { action: 'generate-challenge', email }
      )

      // 2. Solicitar autenticación biométrica al dispositivo
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge: base64urlToBuffer(options.challenge),
          rpId: options.rpId,
          allowCredentials: options.allowCredentials?.map((c: any) => ({
            id: base64urlToBuffer(c.id),
            type: 'public-key'
          })),
          userVerification: 'required',
          timeout: 60000
        }
      }) as PublicKeyCredential

      if (!credential) throw new Error('Autenticación cancelada')

      const response = credential.response as AuthenticatorAssertionResponse

      // 3. Verificar en el servidor y obtener token
      const result = await callEdgeFunction(
        'webauthn-verify',
        {
          action: 'verify-authentication',
          credential: {
            id: bufferToBase64url(credential.rawId),
            response: {
              clientDataJSON: bufferToBase64url(response.clientDataJSON),
              authenticatorData: bufferToBase64url(response.authenticatorData),
              signature: bufferToBase64url(response.signature)
            }
          }
        }
      )

      // 4. Establecer sesión
    if (result.access_token && result.refresh_token) {
    const { error: sessionError } = await supabase.auth.setSession({
        access_token: result.access_token,
        refresh_token: result.refresh_token
    })
    if (sessionError) throw new Error(sessionError.message)
    } else if (result.token) {
    const { error: sessionError } = await supabase.auth.verifyOtp({
        email: result.email,
        token: result.token,
        type: 'magiclink'
    })
    if (sessionError) throw new Error(sessionError.message)
    }

      return true
    } catch (err) {
    const msg = err instanceof Error ? err.message : JSON.stringify(err)
    setError(msg)
    return false
    } finally {
      setLoading(false)
    }
  }

  // Obtener credenciales registradas del usuario actual
  const getCredentials = async () => {
    const { data, error } = await supabase
      .from('webauthn_credentials')
      .select('id, device_name, created_at, last_used_at')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  // Eliminar una credencial
  const removeCredential = async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('webauthn_credentials')
      .delete()
      .eq('id', id)

    if (error) {
      setError(error.message)
      return false
    }
    return true
  }

  return {
    loading,
    error,
    isSupported,
    registerBiometric,
    loginWithBiometric,
    getCredentials,
    removeCredential
  }
}