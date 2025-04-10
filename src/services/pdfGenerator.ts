import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generarPDFMuestra = (muestra: any) => {
  const doc = new jsPDF();

  // Función para reconstruir fechas
  const reconstruirFecha = (fechaObj: any) => {
    if (fechaObj?.fecha && fechaObj?.hora) {
      return `${fechaObj.fecha} ${fechaObj.hora}`;
    }
    return 'N/A';
  };

  // Función para validar y ajustar imágenes base64
  const validarImagenBase64 = (base64: string | undefined) => {
    if (base64 && base64.startsWith('data:image/png;base64,')) {
      return base64;
    } else if (base64) {
      return `data:image/png;base64,${base64}`;
    }
    return null;
  };

  // Depurar los datos antes de generar el PDF
  console.log('Datos de la muestra para el PDF:', muestra);

  // Título
  doc.setFontSize(18);
  doc.text('Detalles de la Muestra', 105, 15, { align: 'center' });

  // Tabla de detalles
  const detalles = [
    ['Campo', 'Valor'],
    ['ID Muestra', muestra.id_muestra || 'N/A'],
    ['Documento', muestra.cliente?.documento || 'N/A'],
    ['Nombre del Cliente', muestra.cliente?.nombre || 'N/A'],
    ['Tipo de Análisis', muestra.tipoAnalisis || 'N/A'],
    ['Tipo de Muestreo', muestra.tipoMuestreo || 'N/A'],
    ['Fecha y Hora de Muestreo', reconstruirFecha(muestra.fechaHoraMuestreo)],
    ['Lugar de Muestreo', muestra.lugarMuestreo || 'N/A'],
    ['Identificación de Muestra', muestra.identificacionMuestra || 'N/A'],
    ['Plan de Muestreo', muestra.planMuestreo || 'N/A'],
    ['Condiciones Ambientales', muestra.condicionesAmbientales || 'N/A'],
    ['Preservación de Muestra', muestra.preservacionMuestra || 'N/A'],
    ['Análisis Seleccionados', (muestra.analisisSeleccionados || []).join(', ') || 'N/A'],
    ['Observaciones', muestra.observaciones || 'N/A'],
    ['Estado', muestra.estado || 'N/A'],
    ['Último cambio por', muestra.historial?.[0]?.administrador?.nombre || 'N/A'],
    ['Fecha de cambio', reconstruirFecha(muestra.historial?.[0]?.fechaCambio)],
    ['Observaciones Hist.', muestra.historial?.[0]?.observaciones || 'N/A']
  ];

  autoTable(doc, {
    startY: 25,
    head: [['Campo', 'Valor']],
    body: detalles.map(([campo, valor]) => [campo, valor]),
    theme: 'grid',
    styles: { fontSize: 10 },
    columnStyles: {
      0: { cellWidth: 60 }, // Ancho de la columna "Campo"
      1: { cellWidth: 120 } // Ancho de la columna "Valor"
    },
    margin: { left: 10, right: 10 } // Márgenes para ajustar el contenido
  });

  // Firmas
  doc.addPage();
  doc.setFontSize(16);
  doc.text('Firmas', 105, 15, { align: 'center' });

  // Firma del Administrador
  const firmaAdministrador = validarImagenBase64(muestra.firmas?.administrador?.firmaAdministrador);
  if (firmaAdministrador) {
    console.log('Firma del Administrador válida:', firmaAdministrador);
    doc.text('Firma del Administrador:', 20, 30);
    doc.addImage(firmaAdministrador, 'PNG', 20, 35, 80, 40);
  } else {
    doc.text('Firma del Administrador: No disponible', 20, 30);
  }

  // Firma del Cliente
  const firmaCliente = validarImagenBase64(muestra.firmas?.cliente?.firmaCliente);
  if (firmaCliente) {
    console.log('Firma del Cliente válida:', firmaCliente);
    doc.text('Firma del Cliente:', 20, 90);
    doc.addImage(firmaCliente, 'PNG', 20, 95, 80, 40);
  } else {
    doc.text('Firma del Cliente: No disponible', 20, 90);
  }

  return doc;
};
