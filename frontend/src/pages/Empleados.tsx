import React, { useEffect, useState } from 'react';
import { Users, Search } from 'lucide-react';
import { getEmpleados } from '../services/api';

interface Empleado {
    Codigo: string;
    Nombre: string;
    Cedula: string;
}

const Empleados: React.FC = () => {
    const [data, setData] = useState<Empleado[]>([]);
    const [busqueda, setBusqueda] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [debouncedBusqueda, setDebouncedBusqueda] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedBusqueda(busqueda), 400);
        return () => clearTimeout(timer);
    }, [busqueda]);

    useEffect(() => {
        setLoading(true);
        setError(null);
        getEmpleados(debouncedBusqueda || undefined)
            .then(r => { setData(r.data); setLoading(false); })
            .catch(err => {
                setError(err.response?.data?.error || err.message);
                setLoading(false);
            });
    }, [debouncedBusqueda]);

    return (
        <>
            <div className="filters-bar" style={{ marginBottom: 16 }}>
                <div className="filter-group">
                    <label className="filter-label">
                        <Search size={10} style={{ display: 'inline', marginRight: 4 }} />
                        Buscar
                    </label>
                    <input
                        className="filter-input"
                        placeholder="Nombre, código, cédula..."
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                        style={{ minWidth: 260 }}
                    />
                </div>
            </div>

            {error && <div className="error-box" style={{ marginBottom: 16 }}>{error}</div>}

            <div className="card">
                <div className="card-header">
                    <div>
                        <div className="card-title">Maestro de Empleados</div>
                        <div className="card-subtitle">{data.length} empleado(s) encontrado(s)</div>
                    </div>
                    <Users size={18} style={{ color: 'var(--text-muted)' }} />
                </div>

                {loading ? (
                    <div className="loading-container">
                        <div className="spinner" />
                        <span>Cargando empleados...</span>
                    </div>
                ) : data.length === 0 ? (
                    <div className="empty-state">
                        <Users size={40} />
                        <p>No se encontraron empleados</p>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Código</th>
                                    <th>Nombre</th>
                                    <th>Cédula</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((emp, i) => (
                                    <tr key={emp.Codigo}>
                                        <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                                        <td className="highlight" style={{ fontFamily: 'monospace' }}>{emp.Codigo}</td>
                                        <td className="highlight">{emp.Nombre}</td>
                                        <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{emp.Cedula}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
};

export default Empleados;
