import axios from 'axios';

const BASE_URL = 'http://localhost:3002/api';

const api = axios.create({
    baseURL: BASE_URL,
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
});

// Interceptor para errores
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);

// ===== ENDPOINTS =====

export const testConnection = () => api.get('/test');

export const getTablasDB = () => api.get('/tablas');

export const getEmpleados = (busqueda?: string) =>
    api.get('/empleados', { params: { busqueda } });

export const getNominaPeriodos = () => api.get('/nomina/periodos');

export const getNominaResumen = (periodo?: string) =>
    api.get('/nomina/resumen', { params: { periodo } });

export const getNominaDetalle = (params?: { periodo?: string; busqueda?: string }) =>
    api.get('/nomina/detalle', { params });

export const getKpis = () => api.get('/nomina/kpis');

// ===== NÓMINAS EJECUTADAS =====
export const getNominasEjecutadas = (busqueda?: string) =>
    api.get('/nomina/ejecutadas', { params: { busqueda } });

export const getDetalleNominaEjecutada = (transId: string) =>
    api.get(`/nomina/ejecutadas/${transId}`);

export default api;
