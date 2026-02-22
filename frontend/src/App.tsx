import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import { useLocation } from 'react-router-dom';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const NominaResumen = lazy(() => import('./pages/NominaResumen'));
const NominaDetalle = lazy(() => import('./pages/NominaDetalle'));
const Empleados = lazy(() => import('./pages/Empleados'));
const NominasEjecutadas = lazy(() => import('./pages/NominasEjecutadas'));
const DetalleNominaEjecutada = lazy(() => import('./pages/DetalleNominaEjecutada'));
const LoginPage = lazy(() => import('./pages/LoginPage'));

const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Dashboard', subtitle: 'Resumen ejecutivo de nómina' },
  '/resumen': { title: 'Resumen de Nómina', subtitle: 'Vista consolidada por período' },
  '/detalle': { title: 'Detalle de Nómina', subtitle: 'Desglose por empleado: ingresos y deducciones' },
  '/empleados': { title: 'Empleados', subtitle: 'Listado de empleados activos' },
  '/ejecutadas': { title: 'Nóminas Ejecutadas', subtitle: 'Documentos de nómina generados en ADM Cloud' },
};

const Topbar: React.FC = () => {
  const location = useLocation();
  const path = location.pathname;
  const { user } = useAuth();

  let info = pageTitles[path];
  if (!info && path.startsWith('/nomina/ejecutada/')) {
    info = { title: 'Detalle de Nómina Ejecutada', subtitle: 'Desglose transaccional por empleado y concepto' };
  }

  if (!info) info = { title: 'Nómina', subtitle: '' };

  return (
    <header className="topbar">
      <div className="topbar-title">
        <h1>{info.title}</h1>
        {info.subtitle && <p>{info.subtitle}</p>}
      </div>
      {user && (
        <div className="topbar-user">
          <div className="user-info">
            <span className="user-name">{user.fullName}</span>
            <span className="user-role">{user.role}</span>
          </div>
          <div className="user-avatar">
            {user.username.charAt(0).toUpperCase()}
          </div>
        </div>
      )}
    </header>
  );
};

const Fallback = () => (
  <div className="loading-container">
    <div className="spinner" />
    <span>Cargando...</span>
  </div>
);

const AppLayout: React.FC = () => {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Topbar />
        <main className="page-content">
          <Suspense fallback={<Fallback />}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/resumen" element={<NominaResumen />} />
              <Route path="/detalle" element={<NominaDetalle />} />
              <Route path="/empleados" element={<Empleados />} />
              <Route path="/ejecutadas" element={<NominasEjecutadas />} />
              <Route path="/nomina/ejecutada/:transId" element={<DetalleNominaEjecutada />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<Fallback />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/*" element={<AppLayout />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
