import React, { useEffect, useState } from 'react';
import { Calendar, FileText, ChevronRight, Search, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getNominasEjecutadas } from '../services/api';

interface NominaEjecutada {
    id: string;
    doc_id: string;
    fecha: string;
    referencia: string;
    fecha_creacion: string;
    tipo_nomina: string;
}

const NominasEjecutadas: React.FC = () => {
    const [data, setData] = useState<NominaEjecutada[]>([]);
    const [busqueda, setBusqueda] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await getNominasEjecutadas(busqueda || undefined);
            setData(res.data);
        } catch (err: any) {
            setError(err.response?.data?.error || err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        fetchData();
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('es-DO', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <>
            <div className="filters-bar">
                <form onSubmit={handleSearch} style={{ display: 'flex', gap: '12px', width: '100%' }}>
                    <div className="filter-group" style={{ flex: 1 }}>
                        <label className="filter-label">
                            <Search size={10} style={{ display: 'inline', marginRight: 4 }} />
                            Buscar nómina
                        </label>
                        <input
                            className="filter-input"
                            placeholder="Referencia o tipo de nómina..."
                            value={busqueda}
                            onChange={e => setBusqueda(e.target.value)}
                        />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-end' }}>
                        Buscar
                    </button>
                </form>
            </div>

            {error && <div className="error-box" style={{ marginBottom: 16 }}>{error}</div>}

            <div className="card">
                <div className="card-header">
                    <div>
                        <div className="card-title">Nóminas Ejecutadas</div>
                        <div className="card-subtitle">Listado de documentos de nómina generados en ADM Cloud</div>
                    </div>
                    <Database size={18} style={{ color: 'var(--text-muted)' }} />
                </div>

                {loading ? (
                    <div className="loading-container">
                        <div className="spinner" />
                        <span>Cargando nóminas ejecutadas...</span>
                    </div>
                ) : data.length === 0 ? (
                    <div className="empty-state">
                        <FileText size={40} />
                        <p>No se encontraron nóminas generadas</p>
                    </div>
                ) : (
                    <div className="grid-list">
                        {data.map((item) => (
                            <div
                                key={item.id}
                                className="grid-item cursor-pointer"
                                onClick={() => navigate(`/nomina/ejecutada/${item.id}`)}
                            >
                                <div className="grid-item-icon">
                                    <Calendar size={20} />
                                </div>
                                <div className="grid-item-content">
                                    <div className="grid-item-title">{item.tipo_nomina}</div>
                                    <div className="grid-item-subtitle">
                                        Ref: {item.referencia} • {formatDate(item.fecha)}
                                    </div>
                                </div>
                                <div className="grid-item-action">
                                    <ChevronRight size={18} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <style>{`
                .grid-list {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 1px;
                    background: var(--border-color);
                }
                .grid-item {
                    display: flex;
                    align-items: center;
                    padding: 16px;
                    background: var(--card-bg);
                    transition: all 0.2s;
                }
                .grid-item:hover {
                    background: rgba(255,255,255,0.05);
                }
                .grid-item-icon {
                    width: 40px;
                    height: 40px;
                    border-radius: 8px;
                    background: var(--primary-color-alpha, rgba(37, 99, 235, 0.1));
                    color: var(--primary-color);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-right: 16px;
                }
                .grid-item-content {
                    flex: 1;
                }
                .grid-item-title {
                    font-weight: 600;
                    margin-bottom: 4px;
                }
                .grid-item-subtitle {
                    font-size: 0.85rem;
                    color: var(--text-muted);
                }
                .grid-item-action {
                    color: var(--text-muted);
                }
                .cursor-pointer {
                    cursor: pointer;
                }
            `}</style>
        </>
    );
};

const Database = ({ size, style }: any) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={style}
    >
        <ellipse cx="12" cy="5" rx="9" ry="3"></ellipse>
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path>
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path>
    </svg>
);

export default NominasEjecutadas;
