import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const NominaResumen = lazy(() => import('./pages/NominaResumen'));
const NominaDetalle = lazy(() => import('./pages/NominaDetalle'));
const Empleados = lazy(() => import('./pages/Empleados'));
const NominasEjecutadas = lazy(() => import('./pages/NominasEjecutadas'));
const DetalleNominaEjecutada = lazy(() => import('./pages/DetalleNominaEjecutada'));

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

  // Manejar rutas con parámetros
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
    </header>
  );
};

const Fallback = () => (
  <div className="loading-container">
    <div className="spinner" />
    <span>Cargando...</span>
  </div>
);

function App() {
  return (
    <BrowserRouter>
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
              </Routes>
            </Suspense>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
