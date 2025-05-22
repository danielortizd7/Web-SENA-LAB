import axios, { AxiosError } from 'axios';

const BASE_URL = "https://backend-registro-muestras.onrender.com/api";

const API_URLS = {
    FIRMA_DIGITAL: {
        GENERAR_PDF: (idMuestra: string) => `${BASE_URL}/firma-digital/generar-pdf/${idMuestra}`,
    },
    RESULTADOS: {
        GENERAR: (idMuestra: string) => `${BASE_URL}/ingreso-resultados/${idMuestra}/pdf`,
        DESCARGAR: (idMuestra: string) => `${BASE_URL}/ingreso-resultados/${idMuestra}/pdf/download`,
    },
    AUDITORIA: {
        EXPORTAR_EXCEL: `${BASE_URL}/auditoria/exportar-excel`,
        EXPORTAR_EXCEL_VISUALIZAR: `${BASE_URL}/auditoria/exportar-excel-visualizar`,
        SEMANALES: `${BASE_URL}/auditoria/semanales`,
        MENSUALES: `${BASE_URL}/auditoria/mensuales`,
        DATOS: `${BASE_URL}/auditoria/datos`,
        HISTORIAL_PARAMETRO: `${BASE_URL}/auditoria/historial-parametro`,
        MUESTRA_DETALLE: `${BASE_URL}/auditoria/muestra-detalle`,
        ESTADISTICAS_ANALISIS: `${BASE_URL}/auditoria/estadisticas-analisis`,
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
 * Maneja la visualización de un Excel en una nueva ventana
 */
const openExcelInNewWindow = (excelBlob: Blob, preOpenedWindow?: Window | null): void => {
    try {
        const excelUrl = window.URL.createObjectURL(excelBlob);
        const win = preOpenedWindow || window.open('', '_blank');
        
        if (win) {
            win.location.href = excelUrl;
            setTimeout(() => {
                window.URL.revokeObjectURL(excelUrl);
            }, 1000);
        } else {
            throw new Error('No se pudo abrir la ventana');
        }
    } catch (error) {
        console.error('Error al abrir Excel:', error);
        downloadExcel(excelBlob, 'auditoria.xlsx');
    }
};

/**
 * Maneja la descarga de un Excel
 */
const downloadExcel = (excelBlob: Blob, filename: string): void => {
    try {
        const downloadUrl = window.URL.createObjectURL(excelBlob);
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
        console.error('Error al descargar Excel:', error);
        throw new Error('No se pudo descargar el Excel');
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

/**
 * Servicio para manejar la generación y exportación de datos de auditoría
 */
export const excelGenerator = {
    async obtenerDatosAuditoria() {
        try {
            const response = await axiosInstance({
                url: API_URLS.AUDITORIA.DATOS,
                method: 'GET',
                headers: getAuthHeaders()
            });
            return response.data;
        } catch (error: any) {
            throw new Error(
                error.response?.data?.message || 
                error.message || 
                'No se pudieron obtener los datos de auditoría'
            );
        }
    },

    async obtenerHistorialParametro(parametroId: string, fechaInicio?: string, fechaFin?: string) {
        try {
            const response = await axiosInstance({
                url: `${API_URLS.AUDITORIA.HISTORIAL_PARAMETRO}/${parametroId}`,
                method: 'GET',
                params: { fechaInicio, fechaFin },
                headers: getAuthHeaders()
            });
            return response.data;
        } catch (error: any) {
            throw new Error(
                error.response?.data?.message || 
                error.message || 
                'No se pudo obtener el historial del parámetro'
            );
        }
    },

    async obtenerMuestraDetalle(muestraId: string) {
        try {
            const response = await axiosInstance({
                url: `${API_URLS.AUDITORIA.MUESTRA_DETALLE}/${muestraId}`,
                method: 'GET',
                headers: getAuthHeaders()
            });
            return response.data;
        } catch (error: any) {
            throw new Error(
                error.response?.data?.message || 
                error.message || 
                'No se pudo obtener el detalle de la muestra'
            );
        }
    },

    async generarExcelAuditoria(tipo: 'download' | 'view' = 'download', periodo: string = 'general', fechaInicio?: string, fechaFin?: string) {
        let preOpenedWindow: Window | null = null;
        try {
            let url = API_URLS.AUDITORIA.EXPORTAR_EXCEL;
            
            if (tipo === 'view') {
                url = API_URLS.AUDITORIA.EXPORTAR_EXCEL_VISUALIZAR;
                preOpenedWindow = window.open('', '_blank');
            }
            
            if (fechaInicio && fechaFin) {
                url += `?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`;
            }

            const response = await retryOperation(() => 
                axiosInstance({
                    url,
                    method: 'GET',
                    responseType: 'blob',
                    headers: {
                        ...getAuthHeaders(),
                        'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                    }
                })
            );

            if (!response.data) {
                throw new Error('No se recibió el archivo Excel');
            }

            const excelBlob = new Blob([response.data], { 
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
            });

            if (tipo === 'view') {
                openExcelInNewWindow(excelBlob, preOpenedWindow);
            } else {
                downloadExcel(excelBlob, `auditoria_${periodo}.xlsx`);
            }
        } catch (error: any) {
            if (preOpenedWindow) preOpenedWindow.close();
            console.error('Error al generar Excel de auditoría:', error);
            throw new Error(
                error.response?.data?.message || 
                error.message || 
                'No se pudo generar el Excel de auditoría'
            );
        }
    },

    async obtenerAuditoriasSemanales(fechaInicio: string, fechaFin: string) {
        try {
            const response = await axiosInstance({
                url: `${API_URLS.AUDITORIA.SEMANALES}?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`,
                method: 'GET',
                headers: getAuthHeaders()
            });
            return response.data;
        } catch (error: any) {
            throw new Error(
                error.response?.data?.message || 
                error.message || 
                'No se pudieron obtener las auditorías semanales'
            );
        }
    },

    async obtenerAuditoriasMensuales(fechaInicio: string, fechaFin: string) {
        try {
            const response = await axiosInstance({
                url: `${API_URLS.AUDITORIA.MENSUALES}?fechaInicio=${fechaInicio}&fechaFin=${fechaFin}`,
                method: 'GET',
                headers: getAuthHeaders()
            });
            return response.data;
        } catch (error: any) {
            throw new Error(
                error.response?.data?.message || 
                error.message || 
                'No se pudieron obtener las auditorías mensuales'
            );
        }
    },

    async obtenerEstadisticasAnalisis() {
        try {
            const response = await axiosInstance({
                url: API_URLS.AUDITORIA.ESTADISTICAS_ANALISIS,
                method: 'GET',
                headers: getAuthHeaders()
            });
            return response.data;
        } catch (error: any) {
            console.error('Error al obtener estadísticas:', error);
            throw new Error(
                error.response?.data?.message || 
                error.message || 
                'No se pudieron obtener las estadísticas de análisis'
            );
        }
    }
};