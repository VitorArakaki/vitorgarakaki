'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import NavBar from '../../components/NavBar';
import styles from '../../styles/Account.module.css';

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

function Spinner() {
    return <span className={styles.spinner} />;
}

export default function AccountPage() {
    const { user, loading, fetchUser } = useAuth();
    const router = useRouter();

    // --- Profile section ---
    const [username, setUsername] = useState('');
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [avatarBase64, setAvatarBase64] = useState(undefined);
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileSuccess, setProfileSuccess] = useState('');
    const [profileErrors, setProfileErrors] = useState({});
    const fileRef = useRef(null);

    // --- Password section ---
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [showCurrent, setShowCurrent] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [passwordSaving, setPasswordSaving] = useState(false);
    const [passwordSuccess, setPasswordSuccess] = useState('');
    const [passwordErrors, setPasswordErrors] = useState({});

    useEffect(() => {
        if (!loading && !user) {
            router.replace('/');
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (user) {
            setUsername(user.username ?? '');
            setAvatarPreview(user.avatar_url ?? null);
        }
    }, [user]);

    const handleAvatarChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            setProfileErrors(prev => ({ ...prev, avatar: 'A imagem deve ter no máximo 2 MB.' }));
            return;
        }
        const reader = new FileReader();
        reader.onload = (ev) => {
            setAvatarPreview(ev.target.result);
            setAvatarBase64(ev.target.result);
            setProfileErrors(prev => { const e = { ...prev }; delete e.avatar; return e; });
        };
        reader.readAsDataURL(file);
    };

    const handleProfileSave = async (e) => {
        e.preventDefault();
        setProfileErrors({});
        setProfileSuccess('');
        setProfileSaving(true);

        const body = {};
        if (username.trim() !== user.username) body.username = username;
        if (avatarBase64 !== undefined) body.avatarUrl = avatarBase64;

        if (Object.keys(body).length === 0) {
            setProfileSaving(false);
            setProfileSuccess('Nenhuma alteração detectada.');
            return;
        }

        const res = await fetch('/api/auth/update-profile', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });
        const data = await res.json();
        setProfileSaving(false);

        if (res.ok) {
            setProfileSuccess('Perfil atualizado com sucesso!');
            setAvatarBase64(undefined);
            if (fetchUser) await fetchUser();
        } else {
            setProfileErrors(data.errors ?? { general: data.error });
        }
    };

    const handlePasswordSave = async (e) => {
        e.preventDefault();
        setPasswordErrors({});
        setPasswordSuccess('');
        setPasswordSaving(true);

        const res = await fetch('/api/auth/update-profile', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentPassword, newPassword, confirmNewPassword }),
        });
        const data = await res.json();
        setPasswordSaving(false);

        if (res.ok) {
            setPasswordSuccess('Senha alterada com sucesso!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
        } else {
            setPasswordErrors(data.errors ?? { general: data.error });
        }
    };

    if (loading || !user) {
        return (
            <main className={styles.page}>
                <NavBar />
                <div className={styles.loadingWrap}><Spinner /></div>
            </main>
        );
    }

    const avatarInitial = (user.username?.[0] ?? '?').toUpperCase();

    return (
        <main className={styles.page}>
            <NavBar />

            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.pageTitle}>Minha conta</h1>
                    <p className={styles.pageSubtitle}>Gerencie suas informações de perfil</p>
                </div>

                {/* ── Seção Perfil ── */}
                <section className={styles.card}>
                    <h2 className={styles.sectionTitle}>Perfil</h2>

                    <form onSubmit={handleProfileSave} className={styles.form}>
                        {/* Avatar */}
                        <div className={styles.avatarRow}>
                            <div className={styles.avatarWrap}>
                                {avatarPreview ? (
                                    <img src={avatarPreview} alt="Avatar" className={styles.avatarImg} />
                                ) : (
                                    <span className={styles.avatarFallback}>{avatarInitial}</span>
                                )}
                            </div>
                            <div className={styles.avatarActions}>
                                <button type="button" className={styles.btnSecondary} onClick={() => fileRef.current?.click()}>
                                    Alterar foto
                                </button>
                                {avatarPreview && (
                                    <button
                                        type="button"
                                        className={styles.btnDanger}
                                        onClick={() => {
                                            setAvatarPreview(null);
                                            setAvatarBase64('');
                                            if (fileRef.current) fileRef.current.value = '';
                                        }}
                                    >
                                        Remover
                                    </button>
                                )}
                                <input
                                    ref={fileRef}
                                    type="file"
                                    accept="image/*"
                                    className={styles.hiddenInput}
                                    onChange={handleAvatarChange}
                                />
                            </div>
                        </div>
                        {profileErrors.avatar && <p className={styles.fieldError}>{profileErrors.avatar}</p>}

                        {/* Username */}
                        <div className={styles.inputGroup}>
                            <label className={styles.label} htmlFor="username">Nome de usuário</label>
                            <input
                                id="username"
                                className={`${styles.input} ${profileErrors.username ? styles.inputError : ''}`}
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                minLength={3}
                                maxLength={50}
                                required
                            />
                            {profileErrors.username && <p className={styles.fieldError}>{profileErrors.username}</p>}
                        </div>

                        {/* Email (read-only) */}
                        <div className={styles.inputGroup}>
                            <label className={styles.label} htmlFor="email">
                                Email
                                <span className={styles.readOnlyBadge}>não editável</span>
                            </label>
                            <input
                                id="email"
                                className={`${styles.input} ${styles.inputReadOnly}`}
                                type="email"
                                value={user.email}
                                readOnly
                                tabIndex={-1}
                            />
                        </div>

                        {profileErrors.general && <p className={styles.errorMsg}>{profileErrors.general}</p>}
                        {profileSuccess && <p className={styles.successMsg}>{profileSuccess}</p>}

                        <div className={styles.formFooter}>
                            <button className={styles.btnPrimary} type="submit" disabled={profileSaving}>
                                {profileSaving && <Spinner />}
                                {profileSaving ? 'Salvando...' : 'Salvar perfil'}
                            </button>
                        </div>
                    </form>
                </section>

                {/* ── Seção Segurança ── */}
                <section className={styles.card}>
                    <h2 className={styles.sectionTitle}>Segurança</h2>
                    <p className={styles.sectionDesc}>Deixe em branco para não alterar a senha.</p>

                    <form onSubmit={handlePasswordSave} className={styles.form}>
                        <div className={styles.inputGroup}>
                            <label className={styles.label} htmlFor="currentPassword">Senha atual</label>
                            <div className={styles.inputWrapper}>
                                <input
                                    id="currentPassword"
                                    className={`${styles.input} ${styles.inputWithToggle} ${passwordErrors.currentPassword ? styles.inputError : ''}`}
                                    type={showCurrent ? 'text' : 'password'}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    autoComplete="current-password"
                                    placeholder="••••••••"
                                />
                                <button type="button" className={styles.eyeBtn} onClick={() => setShowCurrent(v => !v)} aria-label="Mostrar senha">
                                    <EyeIcon open={showCurrent} />
                                </button>
                            </div>
                            {passwordErrors.currentPassword && <p className={styles.fieldError}>{passwordErrors.currentPassword}</p>}
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.label} htmlFor="newPassword">Nova senha</label>
                            <div className={styles.inputWrapper}>
                                <input
                                    id="newPassword"
                                    className={`${styles.input} ${styles.inputWithToggle} ${passwordErrors.newPassword ? styles.inputError : ''}`}
                                    type={showNew ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    autoComplete="new-password"
                                    placeholder="Mínimo 6 caracteres"
                                />
                                <button type="button" className={styles.eyeBtn} onClick={() => setShowNew(v => !v)} aria-label="Mostrar senha">
                                    <EyeIcon open={showNew} />
                                </button>
                            </div>
                            {passwordErrors.newPassword && <p className={styles.fieldError}>{passwordErrors.newPassword}</p>}
                        </div>

                        <div className={styles.inputGroup}>
                            <label className={styles.label} htmlFor="confirmNewPassword">Confirmar nova senha</label>
                            <div className={styles.inputWrapper}>
                                <input
                                    id="confirmNewPassword"
                                    className={`${styles.input} ${styles.inputWithToggle} ${passwordErrors.confirmNewPassword ? styles.inputError : ''}`}
                                    type={showConfirm ? 'text' : 'password'}
                                    value={confirmNewPassword}
                                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                                    autoComplete="new-password"
                                    placeholder="Repita a nova senha"
                                />
                                <button type="button" className={styles.eyeBtn} onClick={() => setShowConfirm(v => !v)} aria-label="Mostrar senha">
                                    <EyeIcon open={showConfirm} />
                                </button>
                            </div>
                            {passwordErrors.confirmNewPassword && <p className={styles.fieldError}>{passwordErrors.confirmNewPassword}</p>}
                        </div>

                        {passwordErrors.general && <p className={styles.errorMsg}>{passwordErrors.general}</p>}
                        {passwordSuccess && <p className={styles.successMsg}>{passwordSuccess}</p>}

                        <div className={styles.formFooter}>
                            <button className={styles.btnPrimary} type="submit" disabled={passwordSaving}>
                                {passwordSaving && <Spinner />}
                                {passwordSaving ? 'Salvando...' : 'Alterar senha'}
                            </button>
                        </div>
                    </form>
                </section>
            </div>
        </main>
    );
}
