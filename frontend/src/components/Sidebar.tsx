import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, FileText, List, Users, Database, History
} from 'lucide-react';

const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/ejecutadas', icon: History, label: 'Nóminas Ejecutadas' },
    { to: '/resumen', icon: FileText, label: 'Resumen Nómina' },
    { to: '/detalle', icon: List, label: 'Detalle Nómina' },
    { to: '/empleados', icon: Users, label: 'Empleados' },
];

const Sidebar: React.FC = () => {
    const location = useLocation();

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
                {navItems.map((item) => (
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
                <div className="footer-status">
                    <div className="status-indicator"></div>
                    <span>Conectado a Azure SQL</span>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
