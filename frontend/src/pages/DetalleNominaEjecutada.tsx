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
    company_paid: number;
    Proyecto?: string;
    fecha_aplicacion?: string;
    referencia?: string;
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
        // Excluir de la vista tabla si el monto es 0 o es pagado por la empresa
        if (row.monto === 0) return false;
        if (row.company_paid === 1) return false;

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
        const generateRows = (lines: DetalleLine[], includeTotals: boolean = true) => {
            const employees: Record<string, any> = {};
            const conceptsSet = new Set<string>();
            const conceptMetadata: Record<string, { type: number; factor: number }> = {};

            lines.forEach(r => {
                const empKey = r.employee_id || r.empleado;
                if (!employees[empKey]) {
                    employees[empKey] = {
                        'Código': r.codigo,
                        'Empleado': r.empleado,
                        'Cédula': r.cedula,
                        'Fecha': r.fecha_aplicacion ? new Date(r.fecha_aplicacion).toLocaleDateString() : '',
                        'Referencia': r.referencia || '',
                        '_total_ingresos': 0,
                        '_total_deducciones': 0,
                        'Proyecto': r.Proyecto || '',
                    };
                }

                const conceptName = r.concepto || 'S/N';
                employees[empKey][conceptName] = (employees[empKey][conceptName] || 0) + r.monto;

                // Solo sumar a los totales si NO es pagado por la empresa
                if (r.company_paid !== 1) {
                    if (r.factor === 1) {
                        employees[empKey]._total_ingresos += r.monto;
                    } else if (r.factor === -1) {
                        employees[empKey]._total_deducciones += r.monto;
                    }
                }

                conceptsSet.add(conceptName);
                if (!conceptMetadata[conceptName]) {
                    conceptMetadata[conceptName] = { type: r.concepto_tipo_id, factor: r.factor };
                }
            });

            const sortedConcepts = Array.from(conceptsSet).sort((a, b) => {
                const metaA = conceptMetadata[a];
                const metaB = conceptMetadata[b];

                // Prioridad 1: Tipo 0 (Sueldo Base u otro fundamental si existe, aunque no parece usarse explícitamente así aquí)
                if (metaA.type === 0 && metaB.type !== 0) return -1;
                if (metaB.type === 0 && metaA.type !== 0) return 1;

                // Prioridad 2: Ingresos antes que Deducciones
                if (metaA.factor === 1 && metaB.factor === -1) return -1;
                if (metaB.factor === 1 && metaA.factor === -1) return 1;

                // Prioridad 3: Conceptos que contienen "Salario" primero dentro de su grupo (Ingresos/Deducciones)
                const isSalarioA = a.toLowerCase().includes('salario');
                const isSalarioB = b.toLowerCase().includes('salario');
                if (isSalarioA && !isSalarioB) return -1;
                if (!isSalarioA && isSalarioB) return 1;

                // Por defecto: Alfabético
                return a.localeCompare(b);
            });

            return Object.values(employees).map(emp => {
                const row: any = {
                    'Código': emp['Código'],
                    'Empleado': emp.Empleado,
                    'Cédula': emp['Cédula'],
                    'Fecha': emp['Fecha'],
                    'Referencia': emp['Referencia'],
                    'Proyecto': emp.Proyecto,
                };
                sortedConcepts.forEach(c => {
                    row[c] = emp[c] || 0;
                });
                if (includeTotals) {
                    row['Total Ingresos'] = emp._total_ingresos;
                    row['Total Deducciones'] = emp._total_deducciones;
                    row['Neto a Pagar'] = emp._total_ingresos - emp._total_deducciones;
                }
                return row;
            });
        };

        // 1. Separar datos
        const principalLines = data.filter(r => r.monto !== 0 && r.company_paid === 0);
        const analysisLines = data.filter(r => r.company_paid === 1);

        // 2. Generar filas para cada hoja
        const principalRows = generateRows(principalLines, true);
        const analysisRows = generateRows(analysisLines, false);

        // 3. Crear el libro y agregar las hojas
        const wb = XLSX.utils.book_new();

        if (principalRows.length > 0) {
            const wsPrincipal = XLSX.utils.json_to_sheet(principalRows);
            XLSX.utils.book_append_sheet(wb, wsPrincipal, 'Nómina Principal');
        }

        if (analysisRows.length > 0) {
            const wsAnalysis = XLSX.utils.json_to_sheet(analysisRows);
            XLSX.utils.book_append_sheet(wb, wsAnalysis, 'Análisis - Otros Conceptos');
        }

        // 4. Guardar archivo
        XLSX.writeFile(wb, `nomina_detallada_${transId?.substring(0, 8)}.xlsx`);
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
                    <button className="btn btn-success btn-sm" onClick={exportExcel} disabled={data.length === 0}>
                        <Download size={14} />
                        Exportar Excel Completo
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
                                    <th>Proyecto</th>
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
                                                </div>
                                            </td>
                                            <td><span className="badge badge-accent" style={{ fontSize: '0.7rem' }}>{row.Proyecto || 'S/P'}</span></td>
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
