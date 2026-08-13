// components/BtnTickets.tsx
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { MessageSquareWarning, Plus, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useAuth } from '@/contexts/AuthContext'
import { useTickets } from '@/hooks/useTickets'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const ticketSchema = z.object({
  asunto: z.string().min(1, 'El asunto es requerido'),
  descripcion: z.string().min(1, 'Describe el problema')
})

type TicketFormData = z.infer<typeof ticketSchema>

interface BtnTicketsProps {
  variant?: 'bottom-nav' | 'sidebar'
}

function getEstadoBadge(estado: string) {
  switch (estado) {
    case 'abierto':
      return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-xs"><Clock className="h-3 w-3 mr-1" />Abierto</Badge>
    case 'respondido':
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs"><CheckCircle2 className="h-3 w-3 mr-1" />Respondido</Badge>
    case 'cerrado':
      return <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200 text-xs"><XCircle className="h-3 w-3 mr-1" />Cerrado</Badge>
    default:
      return <Badge variant="outline" className="text-xs">{estado}</Badge>
  }
}

export function BtnTickets({ variant = 'bottom-nav' }: BtnTicketsProps) {
  const { user } = useAuth()
  const { tickets, loading, fetchTicketsByPal, createTicket } = useTickets()
  const [open, setOpen] = useState(false)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
    defaultValues: { asunto: '', descripcion: '' }
  })

  useEffect(() => {
    if (open && user?.id) {
      fetchTicketsByPal(user.id)
    }
  }, [open, user?.id])

  useEffect(() => {
    if (!open) setMostrarForm(false)
  }, [open])

  const onSubmit = async (data: TicketFormData) => {
    if (!user?.id) return
    try {
      setSubmitting(true)
      await createTicket({
        pal_id: user.id,
        asunto: data.asunto,
        descripcion: data.descripcion
      })
      form.reset()
      setMostrarForm(false)
    } catch {
      // el hook ya muestra el toast de error
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {variant === 'sidebar' ? (
          <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs">
            <MessageSquareWarning className="h-3 w-3" />
            Mensajes a Soporte
          </Button>
        ) : (
          <button className="flex flex-col items-center px-3 py-2 rounded-lg transition-colors text-muted-foreground hover:text-foreground">
            <MessageSquareWarning className="h-5 w-5 mb-1" />
            <span className="text-xs font-medium">Mensajes a Soporte</span>
          </button>
        )}
      </SheetTrigger>

      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-xl px-4">
        <SheetHeader className="mb-4">
          <SheetTitle>Reportar un problema</SheetTitle>
        </SheetHeader>

        <div className="pb-6">
          {!mostrarForm ? (
            <div className="space-y-4">
              <Button className="w-full" onClick={() => setMostrarForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo reporte
              </Button>

              <div className="space-y-2">
                {loading && (
                  <p className="text-sm text-muted-foreground text-center py-4">Cargando...</p>
                )}

                {!loading && tickets.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No has enviado reportes todavía
                  </p>
                )}

                {tickets.map(ticket => (
                  <div key={ticket.id} className="border rounded-lg p-3 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium truncate flex-1">{ticket.asunto}</p>
                      {getEstadoBadge(ticket.estado)}
                    </div>
                    <p className="text-xs text-muted-foreground">{ticket.descripcion}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {format(new Date(ticket.created_at), "dd MMM yyyy, HH:mm", { locale: es })}
                    </p>
                    {ticket.respuesta_admin && (
                      <div className="bg-muted rounded p-2 mt-2">
                        <p className="text-xs font-medium mb-0.5">Respuesta:</p>
                        <p className="text-xs text-muted-foreground">{ticket.respuesta_admin}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="asunto"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asunto</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej. La app se cierra al subir fotos" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="descripcion"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descripción</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe qué pasó, en qué pantalla y qué esperabas que sucediera..."
                          className="resize-none"
                          rows={5}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setMostrarForm(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={submitting}>
                    {submitting ? 'Enviando...' : 'Enviar reporte'}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}