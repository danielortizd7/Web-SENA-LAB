import React, { useState, useRef, useEffect } from 'react'; 
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  FormControl,
  FormControlLabel,
  Checkbox,
  Typography,
  Grid,
  Paper,
  CircularProgress,
  Alert,
  MenuItem,
  Select,
  InputLabel,
  Modal,
  Backdrop,
  Fade,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormHelperText,
  Card,
  CardContent,
  CardHeader
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SignaturePad from '../components/SignaturePad';
import { muestrasService } from '../services/muestras.service';
import { SelectChangeEvent } from '@mui/material/Select';

// URLs base y específicas
const BASE_URLS = {
  USUARIOS: 'https://backend-sena-lab-1-qpzp.onrender.com/api',
  MUESTRAS: 'https://backend-registro-muestras.onrender.com/api'
};

const API_URLS = {
  USUARIOS: `${BASE_URLS.USUARIOS}/usuarios`,
  MUESTRAS: `${BASE_URLS.MUESTRAS}/muestras`,
  ANALISIS_FISICOQUIMICOS: `${BASE_URLS.MUESTRAS}/analisis/fisicoquimicos`,
  ANALISIS_MICROBIOLOGICOS: `${BASE_URLS.MUESTRAS}/analisis/microbiologicos`
};

const TIPOS_PRESERVACION = ['Refrigeración', 'Congelación', 'Acidificación', 'Otro'] as const;
type TipoPreservacion = typeof TIPOS_PRESERVACION[number];

const TIPOS_MUESTREO = ['Simple', 'Compuesto'] as const;
type TipoMuestreo = typeof TIPOS_MUESTREO[number];

const TIPOS_AGUA = ['potable', 'natural', 'residual', 'otra'] as const;
type TipoAgua = typeof TIPOS_AGUA[number];

const TIPOS_AGUA_RESIDUAL = ['domestica', 'no domestica'] as const;
type TipoAguaResidual = typeof TIPOS_AGUA_RESIDUAL[number];

const SUBTIPOS_RESIDUAL = {
  DOMESTICA: 'Doméstica',
  NO_DOMESTICA: 'No Doméstica'
} as const;

const TIPOS_ANALISIS = ['Fisicoquímico', 'Microbiológico'] as const;
type TipoAnalisis = typeof TIPOS_ANALISIS[number];

interface TipoDeAgua {
  tipo: string;
  codigo: string;
  descripcion: string;
  subtipo?: string;
}

interface FirmaData {
  firma: string;
  fecha: string | Date;
}

interface MuestraFormData {
  documento: string;
  tipoDeAgua: TipoDeAgua;
  tipoMuestreo: TipoMuestreo;
  lugarMuestreo: string;
  fechaHoraMuestreo: string;
  tipoAnalisis: TipoAnalisis | '';
  identificacionMuestra: string;
  planMuestreo: string;
  condicionesAmbientales: string;
  preservacionMuestra: TipoPreservacion | '';
  preservacionMuestraOtra?: string;
  analisisSeleccionados: string[];
  firmas: {
    firmaAdministrador: FirmaData;
    firmaCliente: FirmaData;
  };
  observaciones?: string;
}

interface Cliente {
  documento: string;
  nombre?: string;
  razonSocial?: string;
  telefono: string;
  email: string;
  direccion: string;
}

interface ClienteData {
  nombre: string;
  documento: string;
  telefono: string;
  direccion: string;
  email: string;
  password: string;
  razonSocial: string;
}

interface AdminData {
  id: string;
  nombre: string;
  documento: string;
  rol: string;
  email: string;
}

interface FirmasState {
  administrador: any | null;
  cliente: any | null;
}

interface AnalisisCategoria {
  nombre: string;
  unidad: string;
  metodo?: string;
}

interface AnalisisDisponibles {
  fisicoquimico: AnalisisCategoria[];
  microbiologico: AnalisisCategoria[];
}

interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const initialFormData: MuestraFormData = {
  documento: '',
  tipoDeAgua: { tipo: '', codigo: '', descripcion: '' },
  tipoMuestreo: 'Simple',
  lugarMuestreo: '',
  fechaHoraMuestreo: '',
  tipoAnalisis: '',
  identificacionMuestra: '',
  planMuestreo: '',
  condicionesAmbientales: '',
  preservacionMuestra: '',
  preservacionMuestraOtra: '',
  analisisSeleccionados: [],
  firmas: {
    firmaAdministrador: { firma: '', fecha: new Date() },
    firmaCliente: { firma: '', fecha: new Date() }
  },
  observaciones: ''
};

const initialClienteData: ClienteData = {
  nombre: '',
  documento: '',
  telefono: '',
  direccion: '',
  email: '',
  password: '',
  razonSocial: ''
};

// Contenedor estilizado
const FormContainer = styled(Paper)(({ theme }) => ({
  maxWidth: 1000,
  margin: theme.spacing(4, 'auto'),
  padding: theme.spacing(4),
  borderRadius: theme.spacing(2),
  boxShadow: theme.shadows[6],
  background: 'linear-gradient(145deg, #ffffff, #f0f0f0)',
  transition: 'all 0.3s ease'
}));

const AnimatedButton = styled(Button)(({ theme }) => ({
  transition: 'all 0.2s ease',
  '&:hover': {
    transform: 'scale(1.03)',
    boxShadow: theme.shadows[6]
  }
}));

// Configuración de axios
const axiosInstance = axios.create({
  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
  withCredentials: false
});

const getTipoAguaCodigo = (tipo: string, subtipo?: string): string => {
  switch (tipo) {
    case 'potable': return 'P';
    case 'natural': return 'N';
    case 'residual': return 'R';
    case 'otra': return 'O';
    default: return '';
  }
};

const RegistroMuestras: React.FC = () => {
  const navigate = useNavigate();
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [firmas, setFirmas] = useState<FirmasState>({ administrador: null, cliente: null });
  const [formData, setFormData] = useState<MuestraFormData>(initialFormData);
  const [clienteEncontrado, setClienteEncontrado] = useState<Cliente | null>(null);
  const [validatingUser, setValidatingUser] = useState<boolean>(false);
  const [userValidationError, setUserValidationError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [muestraId, setMuestraId] = useState<string | null>(null);
  const [isRejected, setIsRejected] = useState<boolean>(false);
  const [openRechazoModal, setOpenRechazoModal] = useState<boolean>(false);
  const [observacionRechazo, setObservacionRechazo] = useState<string>('');
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [clienteData, setClienteData] = useState<ClienteData>(initialClienteData);
  const [registroError, setRegistroError] = useState<string | null>(null);
  const [registroExito, setRegistroExito] = useState<string | null>(null);
  const [registrando, setRegistrando] = useState<boolean>(false);
  const [analisisDisponibles, setAnalisisDisponibles] = useState<AnalisisDisponibles | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [cantidadMuestras, setCantidadMuestras] = useState<number>(1);

  const firmaAdministradorRef = useRef<SignatureCanvas | null>(null);
  const firmaClienteRef = useRef<SignatureCanvas | null>(null);

  const decodeToken = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error("Error decodificando token:", error);
      return null;
    }
  };

  const obtenerDatosUsuario = () => {
    const token = localStorage.getItem('token');
    if (!token) throw new Error("No hay token de autenticación. Por favor, inicie sesión nuevamente.");
    let userData;
    try {
      const userDataStr = localStorage.getItem("usuario") || localStorage.getItem("user");
      if (userDataStr) {
        userData = JSON.parse(userDataStr);
      } else {
        const decodedToken = decodeToken(token);
        if (decodedToken) {
          userData = { _id: decodedToken.id, nombre: decodedToken.nombre, email: decodedToken.email, rol: decodedToken.rol };
        }
      }
      if (!userData || !userData._id || !userData.nombre || !userData.rol) {
        throw new Error("Datos de usuario incompletos. Por favor, inicie sesión nuevamente.");
      }
      const documento = userData.documento || userData._id;
      return { userData: { ...userData, documento }, token };
    } catch (error) {
      throw new Error("Error al obtener datos del usuario. Por favor, inicie sesión nuevamente.");
    }
  };

  const handleOpenRechazoModal = () => {
    setOpenRechazoModal(true);
  };

  const handleCloseRechazoModal = () => {
    setOpenRechazoModal(false);
  };

  // Al confirmar rechazo, registra la muestra como rechazada automáticamente.
  const handleRegistrarRechazo = async () => {
    if (!observacionRechazo.trim()) {
      setError("Debe ingresar la observación para el rechazo.");
      return;
    }
    setIsRejected(true);
    const exito = await enviarMuestra();
    if (exito) {
      setSuccess("Muestra rechazada y registrada exitosamente");
      handleCloseRechazoModal();
      setTimeout(() => {
        limpiarEstado();
        navigate('/muestras');
      }, 2000);
    }
  };

  useEffect(() => {
    const verificarAdmin = async () => {
      try {
        const { userData, token } = obtenerDatosUsuario();
        const rol = typeof userData.rol === 'string' ? userData.rol : userData.rol?.name;
        if (!token || !rol || rol !== 'administrador') {
          setError('Acceso denegado. Se requieren permisos de administrador.');
          setTimeout(() => navigate('/login'), 2000);
          return;
        }
        setAdminData({
          id: userData._id,
          nombre: userData.nombre,
          documento: userData.documento,
          rol: rol,
          email: userData.email
        });
      } catch (error) {
        console.error('Error al verificar administrador:', error);
        setError('Error al verificar credenciales. Por favor, inicie sesión nuevamente.');
        setTimeout(() => navigate('/login'), 2000);
      }
    };
    verificarAdmin();
  }, [navigate]);

  useEffect(() => {
    const cargarAnalisis = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No se encontró el token de autenticación');
          return;
        }
        const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
        if (formData.tipoAnalisis) {
          const endpoint = formData.tipoAnalisis === 'Fisicoquímico'
            ? API_URLS.ANALISIS_FISICOQUIMICOS
            : API_URLS.ANALISIS_MICROBIOLOGICOS;
          const response = await axios.get(endpoint, { headers });
          setAnalisisDisponibles({
            fisicoquimico: formData.tipoAnalisis === 'Fisicoquímico' ? response.data : [],
            microbiologico: formData.tipoAnalisis === 'Microbiológico' ? response.data : []
          });
        }
      } catch (error) {
        console.error('Error al cargar análisis:', error);
        setError('Error al cargar los análisis disponibles');
      }
    };
    cargarAnalisis();
  }, [formData.tipoAnalisis]);

  const validarFormulario = (data: MuestraFormData): Record<string, string> => {
    const errores: Record<string, string> = {};
    if (!data.documento) errores.documento = 'El documento es requerido';
    if (!data.tipoDeAgua.tipo) errores.tipoDeAgua = 'El tipo de agua es requerido';
    if (data.tipoDeAgua.tipo === 'residual' && !data.tipoDeAgua.subtipo) {
      errores.tipoAguaResidual = 'Debe especificar si el agua residual es doméstica o no doméstica';
    }
    if (data.tipoDeAgua.tipo === 'otra' && !data.tipoDeAgua.descripcion) {
      errores.descripcion = 'La descripción del tipo de agua es requerida';
    }
    if (!data.tipoMuestreo) errores.tipoMuestreo = 'El tipo de muestreo es requerido';
    if (!data.lugarMuestreo) errores.lugarMuestreo = 'El lugar de muestreo es requerido';
    if (!data.fechaHoraMuestreo) errores.fechaHoraMuestreo = 'La fecha y hora de muestreo son requeridas';
    if (!data.tipoAnalisis) errores.tipoAnalisis = 'El tipo de análisis es requerido';
    if (!data.identificacionMuestra) errores.identificacionMuestra = 'La identificación de la muestra es requerida';
    if (!data.planMuestreo) errores.planMuestreo = 'El plan de muestreo es requerido';
    if (!data.condicionesAmbientales) errores.condicionesAmbientales = 'Las condiciones ambientales son requeridas';
    if (!data.preservacionMuestra) errores.preservacionMuestra = 'La preservación de la muestra es requerida';
    if (data.preservacionMuestra === 'Otro' && !data.preservacionMuestraOtra) {
      errores.preservacionMuestraOtra = 'Debe especificar la preservación cuando selecciona "Otro"';
    }
    if (!data.analisisSeleccionados || data.analisisSeleccionados.length === 0) {
      errores.analisisSeleccionados = 'Debe seleccionar al menos un análisis';
    }
    if (!isRejected) {
      if (!data.firmas.firmaAdministrador.firma) {
        errores.firmaAdministrador = 'La firma del administrador es requerida';
      }
      if (!data.firmas.firmaCliente.firma) {
        errores.firmaCliente = 'La firma del cliente es requerida';
      }
    }
    return errores;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent
  ) => {
    const { name, value } = e.target as HTMLInputElement;
    if (name === "tipoAgua") {
      const codigo = getTipoAguaCodigo(value);
      setFormData(prev => ({
        ...prev,
        tipoDeAgua: {
          ...prev.tipoDeAgua,
          tipo: value,
          codigo,
          descripcion: value === 'otra' ? '' : value === 'potable' ? 'Agua potable' : value === 'natural' ? 'Agua natural' : prev.tipoDeAgua.descripcion,
          subtipo: value === 'residual' ? prev.tipoDeAgua.subtipo : undefined
        }
      }));
    } else if (name === "descripcion") {
      setFormData(prev => ({
        ...prev,
        tipoDeAgua: { ...prev.tipoDeAgua, descripcion: value }
      }));
    } else if (name === "tipoAguaResidual") {
      setFormData(prev => ({
        ...prev,
        tipoDeAgua: { 
          ...prev.tipoDeAgua, 
          subtipo: value, 
          descripcion: `Agua residual ${value}` 
        }
      }));
    } else if (name === "preservacionMuestra") {
      setFormData(prev => ({ ...prev, preservacionMuestra: value as TipoPreservacion }));
    } else if (name === "tipoMuestreo") {
      setFormData(prev => ({ ...prev, tipoMuestreo: value as TipoMuestreo }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    setError(null);
  };

  const handleValidateUser = async () => {
    if (!formData.documento) {
      setUserValidationError("Por favor ingrese el número de documento.");
      return;
    }
    setValidatingUser(true);
    setUserValidationError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await axiosInstance.get(
        `${API_URLS.USUARIOS}/buscar`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { documento: formData.documento }
        }
      );
      if (response.data && response.data.documento) {
        setClienteEncontrado(response.data);
        setUserValidationError(null);
        setSuccess('Cliente encontrado exitosamente');
      } else {
        setUserValidationError("Usuario no encontrado.");
        setClienteEncontrado(null);
      }
    } catch (error: any) {
      console.error("Error al validar usuario:", error.response ? error.response.data : error.message);
      setUserValidationError("Usuario no encontrado.");
      setClienteEncontrado(null);
    }
    setValidatingUser(false);
  };

  const validarTamañoFirma = (firma: string): boolean => {
    const tamañoBytes = new Blob([firma]).size;
    const tamañoMB = tamañoBytes / (1024 * 1024);
    return tamañoMB <= 2;
  };

  const validarFormatoBase64 = (firma: string): boolean => {
    try {
      return firma.startsWith('data:image/png;base64,') &&
             btoa(atob(firma.split(',')[1])) === firma.split(',')[1];
    } catch {
      return false;
    }
  };

  const guardarFirmaAdministrador = (firma: string) => {
    try {
      if (!adminData) {
        setError('No se encontraron datos del administrador');
        return;
      }
      if (adminData.rol !== 'administrador') {
        setError('Solo los administradores pueden firmar en esta sección');
        return;
      }
      if (!validarTamañoFirma(firma)) {
        setError('La firma no puede exceder 2MB');
        return;
      }
      if (!validarFormatoBase64(firma)) {
        setError('Formato de firma inválido');
        return;
      }
      setFormData(prev => ({
        ...prev,
        firmas: { 
          ...prev.firmas, 
          firmaAdministrador: { firma, fecha: new Date().toISOString() }
        }
      }));
      setError(null);
    } catch (error: any) {
      setError(error.message || 'Error al guardar la firma del administrador');
    }
  };

  const guardarFirmaCliente = (firma: string) => {
    try {
      if (!clienteEncontrado) {
        setError('Debe validar el cliente antes de firmar');
        return;
      }
      if (!validarTamañoFirma(firma)) {
        setError('La firma no puede exceder 2MB');
        return;
      }
      if (!validarFormatoBase64(firma)) {
        setError('Formato de firma inválido');
        return;
      }
      setFormData(prev => ({
        ...prev,
        firmas: { 
          ...prev.firmas, 
          firmaCliente: { firma, fecha: new Date().toISOString() }
        }
      }));
      setError(null);
      setSuccess('✔ Firma del cliente guardada correctamente');
    } catch (error: any) {
      setError(error.message || 'Error al guardar la firma del cliente');
    }
  };

  const clearUniqueFields = () => {
    setFormData(prev => ({
      ...prev,
      identificacionMuestra: '',
      fechaHoraMuestreo: '',
      planMuestreo: '',
      condicionesAmbientales: '',
      analisisSeleccionados: [],
      observaciones: ''
    }));
  };

  const enviarMuestra = async (): Promise<boolean> => {
    setLoading(true);
    setError('');
    const errores = validarFormulario(formData);
    if (Object.keys(errores).length > 0) {
      setError(Object.values(errores).join(' - '));
      setLoading(false);
      return false;
    }
    if (formData.tipoDeAgua.tipo === 'residual' && !formData.tipoDeAgua.subtipo) {
      setError('Debe seleccionar el tipo de agua residual');
      setLoading(false);
      return false;
    }
    const muestraData = {
      documento: formData.documento,
      tipoDeAgua: {
        tipo: formData.tipoDeAgua.tipo,
        codigo: formData.tipoDeAgua.codigo,
        descripcion: formData.tipoDeAgua.descripcion,
        subtipoResidual: formData.tipoDeAgua.subtipo
      },
      tipoMuestreo: formData.tipoMuestreo,
      lugarMuestreo: formData.lugarMuestreo,
      fechaHoraMuestreo: new Date(formData.fechaHoraMuestreo).toISOString(),
      tipoAnalisis: formData.tipoAnalisis,
      identificacionMuestra: formData.identificacionMuestra,
      planMuestreo: formData.planMuestreo,
      condicionesAmbientales: formData.condicionesAmbientales,
      preservacionMuestra: formData.preservacionMuestra,
      analisisSeleccionados: formData.analisisSeleccionados,
      observaciones: isRejected ? observacionRechazo : formData.observaciones || '',
      estado: isRejected ? 'Rechazada' : 'Recibida',
      rechazoMuestra: isRejected ? { rechazada: true, motivo: observacionRechazo } : undefined,
      firmas: {
        firmaAdministrador: formData.firmas.firmaAdministrador,
        firmaCliente: formData.firmas.firmaCliente
      }
    };
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No se encontró el token de autenticación');
      const headers = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
      if (isUpdating && muestraId) {
        await axios.put(`${API_URLS.MUESTRAS}/${muestraId}`, muestraData, { headers });
      } else {
        await axios.post(API_URLS.MUESTRAS, muestraData, { headers });
      }
      setSuccess('Muestra registrada exitosamente');
      return true;
    } catch (error: any) {
      setError(`Error: ${error.response?.data?.message || error.message}`);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrarOtra = async () => {
    const exito = await enviarMuestra();
    if (exito) {
      setSuccess('Muestra registrada. Ahora ingresa los datos de la siguiente muestra.');
      clearUniqueFields();
    }
  };

  const handleRegistrarFinal = async () => {
    const exito = await enviarMuestra();
    if (exito) {
      setTimeout(() => {
        limpiarEstado();
        navigate('/muestras');
      }, 2000);
    }
  };

  const limpiarEstado = () => {
    setFormData(initialFormData);
    setFirmas({ administrador: null, cliente: null });
    setClienteEncontrado(null);
    setError(null);
    setSuccess(null);
    setIsUpdating(false);
    setMuestraId(null);
    setIsRejected(false);
    setObservacionRechazo('');
  };

  const volverAlFormulario = () => {
    // Aquí podrías implementar una función para reiniciar o volver a la edición
  };

  const handleAnalisisChange = (analisis: string) => {
    setFormData(prev => ({
      ...prev,
      analisisSeleccionados: prev.analisisSeleccionados.includes(analisis)
        ? prev.analisisSeleccionados.filter(a => a !== analisis)
        : [...prev.analisisSeleccionados, analisis]
    }));
  };

  // Modal para registrar cliente
  const handleOpenModal = () => {
    setOpenModal(true);
    setRegistroError(null);
    setRegistroExito(null);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setClienteData(initialClienteData);
    setRegistroError(null);
    setRegistroExito(null);
  };

  const handleClienteChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setClienteData(prev => ({ ...prev, [name]: value }));
    setRegistroError(null);
  };

  const handleRegistrarCliente = async () => {
    const camposRequeridos = { nombre: 'Nombre', documento: 'Documento', email: 'Email', password: 'Contraseña' };
    const camposFaltantes = Object.entries(camposRequeridos)
      .filter(([key]) => !clienteData[key as keyof ClienteData])
      .map(([, label]) => label);
    if (camposFaltantes.length > 0) {
      setRegistroError(`Los siguientes campos son obligatorios: ${camposFaltantes.join(', ')}`);
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(clienteData.email)) {
      setRegistroError("El formato del correo electrónico no es válido");
      return;
    }
    setRegistrando(true);
    setRegistroError(null);
    setRegistroExito(null);
    try {
      const token = localStorage.getItem("token");
      const userData = JSON.parse(localStorage.getItem("usuario") || '{}');
      const userRole = userData?.rol?.name || "";
      const newClienteData = {
        ...clienteData,
        tipo: "cliente",
        telefono: clienteData.telefono || '',
        direccion: clienteData.direccion || '',
        razonSocial: clienteData.razonSocial || ''
      };
      if (userRole === "administrador" && newClienteData.tipo !== "cliente" && newClienteData.tipo !== "laboratorista") {
        setRegistroError("Un administrador solo puede registrar clientes o laboratoristas.");
        return;
      }
      await axios.post(
        `${API_URLS.USUARIOS}/registro`,
        newClienteData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );
      setRegistroExito("Cliente registrado correctamente.");
      setFormData(prev => ({ ...prev, documento: newClienteData.documento }));
      setTimeout(() => {
        handleCloseModal();
        handleValidateUser();
      }, 2000);
    } catch (error: any) {
      setRegistroError(
        error.response?.data?.message ||
        error.response?.data?.detalles ||
        "⚠ Error en el registro. Por favor, verifique los datos e intente nuevamente."
      );
    } finally {
      setRegistrando(false);
    }
  };

  const renderAnalisisDisponibles = () => {
    if (!formData.tipoAnalisis) {
      return (
        <Alert severity="info">
          Seleccione un tipo de análisis para ver las opciones disponibles
        </Alert>
      );
    }
    const analisisAMostrar = formData.tipoAnalisis === 'Fisicoquímico'
      ? analisisDisponibles?.fisicoquimico || []
      : analisisDisponibles?.microbiologico || [];
    if (analisisAMostrar.length === 0) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
          <CircularProgress />
        </Box>
      );
    }
    return (
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>
            {formData.tipoAnalisis === 'Fisicoquímico'
              ? 'Análisis Fisicoquímicos'
              : 'Análisis Microbiológicos'}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2}>
            {analisisAMostrar.map((analisis) => (
              <Grid item xs={12} sm={6} key={analisis.nombre}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={formData.analisisSeleccionados.includes(analisis.nombre)}
                      onChange={() => handleAnalisisChange(analisis.nombre)}
                    />
                  }
                  label={
                    <Typography variant="body2">
                      {analisis.nombre}
                      <br />
                      <small style={{ color: 'text.secondary' }}>
                        {analisis.unidad !== 'N/A' ? `Unidad: ${analisis.unidad}` : 'Sin unidad'}
                      </small>
                    </Typography>
                  }
                />
              </Grid>
            ))}
          </Grid>
        </AccordionDetails>
      </Accordion>
    );
  };

  return (
    <FormContainer>
      <Typography variant="h4" align="center" gutterBottom>
        Registro de Muestras
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <form autoComplete="off">
        {/* Sección de Datos Generales */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <TextField
            fullWidth
            label="Número de Documento"
            name="documento"
            value={formData.documento}
            onChange={handleChange}
            required
            sx={{ flex: 1 }}
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <AnimatedButton
              variant="outlined"
              onClick={handleValidateUser}
              disabled={validatingUser || !formData.documento}
            >
              {validatingUser ? <CircularProgress size={24} /> : 'Validar'}
            </AnimatedButton>
            {userValidationError && (
              <AnimatedButton variant="outlined" onClick={handleOpenModal}>
                Registrar Cliente
              </AnimatedButton>
            )}
          </Box>
        </Box>

        {/* Sección de Datos del Cliente (mejorada con Card) */}
        {clienteEncontrado && (
          <Card sx={{ mb: 3, borderRadius: 2, boxShadow: 3, backgroundColor: '#f5f5f5' }}>
            <CardHeader
              title="Cliente Validado"
              titleTypographyProps={{ variant: 'h6', fontWeight: 'bold' }}
              sx={{ textAlign: 'center', backgroundColor: '#e0e0e0' }}
            />
            <CardContent>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Nombre:</strong> {clienteEncontrado.nombre || clienteEncontrado.razonSocial}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Documento:</strong> {clienteEncontrado.documento}
              </Typography>
              <Typography variant="body1">
                <strong>Correo:</strong> {clienteEncontrado.email}
              </Typography>
            </CardContent>
          </Card>
        )}

        {/* Campos específicos de la muestra */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Tipo de Agua</InputLabel>
              <Select
                name="tipoAgua"
                value={formData.tipoDeAgua.tipo}
                onChange={handleChange}
                label="Tipo de Agua"
                required
              >
                {TIPOS_AGUA.map(tipo => (
                  <MenuItem key={tipo} value={tipo}>
                    {tipo === 'residual'
                      ? 'Residual'
                      : tipo.charAt(0).toUpperCase() + tipo.slice(1)} ({getTipoAguaCodigo(tipo)})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          {formData.tipoDeAgua.tipo === 'otra' && (
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Descripción del Tipo de Agua"
                name="descripcion"
                value={formData.tipoDeAgua.descripcion}
                onChange={handleChange}
                required
              />
            </Grid>
          )}
          {formData.tipoDeAgua.tipo === 'residual' && (
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={Boolean(error && error.includes('agua residual'))}>
                <InputLabel>Tipo de Agua Residual</InputLabel>
                <Select
                  name="tipoAguaResidual"
                  value={formData.tipoDeAgua.subtipo || ''}
                  onChange={handleChange}
                  label="Tipo de Agua Residual"
                  required
                >
                  <MenuItem value={SUBTIPOS_RESIDUAL.DOMESTICA}>Doméstica</MenuItem>
                  <MenuItem value={SUBTIPOS_RESIDUAL.NO_DOMESTICA}>No Doméstica</MenuItem>
                </Select>
                {error && error.includes('agua residual') && (
                  <FormHelperText error>{error}</FormHelperText>
                )}
              </FormControl>
            </Grid>
          )}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Tipo de Muestreo</InputLabel>
              <Select
                name="tipoMuestreo"
                value={formData.tipoMuestreo}
                onChange={handleChange}
                label="Tipo de Muestreo"
                required
              >
                {TIPOS_MUESTREO.map(tipo => (
                  <MenuItem key={tipo} value={tipo}>{tipo}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Lugar de Muestreo"
              name="lugarMuestreo"
              value={formData.lugarMuestreo}
              onChange={handleChange}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Fecha y Hora de Muestreo"
              name="fechaHoraMuestreo"
              type="datetime-local"
              value={formData.fechaHoraMuestreo}
              onChange={handleChange}
              InputLabelProps={{ shrink: true }}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Tipo de Análisis</InputLabel>
              <Select
                name="tipoAnalisis"
                value={formData.tipoAnalisis}
                onChange={handleChange}
                label="Tipo de Análisis"
                required
              >
                {TIPOS_ANALISIS.map(option => (
                  <MenuItem key={option} value={option}>{option}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Identificación de la Muestra"
              name="identificacionMuestra"
              value={formData.identificacionMuestra}
              onChange={handleChange}
              required
              helperText="Identificación física/química de la muestra"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Plan de Muestreo"
              name="planMuestreo"
              value={formData.planMuestreo}
              onChange={handleChange}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Condiciones Ambientales"
              name="condicionesAmbientales"
              value={formData.condicionesAmbientales}
              onChange={handleChange}
              multiline
              rows={2}
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Preservación de la Muestra</InputLabel>
              <Select
                name="preservacionMuestra"
                value={formData.preservacionMuestra}
                onChange={handleChange}
                label="Preservación de la Muestra"
                required
              >
                {TIPOS_PRESERVACION.map(tipo => (
                  <MenuItem key={tipo} value={tipo}>{tipo}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          {formData.preservacionMuestra === 'Otro' && (
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Descripción de la Preservación"
                name="preservacionMuestraOtra"
                value={formData.preservacionMuestraOtra}
                onChange={handleChange}
                required
              />
            </Grid>
          )}
        </Grid>

        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Análisis a realizar:
        </Typography>
        {renderAnalisisDisponibles()}

        {/* Botón para rechazar la muestra */}
        {!isRejected && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', my: 2 }}>
            <AnimatedButton variant="contained" color="error" onClick={handleOpenRechazoModal}>
              Rechazar Muestra
            </AnimatedButton>
          </Box>
        )}

        {/* Sección de Firmas */}
        <Box sx={{ my: 3 }}>
          <Typography variant="h6" gutterBottom>
            Firmas Digitales
          </Typography>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" color="primary" gutterBottom>
              Firma del Administrador
            </Typography>
            {adminData && adminData.rol !== 'administrador' && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Solo los administradores pueden firmar en esta sección.
              </Alert>
            )}
            <SignaturePad
              onSave={guardarFirmaAdministrador}
              titulo="Firma del Administrador"
              disabled={!adminData || adminData.rol !== 'administrador'}
              firma={formData.firmas.firmaAdministrador.firma}
            />
            {formData.firmas.firmaAdministrador.firma && (
              <Alert severity="success" sx={{ mt: 1 }}>
                ✔ Firma del administrador guardada correctamente
              </Alert>
            )}
          </Box>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" color="primary" gutterBottom>
              Firma del Cliente
            </Typography>
            {!clienteEncontrado && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                Debe validar el cliente antes de poder firmar.
              </Alert>
            )}
            <SignaturePad
              onSave={guardarFirmaCliente}
              titulo="Firma del Cliente"
              disabled={!clienteEncontrado}
              firma={formData.firmas.firmaCliente.firma}
            />
            {formData.firmas.firmaCliente.firma && (
              <Alert severity="success" sx={{ mt: 1 }}>
                ✔ Firma del cliente guardada correctamente
              </Alert>
            )}
          </Box>
        </Box>

        {/* Botones de Envío */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <AnimatedButton variant="outlined" onClick={() => navigate('/muestras')} fullWidth>
            Cancelar
          </AnimatedButton>
          <AnimatedButton
            type="button"
            variant="contained"
            color="primary"
            onClick={handleRegistrarOtra}
            fullWidth
            disabled={loading}
          >
            {loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={24} color="inherit" />
                <span>Registrando...</span>
              </Box>
            ) : (
              "Registrar y Agregar Otra"
            )}
          </AnimatedButton>
          <AnimatedButton
            type="button"
            variant="contained"
            color="secondary"
            onClick={handleRegistrarFinal}
            fullWidth
            disabled={loading}
          >
            {loading ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={24} color="inherit" />
                <span>Registrando...</span>
              </Box>
            ) : (
              "Registrar Muestra Final"
            )}
          </AnimatedButton>
        </Box>
      </form>

      {/* Modal para Registrar Cliente */}
      <Modal
        open={openModal}
        onClose={handleCloseModal}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500 }}
      >
        <Fade in={openModal}>
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <Typography variant="h6" gutterBottom>
              Registrar Cliente
            </Typography>
            <TextField
              fullWidth
              label="Nombre Completo"
              name="nombre"
              value={clienteData.nombre}
              onChange={handleClienteChange}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Documento"
              name="documento"
              value={clienteData.documento}
              onChange={handleClienteChange}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Teléfono"
              name="telefono"
              value={clienteData.telefono}
              onChange={handleClienteChange}
              sx={{ mb: 2 }}
            />
          </Box>
        </Fade>
      </Modal>

      {/* Modal para Rechazar Muestra */}
      <Modal
        open={openRechazoModal}
        onClose={handleCloseRechazoModal}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500 }}
      >
        <Fade in={openRechazoModal}>
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <Typography variant="h6" gutterBottom>
              Rechazar Muestra
            </Typography>
            <TextField
              fullWidth
              label="Observación de rechazo"
              name="observacionRechazo"
              value={observacionRechazo}
              onChange={(e) => setObservacionRechazo(e.target.value)}
              multiline
              rows={3}
              required
              sx={{ mb: 2 }}
            />
            <AnimatedButton
              variant="contained"
              color="error"
              fullWidth
              onClick={handleRegistrarRechazo}
            >
              Confirmar Rechazo
            </AnimatedButton>
          </Box>
        </Fade>
      </Modal>
    </FormContainer>
  );
};

export default RegistroMuestras;
