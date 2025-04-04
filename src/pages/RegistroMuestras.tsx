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
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SignatureCanvas from 'react-signature-canvas';
import SignaturePad from '../components/SignaturePad';
import FirmasDigitales from '../components/FirmasDigitales';
import { muestrasService } from '../services/muestras.service';
import { SelectChangeEvent } from '@mui/material/Select';

// URLs base actualizadas
const BASE_URLS = {
  USUARIOS: 'https://back-usuarios-f.onrender.com/api',
  MUESTRAS: 'https://daniel-back-dom.onrender.com/api'
};

// URLs específicas actualizadas
const API_URLS = {
  USUARIOS: `${BASE_URLS.USUARIOS}/usuarios`,
  MUESTRAS: `${BASE_URLS.MUESTRAS}/muestras`,
  INGRESO_RESULTADOS: `${BASE_URLS.MUESTRAS}/ingreso-resultados`,
  EDITAR_RESULTADOS: (id: string) => `${BASE_URLS.MUESTRAS}/ingreso-resultados/editar/${id}`,
  TIPOS_AGUA: `${BASE_URLS.MUESTRAS}/tipos-agua`,
  CAMBIOS_ESTADO: `${BASE_URLS.MUESTRAS}/cambios-estado`
};

const TIPOS_PRESERVACION = ['Refrigeración', 'Congelación', 'Acidificación', 'Otro'] as const;
type TipoPreservacion = typeof TIPOS_PRESERVACION[number];

const TIPOS_MUESTREO = ['Simple', 'Compuesto'] as const;
type TipoMuestreo = typeof TIPOS_MUESTREO[number];

const TIPOS_AGUA = ['potable', 'natural', 'residual domestica', 'residual no domestica', 'otra'] as const;
type TipoAgua = typeof TIPOS_AGUA[number];

const TIPOS_ANALISIS = ['Fisicoquímicos', 'Microbiológicos'] as const;
type TipoAnalisis = typeof TIPOS_ANALISIS[number];

const ESTADOS_VALIDOS = ["Recibida", "En análisis", "Pendiente de resultados", "Finalizada", "Rechazada"] as const;
type EstadoMuestra = typeof ESTADOS_VALIDOS[number];

interface SignatureData {
  firma: string;
}

interface Firmas {
  cedulaLaboratorista: string;
  firmaLaboratorista: string;
  cedulaCliente: string;
  firmaCliente: string;
}

interface TipoDeAgua {
  tipo: string;
  tipoPersonalizado: string;
  descripcion: string;
}

// Se agregan las propiedades estado, observacionRechazo y además la propiedad tipoMuestreo
interface MuestraFormData {
  documento: string;
  tipoMuestra: string;
  tipoMuestreo: string; // <-- propiedad agregada
  fechaHora: string;
  fechaHoraMuestreo: string;
  lugarMuestreo: string;
  planMuestreo: string;
  condicionesAmbientales: string;
  preservacionMuestra: string;
  preservacionMuestraOtro?: string;
  identificacionMuestra: string;
  analisisSeleccionados: string[];
  tipoDeAgua: TipoDeAgua;
  tipoAnalisis: string;
  estado?: string;
  observacionRechazo?: string;
  firmas: {
    firmaAdministrador: { firma: string };
    firmaCliente: { firma: string };
  };
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

interface Firma {
  cedula: string;
  firma: string;
  timestamp: string;
  tamaño: number;
}

interface FirmasState {
  administrador: Firma | null;
  cliente: Firma | null;
}

const initialFormData: MuestraFormData = {
  documento: '',
  tipoMuestra: '',
  tipoMuestreo: '', // Valor inicial agregado
  fechaHora: '',
  fechaHoraMuestreo: '',
  lugarMuestreo: '',
  planMuestreo: '',
  condicionesAmbientales: '',
  preservacionMuestra: '',
  preservacionMuestraOtro: '',
  identificacionMuestra: '',
  analisisSeleccionados: [],
  tipoDeAgua: {
    tipo: '',
    tipoPersonalizado: '',
    descripcion: ''
  },
  tipoAnalisis: '',
  estado: '',
  observacionRechazo: '',
  firmas: {
    firmaAdministrador: { firma: '' },
    firmaCliente: { firma: '' }
  }
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

const initialFirmasState: FirmasState = {
  administrador: null,
  cliente: null
};

const analisisAgua = [
  {
    categoria: "Metales",
    analisis: [
      "Aluminio", "Arsénico", "Cadmio", "Cobre", "Cromo", "Hierro",
      "Manganeso", "Mercurio", "Molibdeno", "Níquel", "Plata", "Plomo", "Zinc"
    ]
  },
  {
    categoria: "Química General",
    analisis: [
      "Carbono Orgánico Total (COT)", "Cloro residual", "Cloro Total",
      "Cloruros", "Conductividad", "Dureza Cálcica", "Dureza Magnésica",
      "Dureza Total", "Ortofosfatos", "Fósforo Total", "Nitratos",
      "Nitritos", "Nitrógeno amoniacal", "Nitrógeno total",
      "Oxígeno disuelto", "pH", "Potasio", "Sulfatos"
    ]
  },
  {
    categoria: "Físicos",
    analisis: [
      "Color aparente", "Color real", "Sólidos sedimentables",
      "Sólidos suspendidos", "Sólidos Totales", "Turbiedad"
    ]
  },
  {
    categoria: "Otros",
    analisis: ["Bromo", "Cobalto", "Yodo"]
  }
];

const analisisSuelo = [
  {
    categoria: "Propiedades Físicas",
    analisis: ["pH", "Conductividad Eléctrica", "Humedad", "Sólidos Totales"]
  },
  {
    categoria: "Propiedades Químicas",
    analisis: [
      "Carbono orgánico", "Materia orgánica", "Fósforo total",
      "Acidez intercambiable", "Bases intercambiables"
    ]
  },
  {
    categoria: "Macronutrientes",
    analisis: ["Calcio", "Magnesio", "Potasio", "Sodio"]
  },
  {
    categoria: "Micronutrientes",
    analisis: ["Cobre", "Zinc", "Hierro", "Manganeso", "Cadmio", "Mercurio"]
  }
];

// Función para formatear la fecha y hora (ej. "2025-04-03 15:45")
const formatearFecha = (fecha: Date): string => {
  const dia = fecha.getDate().toString().padStart(2, '0');
  const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
  const año = fecha.getFullYear();
  const hora = fecha.getHours().toString().padStart(2, '0');
  const minutos = fecha.getMinutes().toString().padStart(2, '0');
  return `${año}-${mes}-${dia} ${hora}:${minutos}`;
};

// Definimos un tipo unificado para el evento de cambio
type MyChangeEvent =
  | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  | SelectChangeEvent;

const RegistroMuestras: React.FC = () => {
  const navigate = useNavigate();
  const [adminData, setAdminData] = useState<AdminData | null>(null);
  const [firmas, setFirmas] = useState<FirmasState>(initialFirmasState);
  const [formData, setFormData] = useState<MuestraFormData>(initialFormData);
  const [clienteEncontrado, setClienteEncontrado] = useState<Cliente | null>(null);
  const [validatingUser, setValidatingUser] = useState<boolean>(false);
  const [userValidationError, setUserValidationError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [mostrarFirmas, setMostrarFirmas] = useState(false);
  const [firmasCompletas, setFirmasCompletas] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [muestraId, setMuestraId] = useState<string | null>(null);
  // Estado para la fecha y hora actual (para mostrar en la esquina superior derecha)
  const [currentDateTime, setCurrentDateTime] = useState(formatearFecha(new Date()));
  // Estados para el rechazo de la muestra
  const [isRejected, setIsRejected] = useState<boolean>(false);
  const [openRechazoModal, setOpenRechazoModal] = useState<boolean>(false);
  const [observacionRechazo, setObservacionRechazo] = useState<string>('');

  // Estados para el modal de registro de cliente
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [clienteData, setClienteData] = useState<ClienteData>(initialClienteData);
  const [registroError, setRegistroError] = useState<string | null>(null);
  const [registroExito, setRegistroExito] = useState<string | null>(null);
  const [registrando, setRegistrando] = useState<boolean>(false);

  const firmaAdministradorRef = useRef<SignatureCanvas | null>(null);
  const firmaClienteRef = useRef<SignatureCanvas | null>(null);

  // Actualizar la fecha y hora cada minuto para mostrarla en la esquina superior derecha
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDateTime(formatearFecha(new Date()));
    }, 60000);
    return () => clearInterval(interval);
  }, []);

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
    const verificarFirmas = () => {
      if (firmas.administrador && firmas.cliente) {
        setFirmasCompletas(true);
      } else {
        setFirmasCompletas(false);
      }
    };
    verificarFirmas();
  }, [firmas]);

  // Todas las muestras serán de tipo "Agua", por lo que se usan los análisis de agua
  const analisisDisponibles = analisisAgua;

  const validarFormulario = (data: MuestraFormData): Record<string, string> => {
    const errores: Record<string, string> = {};
    if (!data.documento) errores.documento = 'El documento es requerido';
    if (!data.tipoMuestreo) errores.tipoMuestreo = 'El tipo de muestreo es requerido';
    if (!data.lugarMuestreo) errores.lugarMuestreo = 'El lugar de muestreo es requerido';
    if (!data.fechaHoraMuestreo) errores.fechaHoraMuestreo = 'La fecha y hora de muestreo es requerida';
    if (!data.tipoAnalisis) errores.tipoAnalisis = 'El tipo de análisis es requerido';
    if (!data.identificacionMuestra) errores.identificacionMuestra = 'La identificación de la muestra es requerida';
    if (!data.planMuestreo) errores.planMuestreo = 'El plan de muestreo es requerido';
    if (!data.condicionesAmbientales) errores.condicionesAmbientales = 'Las condiciones ambientales son requeridas';
    if (!data.preservacionMuestra) errores.preservacionMuestra = 'La preservación de la muestra es requerida';
    if (data.preservacionMuestra === 'Otro' && !data.preservacionMuestraOtro) {
      errores.preservacionMuestraOtro = 'Especifique la preservación de la muestra';
    }
    if (!data.analisisSeleccionados?.length) errores.analisisSeleccionados = 'Debe seleccionar al menos un análisis';
    // Si la muestra se rechaza, no se requiere validar las firmas
    if (!isRejected) {
      if (!data.firmas?.firmaAdministrador.firma) {
        errores.firmaAdministrador = 'La firma del administrador es requerida';
      }
      if (!data.firmas?.firmaCliente.firma) {
        errores.firmaCliente = 'La firma del cliente es requerida';
      }
    }
    return errores;
  };

  // Usamos el tipo unificado MyChangeEvent para manejar tanto TextField como Select
  const handleChange = (e: MyChangeEvent) => {
    // Forzamos el tipado a HTMLInputElement para obtener name y value
    const { name, value } = e.target as HTMLInputElement;
    // Manejo especial para el campo "tipoAgua" que afecta a tipoDeAgua
    if (name === "tipoAgua") {
      setFormData(prev => ({
        ...prev,
        tipoDeAgua: {
          ...prev.tipoDeAgua,
          tipo: value,
          tipoPersonalizado: value === 'otra' ? prev.tipoDeAgua.tipoPersonalizado : '',
          descripcion: value === 'otra' ? prev.tipoDeAgua.descripcion : ''
        }
      }));
    } else if (name === "preservacionMuestra") {
      setFormData(prev => ({ ...prev, preservacionMuestra: value }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
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
      const response = await axios.get(
        `https://back-usuarios-f.onrender.com/api/usuarios/buscar?documento=${formData.documento}`,
        { headers: { Authorization: `Bearer ${token}` } }
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

  const decodeToken = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error("Error decodificando token:", error);
      return null;
    }
  };

  const obtenerDatosUsuario = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error("No hay token de autenticación. Por favor, inicie sesión nuevamente.");
    }
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

  const limpiarFirma = (tipo: 'administrador' | 'cliente') => {
    if (tipo === 'administrador' && firmaAdministradorRef.current) {
      firmaAdministradorRef.current.clear();
    } else if (tipo === 'cliente' && firmaClienteRef.current) {
      firmaClienteRef.current.clear();
    }
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
        firmas: { ...prev.firmas, firmaAdministrador: { firma } }
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
        firmas: { ...prev.firmas, firmaCliente: { firma } }
      }));
      setError(null);
      setSuccess('✔ Firma del cliente guardada correctamente');
    } catch (error: any) {
      setError(error.message || 'Error al guardar la firma del cliente');
    }
  };

  const validarFirmas = () => {
    if (!isRejected) {
      if (!formData.firmas.firmaAdministrador.firma) {
        setError('La firma del administrador es requerida');
        return false;
      }
      if (!formData.firmas.firmaCliente.firma) {
        setError('La firma del cliente es requerida');
        return false;
      }
    }
    return true;
  };

  const cargarMuestraExistente = async (id: string) => {
    try {
      const response = await muestrasService.obtenerMuestra(id);
      if (response.data && response.data.muestra) {
        const muestra = response.data.muestra;
        setFormData({
          documento: muestra.documento,
          tipoMuestra: muestra.tipoMuestra,
          tipoMuestreo: muestra.tipoMuestreo,
          fechaHora: muestra.fechaHora,
          fechaHoraMuestreo: muestra.fechaHoraMuestreo,
          lugarMuestreo: muestra.lugarMuestreo,
          planMuestreo: muestra.planMuestreo,
          condicionesAmbientales: muestra.condicionesAmbientales,
          preservacionMuestra: muestra.preservacionMuestra,
          preservacionMuestraOtro: muestra.preservacionMuestraOtro || '',
          identificacionMuestra: muestra.identificacionMuestra,
          analisisSeleccionados: muestra.analisisSeleccionados || [],
          tipoDeAgua: muestra.tipoDeAgua || { tipo: '', tipoPersonalizado: '', descripcion: '' },
          tipoAnalisis: muestra.tipoAnalisis || '',
          estado: muestra.estado || '',
          observacionRechazo: muestra.observacionRechazo || '',
          firmas: muestra.firmas || {
            firmaAdministrador: { firma: '' },
            firmaCliente: { firma: '' }
          }
        });
        setMuestraId(id);
        setIsUpdating(true);
        if (muestra.documento) {
          setFormData(prev => ({ ...prev, documento: muestra.documento }));
          await handleValidateUser();
        }
      }
    } catch (error: any) {
      setError(error.message || 'Error al cargar la muestra');
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) {
      cargarMuestraExistente(id);
    }
  }, []);

  const handleOpenRechazoModal = () => {
    setOpenRechazoModal(true);
  };

  const handleCloseRechazoModal = () => {
    setOpenRechazoModal(false);
  };

  const handleConfirmarRechazo = () => {
    // Si se ingresa observación, se marca la muestra como rechazada
    if (!observacionRechazo.trim()) {
      setError("Debe ingresar la observación para el rechazo.");
      return;
    }
    setIsRejected(true);
    setOpenRechazoModal(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    // Validamos el formulario (en caso de rechazo, podemos omitir firmas)
    const errores = validarFormulario(formData);
    if (Object.keys(errores).length > 0) {
      setError(Object.values(errores).join(' - '));
      setLoading(false);
      return;
    }
    try {
      if (!adminData) {
        throw new Error('No se encontraron datos del administrador');
      }
      if (!clienteEncontrado) {
        setError('Debe validar el cliente antes de continuar');
        setLoading(false);
        return;
      }
      if (!formData.tipoMuestreo || !formData.lugarMuestreo || formData.analisisSeleccionados.length === 0) {
        setError('Por favor complete todos los campos requeridos');
        setLoading(false);
        return;
      }
      // Asignar automáticamente el tipo de muestra y la fecha y hora de registro actuales
      const updatedFormData: MuestraFormData = {
        ...formData,
        tipoMuestra: "Agua",
        fechaHora: formatearFecha(new Date())
      };
      // Si la muestra fue rechazada, se asigna el estado "Rechazada" y se agrega la observación
      if (isRejected) {
        updatedFormData.estado = "Rechazada";
        updatedFormData.observacionRechazo = observacionRechazo;
      } else {
        if (!mostrarFirmas) {
          setMostrarFirmas(true);
          setLoading(false);
          return;
        }
        if (!validarFirmas()) {
          setLoading(false);
          return;
        }
      }
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No se encontró el token de autenticación');
      }
      const muestraData = {
        ...updatedFormData,
        documento: clienteEncontrado.documento,
        firmas: {
          firmaAdministrador: { firma: updatedFormData.firmas.firmaAdministrador.firma },
          firmaCliente: { firma: updatedFormData.firmas.firmaCliente.firma }
        }
      };
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
      let response;
      if (isUpdating && muestraId) {
        response = await axios.put(
          API_URLS.EDITAR_RESULTADOS(muestraId),
          muestraData,
          { headers }
        );
        setSuccess('✔ Resultados actualizados exitosamente');
      } else {
        response = await axios.post(
          API_URLS.MUESTRAS,
          muestraData,
          { headers }
        );
        setSuccess('✔ Muestra registrada exitosamente');
      }
      limpiarEstado();
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || (isUpdating ? 'Error al actualizar los resultados' : 'Error al registrar la muestra');
      setError(`Error: ${errorMessage}`);
      if (errorMessage.toLowerCase().includes('sesión') || errorMessage.toLowerCase().includes('token')) {
        setTimeout(() => {
          localStorage.clear();
          navigate('/login');
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAnalisisChange = (analisis: string) => {
    setFormData(prev => ({
      ...prev,
      analisisSeleccionados: prev.analisisSeleccionados.includes(analisis)
        ? prev.analisisSeleccionados.filter(a => a !== analisis)
        : [...prev.analisisSeleccionados, analisis]
    }));
  };

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
    const camposRequeridos = {
      nombre: 'Nombre',
      documento: 'Documento',
      email: 'Email',
      password: 'Contraseña'
    };
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
      const response = await axios.post(
        `${API_URLS.USUARIOS}/registro`,
        newClienteData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
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

  const limpiarEstado = () => {
    setFormData(initialFormData);
    setFirmas(initialFirmasState);
    setClienteEncontrado(null);
    setMostrarFirmas(false);
    setError(null);
    setSuccess(null);
    setIsUpdating(false);
    setMuestraId(null);
    setIsRejected(false);
    setObservacionRechazo('');
  };

  return (
    <Paper
      sx={{
        position: 'relative',
        padding: 3,
        maxWidth: 800,
        margin: "auto",
        marginTop: 3
      }}
    >
      {/* Mostrar fecha y hora de registro en la esquina superior derecha */}
      <Box
        sx={{
          position: "absolute",
          top: 8,
          right: 16,
          zIndex: 9999,
          backgroundColor: "rgba(255,255,255,0.8)",
          px: 1,
          borderRadius: 1
        }}
      >
        <Typography variant="caption" color="textSecondary">
          {currentDateTime}
        </Typography>
      </Box>

      <Typography variant="h5" gutterBottom>
        {isUpdating ? 'Actualizar Muestra' : 'Registro de Muestra'}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <form onSubmit={handleSubmit} autoComplete="off">
        {/* 1. Documento */}
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <TextField
            fullWidth
            label="Número de Documento"
            name="documento"
            value={formData.documento}
            onChange={handleChange}
            required
          />
          <Button
            variant="outlined"
            onClick={handleValidateUser}
            sx={{ ml: 1, height: "56px" }}
            disabled={validatingUser || !formData.documento}
          >
            {validatingUser ? <CircularProgress size={24} /> : "Validar"}
          </Button>
          {userValidationError && (
            <Button
              variant="outlined"
              onClick={handleOpenModal}
              sx={{ ml: 1, height: "56px" }}
            >
              Registrar Cliente
            </Button>
          )}
        </Box>
        {userValidationError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {userValidationError}
          </Alert>
        )}
        {clienteEncontrado && (
          <Box sx={{ mb: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: "bold", mb: 1 }}>
              Cliente Validado:
            </Typography>
            <Typography variant="body1">
              Nombre: {clienteEncontrado.nombre || clienteEncontrado.razonSocial}
            </Typography>
            <Typography variant="body1">
              Documento: {clienteEncontrado.documento}
            </Typography>
            <Typography variant="body1">
              Correo: {clienteEncontrado.email}
            </Typography>
          </Box>
        )}

        {/* 2. Tipo de Agua */}
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Tipo de Agua</InputLabel>
          <Select
            name="tipoAgua"
            value={formData.tipoDeAgua.tipo}
            onChange={handleChange}
            label="Tipo de Agua"
          >
            {TIPOS_AGUA.map(tipo => (
              <MenuItem key={tipo} value={tipo}>
                {tipo.charAt(0).toUpperCase() + tipo.slice(1)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {formData.tipoDeAgua.tipo === "otra" && (
          <>
            <TextField
              fullWidth
              label="Tipo Personalizado"
              name="tipoPersonalizado"
              value={formData.tipoDeAgua.tipoPersonalizado}
              onChange={handleChange}
              sx={{ mb: 2 }}
              required
            />
            <TextField
              fullWidth
              label="Descripción"
              name="descripcion"
              value={formData.tipoDeAgua.descripcion}
              onChange={handleChange}
              sx={{ mb: 2 }}
              multiline
              rows={2}
            />
          </>
        )}

        {/* 3. Tipo de Muestreo */}
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Tipo de Muestreo</InputLabel>
          <Select
            name="tipoMuestreo"
            value={formData.tipoMuestreo}
            onChange={handleChange}
            label="Tipo de Muestreo"
          >
            {TIPOS_MUESTREO.map(tipo => (
              <MenuItem key={tipo} value={tipo}>{tipo}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* 4. Lugar de Muestreo */}
        <TextField
          fullWidth
          label="Lugar de Muestreo"
          name="lugarMuestreo"
          value={formData.lugarMuestreo}
          onChange={handleChange}
          required
          sx={{ mb: 2 }}
        />

        {/* 5. Fecha y Hora de Muestreo */}
        <TextField
          fullWidth
          label="Fecha y Hora de Muestreo"
          name="fechaHoraMuestreo"
          type="datetime-local"
          value={formData.fechaHoraMuestreo}
          onChange={handleChange}
          InputLabelProps={{ shrink: true }}
          sx={{ mb: 2 }}
          required
        />

        {/* 6. Tipo de Análisis */}
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Tipo de Análisis</InputLabel>
          <Select
            name="tipoAnalisis"
            value={formData.tipoAnalisis}
            onChange={handleChange}
            label="Tipo de Análisis"
            required
          >
            {TIPOS_ANALISIS.map(option => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* 7. Identificación de la Muestra */}
        <TextField
          fullWidth
          label="Identificación de la Muestra"
          name="identificacionMuestra"
          value={formData.identificacionMuestra}
          onChange={handleChange}
          sx={{ mb: 2 }}
          helperText="Identificación física/química de la muestra"
        />

        {/* 8. Plan de Muestreo */}
        <TextField
          fullWidth
          label="Plan de Muestreo"
          name="planMuestreo"
          value={formData.planMuestreo}
          onChange={handleChange}
          sx={{ mb: 2 }}
        />

        {/* 9. Condiciones Ambientales */}
        <TextField
          fullWidth
          label="Condiciones Ambientales"
          name="condicionesAmbientales"
          value={formData.condicionesAmbientales}
          onChange={handleChange}
          sx={{ mb: 2 }}
          multiline
          rows={2}
        />

        {/* 10. Preservación de la Muestra */}
        <FormControl fullWidth sx={{ mb: 2 }}>
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
        {formData.preservacionMuestra === 'Otro' && (
          <TextField
            fullWidth
            label="Especificar preservación"
            name="preservacionMuestraOtro"
            value={formData.preservacionMuestraOtro}
            onChange={handleChange}
            required
            sx={{ mb: 2 }}
          />
        )}

        {/* 11. Análisis a Realizar */}
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Análisis a realizar:
        </Typography>
        {analisisDisponibles.map((categoria, index) => (
          <Accordion key={index} sx={{ mb: 1, boxShadow: 2 }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ bgcolor: 'grey.100' }}>
              <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                {categoria.categoria}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                {categoria.analisis.map((analisis, idx) => (
                  <Grid item xs={12} sm={6} key={idx}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={formData.analisisSeleccionados.includes(analisis)}
                          onChange={() => handleAnalisisChange(analisis)}
                        />
                      }
                      label={analisis}
                    />
                  </Grid>
                ))}
              </Grid>
            </AccordionDetails>
          </Accordion>
        ))}

        {/* Botón para rechazar la muestra (antes de pasar a firmas) */}
        {!isRejected && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
            <Button variant="contained" color="error" onClick={handleOpenRechazoModal}>
              Rechazar Muestra
            </Button>
          </Box>
        )}

        {/* Se muestran las firmas solo si la muestra no fue rechazada */}
        {!isRejected && mostrarFirmas && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Firmas Digitales
            </Typography>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" color="primary" gutterBottom>
                Firma del Administrador
              </Typography>
              {!adminData && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  No se encontraron datos del administrador. Por favor, inicie sesión nuevamente.
                </Alert>
              )}
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
            {(formData.firmas.firmaAdministrador.firma || formData.firmas.firmaCliente.firma) && (
              <Box sx={{ mt: 2, mb: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Estado de las Firmas:
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Alert severity={formData.firmas.firmaAdministrador.firma ? "success" : "warning"}>
                    Firma del Administrador: {formData.firmas.firmaAdministrador.firma ? "✔ Completada" : "⚠ Pendiente"}
                  </Alert>
                  <Alert severity={formData.firmas.firmaCliente.firma ? "success" : "warning"}>
                    Firma del Cliente: {formData.firmas.firmaCliente.firma ? "✔ Completada" : "⚠ Pendiente"}
                  </Alert>
                </Box>
              </Box>
            )}
          </Box>
        )}

        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          disabled={loading}
          sx={{ mt: 2 }}
        >
          {loading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={24} color="inherit" />
              <span>{isUpdating ? 'Actualizando muestra...' : isRejected ? 'Registrar Muestra Rechazada' : 'Registrar Muestra'}</span>
            </Box>
          ) : isRejected ? (
            "Registrar Muestra Rechazada"
          ) : (
            "Continuar con las Firmas"
          )}
        </Button>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {success}
          </Alert>
        )}
      </form>

      {/* Modal para registrar Cliente */}
      <Modal
        open={openModal}
        onClose={handleCloseModal}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500 }}
      >
        <Fade in={openModal}>
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 400,
              bgcolor: "background.paper",
              boxShadow: 24,
              p: 4,
              borderRadius: 1,
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            <Typography variant="h6" gutterBottom>
              Registrar Cliente
            </Typography>
            <TextField fullWidth label="Nombre Completo" name="nombre" value={clienteData.nombre} onChange={handleClienteChange} required sx={{ mb: 2 }} />
            <TextField fullWidth label="Documento" name="documento" value={clienteData.documento} onChange={handleClienteChange} required sx={{ mb: 2 }} />
            <TextField fullWidth label="Teléfono" name="telefono" value={clienteData.telefono} onChange={handleClienteChange} sx={{ mb: 2 }} />
            <TextField fullWidth label="Dirección" name="direccion" value={clienteData.direccion} onChange={handleClienteChange} sx={{ mb: 2 }} />
            <TextField fullWidth label="Correo Electrónico" name="email" type="email" value={clienteData.email} onChange={handleClienteChange} required sx={{ mb: 2 }} />
            <TextField fullWidth label="Contraseña" name="password" type="password" value={clienteData.password} onChange={handleClienteChange} required sx={{ mb: 2 }} />
            <TextField fullWidth label="Razón Social" name="razonSocial" value={clienteData.razonSocial} onChange={handleClienteChange} sx={{ mb: 2 }} />
            {registroError && <Alert severity="error" sx={{ mb: 2 }}>{registroError}</Alert>}
            {registroExito && <Alert severity="success" sx={{ mb: 2 }}>{registroExito}</Alert>}
            <Button variant="contained" color="primary" fullWidth onClick={handleRegistrarCliente} disabled={registrando}>
              {registrando ? <CircularProgress size={24} /> : "Registrar"}
            </Button>
          </Box>
        </Fade>
      </Modal>

      {/* Modal para rechazo de muestra */}
      <Modal
        open={openRechazoModal}
        onClose={handleCloseRechazoModal}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 500 }}
      >
        <Fade in={openRechazoModal}>
          <Box
            sx={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 400,
              bgcolor: "background.paper",
              boxShadow: 24,
              p: 4,
              borderRadius: 1,
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
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
            <Button variant="contained" color="error" fullWidth onClick={handleConfirmarRechazo}>
              Confirmar Rechazo
            </Button>
          </Box>
        </Fade>
      </Modal>
    </Paper>
  );
};

export default RegistroMuestras;
