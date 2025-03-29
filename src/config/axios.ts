import axios from 'axios';

const instance = axios.create({
  baseURL: 'https://daniel-back-dom.onrender.com',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  withCredentials: false // Deshabilitamos withCredentials para evitar problemas de CORS
});

// Interceptor para añadir el token a todas las peticiones
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para responses
instance.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      // Error de respuesta del servidor
      switch (error.response.status) {
        case 401:
          // Token expirado o inválido
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          break;
        case 403:
          console.error('Acceso denegado:', error.response.data);
          break;
        case 404:
          console.error('Recurso no encontrado:', error.response.data);
          break;
        case 422:
          console.error('Error de validación:', error.response.data);
          break;
        case 500:
          console.error('Error del servidor:', error.response.data);
          break;
        default:
          console.error('Error de red:', error.response.data);
      }
    } else if (error.request) {
      // Error de red
      console.error('Error de red:', error.request);
    } else {
      // Error en la configuración de la petición
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default instance;
