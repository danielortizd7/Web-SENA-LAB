import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const initialResultados = {
  pH: { valor: '', unidad: 'mv' },
  turbidez: { valor: '', unidad: 'NTU' },
  oxigenoDisuelto: { valor: '', unidad: 'mg/L' },
  nitratos: { valor: '', unidad: 'mg/L' },
  solidosSuspendidos: { valor: '', unidad: 'mg/L' },
  fosfatos: { valor: '', unidad: 'mg/k' },
  observaciones: ''
};

const RegistrarResultados = () => {
  const navigate = useNavigate();
  const [resultados, setResultados] = useState(initialResultados);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const { idMuestra } = useParams();
  const [isEditing, setIsEditing] = useState(false);
  const [detallesMuestra, setDetallesMuestra] = useState(null);

  useEffect(() => {
    const cargarResultados = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No hay token de autorización');
          navigate('/login');
          return;
        }

        // Obtener los detalles de la muestra con la URL correcta
        const response = await axios.get(
          `http://localhost:5000/api/muestras/${idMuestra}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            }
          }
        );
        
        console.log('Respuesta del servidor:', response.data);
        
        if (response.data && response.data.success && response.data.data.muestra) {
          const muestra = response.data.data.muestra;

          // Verificar el estado de la muestra
          if (muestra.estado !== 'Recibida' && muestra.estado !== 'En análisis') {
            setError('Solo se pueden registrar o actualizar resultados de muestras en estado "Recibida" o "En análisis"');
            return;
          }

          setDetallesMuestra({
            documento: muestra.documento,
            tipoMuestra: muestra.tipoMuestra,
            tipoMuestreo: muestra.tipoMuestreo,
            fechaHora: muestra.fechaHora,
            estado: muestra.estado,
            lugarMuestreo: muestra.lugarMuestreo,
            tipoDeAgua: muestra.tipoDeAgua,
            analisisSeleccionados: muestra.analisisSeleccionados || []
          });

          // Inicializar valores solo para los análisis seleccionados
          const valoresIniciales = { ...initialResultados };
          if (muestra.analisisSeleccionados) {
            muestra.analisisSeleccionados.forEach(analisis => {
              switch(analisis.toLowerCase()) {
                case 'ph':
                  valoresIniciales.pH = { valor: 0 };
                  break;
                case 'turbidez':
                  valoresIniciales.turbidez = { valor: 0 };
                  break;
                case 'oxigenodisuelto':
                  valoresIniciales.oxigenoDisuelto = { valor: 0 };
                  break;
                case 'nitratos':
                  valoresIniciales.nitratos = { valor: 0 };
                  break;
                case 'solidossuspendidos':
                  valoresIniciales.solidosSuspendidos = { valor: 0 };
                  break;
                case 'fosfatos':
                  valoresIniciales.fosfatos = { valor: 0 };
                  break;
              }
            });
          }
          
          setResultados(valoresIniciales);
          setIsEditing(muestra.estado === 'En análisis');
        }
      } catch (error) {
        console.error('Error al cargar muestra:', error);
        if (error.response?.status === 401 || error.response?.status === 403) {
          setError('No tienes autorización para acceder a estos datos');
          localStorage.removeItem('token');
          navigate('/login');
        } else {
          setError('Error al cargar los datos de la muestra');
        }
      }
    };

    if (idMuestra) {
      cargarResultados();
    }
  }, [idMuestra, navigate]);

  const handleChange = (parametro, valor) => {
    setResultados(prev => ({
      ...prev,
      [parametro]: { valor: parseFloat(valor) || 0 }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No hay token de autorización');
        navigate('/login');
        return;
      }

      // Verificar el estado de la muestra antes de enviar
      if (detallesMuestra && detallesMuestra.estado !== 'Recibida' && detallesMuestra.estado !== 'En análisis') {
        setError('Solo se pueden registrar o actualizar resultados de muestras en estado "Recibida" o "En análisis"');
        setLoading(false);
        return;
      }

      const formData = {
        idMuestra: idMuestra,
        analisis: {
          pH: resultados.pH.valor ? {
            mediciones: {
              M1: resultados.pH.valor.toString(),
              M2: resultados.pH.valor.toString()
            }
          } : undefined,
          turbidez: resultados.turbidez.valor ? {
            mediciones: {
              M1: resultados.turbidez.valor.toString(),
              M2: resultados.turbidez.valor.toString()
            }
          } : undefined,
          conductividad: resultados.conductividad?.valor ? {
            mediciones: {
              M1: resultados.conductividad.valor.toString(),
              M2: resultados.conductividad.valor.toString(),
              unidad: 'µS/cm'
            }
          } : undefined
        },
        observaciones: resultados.observaciones || ''
      };

      let response;
      if (isEditing) {
        response = await axios.put(
          `http://localhost:5000/api/ingreso-resultados/resultados/${idMuestra}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
      } else {
        response = await axios.post(
          `http://localhost:5000/api/ingreso-resultados/registrar/${idMuestra}`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
      }

      setSuccess('✔ Resultados guardados exitosamente');
      setTimeout(() => {
        navigate('/lista-resultados');
      }, 2000);
    } catch (error) {
      console.error('Error:', error);
      setError(error.response?.data?.message || 'Error al guardar los resultados');
      
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={true}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { maxHeight: '90vh' }
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">
          Detalles de la Muestra - {idMuestra}
        </Typography>
        <Button onClick={() => navigate('/resultados')} color="inherit">
          ×
        </Button>
      </DialogTitle>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        
        {detallesMuestra && (
          <Box>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">Documento</Typography>
                <Typography variant="body1">{detallesMuestra.documento}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">Tipo de Muestra</Typography>
                <Typography variant="body1">{detallesMuestra.tipoMuestra}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">Tipo de Muestreo</Typography>
                <Typography variant="body1">{detallesMuestra.tipoMuestreo}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">Fecha y Hora</Typography>
                <Typography variant="body1">{new Date(detallesMuestra.fechaHora).toLocaleString()}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="textSecondary">Estado</Typography>
                <Chip
                  label={detallesMuestra.estado}
                  color={detallesMuestra.estado === 'En análisis' ? 'warning' : 'success'}
                  sx={{ 
                    backgroundColor: detallesMuestra.estado === 'En análisis' ? '#FFA500' : '#39A900',
                    color: 'white'
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" color="textSecondary">Análisis Seleccionados</Typography>
                <Typography variant="body1">{detallesMuestra.analisisSeleccionados.join(", ")}</Typography>
              </Grid>
            </Grid>

            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              Resultados de Análisis
            </Typography>

            <form onSubmit={handleSubmit}>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Parámetro</TableCell>
                      <TableCell>Valor</TableCell>
                      <TableCell>Unidad</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell>pH</TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={resultados.pH.valor}
                          onChange={(e) => handleChange('pH', e.target.value)}
                          inputProps={{ step: "0.01", min: "0", max: "14" }}
                          required
                        />
                      </TableCell>
                      <TableCell>mV</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Turbidez</TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={resultados.turbidez.valor}
                          onChange={(e) => handleChange('turbidez', e.target.value)}
                          inputProps={{ step: "0.01", min: "0" }}
                          required
                        />
                      </TableCell>
                      <TableCell>NTU</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Oxígeno Disuelto</TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={resultados.oxigenoDisuelto.valor}
                          onChange={(e) => handleChange('oxigenoDisuelto', e.target.value)}
                          inputProps={{ step: "0.01", min: "0" }}
                          required
                        />
                      </TableCell>
                      <TableCell>mg/L</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Nitratos</TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={resultados.nitratos.valor}
                          onChange={(e) => handleChange('nitratos', e.target.value)}
                          inputProps={{ step: "0.01", min: "0" }}
                          required
                        />
                      </TableCell>
                      <TableCell>mg/L</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Sólidos Suspendidos</TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={resultados.solidosSuspendidos.valor}
                          onChange={(e) => handleChange('solidosSuspendidos', e.target.value)}
                          inputProps={{ step: "0.1", min: "0" }}
                          required
                        />
                      </TableCell>
                      <TableCell>mg/L</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Fosfatos</TableCell>
                      <TableCell>
                        <TextField
                          size="small"
                          type="number"
                          value={resultados.fosfatos.valor}
                          onChange={(e) => handleChange('fosfatos', e.target.value)}
                          inputProps={{ step: "0.01", min: "0" }}
                          required
                        />
                      </TableCell>
                      <TableCell>mg/L</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              <DialogActions sx={{ mt: 3 }}>
                <Button
                  onClick={() => navigate('/lista-resultados')}
                  color="inherit"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  sx={{
                    backgroundColor: '#39A900',
                    '&:hover': { backgroundColor: '#2d8000' }
                  }}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : (isEditing ? 'Actualizar Resultados' : 'Registrar Resultados')}
                </Button>
              </DialogActions>
            </form>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default RegistrarResultados;