import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUsers } from '@/hooks/useUsers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Search, UserCheck, UserX, Pencil, Trash2 } from 'lucide-react'
import { formatearFecha, formatearTelefono } from '@/lib/utils'
import UserForm from '@/components/admin/UserForm'
import { toast } from 'sonner'
import type { UserProfile } from '@/hooks/useUsers'

export default function Usuarios() {
  const navigate = useNavigate()
  const { users, loading, toggleUserStatus, fetchUsers, deleteUserComplete } = useUsers()
  const [searchTerm, setSearchTerm] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null)
  const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null)
  const [deleting, setDeleting] = useState(false)

  const filteredUsers = users.filter(user =>
    user.nombre_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.telefono?.includes(searchTerm)
  )

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    const result = await toggleUserStatus(id, !currentStatus)
    if (result.success) fetchUsers()
  }

  const handleCreateSuccess = () => {
    setDialogOpen(false)
    setEditingUser(null)
    fetchUsers()
  }

  const handleEdit = (user: UserProfile, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingUser(user)
    setDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditingUser(null)
  }

  const handleDeleteConfirm = async () => {
    if (!deletingUser) return
    setDeleting(true)
    const result = await deleteUserComplete(deletingUser.id)
    if (result.success) {
      toast.success(`Usuario ${deletingUser.nombre_completo} eliminado`)
    } else {
      toast.error(`Error al eliminar: ${result.error}`)
    }
    setDeleting(false)
    setDeletingUser(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando usuarios...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Usuarios</h1>
          <p className="text-muted-foreground">Gestiona los usuarios PAL del sistema</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setEditingUser(null)}>
              <Plus className="mr-2 h-4 w-4" />
              Nuevo Usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</DialogTitle>
              <DialogDescription>
                {editingUser ? 'Modifica la información del usuario' : 'Completa los datos para crear un nuevo PAL'}
              </DialogDescription>
            </DialogHeader>
            <UserForm
              user={editingUser}
              onSuccess={handleCreateSuccess}
              onCancel={handleCloseDialog}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuarios</CardTitle>
          <CardDescription>Total de usuarios: {users.length}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, email o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Teléfono</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Creado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                      {searchTerm ? 'No se encontraron usuarios' : 'No hay usuarios registrados'}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow
                      key={user.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => navigate(`/admin/usuarios/${user.id}`)}
                    >
                      <TableCell className="font-medium">{user.nombre_completo}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        {user.telefono ? formatearTelefono(user.telefono) : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.role === 'admin' ? 'Admin' : 'PAL'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.activo ? 'default' : 'destructive'}>
                          {user.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatearFecha(user.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => handleEdit(user, e)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleToggleStatus(user.id, user.activo)
                            }}
                          >
                            {user.activo
                              ? <UserX className="h-4 w-4 text-destructive" />
                              : <UserCheck className="h-4 w-4 text-green-600" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeletingUser(user)
                            }}
                            disabled={user.role === 'admin'}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!deletingUser} onOpenChange={(open) => { if (!open) setDeletingUser(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar usuario permanentemente</AlertDialogTitle>
            <AlertDialogDescription>
              Estás a punto de eliminar a <strong>{deletingUser?.nombre_completo}</strong> y todos sus datos asociados: visitas, actividades, contactos y fotos de evidencia. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Eliminando...' : 'Eliminar todo'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}