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
} from '@mui/material';
import Pagination from '@mui/material/Pagination';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';

const ResultRow = ({ resultado, onVerificar }) => {
  const [open, setOpen] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [detalleResultado, setDetalleResultado] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [error, setError] = useState(null);
  const [verificando, setVerificando] = useState(false);
  const [observacionesVerificacion, setObservacionesVerificacion] = useState('');
  const [dialogoVerificacion, setDialogoVerificacion] = useState(false);

  const handleOpenDialog = async () => {
    setOpenDialog(true);
    if (!detalleResultado) {
      await cargarDetalleResultado();
    }
  };

  const cargarDetalleResultado = async () => {
    try {
      setLoadingDetalle(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/ingreso-resultados/muestra/${resultado.idMuestra}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.success && response.data.data && response.data.data.resultado) {
        setDetalleResultado(response.data.data.resultado);
      } else {
        throw new Error('Formato de respuesta inválido');
      }
    } catch (error) {
      console.error('Error al cargar detalles:', error);
      setError('Error al cargar los detalles. Por favor, intenta más tarde.');
    } finally {
      setLoadingDetalle(false);
    }
  };

  const handleVerificarResultados = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      if (userData.rol !== 'administrador') {
        setError('Solo el administrador puede verificar resultados');
        return;
      }

      setVerificando(true);
      const response = await axios.post(`http://localhost:5000/api/ingreso-resultados/verificar/${detalleResultado.idMuestra}`, {
        observaciones: observacionesVerificacion
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setDialogoVerificacion(false);
        setOpenDialog(false);
        window.location.reload();
      }
    } catch (error) {
      console.error('Error al verificar resultados:', error);
      setError(error.response?.data?.message || 'Error al verificar los resultados');
    } finally {
      setVerificando(false);
    }
  };

  const renderBotonVerificar = () => {
    if (!detalleResultado || detalleResultado.verificado) return null;

    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    if (userData.rol !== 'administrador') return null;

    return (
      <>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setDialogoVerificacion(true)}
          sx={{
            backgroundColor: '#39A900',
            '&:hover': { backgroundColor: '#2d8000' }
          }}
        >
          VERIFICAR RESULTADOS
        </Button>

        <Dialog open={dialogoVerificacion} onClose={() => setDialogoVerificacion(false)}>
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
            <Button onClick={() => setDialogoVerificacion(false)} color="primary">
              Cancelar
            </Button>
            <Button 
              onClick={handleVerificarResultados} 
              color="primary"
              disabled={verificando || !observacionesVerificacion.trim()}
            >
              {verificando ? <CircularProgress size={24} /> : 'Verificar'}
            </Button>
          </DialogActions>
        </Dialog>
      </>
    );
  };
  return (
    <>
      <TableRow>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>{resultado.idMuestra}</TableCell>
        <TableCell>{resultado.documento}</TableCell>
        <TableCell>{resultado.tipoMuestreo}</TableCell>
        <TableCell>
          {new Date(resultado.fechaHora).toLocaleString()}
        </TableCell>
        <TableCell>
          <Chip
            label={resultado.verificado ? "Finalizada" : "En proceso"}
            color={resultado.verificado ? "success" : "warning"}
            sx={{ 
              backgroundColor: resultado.verificado ? '#39A900' : '#FFA500',
              color: 'white'
            }}
          />
        </TableCell>
        <TableCell>{resultado.nombreLaboratorista || "No asignado"}</TableCell>
        <TableCell>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Ver Detalles">
              <IconButton
                onClick={handleOpenDialog}
                size="small"
                color="primary"
              >
                <VisibilityIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </TableCell>
      </TableRow>

      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f5f5f5' }}>
          <Typography variant="h6" sx={{ color: '#39A900', fontWeight: 'bold' }}>
            Detalles de la Muestra - {resultado.idMuestra}
          </Typography>
          <IconButton onClick={() => setOpenDialog(false)} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {loadingDetalle ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          ) : detalleResultado && (
            <>
              <Typography variant="h6" gutterBottom sx={{ color: '#39A900', mb: 3 }}>
                Detalles de la Muestra
              </Typography>

              <TableContainer component={Paper} variant="outlined" sx={{ mb: 4 }}>
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell component="th" sx={{ backgroundColor: '#f5f5f5', width: '200px', fontWeight: 'bold' }}>
                        Campo
                      </TableCell>
                      <TableCell component="th" sx={{ backgroundColor: '#f5f5f5', fontWeight: 'bold' }}>
                        Valor
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Documento</TableCell>
                      <TableCell>{detalleResultado.documento}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Tipo de Muestreo</TableCell>
                      <TableCell>{detalleResultado.tipoMuestreo}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Fecha y Hora</TableCell>
                      <TableCell>{new Date(detalleResultado.fechaHora).toLocaleString()}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Estado</TableCell>
                      <TableCell>{detalleResultado.verificado ? 'Verificado' : 'En análisis'}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Laboratorista</TableCell>
                      <TableCell>{detalleResultado.nombreLaboratorista || 'No asignado'}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ color: '#39A900' }}>
                  Resultados de Análisis
                </Typography>
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: "bold" }}>Parámetro</TableCell>
                        <TableCell sx={{ fontWeight: "bold" }}>Valor</TableCell>
                        <TableCell sx={{ fontWeight: "bold" }}>Unidad</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {['pH', 'turbidez', 'oxigenoDisuelto', 'nitratos', 'solidosSuspendidos', 'fosfatos'].map((parametro) => {
                        const datos = detalleResultado[parametro];
                        if (!datos) return null;
                        return (
                          <TableRow key={parametro}>
                            <TableCell>{parametro}</TableCell>
                            <TableCell>{datos.valor}</TableCell>
                            <TableCell>{datos.unidad || '-'}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

              {detalleResultado.observaciones && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ color: '#39A900' }}>
                    Observaciones
                  </Typography>
                  <Paper variant="outlined" sx={{ p: 2, backgroundColor: '#fff3e0' }}>
                    <Typography sx={{ color: '#e65100' }}>
                      {detalleResultado.observaciones}
                    </Typography>
                  </Paper>
                </Box>
              )}

              {detalleResultado.historialCambios && detalleResultado.historialCambios.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ color: '#39A900' }}>
                    Historial de Cambios
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: "bold" }}>Fecha</TableCell>
                          <TableCell sx={{ fontWeight: "bold" }}>Laboratorista</TableCell>
                          <TableCell sx={{ fontWeight: "bold" }}>Cambios Realizados</TableCell>
                          <TableCell sx={{ fontWeight: "bold" }}>Observaciones</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {detalleResultado.historialCambios.map((cambio, index) => (
                          <TableRow key={cambio._id || index}>
                            <TableCell>{new Date(cambio.fecha).toLocaleString()}</TableCell>
                            <TableCell>{cambio.nombre}</TableCell>
                            <TableCell>
                              <Box>
                                {Object.entries(cambio.cambiosRealizados || {}).map(([param, valores], i) => {
                                  if (param === 'observaciones' || param === '_id') return null;
                                  return (
                                    <Chip
                                      key={i}
                                      label={`${param}: ${valores.valorAnterior} → ${valores.valorNuevo} ${valores.unidad}`}
                                      size="small"
                                      sx={{
                                        m: 0.5,
                                        backgroundColor: index === 0 ? '#e3f2fd' : '#e8f5e9',
                                        '& .MuiChip-label': {
                                          color: index === 0 ? '#1976d2' : '#2e7d32'
                                        }
                                      }}
                                    />
                                  );
                                })}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography
                                sx={{
                                  backgroundColor: '#fff3e0',
                                  padding: '8px',
                                  borderRadius: '4px',
                                  color: '#e65100'
                                }}
                              >
                                {cambio.cambiosRealizados?.observaciones?.valorNuevo || 'Sin observaciones'}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
          {renderBotonVerificar()}
          <Button 
            onClick={() => setOpenDialog(false)}
            variant="outlined"
          >
            Cerrar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

const ListaResultados = () => {
  const navigate = useNavigate();
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
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

      const response = await axios.get('http://localhost:5000/api/ingreso-resultados/resultados', {
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

  const handleVerificar = async (idMuestra) => {
    try {
      setLoading(true);
      const response = await axios.post(`http://localhost:5000/api/resultados/verificar/${idMuestra}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data && response.data.success) {
        setSuccess('✔ Resultados verificados exitosamente');
        await cargarResultados();
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (error) {
      console.error('Error al verificar:', error);
      setError(
        error.response?.data?.message || 
        'No se pudo verificar los resultados. Asegúrate de que no seas el mismo laboratorista que los registró.'
      );
      setTimeout(() => setError(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentResults = resultados.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(resultados.length / itemsPerPage);

  return (
    <Paper sx={{ p: 3, margin: 'auto', maxWidth: 1200, mt: 3 }}>
      <Typography variant="h5" gutterBottom align="center" sx={{ fontWeight: "bold" }}>
        Resultados de Análisis
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mt: 2, mb: 2 }}>
          {success}
        </Alert>
      )}

      {(!resultados || resultados.length === 0) ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          No hay resultados registrados
        </Alert>
      ) : (
        <>
          <TableContainer>
            <Table>
              <TableHead sx={{ backgroundColor: "#39A900" }}>
                <TableRow>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}></TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>ID Muestra</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>Documento</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>Tipo Muestreo</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>Fecha</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>Estado</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>Laboratorista</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {currentResults.map((resultado) => (
                  <ResultRow 
                    key={resultado._id} 
                    resultado={resultado}
                    onVerificar={handleVerificar}
                  />
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Pagination 
                count={totalPages} 
                page={currentPage}
                onChange={(event, value) => setCurrentPage(value)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}
    </Paper>
  );
};

export default ListaResultados;