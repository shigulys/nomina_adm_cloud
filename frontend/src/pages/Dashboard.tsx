import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import {
    Users, DollarSign, TrendingUp, MinusCircle,
    Calendar, Database, AlertCircle
} from 'lucide-react';
import { getKpis, getNominaResumen } from '../services/api';

interface Kpis {
    empleados_activos: number;
    ultimo_periodo: string;
    total_neto_ultimo: number;
    total_bruto_ultimo: number;
    total_deducciones_ultimo: number;
}

interface ResumenItem {
    periodo: string;
    nombre_periodo: string;
    total_empleados: number;
    total_bruto: number;
    total_deducciones: number;
    total_neto: number;
}

const formatCurrency = (v: number | null | undefined) => {
    if (v == null) return 'RD$ 0.00';
    return new Intl.NumberFormat('es-DO', {
        style: 'currency', currency: 'DOP', minimumFractionDigits: 2,
    }).format(v);
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div style={{
                background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 8, padding: '10px 14px', fontSize: 12,
            }}>
                <p style={{ color: '#94a3b8', marginBottom: 4 }}>{label}</p>
                {payload.map((p: any) => (
                    <p key={p.name} style={{ color: p.color, fontWeight: 600 }}>
                        {p.name}: {formatCurrency(p.value)}
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

const Dashboard: React.FC = () => {
    const [kpis, setKpis] = useState<Kpis | null>(null);
    const [chartData, setChartData] = useState<ResumenItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [kpisRes, resumenRes] = await Promise.all([
                    getKpis(),
                    getNominaResumen(),
                ]);
                setKpis(kpisRes.data);
                setChartData(resumenRes.data.slice(0, 6).reverse());
            } catch (err: any) {
                setError(err.response?.data?.error || err.message || 'Error al cargar datos');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner" />
                <span>Cargando datos de nómina...</span>
            </div>
        );
    }

    return (
        <>
            {error && (
                <div className="error-box" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <AlertCircle size={16} />
                    <strong>Error de conexión:</strong> {error}
                </div>
            )}

            <div className="kpi-grid">
                <div className="kpi-card accent">
                    <div className="kpi-icon accent">
                        <Users size={20} />
                    </div>
                    <div className="kpi-value">{kpis?.empleados_activos ?? '—'}</div>
                    <div className="kpi-label">Empleados Activos</div>
                </div>

                <div className="kpi-card success">
                    <div className="kpi-icon success">
                        <DollarSign size={20} />
                    </div>
                    <div className="kpi-value">{formatCurrency(kpis?.total_neto_ultimo)}</div>
                    <div className="kpi-label">Neto Pagado — Último Período</div>
                </div>

                <div className="kpi-card warning">
                    <div className="kpi-icon warning">
                        <TrendingUp size={20} />
                    </div>
                    <div className="kpi-value">{formatCurrency(kpis?.total_bruto_ultimo)}</div>
                    <div className="kpi-label">Bruto — Último Período</div>
                </div>

                <div className="kpi-card danger">
                    <div className="kpi-icon danger">
                        <MinusCircle size={20} />
                    </div>
                    <div className="kpi-value">{formatCurrency(kpis?.total_deducciones_ultimo)}</div>
                    <div className="kpi-label">Deducciones — Último Período</div>
                </div>
            </div>

            {kpis?.ultimo_periodo && (
                <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Período más reciente:</span>
                    <span className="periodo-badge">{kpis.ultimo_periodo}</span>
                </div>
            )}

            <div className="dashboard-grid">
                <div className="card">
                    <div className="card-header">
                        <div>
                            <div className="card-title">Evolución de Nómina</div>
                            <div className="card-subtitle">Últimos 6 períodos — bruto vs neto</div>
                        </div>
                    </div>
                    {chartData.length > 0 ? (
                        <div className="chart-container">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                    <XAxis
                                        dataKey="nombre_periodo"
                                        tick={{ fill: '#64748b', fontSize: 10 }}
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(v: string) => v.substring(0, 3).toUpperCase()}
                                    />
                                    <YAxis
                                        tick={{ fill: '#64748b', fontSize: 10 }}
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="total_bruto" name="Bruto" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="total_neto" name="Neto" fill="#10b981" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="empty-state">
                            <Database size={40} />
                            <p>Sin datos de períodos anteriores</p>
                        </div>
                    )}
                </div>

                <div className="card">
                    <div className="card-header">
                        <div>
                            <div className="card-title">Resumen por Período</div>
                            <div className="card-subtitle">Últimos 6 períodos</div>
                        </div>
                    </div>
                    {chartData.length > 0 ? (
                        <div className="table-wrapper">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Período</th>
                                        <th>Empl.</th>
                                        <th className="text-right">Neto</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[...chartData].reverse().map((row, i) => (
                                        <tr key={i}>
                                            <td className="highlight">{row.nombre_periodo}</td>
                                            <td>{row.total_empleados}</td>
                                            <td className="amount positive">{formatCurrency(row.total_neto)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="empty-state">
                            <p>No hay datos disponibles</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default Dashboard;
