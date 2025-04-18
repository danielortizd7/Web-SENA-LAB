import axios from 'axios';

// URLs base actualizadas
const BASE_URLS = {
  USUARIOS: 'https://backend-sena-lab-1-qpzp.onrender.com/api',
  MUESTRAS: 'https://backend-registro-muestras.onrender.com/api'
};

// URLs específicas actualizadas
const API_URLS = {
  USUARIOS: `${BASE_URLS.USUARIOS}/usuarios`,
  MUESTRAS: `${BASE_URLS.MUESTRAS}/muestras`,
  ANALISIS_FISICOQUIMICOS: `${BASE_URLS.MUESTRAS}/analisis/fisicoquimico`,
  ANALISIS_MICROBIOLOGICOS: `${BASE_URLS.MUESTRAS}/analisis/microbiologico`
};

interface FirmaData {
  firma: string;
  fecha: string;
}

interface Firmas {
  firmaAdministrador: FirmaData;
  firmaCliente: FirmaData;
}

interface TipoDeAgua {
  tipo: string;
  codigo: string;
  descripcion: string;
  subtipo?: string;
}

interface MuestraFormData {
  documento: string;
  tipoDeAgua: TipoDeAgua;
  tipoMuestreo: 'Simple' | 'Compuesto';
  lugarMuestreo: string;
  fechaHoraMuestreo: string;
  tipoAnalisis: 'Fisicoquímico' | 'Microbiológico' | '';
  identificacionMuestra: string;
  planMuestreo: string;
  condicionesAmbientales: string;
  preservacionMuestra: 'Refrigeración' | 'Congelación' | 'Acidificación' | 'Otro' | '';
  preservacionMuestraOtra?: string;
  analisisSeleccionados: string[];
  firmas: Firmas;
  observaciones?: string;
  estado?: 'Recibida' | 'En análisis' | 'Pendiente de resultados' | 'Finalizada' | 'Rechazada';
}

interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  tipo?: string;
  estado?: string;
}

interface PaginationResponse {
  items: MuestraFormData[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export class MuestrasService {
  private API_URL: string;

  constructor() {
    this.API_URL = API_URLS.MUESTRAS;
  }

  private getHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  async registrarMuestra(muestraData: MuestraFormData): Promise<ApiResponse<MuestraFormData>> {
    try {
      const response = await axios.post<ApiResponse<MuestraFormData>>(
        `${this.API_URL}`,
        muestraData,
        { headers: this.getHeaders() }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error al registrar muestra:', error);
      throw new Error(error.response?.data?.message || 'Error al registrar la muestra');
    }
  }

  async obtenerMuestras(params: PaginationParams = { page: 1, limit: 10 }): Promise<ApiResponse<PaginationResponse>> {
    try {
      const response = await axios.get(
        `${this.API_URL}`,
        { 
          params: {
            page: params.page,
            limit: params.limit,
            sortBy: params.sortBy || 'createdAt',
            sortOrder: params.sortOrder || 'desc',
            ...(params.tipo && params.tipo !== 'todos' && { tipoAnalisis: params.tipo })
          },
          headers: this.getHeaders()
        }
      );

      // Si la respuesta es un error, lanzar excepción
      if (!response.data.success) {
        throw new Error(response.data.message || 'Error al obtener las muestras');
      }

      // La respuesta del backend ya viene con el formato correcto
      const { data, pagination } = response.data.data;

      return {
        success: true,
        data: {
          items: data,
          total: pagination.total,
          page: pagination.currentPage,
          limit: pagination.limit,
          totalPages: pagination.totalPages
        },
        message: response.data.message || 'Muestras obtenidas correctamente'
      };
    } catch (error) {
      console.error('Error en obtenerMuestras:', error);
      return {
        success: false,
        data: {
          items: [],
          total: 0,
          page: params.page,
          limit: params.limit,
          totalPages: 0
        },
        message: error instanceof Error ? error.message : 'Error al obtener las muestras'
      };
    }
  }

  async obtenerMuestra(id: string): Promise<ApiResponse<MuestraFormData>> {
    try {
      const response = await axios.get<ApiResponse<MuestraFormData>>(
        `${this.API_URL}/${id}`,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Error al obtener la muestra');
    }
  }

  async obtenerMuestrasPorTipo(tipo: string): Promise<ApiResponse<MuestraFormData[]>> {
    try {
      const response = await axios.get<ApiResponse<MuestraFormData[]>>(
        `${this.API_URL}?tipo=${tipo}`,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error al obtener muestras por tipo:', error.response || error);
      throw new Error(error.response?.data?.message || 'Error al obtener las muestras');
    }
  }

  async obtenerMuestrasPorEstado(estado: string): Promise<ApiResponse<MuestraFormData[]>> {
    try {
      const response = await axios.get<ApiResponse<MuestraFormData[]>>(
        `${this.API_URL}?estado=${estado}`,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error al obtener muestras por estado:', error.response || error);
      throw new Error(error.response?.data?.message || 'Error al obtener las muestras');
    }
  }

  async actualizarMuestra(id: string, muestra: Partial<MuestraFormData>): Promise<ApiResponse<MuestraFormData>> {
    try {
      const response = await axios.put<ApiResponse<MuestraFormData>>(
        `${this.API_URL}/${id}`,
        muestra,
        { headers: this.getHeaders() }
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Error al actualizar la muestra');
      }

      return response.data;
    } catch (error: any) {
      console.error('Error al actualizar muestra:', error.response || error);
      throw new Error(error.response?.data?.message || 'Error al actualizar la muestra');
    }
  }
}

export const muestrasService = new MuestrasService();
