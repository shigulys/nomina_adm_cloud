import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Search, FileSpreadsheet } from 'lucide-react';
import { getDetalleNominaEjecutada } from '../services/api';
import * as XLSX from 'xlsx';

interface DetalleLine {
    line_id: string;
    employee_id: string;
    benefit_discount_id: string;
    empleado: string;
    codigo: string;
    cedula: string;
    concepto: string;
    concepto_tipo_id: number;
    factor: number;
    tipo_movimiento: string;
    monto: number;
}

const DetalleNominaEjecutada: React.FC = () => {
    const { transId } = useParams<{ transId: string }>();
    const navigate = useNavigate();
    const [data, setData] = useState<DetalleLine[]>([]);
    const [busqueda, setBusqueda] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async () => {
        if (!transId) return;
        setLoading(true);
        setError(null);
        try {
            const res = await getDetalleNominaEjecutada(transId);
            setData(res.data);
        } catch (err: any) {
            setError(err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [transId]);

    const filtered = data.filter(row => {
        if (!busqueda) return true;
        const q = busqueda.toLowerCase();
        return (
            row.empleado?.toLowerCase().includes(q) ||
            row.cedula?.includes(q) ||
            row.codigo?.toLowerCase().includes(q) ||
            row.concepto?.toLowerCase().includes(q)
        );
    });

    const fmt = (v: number) => {
        return new Intl.NumberFormat('es-DO', {
            style: 'currency', currency: 'DOP', minimumFractionDigits: 2,
        }).format(v);
    };

    const exportExcel = () => {
        // 1. Agrupar por empleado
        const employees: Record<string, any> = {};
        const conceptsSet = new Set<string>();
        const conceptMetadata: Record<string, { type: number; factor: number }> = {};

        filtered.forEach(r => {
            const empKey = r.employee_id || r.empleado;
            if (!employees[empKey]) {
                employees[empKey] = {
                    'Código': r.codigo,
                    'Empleado': r.empleado,
                    'Cédula': r.cedula,
                    '_total_ingresos': 0,
                    '_total_deducciones': 0,
                };
            }

            const conceptName = r.concepto || 'S/N';
            employees[empKey][conceptName] = (employees[empKey][conceptName] || 0) + r.monto;

            if (r.factor === 1) {
                employees[empKey]._total_ingresos += r.monto;
            } else if (r.factor === -1) {
                employees[empKey]._total_deducciones += r.monto;
            }

            conceptsSet.add(conceptName);
            // Guardar metadata del concepto para ordenar columnas luego
            if (!conceptMetadata[conceptName]) {
                conceptMetadata[conceptName] = { type: r.concepto_tipo_id, factor: r.factor };
            }
        });

        // 2. Ordenar conceptos: Salarios (Tipo 0) -> Ingresos (Factor 1) -> Deducciones (Factor -1)
        const sortedConcepts = Array.from(conceptsSet).sort((a, b) => {
            const metaA = conceptMetadata[a];
            const metaB = conceptMetadata[b];

            // Tipo 0 (Salario) va primero
            if (metaA.type === 0 && metaB.type !== 0) return -1;
            if (metaB.type === 0 && metaA.type !== 0) return 1;

            // Factor 1 (Ingreso) va antes que -1 (Deducción)
            if (metaA.factor === 1 && metaB.factor === -1) return -1;
            if (metaB.factor === 1 && metaA.factor === -1) return 1;

            // Por nombre si son del mismo tipo/factor
            return a.localeCompare(b);
        });

        // 3. Construir filas finales para el Excel
        const rows = Object.values(employees).map(emp => {
            const row: any = {
                'Código': emp['Código'],
                'Empleado': emp.Empleado,
                'Cédula': emp['Cédula'],
            };

            // Agregar columnas de conceptos en orden
            sortedConcepts.forEach(c => {
                row[c] = emp[c] || 0;
            });

            // Totales al final
            row['Total Ingresos'] = emp._total_ingresos;
            row['Total Deducciones'] = emp._total_deducciones;
            row['Neto a Pagar'] = emp._total_ingresos - emp._total_deducciones;

            return row;
        });

        const ws = XLSX.utils.json_to_sheet(rows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Nómina Columnar');
        XLSX.writeFile(wb, `nomina_columnar_${transId?.substring(0, 8)}.xlsx`);
    };

    return (
        <>
            <div className="top-actions">
                <button className="btn btn-secondary btn-sm" onClick={() => navigate('/ejecutadas')}>
                    <ArrowLeft size={16} />
                    Volver al listado
                </button>
            </div>

            <div className="filters-bar">
                <div className="filter-group" style={{ flex: 1 }}>
                    <label className="filter-label">
                        <Search size={10} style={{ display: 'inline', marginRight: 4 }} />
                        Filtrar por empleado o concepto
                    </label>
                    <input
                        className="filter-input"
                        placeholder="Nombre, concepto, código..."
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
                        <div className="card-title">Desglose de Conceptos</div>
                        <div className="card-subtitle">{filtered.length} líneas encontradas en este documento</div>
                    </div>
                    <FileSpreadsheet size={18} style={{ color: 'var(--text-muted)' }} />
                </div>

                {loading ? (
                    <div className="loading-container">
                        <div className="spinner" />
                        <span>Cargando detalle transaccional...</span>
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="empty-state">
                        <Search size={40} />
                        <p>No se encontraron registros para esta nómina</p>
                    </div>
                ) : (
                    <div className="table-wrapper">
                        <table>
                            <thead>
                                <tr>
                                    <th>Empleado</th>
                                    <th>Concepto</th>
                                    <th>Tipo</th>
                                    <th className="text-right">Monto</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((row) => {
                                    const isLoan = row.benefit_discount_id?.toUpperCase() === '7AF20C81-A90E-4E06-1D2D-08DDDFFEC13C';
                                    return (
                                        <tr key={row.line_id} className={isLoan ? 'loan-row' : ''}>
                                            <td>
                                                <div className="employee-cell">
                                                    <div className="employee-name">{row.empleado}</div>
                                                    <div className="employee-meta">{row.codigo} • {row.cedula}</div>
                                                </div>
                                            </td>
                                            <td>{row.concepto || 'S/N'}</td>
                                            <td>
                                                <span className={`badge ${isLoan ? 'badge-warning' : (row.tipo_movimiento === 'Ingreso' ? 'badge-success' : 'badge-danger')}`}>
                                                    {row.tipo_movimiento}
                                                </span>
                                            </td>
                                            <td className={`amount ${isLoan ? 'warning' : (row.tipo_movimiento === 'Ingreso' ? 'positive' : 'negative')}`}>
                                                {fmt(row.monto)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <style>{`
                .top-actions {
                    margin-bottom: 20px;
                }
                .employee-cell {
                    display: flex;
                    flex-direction: column;
                }
                .employee-name {
                    font-weight: 600;
                    color: var(--primary-light);
                }
                .employee-meta {
                    font-size: 0.75rem;
                    color: var(--text-muted);
                }
                .badge-success {
                    background: rgba(34, 197, 94, 0.15);
                    color: #4ade80;
                }
                .badge-danger {
                    background: rgba(239, 68, 68, 0.15);
                    color: #f87171;
                }
                .badge-warning {
                    background: rgba(245, 158, 11, 0.15);
                    color: #fbbf24;
                }
                .loan-row {
                    background: rgba(245, 158, 11, 0.05) !important;
                }
                .amount.warning {
                    color: #fbbf24;
                }
            `}</style>
        </>
    );
};

export default DetalleNominaEjecutada;
