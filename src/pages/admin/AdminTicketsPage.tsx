// pages/admin/AdminTicketsPage.tsx
import { useState, useEffect } from 'react'
import { MessageSquareWarning, Clock, CheckCircle2, XCircle, Send } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useTickets } from '@/hooks/useTickets'
import type { Ticket, TicketEstado } from '@/types/ticket'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const filtros: { label: string; value: TicketEstado | 'todos' }[] = [
  { label: 'Todos', value: 'todos' },
  { label: 'Abiertos', value: 'abierto' },
  { label: 'Respondidos', value: 'respondido' },
  { label: 'Cerrados', value: 'cerrado' },
]

function getEstadoBadge(estado: string) {
  switch (estado) {
    case 'abierto':
      return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200"><Clock className="h-3 w-3 mr-1" />Abierto</Badge>
    case 'respondido':
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle2 className="h-3 w-3 mr-1" />Respondido</Badge>
    case 'cerrado':
      return <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200"><XCircle className="h-3 w-3 mr-1" />Cerrado</Badge>
    default:
      return <Badge variant="outline">{estado}</Badge>
  }
}

export default function AdminTicketsPage() {
  const { tickets, loading, fetchAllTickets, responderTicket, cerrarTicket } = useTickets()
  const [filtroActivo, setFiltroActivo] = useState<TicketEstado | 'todos'>('abierto')
  const [ticketSeleccionado, setTicketSeleccionado] = useState<Ticket | null>(null)
  const [respuesta, setRespuesta] = useState('')
  const [enviando, setEnviando] = useState(false)

  useEffect(() => {
    fetchAllTickets()
  }, [])

  const ticketsFiltrados = filtroActivo === 'todos'
    ? tickets
    : tickets.filter(t => t.estado === filtroActivo)

  const contarPorEstado = (estado: TicketEstado) =>
    tickets.filter(t => t.estado === estado).length

  const abrirTicket = (ticket: Ticket) => {
    setTicketSeleccionado(ticket)
    setRespuesta(ticket.respuesta_admin ?? '')
  }

  const handleResponder = async () => {
    if (!ticketSeleccionado || !respuesta.trim()) return
    try {
      setEnviando(true)
      await responderTicket(ticketSeleccionado.id, respuesta.trim())
      setTicketSeleccionado(null)
      setRespuesta('')
    } catch {
      // el hook ya muestra el toast de error
    } finally {
      setEnviando(false)
    }
  }

  const handleCerrar = async () => {
    if (!ticketSeleccionado) return
    try {
      setEnviando(true)
      await cerrarTicket(ticketSeleccionado.id)
      setTicketSeleccionado(null)
      setRespuesta('')
    } catch {
      // el hook ya muestra el toast de error
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <MessageSquareWarning className="h-6 w-6" />
          Reportes de Soporte
        </h1>
        <p className="text-muted-foreground text-sm">
          Revisa y responde los problemas reportados por los PALs
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        {filtros.map(f => (
          <Button
            key={f.value}
            size="sm"
            variant={filtroActivo === f.value ? 'default' : 'outline'}
            onClick={() => setFiltroActivo(f.value)}
          >
            {f.label}
            {f.value !== 'todos' && contarPorEstado(f.value) > 0 && (
              <Badge variant="secondary" className="ml-2 text-[10px] h-4 px-1.5">
                {contarPorEstado(f.value)}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {loading && (
          <p className="text-sm text-muted-foreground text-center py-8">Cargando...</p>
        )}

        {!loading && ticketsFiltrados.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            No hay reportes en esta categoría
          </p>
        )}

        {ticketsFiltrados.map(ticket => (
          <Card
            key={ticket.id}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => abrirTicket(ticket)}
          >
            <CardContent className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <p className="font-medium truncate flex-1">{ticket.asunto}</p>
                {getEstadoBadge(ticket.estado)}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">{ticket.descripcion}</p>
              <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                <span>{ticket.pal?.nombre_completo ?? 'PAL desconocido'}</span>
                <span>{format(new Date(ticket.created_at), "dd MMM yyyy, HH:mm", { locale: es })}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog detalle / respuesta */}
      <Dialog open={!!ticketSeleccionado} onOpenChange={(open) => { if (!open) { setTicketSeleccionado(null); setRespuesta('') } }}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          {ticketSeleccionado && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center justify-between gap-2 pr-6">
                  <span className="truncate">{ticketSeleccionado.asunto}</span>
                  {getEstadoBadge(ticketSeleccionado.estado)}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div className="text-xs text-muted-foreground space-y-0.5">
                  <p>Reportado por: <span className="font-medium text-foreground">{ticketSeleccionado.pal?.nombre_completo ?? 'Desconocido'}</span></p>
                  <p>{ticketSeleccionado.pal?.email}</p>
                  <p>{format(new Date(ticketSeleccionado.created_at), "dd MMM yyyy, HH:mm", { locale: es })}</p>
                </div>

                <div className="bg-muted rounded-md p-3">
                  <p className="text-sm">{ticketSeleccionado.descripcion}</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Respuesta</label>
                  <Textarea
                    placeholder="Escribe tu respuesta para el PAL..."
                    rows={4}
                    className="resize-none"
                    value={respuesta}
                    onChange={e => setRespuesta(e.target.value)}
                  />
                </div>

                <div className="flex justify-between gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={handleCerrar}
                    disabled={enviando || ticketSeleccionado.estado === 'cerrado'}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cerrar ticket
                  </Button>
                  <Button onClick={handleResponder} disabled={enviando || !respuesta.trim()}>
                    <Send className="h-4 w-4 mr-2" />
                    {enviando ? 'Enviando...' : 'Enviar respuesta'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}