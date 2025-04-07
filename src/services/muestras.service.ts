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
  ANALISIS_FISICOQUIMICOS: `${BASE_URLS.MUESTRAS}/analisis/fisicoquimicos`,
  ANALISIS_MICROBIOLOGICOS: `${BASE_URLS.MUESTRAS}/analisis/microbiologicos`
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
      const queryParams = new URLSearchParams();
      
      queryParams.append('page', params.page.toString());
      queryParams.append('limit', params.limit.toString());
      
      if (params.sortBy) {
        queryParams.append('sortBy', params.sortBy);
      }
      if (params.sortOrder) {
        queryParams.append('sortOrder', params.sortOrder);
      }
      if (params.tipo) {
        queryParams.append('tipo', params.tipo);
      }
      if (params.estado) {
        queryParams.append('estado', params.estado);
      }

      const response = await axios.get<ApiResponse<PaginationResponse>>(
        `${this.API_URL}?${queryParams.toString()}`,
        { headers: this.getHeaders() }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error en obtenerMuestras:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener las muestras');
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
