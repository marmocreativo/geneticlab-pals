import { supabase } from '@/lib/supabase'

export interface ParDuplicado {
  id_a: string
  nombre_a: string
  ciudad_a: string | null
  estado_a: string | null
  direccion_a: string
  latitud_a: number
  longitud_a: number
  id_b: string
  nombre_b: string
  ciudad_b: string | null
  estado_b: string | null
  direccion_b: string
  latitud_b: number
  longitud_b: number
  distancia_metros: number
  motivo: 'nombre_exacto' | 'nombre_similar' | 'coordenadas'
}

export interface InstitucionCoordInvalida {
  id: string
  nombre: string
  ciudad: string | null
  estado: string | null
  direccion: string
  latitud: number | null
  longitud: number | null
  tieneVisitasLejanas?: boolean
}

export interface InstitucionSinCiudad {
  id: string
  nombre: string
  direccion: string
  ciudad: string | null
  estado: string | null
}

function normalizar(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function calcularDistancia(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000
  const phi1 = (lat1 * Math.PI) / 180
  const phi2 = (lat2 * Math.PI) / 180
  const dphi = ((lat2 - lat1) * Math.PI) / 180
  const dlam = ((lon2 - lon1) * Math.PI) / 180
  const a = Math.sin(dphi / 2) ** 2 + Math.cos(phi1) * Math.cos(phi2) * Math.sin(dlam / 2) ** 2
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

export const mantenimientoService = {
  async detectarDuplicados(): Promise<ParDuplicado[]> {
    const { data, error } = await supabase
      .from('instituciones')
      .select('id, nombre, ciudad, estado, direccion, latitud, longitud')
      .order('nombre')

    if (error) throw error

    const instituciones = data || []
    const pares: ParDuplicado[] = []
    const yaAgregados = new Set<string>()

    for (let i = 0; i < instituciones.length; i++) {
      for (let j = i + 1; j < instituciones.length; j++) {
        const a = instituciones[i]
        const b = instituciones[j]
        const key = [a.id, b.id].sort().join('|')
        if (yaAgregados.has(key)) continue

        const nombreA = normalizar(a.nombre)
        const nombreB = normalizar(b.nombre)
        const distancia = calcularDistancia(a.latitud, a.longitud, b.latitud, b.longitud)

        let motivo: ParDuplicado['motivo'] | null = null

        if (a.nombre === b.nombre) {
          motivo = 'nombre_exacto'
        } else if (nombreA === nombreB) {
          motivo = 'nombre_similar'
        } else if (distancia <= 200) {
          motivo = 'coordenadas'
        }

        if (motivo) {
          yaAgregados.add(key)
          pares.push({
            id_a: a.id, nombre_a: a.nombre, ciudad_a: a.ciudad,
            estado_a: a.estado, direccion_a: a.direccion,
            latitud_a: a.latitud, longitud_a: a.longitud,
            id_b: b.id, nombre_b: b.nombre, ciudad_b: b.ciudad,
            estado_b: b.estado, direccion_b: b.direccion,
            latitud_b: b.latitud, longitud_b: b.longitud,
            distancia_metros: distancia,
            motivo,
          })
        }
      }
    }

    return pares
  },

  async fusionarInstituciones(idConservar: string, idEliminar: string): Promise<void> {
    const tablas: Array<{ tabla: string; columna: string }> = [
      { tabla: 'visitas', columna: 'institucion_id' },
      { tabla: 'actividades', columna: 'institucion_id' },
      { tabla: 'contactos', columna: 'institucion_id' },
      { tabla: 'ficha_paciente', columna: 'institucion_id' },
    ]

    for (const { tabla, columna } of tablas) {
      const { error } = await supabase
        .from(tabla)
        .update({ [columna]: idConservar })
        .eq(columna, idEliminar)
      if (error) throw new Error(`Error actualizando ${tabla}: ${error.message}`)
    }

    const { error } = await supabase
      .from('instituciones')
      .delete()
      .eq('id', idEliminar)

    if (error) throw new Error(`Error eliminando institución: ${error.message}`)
  },

  async detectarCoordenadasInvalidas(): Promise<InstitucionCoordInvalida[]> {
  const { data: instituciones, error } = await supabase
    .from('instituciones')
    .select('id, nombre, ciudad, estado, direccion, latitud, longitud')

  if (error) throw error

  const invalidas: InstitucionCoordInvalida[] = []

  for (const inst of instituciones || []) {
    const lat = Number(inst.latitud)
    const lon = Number(inst.longitud)

    const esInvalida =
      !inst.latitud ||
      !inst.longitud ||
      lat === 0 ||
      lon === 0 ||
      lat < 14 || lat > 33 ||
      lon < -118 || lon > -86

    if (esInvalida) {
      invalidas.push({
        id: inst.id,
        nombre: inst.nombre,
        ciudad: inst.ciudad,
        estado: inst.estado,
        direccion: inst.direccion,
        latitud: inst.latitud,
        longitud: inst.longitud,
      })
    }
  }

  // Buscar también instituciones con visitas de distancia absurda
  const { data: visitasLejanas, error: errorVisitas } = await supabase
    .from('visitas')
    .select('institucion_id')
    .gt('distancia_metros', 500000)

  if (!errorVisitas && visitasLejanas) {
    const idsConProblema = new Set(visitasLejanas.map(v => v.institucion_id))
    const idsYaIncluidos = new Set(invalidas.map(i => i.id))

    for (const instId of idsConProblema) {
      if (idsYaIncluidos.has(instId)) continue
      const inst = instituciones?.find(i => i.id === instId)
      if (!inst) continue
      invalidas.push({
        id: inst.id,
        nombre: inst.nombre,
        ciudad: inst.ciudad,
        estado: inst.estado,
        direccion: inst.direccion,
        latitud: inst.latitud,
        longitud: inst.longitud,
        tieneVisitasLejanas: true,
      })
    }
  }

  return invalidas
},

async repararCoordenadas(
  institucionId: string,
  latitud: number,
  longitud: number
): Promise<void> {
  const { error: errorInst } = await supabase
    .from('instituciones')
    .update({ latitud, longitud })
    .eq('id', institucionId)

  if (errorInst) throw new Error(`Error actualizando institución: ${errorInst.message}`)

  // Obtener visitas con coordenadas registradas para recalcular
  const { data: visitas, error: errorVisitas } = await supabase
    .from('visitas')
    .select('id, latitud_registro, longitud_registro')
    .eq('institucion_id', institucionId)
    .not('latitud_registro', 'is', null)
    .not('longitud_registro', 'is', null)

  if (errorVisitas) throw new Error(`Error obteniendo visitas: ${errorVisitas.message}`)

  for (const visita of visitas || []) {
    const distancia = calcularDistancia(
      Number(visita.latitud_registro),
      Number(visita.longitud_registro),
      latitud,
      longitud
    )
    const { error } = await supabase
      .from('visitas')
      .update({ distancia_metros: distancia })
      .eq('id', visita.id)

    if (error) throw new Error(`Error actualizando visita ${visita.id}: ${error.message}`)
  }
},

async detectarSinCiudad(): Promise<InstitucionSinCiudad[]> {
  const { data, error } = await supabase
    .from('instituciones')
    .select('id, nombre, direccion, ciudad, estado')
    .order('nombre')

  if (error) throw error

  return (data || []).filter(inst =>
    !inst.ciudad || !inst.estado ||
    inst.ciudad.trim() === '' || inst.estado.trim() === ''
  ) as InstitucionSinCiudad[]
},

async actualizarCiudadEstado(
  id: string,
  ciudad: string,
  estado: string
): Promise<void> {
  const { error } = await supabase
    .from('instituciones')
    .update({ ciudad, estado })
    .eq('id', id)

  if (error) throw new Error(`Error actualizando institución: ${error.message}`)
},
}