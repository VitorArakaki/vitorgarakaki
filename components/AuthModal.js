'use client';
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/AuthModal.module.css';

function EyeIcon({ open }) {
    return open ? (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    ) : (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
            <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
            <line x1="1" y1="1" x2="23" y2="23" />
        </svg>
    );
}

function CloseIcon() {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    );
}

function ForgotPasswordForm({ onBack }) {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await res.json();
            if (res.ok) {
                setSent(true);
            } else {
                setError(data.error || 'Erro ao enviar email.');
            }
        } catch {
            setError('Erro de conexão. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    if (sent) {
        return (
            <>
                <div className={styles.logoArea}>
                    <span className={styles.logoMark}>VA</span>
                </div>
                <div>
                    <h2 className={styles.title}>Email enviado</h2>
                    <p className={styles.subtitle}>Se o email estiver cadastrado, você receberá um link para redefinir sua senha.</p>
                </div>
                <button className={styles.button} onClick={onBack}>Voltar para o login</button>
            </>
        );
    }

    return (
        <>
            <div className={styles.logoArea}>
                <span className={styles.logoMark}>VA</span>
            </div>
            <div>
                <h2 className={styles.title}>Esqueci a senha</h2>
                <p className={styles.subtitle}>Informe seu email e enviaremos um link para redefinir sua senha.</p>
            </div>
            <form className={styles.form} onSubmit={handleSubmit}>
                {error && <p className={styles.error}>{error}</p>}
                <div className={styles.inputGroup}>
                    <label className={styles.label} htmlFor="modal-forgot-email">Email</label>
                    <input
                        id="modal-forgot-email"
                        className={styles.input}
                        type="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                    />
                </div>
                <button className={styles.button} type="submit" disabled={loading}>
                    {loading && <span className={styles.spinner} />}
                    {loading ? 'Enviando...' : 'Enviar link'}
                </button>
            </form>
            <p className={styles.footer}>
                <button className={styles.switchBtn} onClick={onBack}>Voltar para o login</button>
            </p>
        </>
    );
}

function LoginForm({ onSuccess, onSwitch, onForgot }) {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        const result = await login(email, password);
        setLoading(false);
        if (result.ok) {
            onSuccess();
        } else {
            setError(result.error);
        }
    };

    return (
        <>
            <div className={styles.logoArea}>
                <span className={styles.logoMark}>VA</span>
            </div>
            <div>
                <h2 className={styles.title}>Entrar</h2>
                <p className={styles.subtitle}>Bem-vindo de volta!</p>
            </div>
            <form className={styles.form} onSubmit={handleSubmit}>
                {error && <p className={styles.error}>{error}</p>}
                <div className={styles.inputGroup}>
                    <label className={styles.label} htmlFor="modal-email">Email</label>
                    <input
                        id="modal-email"
                        className={styles.input}
                        type="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                    />
                </div>
                <div className={styles.inputGroup}>
                    <label className={styles.label} htmlFor="modal-password">Senha</label>
                    <div className={styles.inputWrapper}>
                        <input
                            id="modal-password"
                            className={`${styles.input} ${styles.inputWithToggle}`}
                            type={showPassword ? 'text' : 'password'}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                        />
                        <button type="button" className={styles.eyeBtn} onClick={() => setShowPassword(v => !v)} aria-label="Mostrar senha">
                            <EyeIcon open={showPassword} />
                        </button>
                    </div>
                </div>
                <div style={{ textAlign: 'right', marginTop: '-0.2rem' }}>
                    <button type="button" className={styles.switchBtn} onClick={onForgot}
                        style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', borderColor: 'rgba(255,255,255,0.2)' }}>
                        Esqueci a senha
                    </button>
                </div>
                <button className={styles.button} type="submit" disabled={loading}>
                    {loading && <span className={styles.spinner} />}
                    {loading ? 'Entrando...' : 'Entrar'}
                </button>
            </form>
            <p className={styles.footer}>
                Não tem conta?{' '}
                <button className={styles.switchBtn} onClick={onSwitch}>Cadastre-se</button>
            </p>
        </>
    );
}

function RegisterForm({ onSuccess, onSwitch }) {
    const { register } = useAuth();
    const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (form.password !== form.confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }
        setLoading(true);
        const result = await register(form.username, form.email, form.password, form.confirmPassword);
        setLoading(false);
        if (result.ok) {
            onSuccess();
        } else {
            setError(result.error);
        }
    };

    return (
        <>
            <div className={styles.logoArea}>
                <span className={styles.logoMark}>VA</span>
            </div>
            <div>
                <h2 className={styles.title}>Criar conta</h2>
                <p className={styles.subtitle}>Cadastro gratuito, sem complicação</p>
            </div>
            <form className={styles.form} onSubmit={handleSubmit}>
                {error && <p className={styles.error}>{error}</p>}
                <div className={styles.inputGroup}>
                    <label className={styles.label} htmlFor="modal-username">Nome de usuário</label>
                    <input
                        id="modal-username"
                        className={styles.input}
                        type="text"
                        name="username"
                        placeholder="seunome"
                        value={form.username}
                        onChange={handleChange}
                        required
                        autoComplete="username"
                        minLength={3}
                        maxLength={50}
                    />
                </div>
                <div className={styles.inputGroup}>
                    <label className={styles.label} htmlFor="modal-reg-email">Email</label>
                    <input
                        id="modal-reg-email"
                        className={styles.input}
                        type="email"
                        name="email"
                        placeholder="seu@email.com"
                        value={form.email}
                        onChange={handleChange}
                        required
                        autoComplete="email"
                    />
                </div>
                <div className={styles.inputGroup}>
                    <label className={styles.label} htmlFor="modal-reg-password">Senha</label>
                    <div className={styles.inputWrapper}>
                        <input
                            id="modal-reg-password"
                            className={`${styles.input} ${styles.inputWithToggle}`}
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            placeholder="Mínimo 6 caracteres"
                            value={form.password}
                            onChange={handleChange}
                            required
                            autoComplete="new-password"
                            minLength={6}
                        />
                        <button type="button" className={styles.eyeBtn} onClick={() => setShowPassword(v => !v)} aria-label="Mostrar senha">
                            <EyeIcon open={showPassword} />
                        </button>
                    </div>
                </div>
                <div className={styles.inputGroup}>
                    <label className={styles.label} htmlFor="modal-reg-confirm">Confirmar senha</label>
                    <div className={styles.inputWrapper}>
                        <input
                            id="modal-reg-confirm"
                            className={`${styles.input} ${styles.inputWithToggle}`}
                            type={showConfirm ? 'text' : 'password'}
                            name="confirmPassword"
                            placeholder="Repita a senha"
                            value={form.confirmPassword}
                            onChange={handleChange}
                            required
                            autoComplete="new-password"
                            minLength={6}
                        />
                        <button type="button" className={styles.eyeBtn} onClick={() => setShowConfirm(v => !v)} aria-label="Mostrar senha">
                            <EyeIcon open={showConfirm} />
                        </button>
                    </div>
                </div>
                <button className={styles.button} type="submit" disabled={loading}>
                    {loading && <span className={styles.spinner} />}
                    {loading ? 'Criando conta...' : 'Criar conta'}
                </button>
            </form>
            <p className={styles.footer}>
                Já tem conta?{' '}
                <button className={styles.switchBtn} onClick={onSwitch}>Entrar</button>
            </p>
        </>
    );
}

export default function AuthModal() {
    const { modalOpen, modalView, closeAuthModal, setModalView } = useAuth();

    // Fechar com Escape
    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Escape') closeAuthModal();
    }, [closeAuthModal]);

    useEffect(() => {
        if (modalOpen) {
            document.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [modalOpen, handleKeyDown]);

    if (!modalOpen) return null;

    return (
        <div className={styles.overlay} onClick={(e) => { if (e.target === e.currentTarget) closeAuthModal(); }}>
            <div className={styles.modal} role="dialog" aria-modal="true">
                <button className={styles.closeBtn} onClick={closeAuthModal} aria-label="Fechar">
                    <CloseIcon />
                </button>

                {modalView === 'login' && (
                    <LoginForm
                        onSuccess={closeAuthModal}
                        onSwitch={() => setModalView('register')}
                        onForgot={() => setModalView('forgot-password')}
                    />
                )}
                {modalView === 'register' && (
                    <RegisterForm
                        onSuccess={closeAuthModal}
                        onSwitch={() => setModalView('login')}
                    />
                )}
                {modalView === 'forgot-password' && (
                    <ForgotPasswordForm
                        onBack={() => setModalView('login')}
                    />
                )}
            </div>
        </div>
    );
}
