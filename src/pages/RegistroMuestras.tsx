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
  SelectChangeEvent,
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

// URLs base
const BASE_URLS = {
  USUARIOS: 'https://back-usuarios-f.onrender.com/api',
  MUESTRAS: 'https://daniel-back-dom.onrender.com/api'
};

// URLs específicas
const API_URLS = {
  USUARIOS: `${BASE_URLS.USUARIOS}/usuarios`,
  MUESTRAS: `${BASE_URLS.MUESTRAS}/muestras`,
  TIPOS_AGUA: `${BASE_URLS.MUESTRAS}/tipos-agua`,
  CAMBIOS_ESTADO: `${BASE_URLS.MUESTRAS}/cambios-estado`
};

// Tipos de preservación válidos
const TIPOS_PRESERVACION = ['Refrigeración', 'Congelación', 'Temperatura Ambiente'] as const;
type TipoPreservacion = typeof TIPOS_PRESERVACION[number];

// Tipos de muestreo válidos
const TIPOS_MUESTREO = ['Simple', 'Compuesto'] as const;
type TipoMuestreo = typeof TIPOS_MUESTREO[number];

// Tipos de agua válidos
const TIPOS_AGUA = ['potable', 'natural', 'residual', 'otra'] as const;
type TipoAgua = typeof TIPOS_AGUA[number];

// Estados válidos para las muestras
const ESTADOS_VALIDOS = ["Recibida", "En análisis", "Pendiente de resultados", "Finalizada", "Rechazada"] as const;
type EstadoMuestra = typeof ESTADOS_VALIDOS[number];

// Interfaces actualizadas
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

interface MuestraFormData {
  documento: string;
  tipoMuestra: string;
  tipoMuestreo: string;
  fechaHora: string;
  lugarMuestreo: string;
  planMuestreo: string;
  condicionesAmbientales: string;
  preservacionMuestra: string;
  identificacionMuestra: string;
  analisisSeleccionados: string[];
  tipoDeAgua: TipoDeAgua;
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
  tipoMuestreo: '',
  fechaHora: '',
  lugarMuestreo: '',
  planMuestreo: '',
  condicionesAmbientales: '',
  preservacionMuestra: '',
  identificacionMuestra: '',
  analisisSeleccionados: [],
  tipoDeAgua: {
    tipo: '',
    tipoPersonalizado: '',
    descripcion: ''
  },
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
  razonSocial: '',
};

// Estado inicial para las firmas
const initialFirmasState: FirmasState = {
  administrador: null,
  cliente: null
};

// Listas de análisis
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

// Función para formatear la fecha al formato del formulario
const formatearFecha = (fecha: Date): string => {
  const dia = fecha.getDate().toString().padStart(2, '0');
  const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
  const año = fecha.getFullYear();
  const hora = fecha.getHours().toString().padStart(2, '0');
  const minutos = fecha.getMinutes().toString().padStart(2, '0');
  return `${año}-${mes}-${dia}T${hora}:${minutos}`;
};

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

  // Estados para el modal de registro de cliente
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [clienteData, setClienteData] = useState<ClienteData>(initialClienteData);
  const [registroError, setRegistroError] = useState<string | null>(null);
  const [registroExito, setRegistroExito] = useState<string | null>(null);
  const [registrando, setRegistrando] = useState<boolean>(false);

  const firmaAdministradorRef = useRef<SignatureCanvas | null>(null);
  const firmaClienteRef = useRef<SignatureCanvas | null>(null);

  // Verificar y cargar datos del administrador al montar el componente
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

  // Efecto para verificar el estado de las firmas
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

  // Determinar qué lista de análisis mostrar según el tipo de muestra
  const analisisDisponibles = formData.tipoMuestra === "Suelo" ? analisisSuelo :
                             formData.tipoMuestra === "Agua" ? analisisAgua : [];

  // Función actualizada para validar el formulario
  const validarFormulario = (data: MuestraFormData): Record<string, string> => {
    const errores: Record<string, string> = {};

    // Validaciones básicas
    if (!data.documento) errores.documento = 'El documento es requerido';
    if (!data.tipoMuestra) errores.tipoMuestra = 'El tipo de muestra es requerido';
    if (!data.tipoMuestreo) errores.tipoMuestreo = 'El tipo de muestreo es requerido';
    if (!data.lugarMuestreo) errores.lugarMuestreo = 'El lugar de muestreo es requerido';
    if (!data.analisisSeleccionados?.length) errores.analisisSeleccionados = 'Debe seleccionar al menos un análisis';

    // Validación de firmas
    if (!data.firmas?.firmaAdministrador.firma) {
      errores.firmaAdministrador = 'La firma del administrador es requerida';
    }
    if (!data.firmas?.firmaCliente.firma) {
      errores.firmaCliente = 'La firma del cliente es requerida';
    }

    // Validación específica para tipo de agua
    if (data.tipoMuestra === 'Agua' && !data.tipoDeAgua?.tipo) {
      errores.tipoDeAgua = 'El tipo de agua es requerido';
    }

    return errores;
  };

  // Función para validar el cliente
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
        {
          headers: { Authorization: `Bearer ${token}` }
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
      console.error(
        "Error al validar usuario:",
        error.response ? error.response.data : error.message
      );
      setUserValidationError("Usuario no encontrado.");
      setClienteEncontrado(null);
    }
    setValidatingUser(false);
  };

  // Función para decodificar el token JWT
  const decodeToken = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (error) {
      console.error("Error decodificando token:", error);
      return null;
    }
  };

  // Función para obtener los datos del usuario
  const obtenerDatosUsuario = () => {
    console.log("Iniciando obtención de datos de usuario...");
    
    const token = localStorage.getItem('token');
    if (!token) {
        console.error("No se encontró token en localStorage");
        throw new Error("No hay token de autenticación. Por favor, inicie sesión nuevamente.");
    }

    let userData;
    try {
        // Intentar obtener datos del localStorage
        console.log("Buscando datos en localStorage...");
        const userDataStr = localStorage.getItem("usuario") || localStorage.getItem("user");
        
        if (userDataStr) {
            console.log("Datos encontrados en localStorage:", userDataStr);
            userData = JSON.parse(userDataStr);
        } else {
            console.log("No se encontraron datos en localStorage, intentando decodificar token...");
            // Si no hay datos en localStorage, intentar obtener del token
            const decodedToken = decodeToken(token);
            if (decodedToken) {
                userData = {
                    _id: decodedToken.id,
                    nombre: decodedToken.nombre,
                    email: decodedToken.email,
                    rol: decodedToken.rol
                };
                console.log("Datos obtenidos del token:", userData);
            }
        }

        if (!userData || !userData._id || !userData.nombre || !userData.rol) {
            console.error("Datos de usuario incompletos:", userData);
            throw new Error("Datos de usuario incompletos. Por favor, inicie sesión nuevamente.");
        }

        // Usar el _id como documento si no existe documento
        const documento = userData.documento || userData._id;

        console.log("Datos de usuario validados correctamente:", { ...userData, documento });
        return { userData: { ...userData, documento }, token };
    } catch (error) {
        console.error("Error al obtener datos del usuario:", error);
        throw new Error("Error al obtener datos del usuario. Por favor, inicie sesión nuevamente.");
    }
  };

  // Función para limpiar firmas
  const limpiarFirma = (tipo: 'administrador' | 'cliente') => {
    if (tipo === 'administrador' && firmaAdministradorRef.current) {
      firmaAdministradorRef.current.clear();
    } else if (tipo === 'cliente' && firmaClienteRef.current) {
      firmaClienteRef.current.clear();
    }
  };

  // Función para validar el tamaño de la firma
  const validarTamañoFirma = (firma: string): boolean => {
    const tamañoBytes = new Blob([firma]).size;
    const tamañoMB = tamañoBytes / (1024 * 1024);
    return tamañoMB <= 2;
  };

  // Función para validar formato base64
  const validarFormatoBase64 = (firma: string): boolean => {
    try {
      return firma.startsWith('data:image/png;base64,') && 
             btoa(atob(firma.split(',')[1])) === firma.split(',')[1];
    } catch {
      return false;
    }
  };

  // Función actualizada para guardar firma del administrador
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
          firmaAdministrador: { firma }
        }
      }));

        setError(null);
    } catch (error: any) {
      console.error('Error al guardar firma del administrador:', error);
      setError(error.message || 'Error al guardar la firma del administrador');
    }
  };

  // Función actualizada para guardar firma del cliente
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

      console.log('Guardando firma del cliente...');
      
      setFormData(prev => ({
        ...prev,
        firmas: {
          ...prev.firmas,
          firmaCliente: { firma }
        }
      }));

      console.log('Firma del cliente guardada correctamente');
      setError(null);
      setSuccess('✔ Firma del cliente guardada correctamente');
    } catch (error: any) {
      console.error('Error al guardar firma del cliente:', error);
      setError(error.message || 'Error al guardar la firma del cliente');
    }
  };

  // Función actualizada para validar firmas
  const validarFirmas = () => {
    if (!formData.firmas.firmaAdministrador.firma) {
      setError('Se requiere la firma del administrador');
      return false;
    }

    if (!formData.firmas.firmaCliente.firma) {
      setError('Se requiere la firma del cliente');
      return false;
    }

    return true;
  };

  // Función para cargar los datos de una muestra existente
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
          lugarMuestreo: muestra.lugarMuestreo,
          planMuestreo: muestra.planMuestreo,
          condicionesAmbientales: muestra.condicionesAmbientales,
          preservacionMuestra: muestra.preservacionMuestra,
          identificacionMuestra: muestra.identificacionMuestra,
          analisisSeleccionados: muestra.analisisSeleccionados || [],
          tipoDeAgua: muestra.tipoDeAgua || { tipo: '', tipoPersonalizado: '', descripcion: '' },
          firmas: muestra.firmas || {
            firmaAdministrador: { firma: '' },
            firmaCliente: { firma: '' }
          }
        });
        setMuestraId(id);
        setIsUpdating(true);
        
        // Validar el cliente automáticamente
        if (muestra.documento) {
          setFormData(prev => ({ ...prev, documento: muestra.documento }));
          await handleValidateUser();
        }
      }
    } catch (error: any) {
      console.error('Error al cargar la muestra:', error);
      setError(error.message || 'Error al cargar la muestra');
    }
  };

  // Efecto para cargar la muestra si hay un ID en la URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) {
      cargarMuestraExistente(id);
    }
  }, []);

  // Modificar handleSubmit para manejar actualizaciones
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (!adminData) {
        throw new Error('No se encontraron datos del administrador');
      }

      if (!clienteEncontrado) {
        setError('Debe validar el cliente antes de continuar');
        setLoading(false);
        return;
      }

      if (!mostrarFirmas) {
        if (!formData.tipoMuestra || !formData.tipoMuestreo || !formData.lugarMuestreo || 
            !formData.fechaHora || formData.analisisSeleccionados.length === 0) {
          setError('Por favor complete todos los campos requeridos');
          setLoading(false);
          return;
        }

        setMostrarFirmas(true);
        setLoading(false);
        return;
      }

      if (!validarFirmas()) {
        setLoading(false);
        return;
      }

      const muestraData: MuestraFormData = {
        ...formData,
        documento: clienteEncontrado.documento,
        firmas: {
          firmaAdministrador: { firma: formData.firmas.firmaAdministrador.firma },
          firmaCliente: { firma: formData.firmas.firmaCliente.firma }
        }
      };

      let response;
      if (isUpdating && muestraId) {
        // Actualizar muestra existente
        response = await muestrasService.actualizarMuestra(muestraId, muestraData);
        setSuccess('✔ Muestra actualizada exitosamente');
      } else {
        // Registrar nueva muestra
        response = await muestrasService.registrarMuestra(muestraData);
        setSuccess('✔ Muestra registrada exitosamente');
      }
      
      limpiarEstado();
      
    } catch (error: any) {
      console.error('Error:', error);
      const errorMessage = error.response?.data?.message || error.message || 
        isUpdating ? 'Error al actualizar la muestra' : 'Error al registrar la muestra';
      setError(errorMessage);
        
      if (errorMessage.toLowerCase().includes('sesión') || 
          errorMessage.toLowerCase().includes('token')) {
        setTimeout(() => {
          localStorage.clear();
          navigate('/login');
        }, 2000);
      }
    } finally {
      setLoading(false);
    }
  };

  // Manejar cambios en el formulario
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent
  ) => {
    const { name, value } = e.target;
    
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
    } else if (name === "tipoPersonalizado" || name === "descripcion") {
      setFormData(prev => ({
        ...prev,
        tipoDeAgua: {
          ...prev.tipoDeAgua,
          [name]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    setError(null);
  };

  // Manejar cambios en los análisis seleccionados
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
    // Validar campos requeridos
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

    // Validar formato de email
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
      
      console.log("Cliente registrado con éxito:", response.data);
      setRegistroExito("Cliente registrado correctamente.");
      
      // Actualizar el documento en el formulario principal
      setFormData(prev => ({ ...prev, documento: newClienteData.documento }));
      
      // Cerrar el modal después de un breve delay y validar el usuario
      setTimeout(() => {
        handleCloseModal();
        handleValidateUser();
      }, 2000);
      
    } catch (error: any) {
      console.error(
        "Error al registrar el cliente:",
        error.response ? error.response.data : error.message
      );
      setRegistroError(
        error.response?.data?.message || 
        error.response?.data?.detalles || 
        "⚠ Error en el registro. Por favor, verifique los datos e intente nuevamente."
      );
    } finally {
      setRegistrando(false);
    }
  };

  // Función para limpiar el estado
  const limpiarEstado = () => {
    setFormData(initialFormData);
    setFirmas(initialFirmasState);
    setClienteEncontrado(null);
    setMostrarFirmas(false);
    setError(null);
    setSuccess(null);
    setIsUpdating(false);
    setMuestraId(null);
  };

  return (
    <Paper sx={{ padding: 3, maxWidth: 800, margin: "auto", marginTop: 3 }}>
      <Typography variant="h5" gutterBottom>
        {isUpdating ? 'Actualizar Muestra' : 'Registro de Muestra'}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <form onSubmit={handleSubmit} autoComplete="off">
        {/* Selección de Tipo de Muestra */}
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Tipo de Muestra</InputLabel>
          <Select
            name="tipoMuestra"
            value={formData.tipoMuestra}
            onChange={handleChange}
            label="Tipo de Muestra"
          >
            <MenuItem value="Agua">Agua</MenuItem>
            <MenuItem value="Suelo">Suelo</MenuItem>
          </Select>
        </FormControl>

        {/* Selección de Tipo de Muestreo */}
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

        {/* La selección de Tipo de Agua solo se muestra si el Tipo de Muestra es Agua */}
        {formData.tipoMuestra === "Agua" && (
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
        )}

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

        {/* Campos de identificación y ubicación */}
        <TextField
          fullWidth
          label="Identificación de la Muestra"
          name="identificacionMuestra"
          value={formData.identificacionMuestra}
          onChange={handleChange}
          sx={{ mb: 2 }}
          helperText="Identificación física/química de la muestra"
        />

        <TextField
          fullWidth
          label="Lugar de Muestreo"
          name="lugarMuestreo"
          value={formData.lugarMuestreo}
          onChange={handleChange}
          required
          sx={{ mb: 2 }}
        />

        <TextField
          fullWidth
          label="Plan de Muestreo"
          name="planMuestreo"
          value={formData.planMuestreo}
          onChange={handleChange}
          sx={{ mb: 2 }}
        />

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

        {/* Número de Documento y Validación */}
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

        {/* Fecha y Hora */}
        <TextField
          fullWidth
          type="datetime-local"
          label="Fecha y Hora"
          name="fechaHora"
          value={formData.fechaHora}
          onChange={handleChange}
          InputLabelProps={{ shrink: true }}
          sx={{ mb: 2 }}
          required
        />

        {/* Selección de Análisis */}
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Análisis a realizar:
        </Typography>
        {analisisDisponibles.map((categoria, index) => (
          <Accordion key={index} sx={{ mb: 1, boxShadow: 2 }}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{ bgcolor: 'grey.100' }}
            >
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

        {mostrarFirmas && (
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

            {/* Indicador de estado de las firmas */}
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
              <span>{isUpdating ? 'Actualizando muestra...' : 'Registrando muestra...'}</span>
            </Box>
          ) : mostrarFirmas ? (
            formData.firmas.firmaAdministrador.firma && formData.firmas.firmaCliente.firma
              ? isUpdating ? "Actualizar Muestra" : "Registrar Muestra"
              : "Se requieren ambas firmas para continuar"
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
            <TextField
              fullWidth
              label="Dirección"
              name="direccion"
              value={clienteData.direccion}
              onChange={handleClienteChange}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Correo Electrónico"
              name="email"
              type="email"
              value={clienteData.email}
              onChange={handleClienteChange}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Contraseña"
              name="password"
              type="password"
              value={clienteData.password}
              onChange={handleClienteChange}
              required
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Razón Social"
              name="razonSocial"
              value={clienteData.razonSocial}
              onChange={handleClienteChange}
              sx={{ mb: 2 }}
            />
            {registroError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {registroError}
              </Alert>
            )}
            {registroExito && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {registroExito}
              </Alert>
            )}
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={handleRegistrarCliente}
              disabled={registrando}
            >
              {registrando ? <CircularProgress size={24} /> : "Registrar"}
            </Button>
          </Box>
        </Fade>
      </Modal>
    </Paper>
  );
};

export default RegistroMuestras; 