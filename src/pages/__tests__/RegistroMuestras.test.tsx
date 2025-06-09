import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { validarMuestra } from '../../utils/validaciones';

// DATOS DE PRUEBA: Puedes modificar este objeto para probar cualquier validación
// Si cambias o dejas vacío cualquier campo obligatorio, el test fallará
const ejemploMuestra = {
  documento: '123456',
  tipoDeAgua: { tipo: 'potable' },
  tipoMuestreo: 'puntual',
  lugarMuestreo: 'Sitio X',
  fechaHoraMuestreo: '2025-05-01T10:00',
  tipoAnalisis: 'fisicoquimico',
  identificacionMuestra: 'M001',
  planMuestreo: 'Plan A',
  condicionesAmbientales: 'Normal',
  preservacionMuestra: 'refrigeracion',
  analisisSeleccionados: ['pH', 'temperatura'],
};

describe('Validación de Muestras (ejemplo unico)', () => {
  test('debe pasar si todos los campos son válidos', () => {
    const errores = validarMuestra(ejemploMuestra);
    expect(Object.keys(errores).length).toBe(0);
  });

  test('debe arrojar error si algún campo obligatorio está vacío', () => {
    const campos = [
      'documento',
      'tipoDeAgua',
      'tipoMuestreo',
      'lugarMuestreo',
      'fechaHoraMuestreo',
      'tipoAnalisis',
      'identificacionMuestra',
      'planMuestreo',
      'condicionesAmbientales',
      'preservacionMuestra',
    ];
    for (const campo of campos) {
      const muestra = { ...ejemploMuestra, tipoDeAgua: { ...ejemploMuestra.tipoDeAgua } };
      if (campo === 'tipoDeAgua') {
        muestra.tipoDeAgua.tipo = '';
      } else {
        muestra[campo] = '';
      }
      const errores = validarMuestra(muestra);
      expect(Object.keys(errores).length).toBeGreaterThan(0);
    }
  });

  test('debe arrojar error si el documento tiene letras o simbolos', () => {
    const muestra = { ...ejemploMuestra, documento: '12A34B' };
    const errores = validarMuestra(muestra);
    expect(errores.documento).toBe('El documento debe contener solo numeros');
  });

  test('debe arrojar error si falta la hora en fechaHoraMuestreo', () => {
    const muestra = { ...ejemploMuestra, fechaHoraMuestreo: '2025-05-01T' };
    const errores = validarMuestra(muestra);
    expect(errores.fechaHoraMuestreo).toBe('Debe ingresar fecha y hora de muestreo');
  });

  test('debe arrojar error si falta la fecha en fechaHoraMuestreo', () => {
    const muestra = { ...ejemploMuestra, fechaHoraMuestreo: 'T10:00' };
    const errores = validarMuestra(muestra);
    expect(errores.fechaHoraMuestreo).toBe('Debe ingresar fecha y hora de muestreo');
  });

  test('debe arrojar error si fechaHoraMuestreo es objeto y falta fecha u hora', () => {
    const muestra1 = { ...ejemploMuestra, fechaHoraMuestreo: { fecha: '', hora: '10:00' } };
    const muestra2 = { ...ejemploMuestra, fechaHoraMuestreo: { fecha: '2025-05-01', hora: '' } };
    expect(validarMuestra(muestra1).fechaHoraMuestreo).toBe('Debe ingresar fecha y hora de muestreo');
    expect(validarMuestra(muestra2).fechaHoraMuestreo).toBe('Debe ingresar fecha y hora de muestreo');
  });

  test('debe arrojar error si el tipo de analisis no es valido', () => {
    const muestra = { ...ejemploMuestra, tipoAnalisis: 'otro' };
    const errores = validarMuestra(muestra);
    expect(errores.tipoAnalisis).toBe('El tipo de analisis no es valido');
  });
});
