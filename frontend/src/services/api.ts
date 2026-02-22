import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3003/api',
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
});

// Interceptor para agregar el token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Interceptor para errores
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expirado o inválido
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
    }
);

// ===== AUTHENTICATION =====
export const login = (credentials: any) => api.post('/auth/login', credentials);
export const getMe = () => api.get('/auth/me');

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
