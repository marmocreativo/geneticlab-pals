import { useState, useEffect } from 'react'
import { useWebAuthn } from '@/hooks/useWebAuthn'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Fingerprint, Trash2, Loader2, ShieldCheck, ShieldOff } from 'lucide-react'
import { formatearFechaHora } from '@/lib/utils'

interface Credential {
  id: string
  device_name: string
  created_at: string
  last_used_at: string | null
}

export default function BiometricSetup() {
  const [credentials, setCredentials] = useState<Credential[]>([])
  const [loadingCredentials, setLoadingCredentials] = useState(true)
  const [deviceName, setDeviceName] = useState('')

  const {
    loading,
    error,
    isSupported,
    registerBiometric,
    getCredentials,
    removeCredential
  } = useWebAuthn()

  useEffect(() => {
    fetchCredentials()
    // Intentar detectar nombre del dispositivo automáticamente
    const ua = navigator.userAgent
    if (/iPhone/.test(ua)) setDeviceName('iPhone')
    else if (/iPad/.test(ua)) setDeviceName('iPad')
    else if (/Android/.test(ua)) setDeviceName('Android')
    else setDeviceName('Mi dispositivo')
  }, [])

  const fetchCredentials = async () => {
    try {
      setLoadingCredentials(true)
      const data = await getCredentials()
      setCredentials(data || [])
    } catch (err) {
      console.error('Error cargando credenciales:', err)
    } finally {
      setLoadingCredentials(false)
    }
  }

  const handleRegister = async () => {
    const success = await registerBiometric(deviceName)
    if (success) await fetchCredentials()
  }

  const handleRemove = async (id: string) => {
    const success = await removeCredential(id)
    if (success) setCredentials(prev => prev.filter(c => c.id !== id))
  }

  if (!isSupported()) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldOff className="h-4 w-4" />
            Autenticación biométrica
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Tu dispositivo o navegador no soporta autenticación biométrica.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-4 w-4" />
          Autenticación biométrica
        </CardTitle>
        <CardDescription>
          Registra tu huella digital o Face ID para iniciar sesión más rápido
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Credenciales registradas */}
        {loadingCredentials ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : credentials.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm font-medium">Dispositivos registrados</p>
            {credentials.map(cred => (
              <div
                key={cred.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div className="flex items-center gap-3">
                  <Fingerprint className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{cred.device_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Registrado: {formatearFechaHora(cred.created_at)}
                    </p>
                    {cred.last_used_at && (
                      <p className="text-xs text-muted-foreground">
                        Último uso: {formatearFechaHora(cred.last_used_at)}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleRemove(cred.id)}
                  disabled={loading}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No tienes dispositivos biométricos registrados.
          </p>
        )}

        {/* Botón registrar */}
        <Button
          variant="outline"
          className="w-full"
          onClick={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Fingerprint className="mr-2 h-4 w-4" />
          )}
          {credentials.length > 0 ? 'Registrar otro dispositivo' : 'Registrar huella digital'}
        </Button>

      </CardContent>
    </Card>
  )
}