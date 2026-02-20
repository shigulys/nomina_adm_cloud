import React, { useEffect, useState } from 'react';
import { FileText, Download, Search, Filter } from 'lucide-react';
import { getNominaResumen, getNominaPeriodos } from '../services/api';
import * as XLSX from 'xlsx';

interface Periodo {
    periodo: string;
    nombre_periodo: string;
}

interface ResumenItem {
    periodo: string;
    fecha: string;
    nombre_periodo: string;
    total_empleados: number;
    total_bruto: number;
    total_deducciones: number;
    total_neto: number;
}

const fmt = (v: number | null | undefined) => {
    if (v == null) return 'RD$ 0.00';
    return new Intl.NumberFormat('es-DO', {
        style: 'currency', currency: 'DOP', minimumFractionDigits: 2,
    }).format(v);
};

const NominaResumen: React.FC = () => {
    const [data, setData] = useState<ResumenItem[]>([]);
    const [periodos, setPeriodos] = useState<Periodo[]>([]);
    const [selectedPeriodo, setSelectedPeriodo] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async (periodo?: string) => {
        setLoading(true);
        setError(null);
        try {
            const res = await getNominaResumen(periodo || undefined);
            setData(res.data);
        } catch (err: any) {
            setError(err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        getNominaPeriodos()
            .then(r => setPeriodos(r.data))
            .catch(() => { });
        fetchData();
    }, []);

    const handlePeriodoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedPeriodo(e.target.value);
        fetchData(e.target.value || undefined);
    };

    const exportExcel = () => {
        const rows = data.map(r => ({
            'Período': r.nombre_periodo,
            'Fecha': new Date(r.fecha).toLocaleDateString(),
            'Total Empleados': r.total_empleados,
            'Salario Bruto': r.total_bruto,
            'Deducciones': r.total_deducciones,
            'Salario Neto': r.total_neto,
        }));
        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Resumen Nómina');
        XLSX.writeFile(wb, `resumen_nomina_${selectedPeriodo || 'todos'}.xlsx`);
    };

    const totalBruto = data.reduce((s, r) => s + (r.total_bruto || 0), 0);
    const totalDeducciones = data.reduce((s, r) => s + (r.total_deducciones || 0), 0);
    const totalNeto = data.reduce((s, r) => s + (r.total_neto || 0), 0);

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

                <div style={{ marginLeft: 'auto' }}>
                    <button className="btn btn-success btn-sm" onClick={exportExcel} disabled={data.length === 0}>
                        <Download size={14} />
                        Exportar Excel
                    </button>
                </div>
            </div>

            {error && <div className="error-box" style={{ marginBottom: 16 }}>{error}</div>}

            <div className="card">
                <div className="card-header">
                    <div>
                        <div className="card-title">Resumen de Nómina por Período</div>
                        <div className="card-subtitle">{data.length} período(s) encontrado(s)</div>
                    </div>
                    <FileText size={18} style={{ color: 'var(--text-muted)' }} />
                </div>

                {loading ? (
                    <div className="loading-container">
                        <div className="spinner" />
                        <span>Cargando resumen...</span>
                    </div>
                ) : data.length === 0 ? (
                    <div className="empty-state">
                        <Search size={40} />
                        <p>No se encontraron datos</p>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Período</th>
                                    <th>Fecha</th>
                                    <th className="text-right">Empleados</th>
                                    <th className="text-right">Salario Bruto</th>
                                    <th className="text-right">Deducciones</th>
                                    <th className="text-right">Salario Neto</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((row, i) => (
                                    <tr key={i}>
                                        <td className="highlight">{row.nombre_periodo}</td>
                                        <td>{new Date(row.fecha).toLocaleDateString()}</td>
                                        <td className="amount">{row.total_empleados}</td>
                                        <td className="amount">{fmt(row.total_bruto)}</td>
                                        <td className="amount negative">{fmt(row.total_deducciones)}</td>
                                        <td className="amount positive">{fmt(row.total_neto)}</td>
                                    </tr>
                                ))}
                            </tbody>
                            {data.length > 1 && (
                                <tfoot>
                                    <tr className="table-footer">
                                        <td colSpan={2}><strong>TOTAL GENERAL</strong></td>
                                        <td className="amount"><strong>{fmt(totalBruto)}</strong></td>
                                        <td className="amount negative"><strong>{fmt(totalDeducciones)}</strong></td>
                                        <td className="amount positive"><strong>{fmt(totalNeto)}</strong></td>
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                )}
            </div>
        </>
    );
};

export default NominaResumen;
