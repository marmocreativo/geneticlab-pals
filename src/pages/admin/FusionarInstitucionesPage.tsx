import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { mantenimientoService, type ParDuplicado } from '@/services/mantenimientoService'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Check, Loader2, MapPin, Building2 } from 'lucide-react'
import { toast } from 'sonner'

function CampoComparacion({ label, valorA, valorB }: {
  label: string
  valorA: string | null
  valorB: string | null
}) {
  const distintos = valorA !== valorB
  return (
    <div className={`grid grid-cols-2 gap-2 py-2 px-3 rounded ${distintos ? 'bg-yellow-50 dark:bg-yellow-950/20' : ''}`}>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm">{valorA ?? '—'}</p>
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm">{valorB ?? '—'}</p>
      </div>
    </div>
  )
}

function TarjetaInstitucion({
  par,
  elegido,
  onElegir,
}: {
  par: ParDuplicado
  elegido: 'a' | 'b' | null
  onElegir: (id: 'a' | 'b') => void
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Comparación</p>
        <CampoComparacion label="Nombre" valorA={par.nombre_a} valorB={par.nombre_b} />
        <CampoComparacion label="Ciudad" valorA={par.ciudad_a} valorB={par.ciudad_b} />
        <CampoComparacion label="Estado" valorA={par.estado_a} valorB={par.estado_b} />
        <CampoComparacion label="Dirección" valorA={par.direccion_a} valorB={par.direccion_b} />
        <CampoComparacion
          label="Coordenadas"
          valorA={`${par.latitud_a}, ${par.longitud_a}`}
          valorB={`${par.latitud_b}, ${par.longitud_b}`}
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => onElegir('a')}
          className={`p-3 rounded-lg border-2 text-left transition-colors ${
            elegido === 'a'
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Building2 className="w-3 h-3" />
              <span>Opción A</span>
            </div>
            {elegido === 'a' && <Check className="w-4 h-4 text-primary" />}
          </div>
          <p className="text-sm font-medium leading-tight">{par.nombre_a}</p>
          <div className="flex items-center gap-1 mt-1">
            <MapPin className="w-3 h-3 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">{par.ciudad_a ?? '—'}</p>
          </div>
        </button>

        <button
          onClick={() => onElegir('b')}
          className={`p-3 rounded-lg border-2 text-left transition-colors ${
            elegido === 'b'
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Building2 className="w-3 h-3" />
              <span>Opción B</span>
            </div>
            {elegido === 'b' && <Check className="w-4 h-4 text-primary" />}
          </div>
          <p className="text-sm font-medium leading-tight">{par.nombre_b}</p>
          <div className="flex items-center gap-1 mt-1">
            <MapPin className="w-3 h-3 text-muted-foreground" />
            <p className="text-xs text-muted-foreground">{par.ciudad_b ?? '—'}</p>
          </div>
        </button>
      </div>
    </div>
  )
}

export default function FusionarInstitucionesPage() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const pares: ParDuplicado[] = state?.pares ?? []

  const [decisiones, setDecisiones] = useState<Record<string, 'a' | 'b'>>({})
  const [procesando, setProcesando] = useState(false)
  const [indiceActual, setIndiceActual] = useState(0)

  if (pares.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <p className="text-sm text-muted-foreground">No hay pares para revisar.</p>
        <Button variant="outline" onClick={() => navigate('/admin/mantenimiento')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>
      </div>
    )
  }

  const par = pares[indiceActual]
  const key = `${par.id_a}|${par.id_b}`
  const elegido = decisiones[key] ?? null
  const totalDecididos = Object.keys(decisiones).length
  const todosPendientes = totalDecididos < pares.length

  const elegir = (opcion: 'a' | 'b') => {
    setDecisiones(prev => ({ ...prev, [key]: opcion }))
  }

  const irAnterior = () => setIndiceActual(i => Math.max(0, i - 1))
  const irSiguiente = () => setIndiceActual(i => Math.min(pares.length - 1, i + 1))

  const ejecutarFusion = async () => {
    setProcesando(true)
    let exitosos = 0
    let fallidos = 0

    for (const [parKey, opcion] of Object.entries(decisiones)) {
      const [id_a, id_b] = parKey.split('|')
      const idConservar = opcion === 'a' ? id_a : id_b
      const idEliminar = opcion === 'a' ? id_b : id_a

      try {
        await mantenimientoService.fusionarInstituciones(idConservar, idEliminar)
        exitosos++
      } catch (err) {
        console.error(`Error fusionando ${parKey}:`, err)
        fallidos++
      }
    }

    setProcesando(false)

    if (fallidos === 0) {
      toast.success(`${exitosos} fusión(es) completadas correctamente`)
      navigate('/admin/mantenimiento')
    } else {
      toast.error(`${exitosos} exitosas, ${fallidos} fallidas. Revisa los logs.`)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin/mantenimiento')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-xl font-semibold">Revisar duplicados</h1>
          <p className="text-sm text-muted-foreground">
            {indiceActual + 1} de {pares.length} — {totalDecididos} decididos
          </p>
        </div>
      </div>

      <div className="flex gap-1">
        {pares.map((p, i) => {
          const k = `${p.id_a}|${p.id_b}`
          const decidido = decisiones[k] !== undefined
          return (
            <button
              key={k}
              onClick={() => setIndiceActual(i)}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                i === indiceActual
                  ? 'bg-primary'
                  : decidido
                  ? 'bg-primary/40'
                  : 'bg-muted'
              }`}
            />
          )
        })}
      </div>

      <div className="border rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Badge variant={
            par.motivo === 'nombre_exacto' ? 'destructive' :
            par.motivo === 'nombre_similar' ? 'secondary' : 'outline'
          }>
            {par.motivo === 'nombre_exacto' ? 'Nombre exacto' :
             par.motivo === 'nombre_similar' ? 'Nombre similar' : 'Coordenadas cercanas'}
          </Badge>
          {par.motivo === 'coordenadas' && (
            <span className="text-xs text-muted-foreground">{par.distancia_metros}m</span>
          )}
        </div>

        <TarjetaInstitucion par={par} elegido={elegido} onElegir={elegir} />
      </div>

      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={irAnterior} disabled={indiceActual === 0}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Anterior
        </Button>

        {indiceActual < pares.length - 1 ? (
          <Button onClick={irSiguiente}>
            Siguiente
            <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
          </Button>
        ) : (
          <Button
            onClick={ejecutarFusion}
            disabled={todosPendientes || procesando}
          >
            {procesando ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            Fusionar {totalDecididos} par(es)
          </Button>
        )}
      </div>

      {todosPendientes && indiceActual === pares.length - 1 && (
        <p className="text-xs text-muted-foreground text-center">
          Aún hay {pares.length - totalDecididos} par(es) sin decidir
        </p>
      )}
    </div>
  )
}