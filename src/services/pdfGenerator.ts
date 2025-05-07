import axios, { AxiosError } from 'axios';

const BASE_URL = "https://backend-registro-muestras.onrender.com/api";

const API_URLS = {
    FIRMA_DIGITAL: {
        GENERAR_PDF: (idMuestra: string) => `${BASE_URL}/firma-digital/generar-pdf/${idMuestra}`,
    },
    RESULTADOS: {
        GENERAR: (idMuestra: string) => `${BASE_URL}/ingreso-resultados/${idMuestra}/pdf`,
        DESCARGAR: (idMuestra: string) => `${BASE_URL}/ingreso-resultados/${idMuestra}/pdf/download`,
    }
};

// Configuración de axios
const axiosInstance = axios.create({
    timeout: 90000, // 90 segundos
    headers: {
        'Accept': 'application/pdf',
        'Content-Type': 'application/json'
    }
});

// Interceptor para manejar errores
axiosInstance.interceptors.response.use(
    response => response,
    async (error: AxiosError) => {
        if (error.response?.status === 401) {
            // Token expirado o inválido
            localStorage.removeItem('token');
            window.location.href = '/login';
            return Promise.reject(new Error('Sesión expirada. Por favor, inicie sesión nuevamente.'));
        }
        return Promise.reject(error);
    }
);

/**
 * Obtiene el token de autenticación y valida su existencia
 */
const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    if (!token) {
        throw new Error('No hay token de autenticación');
    }
    return {
        'Authorization': `Bearer ${token}`
    };
};

/**
 * Verifica si la respuesta es un PDF válido
 */
const isValidPDFResponse = (response: any): boolean => {
    const contentType = response.headers['content-type'];
    return contentType?.includes('application/pdf') && response.data;
};

/**
 * Maneja la visualización de un PDF en una nueva ventana
 */
const openPDFInNewWindow = (pdfBlob: Blob, preOpenedWindow?: Window | null): void => {
    try {
        const pdfUrl = window.URL.createObjectURL(pdfBlob);
        const win = preOpenedWindow || window.open('', '_blank');
        
        if (win) {
            win.location.href = pdfUrl;
            // Limpiar URL después de un tiempo
            setTimeout(() => {
                window.URL.revokeObjectURL(pdfUrl);
            }, 1000);
        } else {
            throw new Error('No se pudo abrir la ventana');
        }
    } catch (error) {
        console.error('Error al abrir PDF:', error);
        downloadPDF(pdfBlob, 'resultados.pdf');
    }
};

/**
 * Maneja la descarga de un PDF
 */
const downloadPDF = (pdfBlob: Blob, filename: string): void => {
    try {
        const downloadUrl = window.URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => {
            window.URL.revokeObjectURL(downloadUrl);
        }, 1000);
    } catch (error) {
        console.error('Error al descargar PDF:', error);
        throw new Error('No se pudo descargar el PDF');
    }
};

/**
 * Función para reintentar una operación
 */
const retryOperation = async <T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
): Promise<T> => {
    let lastError: Error = new Error('Operación fallida');
    
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error as Error;
            if (i < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
            }
        }
    }
    
    throw lastError;
};

/**
 * Servicio para manejar la generación y descarga de PDFs
 */
export const PDFService = {
    /**
     * Genera y obtiene el PDF de una muestra
     */
    async generarPDFMuestra(idMuestra: string): Promise<void> {
        try {
            console.log('Generando PDF de muestra:', idMuestra);
            const response = await retryOperation(() => 
                axiosInstance({
                    url: API_URLS.FIRMA_DIGITAL.GENERAR_PDF(idMuestra),
                    method: 'GET',
                    responseType: 'blob',
                    headers: getAuthHeaders()
                })
            );

            if (!isValidPDFResponse(response)) {
                throw new Error('La respuesta del servidor no es un PDF válido');
            }

            const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
            openPDFInNewWindow(pdfBlob);
        } catch (error: any) {
            console.error('Error al generar PDF de muestra:', error);
            throw new Error(
                error.response?.data?.message || 
                error.message || 
                'No se pudo generar el PDF de la muestra'
            );
        }
    },

    /**
     * Descarga el PDF de una muestra
     */
    async descargarPDFMuestra(idMuestra: string): Promise<void> {
        try {
            console.log('Descargando PDF de muestra:', idMuestra);
            const response = await retryOperation(() => 
                axiosInstance({
                    url: API_URLS.FIRMA_DIGITAL.GENERAR_PDF(idMuestra),
                    method: 'GET',
                    responseType: 'blob',
                    headers: getAuthHeaders()
                })
            );

            if (!isValidPDFResponse(response)) {
                throw new Error('La respuesta del servidor no es un PDF válido');
            }

            const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
            downloadPDF(pdfBlob, `Muestra_${idMuestra}.pdf`);
        } catch (error: any) {
            console.error('Error al descargar PDF de muestra:', error);
            throw new Error(
                error.response?.data?.message || 
                error.message || 
                'No se pudo descargar el PDF de la muestra'
            );
        }
    },

    /**
     * Genera y obtiene el PDF de resultados de una muestra
     */
    async generarPDFResultados(idMuestra: string): Promise<void> {
        let preOpenedWindow: Window | null = null;
        try {
            preOpenedWindow = window.open('', '_blank');
            console.log('Generando PDF de resultados:', idMuestra);
            
            const response = await retryOperation(() => 
                axiosInstance({
                    url: API_URLS.RESULTADOS.GENERAR(idMuestra),
                    method: 'GET',
                    responseType: 'blob',
                    headers: getAuthHeaders()
                })
            );

            if (!isValidPDFResponse(response)) {
                throw new Error('La respuesta del servidor no es un PDF válido');
            }

            const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
            openPDFInNewWindow(pdfBlob, preOpenedWindow);
        } catch (error: any) {
            if (preOpenedWindow) preOpenedWindow.close();
            console.error('Error al generar PDF de resultados:', error);
            throw new Error(
                error.response?.data?.message || 
                error.message || 
                'No se pudo generar el PDF de resultados'
            );
        }
    },

    /**
     * Descarga el PDF de resultados de una muestra
     */
    async descargarPDFResultados(idMuestra: string): Promise<void> {
        try {
            console.log('Descargando PDF de resultados:', idMuestra);
            const response = await retryOperation(() => 
                axiosInstance({
                    url: API_URLS.RESULTADOS.DESCARGAR(idMuestra),
                    method: 'GET',
                    responseType: 'blob',
                    headers: getAuthHeaders()
                })
            );

            if (!isValidPDFResponse(response)) {
                throw new Error('La respuesta del servidor no es un PDF válido');
            }

            const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
            downloadPDF(pdfBlob, `Resultados_Muestra_${idMuestra}.pdf`);
        } catch (error: any) {
            console.error('Error al descargar PDF de resultados:', error);
            throw new Error(
                error.response?.data?.message || 
                error.message || 
                'No se pudo descargar el PDF de resultados'
            );
        }
    },
};