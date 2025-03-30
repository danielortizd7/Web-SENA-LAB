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

const RegistrarResultados = () => {
  const { idMuestra } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [resultadoExistente, setResultadoExistente] = useState(null);
  const [muestraInfo, setMuestraInfo] = useState(null);
  const [historialCambios, setHistorialCambios] = useState([]);
  const [openConfirm, setOpenConfirm] = useState(false);

  const [resultados, setResultados] = useState({
    pH: '',
    turbidez: '',
    oxigenoDisuelto: '',
    nitratos: '',
    solidosSuspendidos: '',
    fosfatos: '',
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
        
        // Obtener información de la muestra
        const muestraResponse = await axios.get(
          `https://daniel-back-dom.onrender.com/api/muestras/${idMuestra}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        if (!muestraResponse.data?.data) {
          throw new Error('No se encontró la muestra');
        }

        setMuestraInfo(muestraResponse.data.data);

        try {
          const resultadosResponse = await axios.get(
            `https://daniel-back-dom.onrender.com/api/ingreso-resultados/muestra/${idMuestra}`,
            {
              headers: { Authorization: `Bearer ${token}` }
            }
          );
          
          if (resultadosResponse.data?.success && resultadosResponse.data?.data?.resultado) {
            const resultado = resultadosResponse.data.data.resultado;
            setResultadoExistente(resultado);
            setHistorialCambios(resultado.historialCambios || []);

            // Formatear valores existentes
            setResultados({
              pH: resultado.pH ? `${resultado.pH.valor}${resultado.pH.unidad}` : '',
              turbidez: resultado.turbidez ? `${resultado.turbidez.valor}${resultado.turbidez.unidad}` : '',
              oxigenoDisuelto: resultado.oxigenoDisuelto ? `${resultado.oxigenoDisuelto.valor}${resultado.oxigenoDisuelto.unidad}` : '',
              nitratos: resultado.nitratos ? `${resultado.nitratos.valor}${resultado.nitratos.unidad}` : '',
              solidosSuspendidos: resultado.solidosSuspendidos ? `${resultado.solidosSuspendidos.valor}${resultado.solidosSuspendidos.unidad}` : '',
              fosfatos: resultado.fosfatos ? `${resultado.fosfatos.valor}${resultado.fosfatos.unidad}` : '',
              observaciones: resultado.observaciones || ''
            });
          }
        } catch (error) {
          setLoading(false); // Asegurar que loading se desactive incluso si no hay resultados
          setSnackbar({
            open: true,
            message: 'No hay resultados previos para esta muestra',
            severity: 'info'
          });
        }
      } catch (error) {
        setSnackbar({
          open: true,
          message: 'Error al cargar la información de la muestra',
          severity: 'error'
        });
      } finally {
        setLoading(false); // Asegurar que loading siempre se desactive
      }
    };

    verificarMuestra();
  }, [idMuestra, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setOpenConfirm(true);
  };

  const handleConfirmSubmit = async () => {
    setOpenConfirm(false);
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      
      // Determinar si es nuevo registro o actualización basado en resultadoExistente
      const endpoint = resultadoExistente
        ? `https://daniel-back-dom.onrender.com/ingreso-resultados/editar/${idMuestra}`
        : `https://daniel-back-dom.onrender.com/api/ingreso-resultados/registrar/${idMuestra}`;
      
      const method = resultadoExistente ? 'put' : 'post';
      
      const response = await axios[method](
        endpoint,
        resultados,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data?.success) {
        // Actualizar estado local con la respuesta
        if (response.data.data?.resultado) {
          setResultadoExistente(response.data.data.resultado);
          setHistorialCambios(response.data.data.resultado.historialCambios || []);
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setResultados(prev => ({
      ...prev,
      [name]: value
    }));
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

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              name="pH"
              label="pH (mv)"
              value={resultados.pH}
              onChange={handleChange}
              placeholder="Ej: 6.6mv"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              name="turbidez"
              label="Turbidez (NTU)"
              value={resultados.turbidez}
              onChange={handleChange}
              placeholder="Ej: 1.6 NTU"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              name="oxigenoDisuelto"
              label="Oxígeno Disuelto (mg/L)"
              value={resultados.oxigenoDisuelto}
              onChange={handleChange}
              placeholder="Ej: 9.1mg/L"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              name="nitratos"
              label="Nitratos (mg/L)"
              value={resultados.nitratos}
              onChange={handleChange}
              placeholder="Ej: 6.8 mg/L"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              name="solidosSuspendidos"
              label="Sólidos Suspendidos (mg/L)"
              value={resultados.solidosSuspendidos}
              onChange={handleChange}
              placeholder="Ej: 6.8 mg/L"
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              name="fosfatos"
              label="Fosfatos (mg/k)"
              value={resultados.fosfatos}
              onChange={handleChange}
              placeholder="Ej: 3.9 mg/k"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              name="observaciones"
              label="Observaciones"
              value={resultados.observaciones}
              onChange={handleChange}
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

        {/* Historial de cambios - Solo mostrar si hay resultadoExistente */}
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
                  Fecha: {new Date(cambio.fecha).toLocaleString()}
                </Typography>
                <Box sx={{ mt: 1 }}>
                  {Object.entries(cambio.cambiosRealizados).map(([param, valores]) => (
                    param !== '_id' && (
                      <Typography key={param} variant="body2">
                        {param}: {valores.valorAnterior} → {valores.valorNuevo}
                        {valores.unidad ? ` ${valores.unidad}` : ''}
                      </Typography>
                    )
                  ))}
                </Box>
              </Paper>
            ))}
          </Box>
        )}
      </form>

      {/* Diálogo de confirmación */}
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