import axios from 'axios';

interface SignatureData {
  firma: string;
}

interface Firmas {
  firmaAdministrador: SignatureData;
  firmaCliente: SignatureData;
}

interface TipoDeAgua {
  tipo: string;
  tipoPersonalizado?: string;
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
  firmas: Firmas;
}

class MuestrasService {
  private API_URL = 'http://localhost:5000/api';

  private getHeaders() {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  async registrarMuestra(muestraData: MuestraFormData) {
    try {
      const response = await axios.post(
        `${this.API_URL}/muestras`,
        muestraData,
        { headers: this.getHeaders() }
      );

      return response.data;
    } catch (error: any) {
      console.error('Error al registrar muestra:', error);
      throw new Error(error.response?.data?.message || 'Error al registrar la muestra');
    }
  }

  async obtenerMuestras() {
    try {
      const response = await axios.get(
        `${this.API_URL}/muestras`,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error al obtener muestras:', error.response || error);
      throw new Error(error.response?.data?.message || 'Error al obtener las muestras');
    }
  }

  async obtenerMuestra(id: string) {
    try {
      const response = await axios.get(
        `${this.API_URL}/muestras/${id}`,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error al obtener muestra:', error.response || error);
      throw new Error(error.response?.data?.message || 'Error al obtener la muestra');
    }
  }

  async obtenerMuestrasPorTipo(tipo: string) {
    try {
      const response = await axios.get(
        `${this.API_URL}/muestras/tipo/${tipo}`,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error al obtener muestras por tipo:', error.response || error);
      throw new Error(error.response?.data?.message || 'Error al obtener las muestras');
    }
  }

  async obtenerMuestrasPorEstado(estado: string) {
    try {
      const response = await axios.get(
        `${this.API_URL}/muestras/estado/${estado}`,
        { headers: this.getHeaders() }
      );
      return response.data;
    } catch (error: any) {
      console.error('Error al obtener muestras por estado:', error.response || error);
      throw new Error(error.response?.data?.message || 'Error al obtener las muestras');
    }
  }

  async actualizarMuestra(id: string, muestra: Partial<MuestraFormData>) {
    try {
      const response = await axios.put(
        `${this.API_URL}/muestras/${id}`,
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
