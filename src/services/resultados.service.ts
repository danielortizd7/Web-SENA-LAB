import axios from 'axios';

interface ResultadosData {
  idMuestra: string;
  analisis: {
    pH?: {
      calibracion: {
        pH4?: string;
        pH7?: string;
        pH10?: string;
      };
      mediciones: {
        M1: string;
        M2: string;
      };
    };
    turbidez?: {
      calibracion: {
        '20UNT'?: string;
        '200UNT'?: string;
      };
      mediciones: {
        M1: string;
        M2: string;
      };
    };
    conductividad?: {
      mediciones: {
        M1: string;
        M2: string;
        unidad: string;
      };
    };
  };
  observaciones: string;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

class ResultadosService {
  private API_URL = 'https://backend-registro-muestras.onrender.com/api/ingreso-resultados';

  private getHeaders() {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No se encontró el token de autenticación. Por favor, inicia sesión.');
    }
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  async obtenerMuestrasPendientes(): Promise<ApiResponse<any>> {
    try {
      const response = await axios.get<ApiResponse<any>>(
        `${this.API_URL}/pendientes`,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error al obtener muestras pendientes:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener las muestras pendientes');
    }
  }

  async registrarResultados(resultados: ResultadosData): Promise<ApiResponse<any>> {
    try {
      const response = await axios.post<ApiResponse<any>>(
        `${this.API_URL}`,
        resultados,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error al registrar resultados:', error);
      throw new Error(error.response?.data?.message || 'Error al registrar los resultados');
    }
  }

  async obtenerResultados(idMuestra: string): Promise<ApiResponse<any>> {
    try {
      const response = await axios.get<ApiResponse<any>>(
        `${this.API_URL}/${idMuestra}`,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error al obtener resultados:', error);
      throw new Error(error.response?.data?.message || 'Error al obtener los resultados');
    }
  }

  async verificarResultados(idMuestra: string, verificacion: { observaciones: string }): Promise<ApiResponse<any>> {
    try {
      const response = await axios.post<ApiResponse<any>>(
        `${this.API_URL}/${idMuestra}/verificar`,
        verificacion,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error al verificar resultados:', error);
      throw new Error(error.response?.data?.message || 'Error al verificar los resultados');
    }
  }
}

export const resultadosService = new ResultadosService();