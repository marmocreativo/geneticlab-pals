import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Lock, Mail, Eye, EyeOff, Fingerprint } from 'lucide-react'
import { useWebAuthn } from '@/hooks/useWebAuthn'

const EMAIL_STORAGE_KEY = 'last_login_email'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [hasBiometric, setHasBiometric] = useState(false)
  const [debugInfo, setDebugInfo] = useState('')

  const { signIn } = useAuth()
  const navigate = useNavigate()
  const {
    loginWithBiometric,
    isSupported,
    loading: biometricLoading,
    error: biometricError
  } = useWebAuthn()

  useEffect(() => {
    // Recuperar email guardado
    const savedEmail = localStorage.getItem(EMAIL_STORAGE_KEY)
    if (savedEmail) setEmail(savedEmail)
  }, [])

  useEffect(() => {
    const checkBiometric = async () => {
      if (!isSupported()) return
      if (!email) { setHasBiometric(false); return }

      try {
        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/webauthn-verify`
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
          },
          body: JSON.stringify({ action: 'check-credentials', email })
        })
        const data = await res.json()
        setDebugInfo(JSON.stringify(data))
        setHasBiometric(data.hasCredentials === true)
      } catch (err) {
        setDebugInfo('Error: ' + String(err))
        setHasBiometric(false)
      }
    }

    checkBiometric()
  }, [email])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await signIn(email, password)
      localStorage.setItem(EMAIL_STORAGE_KEY, email)
      navigate('/')
    } catch {
      setError('Credenciales incorrectas. Por favor intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const handleBiometricLogin = async () => {
    setError('')
    const success = await loginWithBiometric(email)
    if (success) {
      localStorage.setItem(EMAIL_STORAGE_KEY, email)
      navigate('/')
    } else {
      setError(biometricError || 'Error al autenticar con huella')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white to-primary/20 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-3">
            <img src="/logo.svg" alt="Aliado Presente Logo" className="h-32 w-auto" />
          </div>
          <CardTitle className="text-xl font-bold">Acceso a usuarios</CardTitle>
          <CardDescription>
            Ingresa tus credenciales para acceder
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* DEBUG - quitar después */}
            <div className="text-xs text-muted-foreground space-y-1 p-2 bg-muted rounded">
              <p>Email guardado: {email || 'ninguno'}</p>
              <p>Soporta biométrico: {isSupported() ? 'sí' : 'no'}</p>
              <p>Tiene huella: {hasBiometric ? 'sí' : 'no'}</p>
              <p>Error biométrico: {biometricError || 'ninguno'}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Correo electrónico</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  disabled={loading || biometricLoading}
                />
              </div>
            </div>

            {hasBiometric ? (
              <Button
                type="button"
                className="w-full"
                onClick={handleBiometricLogin}
                disabled={biometricLoading || loading}
              >
                {biometricLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Fingerprint className="mr-2 h-4 w-4" />
                )}
                Iniciar sesión con huella
              </Button>
            ) : null}

            {hasBiometric && (
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    o usa tu contraseña
                  </span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                    disabled={loading || biometricLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                variant={hasBiometric ? 'outline' : 'default'}
                className="w-full"
                disabled={loading || biometricLoading}
              >
                {loading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  'Iniciar sesión'
                )}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}