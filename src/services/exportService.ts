// src/services/exportService.ts

import * as XLSX from 'xlsx';

export interface ContactoParaExportar {
  fecha_contacto: string;
  pal_nombre: string;
  institucion_nombre: string;
  contacto_con?: string;
  nombre_completo?: string;
  telefono?: string;
  numero_pm?: string;
  tipo_contacto?: string;
  estado: string;
  entrega_sobres?: string;
  entrega_kit_rash?: string;
  torre_control?: string;
  descripcion_actividad?: string;
  tema_impartido?: string;
  validacion_gps?: boolean;
  distancia_metros?: number;
}

export const exportService = {
  // Exportar contactos a Excel
  exportarContactosExcel: (contactos: ContactoParaExportar[], nombreArchivo: string = 'reporte_contactos') => {
    try {
      // Formatear datos para Excel
      const datosFormateados = contactos.map((contacto) => ({
        'Fecha': new Date(contacto.fecha_contacto).toLocaleDateString('es-MX'),
        'PAL': contacto.pal_nombre,
        'Institución': contacto.institucion_nombre,
        'Contacto Con': contacto.contacto_con || 'N/A',
        'Nombre': contacto.nombre_completo || 'N/A',
        'Teléfono': contacto.telefono || 'N/A',
        'Número PM': contacto.numero_pm || 'N/A',
        'Tipo': contacto.tipo_contacto || 'N/A',
        'Estado': contacto.estado,
        'Entrega Sobres': contacto.entrega_sobres || 'N/A',
        'Kit RASH': contacto.entrega_kit_rash || 'N/A',
        'Torre Control': contacto.torre_control || 'N/A',
        'Descripción Actividad': contacto.descripcion_actividad || 'N/A',
        'Tema Impartido': contacto.tema_impartido || 'N/A',
        'Validación GPS': contacto.validacion_gps ? 'Sí' : 'No',
        'Distancia (m)': contacto.distancia_metros || 'N/A',
      }));

      // Crear workbook y worksheet
      const worksheet = XLSX.utils.json_to_sheet(datosFormateados);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Contactos');

      // Ajustar ancho de columnas
      const columnWidths = [
        { wch: 12 }, // Fecha
        { wch: 20 }, // PAL
        { wch: 30 }, // Institución
        { wch: 15 }, // Contacto Con
        { wch: 25 }, // Nombre
        { wch: 15 }, // Teléfono
        { wch: 12 }, // Número PM
        { wch: 12 }, // Tipo
        { wch: 12 }, // Estado
        { wch: 15 }, // Entrega Sobres
        { wch: 15 }, // Kit RASH
        { wch: 15 }, // Torre Control
        { wch: 20 }, // Descripción Actividad
        { wch: 20 }, // Tema Impartido
        { wch: 12 }, // Validación GPS
        { wch: 12 }, // Distancia
      ];
      worksheet['!cols'] = columnWidths;

      // Generar archivo y descargar
      const fecha = new Date().toISOString().split('T')[0];
      XLSX.writeFile(workbook, `${nombreArchivo}_${fecha}.xlsx`);

      return true;
    } catch (error) {
      console.error('Error exportando a Excel:', error);
      throw new Error('Error al generar archivo Excel');
    }
  },

  // Exportar contactos a CSV
  exportarContactosCSV: (contactos: ContactoParaExportar[], nombreArchivo: string = 'reporte_contactos') => {
    try {
      const datosFormateados = contactos.map((contacto) => ({
        'Fecha': new Date(contacto.fecha_contacto).toLocaleDateString('es-MX'),
        'PAL': contacto.pal_nombre,
        'Institución': contacto.institucion_nombre,
        'Contacto Con': contacto.contacto_con || 'N/A',
        'Nombre': contacto.nombre_completo || 'N/A',
        'Teléfono': contacto.telefono || 'N/A',
        'Número PM': contacto.numero_pm || 'N/A',
        'Tipo': contacto.tipo_contacto || 'N/A',
        'Estado': contacto.estado,
        'Entrega Sobres': contacto.entrega_sobres || 'N/A',
        'Kit RASH': contacto.entrega_kit_rash || 'N/A',
        'Torre Control': contacto.torre_control || 'N/A',
        'Descripción Actividad': contacto.descripcion_actividad || 'N/A',
        'Tema Impartido': contacto.tema_impartido || 'N/A',
        'Validación GPS': contacto.validacion_gps ? 'Sí' : 'No',
        'Distancia (m)': contacto.distancia_metros || 'N/A',
      }));

      const worksheet = XLSX.utils.json_to_sheet(datosFormateados);
      const csv = XLSX.utils.sheet_to_csv(worksheet);

      // Descargar CSV
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      const fecha = new Date().toISOString().split('T')[0];
      link.setAttribute('href', url);
      link.setAttribute('download', `${nombreArchivo}_${fecha}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return true;
    } catch (error) {
      console.error('Error exportando a CSV:', error);
      throw new Error('Error al generar archivo CSV');
    }
  },
};