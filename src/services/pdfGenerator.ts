import axios from 'axios';

// ----- URLs para las peticiones -----
const BASE_URLS = {
    // Usar URL local para desarrollo
    MUESTRAS: "https://backend-registro-muestras.onrender.com/api",
};

const API_URLS = {
    MUESTRAS: {
        // Endpoints para PDF de muestras
        GENERAR: (idMuestra: string) => `${BASE_URLS.MUESTRAS}/firma-digital/generar-pdf/${idMuestra}`,
    },
    RESULTADOS: {
        // Endpoints para PDF de resultados
        GENERAR: (idMuestra: string) => `${BASE_URLS.MUESTRAS}/ingreso-resultados/${idMuestra}/pdf`,
        DESCARGAR: (idMuestra: string) => `${BASE_URLS.MUESTRAS}/ingreso-resultados/${idMuestra}/pdf/download`,
    }
};

/**
 * Obtiene el token de autenticación del localStorage y los headers necesarios
 */
const getAuthHeaders = () => ({
    'Accept': 'application/pdf',
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
});

/**
 * Verifica si la respuesta es un PDF válido
 */
const isValidPDFResponse = (response: any): boolean => {
    const contentType = response.headers['content-type'];
    // Solo valida que sea PDF y que haya datos
    return contentType && contentType.includes('application/pdf') && response.data;
};

/**
 * Maneja la visualización de un PDF en una nueva ventana (ventana pre-abierta)
 */
const openPDFInNewWindow = (pdfBlob: Blob, preOpenedWindow?: Window | null): void => {
    const pdfUrl = window.URL.createObjectURL(pdfBlob);
    const win = preOpenedWindow || window.open('', '_blank');
    if (win) {
        win.location.href = pdfUrl;
        setTimeout(() => {
            window.URL.revokeObjectURL(pdfUrl);
        }, 100);
    } else {
        // Si el navegador bloqueó la ventana, descarga
        downloadPDF(pdfBlob, 'resultados.pdf');
    }
};

/**
 * Maneja la descarga de un PDF
 */
const downloadPDF = (pdfBlob: Blob, filename: string): void => {
    const downloadUrl = window.URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
        window.URL.revokeObjectURL(downloadUrl);
    }, 100);
};

/**
 * Servicio para manejar la generación y descarga de PDFs
 */
export const PDFService = {
    /**
     * Genera y obtiene el PDF de una muestra (sin resultados)
     */
    async generarPDFMuestra(idMuestra: string): Promise<void> {
        try {
            console.log('Generando PDF de muestra:', idMuestra);
            const response = await axios({
                url: API_URLS.MUESTRAS.GENERAR(idMuestra),
                method: 'GET',
                responseType: 'blob',
                headers: getAuthHeaders()
            });

            if (!isValidPDFResponse(response)) {
                throw new Error('La respuesta del servidor no es un PDF válido');
            }

            const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
            openPDFInNewWindow(pdfBlob);
        } catch (error: any) {
            console.error('Error al generar PDF de muestra:', error);
            throw new Error(
                error.response?.data?.message || 
                error.response?.statusText || 
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
            const response = await axios({
                url: API_URLS.MUESTRAS.GENERAR(idMuestra),
                method: 'GET',
                responseType: 'blob',
                headers: getAuthHeaders()
            });

            if (!isValidPDFResponse(response)) {
                throw new Error('La respuesta del servidor no es un PDF válido');
            }

            const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
            downloadPDF(pdfBlob, `Muestra_${idMuestra}.pdf`);
        } catch (error: any) {
            console.error('Error al descargar PDF de muestra:', error);
            throw new Error(
                error.response?.data?.message || 
                error.response?.statusText || 
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
            // Abrir la ventana antes de la petición para evitar bloqueo
            preOpenedWindow = window.open('', '_blank');
            console.log('Generando PDF de resultados:', idMuestra);
            const response = await axios({
                url: API_URLS.RESULTADOS.GENERAR(idMuestra),
                method: 'GET',
                responseType: 'blob',
                headers: getAuthHeaders()
            });

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
                error.response?.statusText || 
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
            const response = await axios({
                url: API_URLS.RESULTADOS.DESCARGAR(idMuestra),
                method: 'GET',
                responseType: 'blob',
                headers: getAuthHeaders()
            });

            if (!isValidPDFResponse(response)) {
                throw new Error('La respuesta del servidor no es un PDF válido');
            }

            const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
            downloadPDF(pdfBlob, `Resultados_Muestra_${idMuestra}.pdf`);
        } catch (error: any) {
            console.error('Error al descargar PDF de resultados:', error);
            throw new Error(
                error.response?.data?.message || 
                error.response?.statusText || 
                'No se pudo descargar el PDF de resultados'
            );
        }
    },
};
