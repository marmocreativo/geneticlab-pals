import { useState } from 'react'
import { Fingerprint, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useWebAuthn } from '@/hooks/useWebAuthn'

interface BiometricPromptDialogProps {
  open: boolean
  onClose: () => void
}

const STORAGE_KEY = 'biometric_prompt_dismissed'

export function shouldShowBiometricPrompt(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== 'never'
}

export default function BiometricPromptDialog({ open, onClose }: BiometricPromptDialogProps) {
  const [success, setSuccess] = useState(false)
  const { registerBiometric, loading, error, isSupported } = useWebAuthn()

  if (!isSupported()) return null

  const handleRegister = async () => {
    const ua = navigator.userAgent
    let deviceName = 'Mi dispositivo'
    if (/iPhone/.test(ua)) deviceName = 'iPhone'
    else if (/iPad/.test(ua)) deviceName = 'iPad'
    else if (/Android/.test(ua)) deviceName = 'Android'

    const ok = await registerBiometric(deviceName)
    if (ok) {
      setSuccess(true)
      setTimeout(() => onClose(), 1500)
    }
  }

  const handleLater = () => {
    onClose()
  }

  const handleNever = () => {
    localStorage.setItem(STORAGE_KEY, 'never')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex justify-center mb-2">
            <div className="rounded-full bg-primary/10 p-4">
              <Fingerprint className="h-8 w-8 text-primary" />
            </div>
          </div>
          <DialogTitle className="text-center">
            Inicia sesión más rápido
          </DialogTitle>
          <DialogDescription className="text-center">
            Puedes usar tu huella digital o Face ID para entrar sin escribir tu contraseña.
          </DialogDescription>
        </DialogHeader>

        {success && (
          <p className="text-center text-sm text-green-600 font-medium">
            Huella registrada correctamente
          </p>
        )}

        {error && (
          <p className="text-center text-sm text-destructive">
            {error}
          </p>
        )}

        <DialogFooter className="flex flex-col gap-2 sm:flex-col">
          <Button
            className="w-full"
            onClick={handleRegister}
            disabled={loading || success}
          >
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Fingerprint className="mr-2 h-4 w-4" />
            )}
            Registrar huella
          </Button>

          <Button
            variant="outline"
            className="w-full"
            onClick={handleLater}
            disabled={loading}
          >
            Ahora no
          </Button>

          <Button
            variant="ghost"
            className="w-full text-muted-foreground text-sm"
            onClick={handleNever}
            disabled={loading}
          >
            No volver a preguntar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}