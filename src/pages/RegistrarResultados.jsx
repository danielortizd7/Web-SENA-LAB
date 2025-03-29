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
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const initialResultados = {
  pH: { valor: 0 },
  turbidez: { valor: 0 },
  oxigenoDisuelto: { valor: 0 },
  nitratos: { valor: 0 },
  solidosSuspendidos: { valor: 0 },
  fosfatos: { valor: 0 }
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
        ...resultados,
        idMuestra: idMuestra,
        fechaHora: new Date().toISOString()
      };

      let response;
      if (isEditing) {
        response = await axios.put(
          `http://localhost:5000/api/muestras/${idMuestra}`,
          {
            ...formData,
          },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );
      } else {
        response = await axios.post(
          `http://localhost:5000/api/muestras/${idMuestra}/resultados`,
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
    <Paper sx={{ padding: 3, maxWidth: 800, margin: "auto", marginTop: 3 }}>
      <Typography variant="h5" gutterBottom align="center">
        {isEditing ? 'Editar Resultados' : 'Registrar Resultados'}
      </Typography>
      <Typography variant="subtitle1" gutterBottom align="center" color="primary">
        Muestra: {idMuestra}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      {detallesMuestra && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            Detalles de la Muestra
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Campo</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Valor</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>Documento</TableCell>
                  <TableCell>{detallesMuestra.documento}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Tipo de Muestra</TableCell>
                  <TableCell>{detallesMuestra.tipoMuestra}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Tipo de Muestreo</TableCell>
                  <TableCell>{detallesMuestra.tipoMuestreo}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Fecha y Hora</TableCell>
                  <TableCell>{new Date(detallesMuestra.fechaHora).toLocaleString()}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Estado</TableCell>
                  <TableCell>{detallesMuestra.estado}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Lugar de Muestreo</TableCell>
                  <TableCell>{detallesMuestra.lugarMuestreo}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Tipo de Agua</TableCell>
                  <TableCell>
                    {detallesMuestra.tipoDeAgua?.tipo}
                    {detallesMuestra.tipoDeAgua?.descripcion && ` - ${detallesMuestra.tipoDeAgua.descripcion}`}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Análisis Seleccionados</TableCell>
                  <TableCell>{detallesMuestra.analisisSeleccionados.join(", ")}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="pH"
              type="number"
              value={resultados.pH.valor}
              onChange={(e) => handleChange('pH', e.target.value)}
              inputProps={{ step: "0.01", min: "0", max: "14" }}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Turbidez"
              type="number"
              value={resultados.turbidez.valor}
              onChange={(e) => handleChange('turbidez', e.target.value)}
              inputProps={{ step: "0.01", min: "0" }}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Oxígeno Disuelto"
              type="number"
              value={resultados.oxigenoDisuelto.valor}
              onChange={(e) => handleChange('oxigenoDisuelto', e.target.value)}
              inputProps={{ step: "0.01", min: "0" }}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Nitratos"
              type="number"
              value={resultados.nitratos.valor}
              onChange={(e) => handleChange('nitratos', e.target.value)}
              inputProps={{ step: "0.01", min: "0" }}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Sólidos Suspendidos"
              type="number"
              value={resultados.solidosSuspendidos.valor}
              onChange={(e) => handleChange('solidosSuspendidos', e.target.value)}
              inputProps={{ step: "0.1", min: "0" }}
              required
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Fosfatos"
              type="number"
              value={resultados.fosfatos.valor}
              onChange={(e) => handleChange('fosfatos', e.target.value)}
              inputProps={{ step: "0.01", min: "0" }}
              required
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : (isEditing ? 'Actualizar Resultados' : 'Registrar Resultados')}
          </Button>
        </Box>
      </form>
    </Paper>
  );
};

export default RegistrarResultados; 