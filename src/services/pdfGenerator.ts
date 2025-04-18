import axios from 'axios';

// ----- URLs para las peticiones -----
const BASE_URLS = {
    MUESTRAS: "https://backend-registro-muestras.onrender.com/api",
};

const API_URLS = {
    MUESTRAS: `${BASE_URLS.MUESTRAS}/firma-digital`,
    FIRMAS: {
        GENERAR: (idMuestra: string) => `${BASE_URLS.MUESTRAS}/firma-digital/generar-pdf/${idMuestra}`,
        PREVIEW: (idMuestra: string) => `${BASE_URLS.MUESTRAS}/firma-digital/pdfs/${idMuestra}`,
    }
};

/**
 * Obtiene el token de autenticación del localStorage
 */
const getAuthHeaders = () => ({
    'Accept': 'application/pdf',
    'Authorization': `Bearer ${localStorage.getItem('token')}`
});

/**
 * Servicio para manejar la generación y descarga de PDFs de muestras
 */
export const PDFService = {
    /**
     * Genera y obtiene el PDF de una muestra
     * @param idMuestra - ID de la muestra
     */
    async generarPDFMuestra(idMuestra: string): Promise<void> {
        try {
            const response = await axios({
                url: API_URLS.FIRMAS.GENERAR(idMuestra),
                method: 'GET',
                responseType: 'blob',
                headers: getAuthHeaders()
            });

            // Crear URL del blob
            const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
            const pdfUrl = window.URL.createObjectURL(pdfBlob);

            // Abrir el PDF en una nueva pestaña
            window.open(pdfUrl, '_blank');

            // Limpiar la URL del blob después de un tiempo
            setTimeout(() => {
                window.URL.revokeObjectURL(pdfUrl);
            }, 100);

        } catch (error) {
            console.error('Error al generar PDF:', error);
            throw new Error('No se pudo generar el PDF de la muestra. Verifique su conexión y permisos.');
        }
    },

    /**
     * Descarga el PDF de una muestra
     * @param idMuestra - ID de la muestra
     */
    async descargarPDFMuestra(idMuestra: string): Promise<void> {
        try {
            const response = await axios({
                url: API_URLS.FIRMAS.GENERAR(idMuestra),
                method: 'GET',
                responseType: 'blob',
                headers: getAuthHeaders()
            });

            // Crear el blob y el link de descarga
            const pdfBlob = new Blob([response.data], { type: 'application/pdf' });
            const downloadUrl = window.URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = `Muestra_${idMuestra}.pdf`;

            // Simular click para descargar
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            // Limpiar la URL
            setTimeout(() => {
                window.URL.revokeObjectURL(downloadUrl);
            }, 100);

        } catch (error) {
            console.error('Error al descargar PDF:', error);
            throw new Error('No se pudo descargar el PDF de la muestra. Verifique su conexión y permisos.');
        }
    },

    /**
     * Previsualiza el PDF en el navegador
     * @param idMuestra - ID de la muestra
     * @returns URL para previsualizar el PDF
     */
    getPDFPreviewUrl(idMuestra: string): string {
        const token = localStorage.getItem('token');
        return `${API_URLS.FIRMAS.PREVIEW(idMuestra)}?token=${token}`;
    }
};

