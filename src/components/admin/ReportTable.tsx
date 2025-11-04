// src/components/admin/ReportTable.tsx

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {  FileSpreadsheet, FileText } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { type FiltrosReporte } from './ReportFilters';
import { exportService, type ContactoParaExportar } from '@/services/exportService';
import { toast } from 'sonner';

interface ReportTableProps {
  filtros: FiltrosReporte;
}

interface ContactoReporte {
  id: string;
  fecha_contacto: string;
  estado: string;
  tipo_contacto?: string;
  contacto_con?: string;
  nombre?: string;
  apellido_paterno?: string;
  apellido_materno?: string;
  telefono?: string;
  numero_pm?: string;
  validacion_gps?: boolean;
  distancia_metros?: number;
  users: {
    nombre_completo: string;
  } | null;
  instituciones: {
    nombre: string;
  } | null;
  entrega_sobres: {
    nombre: string;
  } | null;
  entrega_kit_rash: {
    nombre: string;
  } | null;
  torre_control: {
    nombre: string;
  } | null;
  descripcion_actividad: {
    nombre: string;
  } | null;
  tema_impartido: {
    nombre: string;
  } | null;
}

const ITEMS_PER_PAGE = 20;

export const ReportTable = ({ filtros }: ReportTableProps) => {
  const [contactos, setContactos] = useState<ContactoReporte[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalContactos, setTotalContactos] = useState(0);

  useEffect(() => {
    cargarContactos();
  }, [filtros, currentPage]);

  const cargarContactos = async () => {
    try {
      setLoading(true);

      let query = supabase
        .from('contactos')
        .select(`
          id,
          fecha_contacto,
          estado,
          tipo_contacto,
          contacto_con,
          nombre,
          apellido_paterno,
          apellido_materno,
          telefono,
          numero_pm,
          validacion_gps,
          distancia_metros,
          users!contactos_pal_id_fkey(nombre_completo),
          instituciones!contactos_institucion_id_fkey(nombre),
          entrega_sobres:catalogos!contactos_entrega_sobres_id_fkey(nombre),
          entrega_kit_rash:catalogos!contactos_entrega_kit_rash_id_fkey(nombre),
          torre_control:catalogos!contactos_torre_control_id_fkey(nombre),
          descripcion_actividad:catalogos!contactos_descripcion_actividad_id_fkey(nombre),
          tema_impartido:catalogos!contactos_tema_impartido_id_fkey(nombre)
        `, { count: 'exact' })
        .order('fecha_contacto', { ascending: false });

      // Aplicar filtros
      if (filtros.fechaInicio) {
        query = query.gte('fecha_contacto', filtros.fechaInicio);
      }
      if (filtros.fechaFin) {
        query = query.lte('fecha_contacto', filtros.fechaFin);
      }
      if (filtros.palId) {
        query = query.eq('pal_id', filtros.palId);
      }
      if (filtros.institucionId) {
        query = query.eq('institucion_id', filtros.institucionId);
      }
      if (filtros.estado) {
        query = query.eq('estado', filtros.estado);
      }
      if (filtros.tipoContacto) {
        query = query.eq('tipo_contacto', filtros.tipoContacto);
      }

      // Paginación
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      setContactos((data as any) || []);
      setTotalContactos(count || 0);
    } catch (error) {
      console.error('Error cargando contactos:', error);
      toast.error('Error al cargar contactos');
    } finally {
      setLoading(false);
    }
  };

  const exportarExcel = async () => {
    try {
      toast.info('Generando archivo Excel...');

      // Obtener todos los contactos sin paginación
      let query = supabase
        .from('contactos')
        .select(`
          fecha_contacto,
          estado,
          tipo_contacto,
          contacto_con,
          nombre,
          apellido_paterno,
          apellido_materno,
          telefono,
          numero_pm,
          validacion_gps,
          distancia_metros,
          users!contactos_pal_id_fkey(nombre_completo),
          instituciones!contactos_institucion_id_fkey(nombre),
          entrega_sobres:catalogos!contactos_entrega_sobres_id_fkey(nombre),
          entrega_kit_rash:catalogos!contactos_entrega_kit_rash_id_fkey(nombre),
          torre_control:catalogos!contactos_torre_control_id_fkey(nombre),
          descripcion_actividad:catalogos!contactos_descripcion_actividad_id_fkey(nombre),
          tema_impartido:catalogos!contactos_tema_impartido_id_fkey(nombre)
        `)
        .order('fecha_contacto', { ascending: false });

      // Aplicar los mismos filtros
      if (filtros.fechaInicio) query = query.gte('fecha_contacto', filtros.fechaInicio);
      if (filtros.fechaFin) query = query.lte('fecha_contacto', filtros.fechaFin);
      if (filtros.palId) query = query.eq('pal_id', filtros.palId);
      if (filtros.institucionId) query = query.eq('institucion_id', filtros.institucionId);
      if (filtros.estado) query = query.eq('estado', filtros.estado);
      if (filtros.tipoContacto) query = query.eq('tipo_contacto', filtros.tipoContacto);

      const { data, error } = await query;

      if (error) throw error;

      // Formatear datos para exportación
      const datosExportar: ContactoParaExportar[] = (data || []).map((c: any) => ({
        fecha_contacto: c.fecha_contacto,
        pal_nombre: c.users?.nombre_completo || 'N/A',
        institucion_nombre: c.instituciones?.nombre || 'N/A',
        contacto_con: c.contacto_con,
        nombre_completo: c.nombre && c.apellido_paterno 
          ? `${c.nombre} ${c.apellido_paterno} ${c.apellido_materno || ''}`.trim()
          : undefined,
        telefono: c.telefono,
        numero_pm: c.numero_pm,
        tipo_contacto: c.tipo_contacto,
        estado: c.estado,
        entrega_sobres: c.entrega_sobres?.nombre,
        entrega_kit_rash: c.entrega_kit_rash?.nombre,
        torre_control: c.torre_control?.nombre,
        descripcion_actividad: c.descripcion_actividad?.nombre,
        tema_impartido: c.tema_impartido?.nombre,
        validacion_gps: c.validacion_gps,
        distancia_metros: c.distancia_metros,
      }));

      exportService.exportarContactosExcel(datosExportar);
      toast.success('Archivo Excel generado correctamente');
    } catch (error) {
      console.error('Error exportando:', error);
      toast.error('Error al exportar a Excel');
    }
  };

  const exportarCSV = async () => {
    try {
      toast.info('Generando archivo CSV...');

      let query = supabase
        .from('contactos')
        .select(`
          fecha_contacto,
          estado,
          tipo_contacto,
          contacto_con,
          nombre,
          apellido_paterno,
          apellido_materno,
          telefono,
          numero_pm,
          validacion_gps,
          distancia_metros,
          users!contactos_pal_id_fkey(nombre_completo),
          instituciones!contactos_institucion_id_fkey(nombre),
          entrega_sobres:catalogos!contactos_entrega_sobres_id_fkey(nombre),
          entrega_kit_rash:catalogos!contactos_entrega_kit_rash_id_fkey(nombre),
          torre_control:catalogos!contactos_torre_control_id_fkey(nombre),
          descripcion_actividad:catalogos!contactos_descripcion_actividad_id_fkey(nombre),
          tema_impartido:catalogos!contactos_tema_impartido_id_fkey(nombre)
        `)
        .order('fecha_contacto', { ascending: false });

      if (filtros.fechaInicio) query = query.gte('fecha_contacto', filtros.fechaInicio);
      if (filtros.fechaFin) query = query.lte('fecha_contacto', filtros.fechaFin);
      if (filtros.palId) query = query.eq('pal_id', filtros.palId);
      if (filtros.institucionId) query = query.eq('institucion_id', filtros.institucionId);
      if (filtros.estado) query = query.eq('estado', filtros.estado);
      if (filtros.tipoContacto) query = query.eq('tipo_contacto', filtros.tipoContacto);

      const { data, error } = await query;

      if (error) throw error;

      const datosExportar: ContactoParaExportar[] = (data || []).map((c: any) => ({
        fecha_contacto: c.fecha_contacto,
        pal_nombre: c.users?.nombre_completo || 'N/A',
        institucion_nombre: c.instituciones?.nombre || 'N/A',
        contacto_con: c.contacto_con,
        nombre_completo: c.nombre && c.apellido_paterno 
          ? `${c.nombre} ${c.apellido_paterno} ${c.apellido_materno || ''}`.trim()
          : undefined,
        telefono: c.telefono,
        numero_pm: c.numero_pm,
        tipo_contacto: c.tipo_contacto,
        estado: c.estado,
        entrega_sobres: c.entrega_sobres?.nombre,
        entrega_kit_rash: c.entrega_kit_rash?.nombre,
        torre_control: c.torre_control?.nombre,
        descripcion_actividad: c.descripcion_actividad?.nombre,
        tema_impartido: c.tema_impartido?.nombre,
        validacion_gps: c.validacion_gps,
        distancia_metros: c.distancia_metros,
      }));

      exportService.exportarContactosCSV(datosExportar);
      toast.success('Archivo CSV generado correctamente');
    } catch (error) {
      console.error('Error exportando:', error);
      toast.error('Error al exportar a CSV');
    }
  };

  const getEstadoBadge = (estado: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      programado: 'secondary',
      confirmado: 'default',
      cancelado: 'destructive',
    };
    return <Badge variant={variants[estado] || 'default'}>{estado}</Badge>;
  };

  const totalPages = Math.ceil(totalContactos / ITEMS_PER_PAGE);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Reporte de Contactos</CardTitle>
          <div className="flex gap-2">
            <Button onClick={exportarCSV} variant="outline" size="sm">
              <FileText className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button onClick={exportarExcel} variant="outline" size="sm">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Excel
            </Button>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Total: {totalContactos} contacto{totalContactos !== 1 ? 's' : ''}
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-gray-500">Cargando...</div>
        ) : contactos.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No se encontraron contactos con los filtros aplicados
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>PAL</TableHead>
                    <TableHead>Institución</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contactos.map((contacto) => {
                    const nombreCompleto = contacto.nombre && contacto.apellido_paterno
                      ? `${contacto.nombre} ${contacto.apellido_paterno} ${contacto.apellido_materno || ''}`.trim()
                      : 'N/A';

                    return (
                      <TableRow key={contacto.id}>
                        <TableCell>
                          {new Date(contacto.fecha_contacto).toLocaleDateString('es-MX')}
                        </TableCell>
                        <TableCell>{contacto.users?.nombre_completo || 'N/A'}</TableCell>
                        <TableCell>{contacto.instituciones?.nombre || 'N/A'}</TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{nombreCompleto}</div>
                            {contacto.contacto_con && (
                              <div className="text-gray-500 text-xs capitalize">
                                {contacto.contacto_con}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="capitalize">
                          {contacto.tipo_contacto || 'N/A'}
                        </TableCell>
                        <TableCell>{getEstadoBadge(contacto.estado)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600">
                  Página {currentPage} de {totalPages}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    variant="outline"
                    size="sm"
                  >
                    Anterior
                  </Button>
                  <Button
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    variant="outline"
                    size="sm"
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};