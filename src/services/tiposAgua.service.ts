import axios from 'axios';
import { API_CONFIG } from '../config/api';

export interface TipoAgua {
  tipo: 'potable' | 'natural' | 'residual' | 'otra';
  tipoPersonalizado?: string;
  descripcion?: string;
}

class TiposAguaService {
  private baseUrl = `${API_CONFIG.MUESTRAS_BASE_URL}${API_CONFIG.ENDPOINTS.TIPOS_AGUA}`;

  async getTiposAgua(): Promise<TipoAgua[]> {
    try {
      const response = await axios.get(this.baseUrl);
      return response.data;
    } catch (error) {
      console.error('Error al obtener tipos de agua:', error);
      throw error;
    }
  }

  async crearTipoAgua(tipoAgua: TipoAgua): Promise<TipoAgua> {
    try {
      const response = await axios.post(this.baseUrl, tipoAgua);
      return response.data;
    } catch (error) {
      console.error('Error al crear tipo de agua:', error);
      throw error;
    }
  }
}

export const tiposAguaService = new TiposAguaService();
