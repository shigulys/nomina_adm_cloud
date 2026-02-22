import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { login as loginApi } from '../services/api';
import { Lock, User, AlertCircle, Loader2 } from 'lucide-react';

const LoginPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            const res = await loginApi({ username, password });
            login(res.data.token, res.data.user);
            navigate('/');
        } catch (err: any) {
            setError(err.response?.data?.error || 'Error al iniciar sesión. Verifique sus credenciales.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-header">
                    <div className="logo-circle">
                        <Lock size={24} />
                    </div>
                    <h1>Nómina Cloud</h1>
                    <p>Ingrese sus credenciales para acceder</p>
                </div>

                {error && (
                    <div className="error-alert">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <label>Usuario</label>
                        <div className="input-with-icon">
                            <User size={18} />
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Nombre de usuario"
                                required
                                autoComplete="username"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Contraseña</label>
                        <div className="input-with-icon">
                            <Lock size={18} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                autoComplete="current-password"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-block"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="spinner" size={18} />
                                Autenticando...
                            </>
                        ) : (
                            'Iniciar Sesión'
                        )}
                    </button>
                </form>
            </div>

            <style>{`
                .login-container {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    background: var(--bg-color);
                    padding: 20px;
                }
                .login-card {
                    width: 100%;
                    max-width: 400px;
                    background: var(--card-bg);
                    border: 1px solid var(--border-color);
                    border-radius: 16px;
                    padding: 40px;
                    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
                }
                .login-header {
                    text-align: center;
                    margin-bottom: 30px;
                }
                .logo-circle {
                    width: 60px;
                    height: 60px;
                    background: var(--primary-color);
                    color: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 16px;
                }
                .login-header h1 {
                    font-size: 1.5rem;
                    margin-bottom: 8px;
                    color: white;
                }
                .login-header p {
                    color: var(--text-muted);
                    font-size: 0.9rem;
                }
                .error-alert {
                    background: rgba(239, 68, 68, 0.1);
                    color: #ef4444;
                    padding: 12px;
                    border-radius: 8px;
                    margin-bottom: 20px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 0.85rem;
                    border: 1px solid rgba(239, 68, 68, 0.2);
                }
                .login-form {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }
                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .form-group label {
                    font-size: 0.85rem;
                    font-weight: 500;
                    color: var(--text-muted);
                }
                .input-with-icon {
                    position: relative;
                }
                .input-with-icon svg {
                    position: absolute;
                    left: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: var(--text-muted);
                }
                .input-with-icon input {
                    width: 100%;
                    padding: 12px 12px 12px 40px;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid var(--border-color);
                    border-radius: 8px;
                    color: white;
                    outline: none;
                    transition: border-color 0.2s;
                }
                .input-with-icon input:focus {
                    border-color: var(--primary-color);
                }
                .btn-block {
                    width: 100%;
                    justify-content: center;
                }
            `}</style>
        </div>
    );
};

export default LoginPage;
