// Funciones de validación para el registro de muestras
export const validarMuestra = (data: any) => {
  const errores: Record<string, string> = {};
  if (!data.documento) {
    errores.documento = 'El documento es requerido';
  } else if (!/^\d+$/.test(data.documento)) {
    errores.documento = 'El documento debe contener solo numeros';
  }
  if (!data.tipoDeAgua.tipo) errores.tipoDeAgua = 'El tipo de agua es requerido';
  if (data.tipoDeAgua.tipo === 'residual' && !data.tipoDeAgua.subtipo) {
    errores.tipoAguaResidual = 'Debe especificar tipo de agua residual';
  }
  if (data.tipoDeAgua.tipo === 'otra' && !data.tipoDeAgua.descripcion) {
    errores.descripcion = 'Descripcion del tipo de agua es requerida';
  }
  if (!data.tipoMuestreo) errores.tipoMuestreo = 'El tipo de muestreo es requerido';
  if (!data.lugarMuestreo) errores.lugarMuestreo = 'El lugar de muestreo es requerido';
  // Validar fecha y hora de muestreo: debe tener ambas partes
  if (!data.fechaHoraMuestreo) {
    errores.fechaHoraMuestreo = 'La fecha y hora de muestreo son requeridas';
  } else if (typeof data.fechaHoraMuestreo === 'string') {
    // Espera formato 'YYYY-MM-DDTHH:mm' o similar
    const partes = data.fechaHoraMuestreo.split('T');
    if (partes.length < 2 || !partes[0] || !partes[1]) {
      errores.fechaHoraMuestreo = 'Debe ingresar fecha y hora de muestreo';
    }
  } else if (typeof data.fechaHoraMuestreo === 'object' && (data.fechaHoraMuestreo.fecha === '' || data.fechaHoraMuestreo.hora === '')) {
    errores.fechaHoraMuestreo = 'Debe ingresar fecha y hora de muestreo';
  }
  // Validar tipo de analisis permitido
  const tiposAnalisisValidos = ['fisicoquimico', 'microbiologico'];
  if (!data.tipoAnalisis) {
    errores.tipoAnalisis = 'El tipo de analisis es requerido';
  } else if (!tiposAnalisisValidos.includes(data.tipoAnalisis)) {
    errores.tipoAnalisis = 'El tipo de analisis no es valido';
  }
  if (!data.identificacionMuestra) errores.identificacionMuestra = 'Identificacion de la muestra es requerida';
  if (!data.planMuestreo) errores.planMuestreo = 'El plan de muestreo es requerido';
  if (!data.condicionesAmbientales) errores.condicionesAmbientales = 'Condiciones ambientales requeridas';
  if (!data.preservacionMuestra) errores.preservacionMuestra = 'Preservacion de la muestra es requerida';
  if (data.preservacionMuestra === 'Otro' && !data.preservacionMuestraOtra) {
    errores.preservacionMuestraOtra = 'Debe especificar preservacion "Otro"';
  }
  if (!data.analisisSeleccionados?.length) {
    errores.analisisSeleccionados = 'Debe seleccionar al menos un analisis';
  }
  return errores;
};
