'use client';
import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import styles from '../../styles/Auth.module.css';

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

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    if (!token) {
        return (
            <div className={styles.card}>
                <div className={styles.logoArea}>
                    <span className={styles.logoMark}>VA</span>
                </div>
                <div>
                    <h1 className={styles.title}>Link inválido</h1>
                    <p className={styles.subtitle}>Este link de redefinição é inválido ou já expirou.</p>
                </div>
                <button className={styles.button} onClick={() => router.push('/')}>Voltar ao início</button>
            </div>
        );
    }

    if (success) {
        return (
            <div className={styles.card}>
                <div className={styles.logoArea}>
                    <span className={styles.logoMark}>VA</span>
                </div>
                <div>
                    <h1 className={styles.title}>Senha redefinida!</h1>
                    <p className={styles.subtitle}>Sua senha foi atualizada com sucesso. Faça login com sua nova senha.</p>
                </div>
                <button className={styles.button} onClick={() => router.push('/')}>Ir para o início</button>
            </div>
        );
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token, password, confirmPassword }),
            });
            const data = await res.json();
            if (res.ok) {
                setSuccess(true);
            } else {
                setError(data.error || 'Erro ao redefinir senha.');
            }
        } catch {
            setError('Erro de conexão. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.card}>
            <div className={styles.logoArea}>
                <span className={styles.logoMark}>VA</span>
            </div>
            <div>
                <h1 className={styles.title}>Nova senha</h1>
                <p className={styles.subtitle}>Escolha uma nova senha para sua conta.</p>
            </div>
            <form className={styles.form} onSubmit={handleSubmit}>
                {error && <p className={styles.error}>{error}</p>}
                <div className={styles.inputGroup}>
                    <label className={styles.label} htmlFor="new-password">Nova senha</label>
                    <div className={styles.inputWrapper}>
                        <input
                            id="new-password"
                            className={`${styles.input} ${styles.inputWithToggle}`}
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Mínimo 6 caracteres"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            autoComplete="new-password"
                        />
                        <button type="button" className={styles.eyeBtn} onClick={() => setShowPassword(v => !v)} aria-label="Mostrar senha">
                            <EyeIcon open={showPassword} />
                        </button>
                    </div>
                </div>
                <div className={styles.inputGroup}>
                    <label className={styles.label} htmlFor="confirm-password">Confirmar nova senha</label>
                    <div className={styles.inputWrapper}>
                        <input
                            id="confirm-password"
                            className={`${styles.input} ${styles.inputWithToggle}`}
                            type={showConfirm ? 'text' : 'password'}
                            placeholder="Repita a senha"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            minLength={6}
                            autoComplete="new-password"
                        />
                        <button type="button" className={styles.eyeBtn} onClick={() => setShowConfirm(v => !v)} aria-label="Mostrar senha">
                            <EyeIcon open={showConfirm} />
                        </button>
                    </div>
                </div>
                <button className={styles.button} type="submit" disabled={loading}>
                    {loading && <span className={styles.spinner} />}
                    {loading ? 'Salvando...' : 'Salvar nova senha'}
                </button>
            </form>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <div className={styles.container}>
            <Suspense fallback={<div className={styles.card}><p style={{ color: 'rgba(255,255,255,0.5)', textAlign: 'center' }}>Carregando...</p></div>}>
                <ResetPasswordForm />
            </Suspense>
        </div>
    );
}
