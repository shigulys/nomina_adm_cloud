import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, FileText, List, Users, Database, History, LogOut
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard', key: 'dashboard' },
    { to: '/ejecutadas', icon: History, label: 'Nóminas Ejecutadas', key: 'ejecutadas' },
    { to: '/resumen', icon: FileText, label: 'Resumen Nómina', key: 'resumen' },
    { to: '/detalle', icon: List, label: 'Detalle Nómina', key: 'detalle' },
    { to: '/empleados', icon: Users, label: 'Empleados', key: 'empleados' },
];

const Sidebar: React.FC = () => {
    const location = useLocation();
    const { user, logout } = useAuth();

    const filteredItems = navItems.filter(item =>
        user?.permissions?.includes(item.key) || user?.role === 'Admin'
    );

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <Database className="logo-icon" />
                <div className="logo-text">
                    <span className="logo-main">ADM</span>
                    <span className="logo-sub">Payroll</span>
                </div>
            </div>

            <nav className="sidebar-nav">
                <div className="nav-section">Menú Principal</div>
                {filteredItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                    >
                        <item.icon size={20} />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="sidebar-footer">
                <button onClick={logout} className="nav-item btn-logout" style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
                    <LogOut size={20} />
                    <span>Cerrar Sesión</span>
                </button>
                <div className="footer-status">
                    <div className="status-indicator"></div>
                    <span>Conectado a Azure SQL</span>
                </div>
            </div>

            <style>{`
                .btn-logout:hover {
                    background: rgba(239, 68, 68, 0.1) !important;
                    color: #ef4444 !important;
                }
            `}</style>
        </aside>
    );
};

export default Sidebar;
