import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  Snackbar,
  Alert,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import axios from 'axios';

// URLs base actualizadas
const BASE_URLS = {
  USUARIOS: import.meta.env.VITE_BACKEND_URL || 'https://backend-sena-lab-1-qpzp.onrender.com/api',
  MUESTRAS: import.meta.env.VITE_BACKEND_MUESTRAS_URL || 'https://backend-registro-muestras.onrender.com/api'
};

// URLs específicas actualizadas
const API_URLS = {
  USUARIOS: `${BASE_URLS.USUARIOS}/usuarios`,
  MUESTRAS: `${BASE_URLS.MUESTRAS}/api/muestras`,
  RESULTADOS: `${BASE_URLS.MUESTRAS}/api/ingreso-resultados`
};

const formatearFecha = (fecha) => {
  if (!fecha) return 'Fecha no disponible';
  
  // Si la fecha viene en el formato del backend
  if (typeof fecha === 'object' && fecha.fecha && fecha.hora) {
    return `${fecha.fecha} ${fecha.hora}`;
  }
  
  return 'Fecha inválida';
};

const RegistrarResultados = () => {
  const { idMuestra } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [resultadoExistente, setResultadoExistente] = useState(null);
  const [muestraInfo, setMuestraInfo] = useState(null);
  const [historialCambios, setHistorialCambios] = useState([]);
  const [openConfirm, setOpenConfirm] = useState(false);

  // Estado para los resultados dinámicos
  const [resultados, setResultados] = useState({
    resultados: {},
    observaciones: ''
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'info'
  });

  useEffect(() => {
    const verificarMuestra = async () => {
      try {
        const token = localStorage.getItem('token');
        setLoading(true);
        
        // Obtener información de la muestra
        const muestraResponse = await axios.get(
          `${API_URLS.MUESTRAS}/${idMuestra}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (!muestraResponse.data?.data?.muestra) {
          throw new Error('No se encontró la muestra');
        }

        const muestraData = muestraResponse.data.data.muestra;
        setMuestraInfo(muestraData);

        // Intentar obtener los resultados existentes
        try {
          const resultadosResponse = await axios.get(
            `${API_URLS.RESULTADOS}/muestra/${idMuestra}`,
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );
          
          if (resultadosResponse.data?.success && resultadosResponse.data?.data) {
            const resultado = resultadosResponse.data.data;
            setResultadoExistente(resultado);
            setHistorialCambios(resultado.historialCambios || []);

            // Formatear valores existentes
            const resultadosExistentes = {};
            Object.entries(resultado.resultados).forEach(([nombre, datos]) => {
              resultadosExistentes[nombre] = {
                valor: datos.valor,
                unidad: datos.unidad
              };
            });

            setResultados({
              resultados: resultadosExistentes,
              observaciones: resultado.observaciones || ''
            });
          } else {
            // Solo si no hay resultados previos, inicializar con valores vacíos
            const resultadosIniciales = {};
            muestraData.analisisSeleccionados.forEach(analisis => {
              resultadosIniciales[analisis.nombre] = {
                valor: '',
                unidad: analisis.unidad || 'mg/L'
              };
            });

            setResultados({
              resultados: resultadosIniciales,
              observaciones: ''
            });
          }
        } catch (error) {
          console.log('No hay resultados previos para esta muestra');
          // Solo si hay error al obtener resultados, inicializar con valores vacíos
          const resultadosIniciales = {};
          muestraData.analisisSeleccionados.forEach(analisis => {
            resultadosIniciales[analisis.nombre] = {
              valor: '',
              unidad: analisis.unidad || 'mg/L'
            };
          });

          setResultados({
            resultados: resultadosIniciales,
            observaciones: ''
          });
        }
      } catch (error) {
        console.error('Error al cargar la información:', error);
        setSnackbar({
          open: true,
          message: 'Error al cargar la información de la muestra',
          severity: 'error'
        });
      } finally {
        setLoading(false);
      }
    };

    verificarMuestra();
  }, [idMuestra]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setOpenConfirm(true);
  };

  const handleConfirmSubmit = async () => {
    setOpenConfirm(false);
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      
      const endpoint = resultadoExistente
        ? `${API_URLS.RESULTADOS}/editar/${idMuestra}`
        : `${API_URLS.RESULTADOS}/registrar/${idMuestra}`;
      
      const method = resultadoExistente ? 'put' : 'post';

      // Formatear los resultados para que coincidan con los nombres exactos de los análisis
      const resultadosFormateados = {};
      Object.entries(resultados.resultados).forEach(([nombre, datos]) => {
        const analisisEncontrado = muestraInfo.analisisSeleccionados.find(
          a => a.nombre === nombre
        );
        if (analisisEncontrado) {
          resultadosFormateados[analisisEncontrado.nombre] = {
            valor: datos.valor,
            unidad: datos.unidad || analisisEncontrado.unidad
          };
        }
      });
      
      const response = await axios[method](
        endpoint,
        {
          resultados: resultadosFormateados,
          observaciones: resultados.observaciones
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data?.success) {
        if (response.data.data) {
          setResultadoExistente(response.data.data);
          setHistorialCambios(response.data.data.historialCambios || []);
        }

        setSnackbar({
          open: true,
          message: resultadoExistente ? 'Resultados actualizados correctamente' : 'Resultados registrados correctamente',
          severity: 'success'
        });
      }

    } catch (error) {
      setSnackbar({
        open: true,
        message: `Error: ${error.response?.data?.message || 'Error al procesar la solicitud'}`,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (analisis, campo) => (e) => {
    const { value } = e.target;
    
    if (campo === 'observaciones') {
      setResultados(prev => ({
        ...prev,
        observaciones: value
      }));
    } else {
      setResultados(prev => ({
        ...prev,
        resultados: {
          ...prev.resultados,
          [analisis]: {
            ...prev.resultados[analisis],
            [campo]: value
          }
        }
      }));
    }
  };

  return (
    <Paper sx={{ p: 4, margin: 'auto', maxWidth: 800, mt: 4 }}>
      <Typography variant="h4" align="center" gutterBottom>
        {resultadoExistente ? 'Editar Resultados' : 'Registrar Resultados'}
      </Typography>
      <Typography variant="h6" gutterBottom>
        Muestra: {idMuestra}
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Estado: {muestraInfo?.estado || 'Cargando...'}
      </Typography>

      {muestraInfo && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1">
            Tipo de Análisis: {muestraInfo.tipoAnalisis}
          </Typography>
          <Typography variant="subtitle1">
            Análisis Seleccionados: {muestraInfo.analisisSeleccionados?.map(a => a.nombre).join(', ')}
          </Typography>
        </Box>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {muestraInfo?.analisisSeleccionados?.map((analisis) => (
            <Grid item xs={12} sm={6} key={analisis.nombre}>
              <TextField
                fullWidth
                name={`${analisis.nombre}-valor`}
                label={`${analisis.nombre} (${analisis.unidad})`}
                value={resultados.resultados[analisis.nombre]?.valor || ''}
                onChange={handleChange(analisis.nombre, 'valor')}
                placeholder={`Rango: ${analisis.rango}`}
                helperText={`Método: ${analisis.metodo}`}
              />
            </Grid>
          ))}

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              name="observaciones"
              label="Observaciones"
              value={resultados.observaciones}
              onChange={handleChange(null, 'observaciones')}
            />
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 2 }}>
              <Button
                variant="contained"
                color="secondary"
                onClick={() => navigate('/muestras')}
              >
                Volver
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Guardar Cambios'}
              </Button>
            </Box>
          </Grid>
        </Grid>

        {resultadoExistente && historialCambios.length > 0 && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Historial de Cambios
            </Typography>
            {historialCambios.map((cambio, index) => (
              <Paper key={index} sx={{ p: 2, mb: 2, bgcolor: '#f5f5f5' }}>
                <Typography variant="subtitle2">
                  Realizado por: {cambio.nombre}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Fecha: {formatearFecha(cambio.fecha)}
                </Typography>
                <Box sx={{ mt: 1 }}>
                  {cambio.cambiosRealizados.resultados && 
                    Object.entries(cambio.cambiosRealizados.resultados).map(([param, valores]) => (
                      <Typography key={param} variant="body2">
                        {param}: {valores.valorAnterior} → {valores.valorNuevo}
                      </Typography>
                    ))}
                  <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                    Observaciones: {cambio.observaciones}
                  </Typography>
                </Box>
              </Paper>
            ))}
          </Box>
        )}
      </form>

      <Dialog
        open={openConfirm}
        onClose={() => setOpenConfirm(false)}
      >
        <DialogTitle sx={{ color: '#39A900' }}>
          Confirmar Acción
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            ¿Está seguro de que desea {resultadoExistente ? 'actualizar' : 'registrar'} los resultados?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setOpenConfirm(false)}
            variant="outlined"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmSubmit}
            variant="contained"
            sx={{
              backgroundColor: '#39A900',
              '&:hover': { backgroundColor: '#2d8000' }
            }}
          >
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default RegistrarResultados;