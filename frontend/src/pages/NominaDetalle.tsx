import React, { useEffect, useState } from 'react';
import { Download, Search, Filter, FileText } from 'lucide-react';
import { getNominaDetalle, getNominaPeriodos } from '../services/api';
import * as XLSX from 'xlsx';

interface Periodo {
    periodo: string;
    nombre_periodo: string;
}

interface DetalleItem {
    id: string;
    periodo: string;
    fecha: string;
    nombre_periodo: string;
    empleado: string;
    cedula: string;
    codigo: string;
    salario_bruto: number;
    total_deducciones: number;
    salario_neto: number;
}

const fmt = (v: number | null | undefined) => {
    if (v == null) return 'RD$ 0.00';
    return new Intl.NumberFormat('es-DO', {
        style: 'currency', currency: 'DOP', minimumFractionDigits: 2,
    }).format(v);
};

const NominaDetalle: React.FC = () => {
    const [data, setData] = useState<DetalleItem[]>([]);
    const [periodos, setPeriodos] = useState<Periodo[]>([]);
    const [selectedPeriodo, setSelectedPeriodo] = useState('');
    const [busqueda, setBusqueda] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async (periodo?: string) => {
        setLoading(true);
        setError(null);
        try {
            const res = await getNominaDetalle({ periodo: periodo || undefined });
            setData(res.data);
        } catch (err: any) {
            setError(err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getNominaPeriodos().then(r => setPeriodos(r.data)).catch(() => { });
        fetchData();
    }, []);

    const handlePeriodoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedPeriodo(e.target.value);
        fetchData(e.target.value || undefined);
    };

    const filtered = data.filter(row => {
        if (!busqueda) return true;
        const q = busqueda.toLowerCase();
        return (
            row.empleado?.toLowerCase().includes(q) ||
            row.cedula?.includes(q) ||
            row.codigo?.toLowerCase().includes(q)
        );
    });

    const exportExcel = () => {
        const rows = filtered.map(r => ({
            'Período': r.nombre_periodo,
            'Fecha': new Date(r.fecha).toLocaleDateString(),
            'Empleado': r.empleado,
            'Código': r.codigo,
            'Cédula': r.cedula,
            'Salario Bruto': r.salario_bruto,
            'Total Deducciones': r.total_deducciones,
            'Salario Neto': r.salario_neto,
        }));
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Detalle Nómina');
        XLSX.writeFile(wb, `detalle_nomina_${selectedPeriodo || 'todos'}.xlsx`);
    };

    return (
        <>
            <div className="filters-bar">
                <div className="filter-group">
                    <label className="filter-label">
                        <Filter size={10} style={{ display: 'inline', marginRight: 4 }} />
                        Período
                    </label>
                    <select className="filter-select" value={selectedPeriodo} onChange={handlePeriodoChange}>
                        <option value="">Todos los períodos</option>
                        {periodos.map((p, i) => (
                            <option key={i} value={p.periodo}>{p.nombre_periodo}</option>
                        ))}
                    </select>
                </div>

                <div className="filter-group">
                    <label className="filter-label">
                        <Search size={10} style={{ display: 'inline', marginRight: 4 }} />
                        Buscar empleado
                    </label>
                    <input
                        className="filter-input"
                        placeholder="Nombre, cédula, código..."
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                    />
                </div>

                <div style={{ marginLeft: 'auto', alignSelf: 'flex-end' }}>
                    <button className="btn btn-success btn-sm" onClick={exportExcel} disabled={filtered.length === 0}>
                        <Download size={14} />
                        Exportar Excel
                    </button>
                </div>
            </div>

            {error && <div className="error-box" style={{ marginBottom: 16 }}>{error}</div>}

            <div className="card">
                <div className="card-header">
                    <div>
                        <div className="card-title">Detalle de Nómina por Empleado</div>
                        <div className="card-subtitle">{filtered.length} registro(s) agrupado(s)</div>
                    </div>
                    <FileText size={18} style={{ color: 'var(--text-muted)' }} />
                </div>

                {loading ? (
                    <div className="loading-container">
                        <div className="spinner" />
                        <span>Cargando detalle de nómina...</span>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="empty-state">
                        <Search size={40} />
                        <p>No se encontraron registros</p>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Empleado</th>
                                    <th>Código</th>
                                    <th>Cédula</th>
                                    <th>Período</th>
                                    <th>Fecha</th>
                                    <th className="text-right">Salario Bruto</th>
                                    <th className="text-right">Deducciones</th>
                                    <th className="text-right">Neto a Pagar</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((row) => (
                                    <tr key={`${row.id}-${row.periodo}`}>
                                        <td className="highlight">{row.empleado}</td>
                                        <td style={{ fontFamily: 'monospace' }}>{row.codigo}</td>
                                        <td>{row.cedula}</td>
                                        <td><span className="badge badge-accent">{row.nombre_periodo}</span></td>
                                        <td>{new Date(row.fecha).toLocaleDateString()}</td>
                                        <td className="amount">{fmt(row.salario_bruto)}</td>
                                        <td className="amount negative">{fmt(row.total_deducciones)}</td>
                                        <td className="amount positive">{fmt(row.salario_neto)}</td>
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

export default NominaDetalle;
