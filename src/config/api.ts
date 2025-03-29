export const API_CONFIG = {
  USUARIOS_BASE_URL: process.env.REACT_APP_USUARIOS_API_URL || 'https://back-usuarios-f.onrender.com/api',
  MUESTRAS_BASE_URL: process.env.REACT_APP_MUESTRAS_API_URL || 'https://daniel-back-dom.onrender.com/api',
  ENDPOINTS: {
    USUARIOS: '/usuarios',
    MUESTRAS: '/muestras',
    TIPOS_AGUA: '/tipos-agua',
    CAMBIOS_ESTADO: '/cambios-estado'
  }
};
