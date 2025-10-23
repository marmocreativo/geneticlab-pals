import { useState } from 'react'
import { useUsers, type UserProfile } from '@/hooks/useUsers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'
import type { UserRole } from '@/types/database.types'

interface UserFormProps {
  user?: UserProfile | null
  onSuccess: () => void
  onCancel: () => void
}

export default function UserForm({ user, onSuccess, onCancel }: UserFormProps) {
  const { createUser, updateUser } = useUsers()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    email: user?.email || '',
    password: '',
    nombre_completo: user?.nombre_completo || '',
    telefono: user?.telefono || '',
    role: (user?.role || 'pal') as UserRole,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (user) {
        // Editar usuario existente
        const result = await updateUser(user.id, {
          nombre_completo: formData.nombre_completo,
          telefono: formData.telefono || null,
          role: formData.role,
        })

        if (!result.success) {
          setError(result.error || 'Error al actualizar usuario')
          return
        }
      } else {
        // Crear nuevo usuario
        if (!formData.password || formData.password.length < 6) {
          setError('La contraseña debe tener al menos 6 caracteres')
          return
        }

        const result = await createUser(formData)

        if (!result.success) {
          setError(result.error || 'Error al crear usuario')
          return
        }
      }

      onSuccess()
    } catch (err) {
      setError('Error inesperado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="nombre_completo">Nombre completo *</Label>
        <Input
          id="nombre_completo"
          value={formData.nombre_completo}
          onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
          required
          disabled={loading}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
          disabled={loading || !!user}
        />
        {user && (
          <p className="text-xs text-muted-foreground">
            El email no se puede modificar
          </p>
        )}
      </div>

      {!user && (
        <div className="space-y-2">
          <Label htmlFor="password">Contraseña *</Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            disabled={loading}
            minLength={6}
          />
          <p className="text-xs text-muted-foreground">
            Mínimo 6 caracteres
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="telefono">Teléfono</Label>
        <Input
          id="telefono"
          type="tel"
          value={formData.telefono}
          onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
          disabled={loading}
          placeholder="5512345678"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Rol *</Label>
        <Select
          value={formData.role}
          onValueChange={(value: UserRole) => setFormData({ ...formData, role: value })}
          disabled={loading}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pal">PAL</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {user ? 'Actualizando...' : 'Creando...'}
            </>
          ) : (
            user ? 'Actualizar' : 'Crear Usuario'
          )}
        </Button>
      </div>
    </form>
  )
}