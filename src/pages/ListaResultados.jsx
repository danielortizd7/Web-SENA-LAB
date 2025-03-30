import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Alert,
  CircularProgress,
  Chip,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  TextField,
  Snackbar,
  Modal,
  Grid
} from '@mui/material';
import Pagination from '@mui/material/Pagination';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';

const ListaResultados = () => {
  const navigate = useNavigate();
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedResult, setSelectedResult] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [observacionesVerificacion, setObservacionesVerificacion] = useState('');
  const [dialogoVerificacion, setDialogoVerificacion] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    cargarResultados();
  }, []);

  const cargarResultados = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (!token) {
        setError('No tienes autorización. Inicia sesión.');
        navigate('/login');
        return;
      }

      const userRole = userData.rol?.toLowerCase();
      if (!userRole || (userRole !== 'laboratorista' && userRole !== 'administrador')) {
        setError('No tienes autorización para ver esta página.');
        navigate('/login');
        return;
      }

      const response = await axios.get('https://daniel-back-dom.onrender.com/api/ingreso-resultados/resultados', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data && Array.isArray(response.data)) {
        setResultados(response.data);
      } else if (response.data && response.data.data && Array.isArray(response.data.data.resultados)) {
        setResultados(response.data.data.resultados);
      } else if (response.data && Array.isArray(response.data.resultados)) {
        setResultados(response.data.resultados);
      } else {
        setResultados([]);
      }
    } catch (err) {
      console.error('Error al cargar resultados:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        setError('Sesión expirada. Por favor, inicia sesión nuevamente.');
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        setError('Error al cargar los resultados. Por favor, intenta más tarde.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleVerificarResultados = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      if (userData.rol !== 'administrador') {
        setSnackbar({
          open: true,
          message: 'Solo el administrador puede verificar resultados',
          severity: 'error'
        });
        return;
      }

      setVerificando(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `https://daniel-back-dom.onrender.com/api/ingreso-resultados/verificar/${selectedResult.idMuestra}`,
        { observaciones: observacionesVerificacion },
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        setDialogoVerificacion(false);
        setSelectedResult(null);
        setSnackbar({
          open: true,
          message: 'Resultados verificados correctamente',
          severity: 'success'
        });
        cargarResultados(); // Recargar la lista
      }
    } catch (error) {
      console.error('Error al verificar resultados:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Error al verificar los resultados',
        severity: 'error'
      });
    } finally {
      setVerificando(false);
    }
  };

  const filteredResultados = resultados.filter((resultado) =>
    resultado.idMuestra.toLowerCase().includes(searchTerm.toLowerCase()) ||
    resultado.nombreCliente?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleVerDetalles = (resultado) => {
    setSelectedResult(resultado);
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentResults = filteredResultados.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredResultados.length / itemsPerPage);

  return (
    <Paper sx={{ p: 4, margin: 'auto', maxWidth: 1200, mt: 4, bgcolor: 'background.paper' }}>
      <Typography variant="h4" align="center" gutterBottom sx={{ 
        color: '#333',
        fontWeight: 'bold',
        mb: 3
      }}>
        Lista de Resultados
      </Typography>

      <TextField
        fullWidth
        variant="outlined"
        label="Buscar por ID de muestra o cliente"
        value={searchTerm}
        onChange={handleSearchChange}
        sx={{ mb: 3 }}
      />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          <TableContainer component={Paper} sx={{ 
            boxShadow: 3,
            borderRadius: 2,
            overflow: 'hidden'
          }}>
            <Table>
              <TableHead sx={{ bgcolor: '#39A900' }}>
                <TableRow>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>ID Muestra</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Cliente</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Fecha</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Estado</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {currentResults.map((resultado) => (
                  <TableRow 
                    key={resultado._id}
                    sx={{
                      transition: 'background-color 0.3s',
                      '&:hover': {
                        bgcolor: 'rgba(57, 169, 0, 0.04)',
                        transform: 'scale(1.01)',
                      },
                      cursor: 'pointer'
                    }}
                  >
                    <TableCell>{resultado.idMuestra}</TableCell>
                    <TableCell>{resultado.nombreCliente}</TableCell>
                    <TableCell>
                      {new Date(resultado.fechaHora).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={resultado.verificado ? "Verificado" : "Pendiente"}
                        color={resultado.verificado ? "success" : "warning"}
                        sx={{
                          bgcolor: resultado.verificado ? '#39A900' : '#FF9800',
                          color: 'white'
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handleVerDetalles(resultado)}
                          sx={{
                            bgcolor: '#39A900',
                            '&:hover': {
                              bgcolor: '#2d8000',
                            }
                          }}
                        >
                          Ver Detalles
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Modal
            open={selectedResult !== null}
            onClose={() => setSelectedResult(null)}
          >
            <Box sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 800,
              bgcolor: 'background.paper',
              boxShadow: 24,
              p: 4,
              borderRadius: 2,
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              {selectedResult && (
                <>
                  <Typography variant="h5" gutterBottom sx={{ color: '#39A900', textAlign: 'center' }}>
                    Detalles del Resultado
                  </Typography>
                  <Grid container spacing={3}>
                    <Grid item xs={12}>
                      <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                        <Typography variant="h6" gutterBottom>
                          Información General
                        </Typography>
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Typography><strong>ID Muestra:</strong> {selectedResult.idMuestra}</Typography>
                            <Typography><strong>Cliente:</strong> {selectedResult.nombreCliente}</Typography>
                            <Typography><strong>Fecha:</strong> {new Date(selectedResult.fechaHora).toLocaleString()}</Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography><strong>Estado:</strong> {selectedResult.verificado ? "Verificado" : "Pendiente"}</Typography>
                            <Typography><strong>Laboratorista:</strong> {selectedResult.nombreLaboratorista}</Typography>
                          </Grid>
                        </Grid>
                      </Paper>
                    </Grid>

                    <Grid item xs={12}>
                      <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                        <Typography variant="h6" gutterBottom>
                          Resultados de Análisis
                        </Typography>
                        <Grid container spacing={2}>
                          {Object.entries(selectedResult)
                            .filter(([key, value]) => 
                              ['pH', 'turbidez', 'oxigenoDisuelto', 'nitratos', 'solidosSuspendidos', 'fosfatos']
                              .includes(key) && value)
                            .map(([key, value]) => (
                              <Grid item xs={6} key={key}>
                                <Typography>
                                  <strong>{key}:</strong> {value.valor} {value.unidad}
                                </Typography>
                              </Grid>
                            ))
                          }
                        </Grid>
                      </Paper>
                    </Grid>

                    {selectedResult.historialCambios?.length > 0 && (
                      <Grid item xs={12}>
                        <Paper sx={{ p: 2, bgcolor: '#f5f5f5' }}>
                          <Typography variant="h6" gutterBottom sx={{ color: '#39A900' }}>
                            Historial de Cambios
                          </Typography>
                          {selectedResult.historialCambios.map((cambio, index) => (
                            <Box 
                              key={index} 
                              sx={{ 
                                mb: 2, 
                                p: 2, 
                                bgcolor: 'white', 
                                borderRadius: 1,
                                border: '1px solid #e0e0e0'
                              }}
                            >
                              <Grid container spacing={2}>
                                <Grid item xs={12}>
                                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#39A900' }}>
                                    Cambio #{selectedResult.historialCambios.length - index}
                                  </Typography>
                                  <Typography variant="body2" sx={{ mb: 1, color: '#666' }}>
                                    Realizado por: {cambio.nombre} | Fecha: {new Date(cambio.fecha).toLocaleString()}
                                  </Typography>
                                </Grid>
                                <Grid item xs={12}>
                                  <TableContainer component={Paper} variant="outlined">
                                    <Table size="small">
                                      <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                                        <TableRow>
                                          <TableCell sx={{ fontWeight: 'bold' }}>Parámetro</TableCell>
                                          <TableCell sx={{ fontWeight: 'bold' }}>Valor Anterior</TableCell>
                                          <TableCell sx={{ fontWeight: 'bold' }}>Valor Nuevo</TableCell>
                                          <TableCell sx={{ fontWeight: 'bold' }}>Unidad</TableCell>
                                        </TableRow>
                                      </TableHead>
                                      <TableBody>
                                        {Object.entries(cambio.cambiosRealizados || {}).map(([param, valores], i) => {
                                          if (param === '_id') return null;
                                          return (
                                            <TableRow key={i}>
                                              <TableCell>{param}</TableCell>
                                              <TableCell>
                                                {valores.valorAnterior === 'No registrado' ? (
                                                  <Chip 
                                                    label="No registrado" 
                                                    size="small" 
                                                    sx={{ bgcolor: '#ffebee', color: '#c62828' }}
                                                  />
                                                ) : valores.valorAnterior}
                                              </TableCell>
                                              <TableCell>
                                                <Typography sx={{ color: '#2e7d32', fontWeight: 'bold' }}>
                                                  {valores.valorNuevo}
                                                </Typography>
                                              </TableCell>
                                              <TableCell>{valores.unidad || '-'}</TableCell>
                                            </TableRow>
                                          );
                                        })}
                                      </TableBody>
                                    </Table>
                                  </TableContainer>
                                </Grid>
                                {cambio.cambiosRealizados?.observaciones && (
                                  <Grid item xs={12}>
                                    <Paper 
                                      variant="outlined" 
                                      sx={{ 
                                        p: 1.5, 
                                        bgcolor: '#fff3e0',
                                        borderColor: '#ffe0b2'
                                      }}
                                    >
                                      <Typography variant="subtitle2" sx={{ color: '#e65100' }}>
                                        Observaciones:
                                      </Typography>
                                      <Typography variant="body2" sx={{ color: '#f57c00' }}>
                                        {cambio.cambiosRealizados.observaciones.valorNuevo}
                                      </Typography>
                                    </Paper>
                                  </Grid>
                                )}
                              </Grid>
                            </Box>
                          ))}
                        </Paper>
                      </Grid>
                    )}
                  </Grid>

                  <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    {!selectedResult.verificado && JSON.parse(localStorage.getItem('user') || '{}').rol === 'administrador' && (
                      <Button
                        variant="contained"
                        onClick={() => setDialogoVerificacion(true)}
                        sx={{
                          backgroundColor: '#39A900',
                          '&:hover': { backgroundColor: '#2d8000' }
                        }}
                      >
                        Verificar Resultados
                      </Button>
                    )}
                    <Button 
                      variant="outlined"
                      onClick={() => setSelectedResult(null)}
                    >
                      Cerrar
                    </Button>
                  </Box>
                </>
              )}
            </Box>
          </Modal>

          <Dialog
            open={dialogoVerificacion}
            onClose={() => setDialogoVerificacion(false)}
          >
            <DialogTitle>Verificar Resultados</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Por favor, ingrese las observaciones de la verificación:
              </DialogContentText>
              <TextField
                autoFocus
                margin="dense"
                label="Observaciones"
                type="text"
                fullWidth
                multiline
                rows={4}
                value={observacionesVerificacion}
                onChange={(e) => setObservacionesVerificacion(e.target.value)}
                sx={{ mt: 2 }}
              />
            </DialogContent>
            <DialogActions>
              <Button 
                onClick={() => setDialogoVerificacion(false)}
                color="inherit"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleVerificarResultados}
                variant="contained"
                disabled={verificando || !observacionesVerificacion.trim()}
                sx={{
                  backgroundColor: '#39A900',
                  '&:hover': { backgroundColor: '#2d8000' }
                }}
              >
                {verificando ? <CircularProgress size={24} /> : 'Verificar'}
              </Button>
            </DialogActions>
          </Dialog>
        </>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
      >
        <Alert 
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default ListaResultados;