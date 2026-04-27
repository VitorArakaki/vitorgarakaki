'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import NavBar from '../../components/NavBar';
import styles from '../../styles/Subscription.module.css';

function CheckIcon() {
    return (
        <svg className={styles.checkIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    );
}

function Spinner() {
    return <span className={styles.spinner} />;
}

const PROJECT_FEATURES = [
    'Acesso completo a 1 projeto',
    'Demos interativos ilimitados',
    'Todas as atualizações do projeto',
    'Suporte por email',
];

const FULL_FEATURES = [
    'Acesso a todos os projetos',
    'Demos interativos ilimitados',
    'Todas as atualizações',
    'Projetos futuros incluídos',
    'Suporte prioritário',
];

export default function SubscriptionPage() {
    const { user, loading, fetchUser } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState('');
    const [selectedChangeProject, setSelectedChangeProject] = useState('');
    const [subscribing, setSubscribing] = useState(null); // 'project' | 'full' | null
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [cancelling, setCancelling] = useState(false);
    const [reactivating, setReactivating] = useState(false);
    const [changingPlan, setChangingPlan] = useState(false);
    const [showChangePlan, setShowChangePlan] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        if (!loading && !user) router.replace('/');
    }, [user, loading, router]);

    useEffect(() => {
        if (searchParams.get('success') === '1') {
            setSuccess('Assinatura realizada com sucesso! Pode levar alguns segundos para ser ativada.');
            if (fetchUser) fetchUser();
        }
        if (searchParams.get('cancelled') === '1') {
            setError('Pagamento cancelado. Nenhuma cobrança foi feita.');
        }
    }, [searchParams, fetchUser]);

    useEffect(() => {
        fetch('/assets/data/projects/project-items.json')
            .then(r => r.json())
            .then(data => {
                setProjects(data);
                if (data.length > 0) {
                    setSelectedProject(data[0].slug);
                    setSelectedChangeProject(data[0].slug);
                }
            })
            .catch(() => { });
    }, []);

    // Redireciona para checkout Stripe
    const handleSubscribe = async (plan) => {
        if (plan === 'project' && !selectedProject) {
            setError('Selecione um projeto antes de assinar.');
            return;
        }
        setError('');
        setSuccess('');
        setSubscribing(plan);

        const res = await fetch('/api/subscription/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ plan, ...(plan === 'project' && { projectSlug: selectedProject }) }),
        });
        const data = await res.json();
        setSubscribing(null);

        if (res.ok && data.url) {
            window.location.href = data.url;
        } else {
            setError(data.error ?? 'Erro ao iniciar checkout. Tente novamente.');
        }
    };

    // Troca de plano com prorate
    const handleChangePlan = async (targetPlan) => {
        const projectSlug = targetPlan === 'project' ? selectedChangeProject : undefined;
        if (targetPlan === 'project' && !projectSlug) {
            setError('Selecione um projeto.');
            return;
        }
        setError('');
        setSuccess('');
        setChangingPlan(true);

        const res = await fetch('/api/subscription/update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ plan: targetPlan, ...(projectSlug && { projectSlug }) }),
        });
        const data = await res.json();
        setChangingPlan(false);
        setShowChangePlan(false);

        if (res.ok) {
            setSuccess('Plano atualizado com sucesso! O valor proporcional foi calculado automaticamente.');
            if (fetchUser) await fetchUser();
        } else {
            setError(data.error ?? 'Erro ao trocar plano. Tente novamente.');
        }
    };

    // Cancela ao final do período
    const handleCancel = async () => {
        setCancelling(true);
        setError('');
        setSuccess('');

        const res = await fetch('/api/subscription/cancel', { method: 'POST' });
        const data = await res.json();
        setCancelling(false);
        setShowCancelConfirm(false);

        if (res.ok) {
            const date = data.expires_at
                ? new Date(data.expires_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
                : null;
            setSuccess(`Assinatura cancelada. Seu acesso se encerra em ${date ?? 'breve'}.`);
            if (fetchUser) await fetchUser();
        } else {
            setError(data.error ?? 'Erro ao cancelar assinatura. Tente novamente.');
        }
    };

    // Reativa assinatura cancelada
    const handleReactivate = async () => {
        setReactivating(true);
        setError('');
        setSuccess('');

        const res = await fetch('/api/subscription/reactivate', { method: 'POST' });
        const data = await res.json();
        setReactivating(false);

        if (res.ok) {
            setSuccess('Assinatura reativada com sucesso!');
            if (fetchUser) await fetchUser();
        } else {
            setError(data.error ?? 'Erro ao reativar. Tente novamente.');
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

    const isPaid = user.plan_name && user.plan_name !== 'free' && user.plan_status !== 'expired';
    const isCancelling = user.plan_status === 'cancelling';
    const isPastDue = user.plan_status === 'past_due';
    const subscribedProject = isPaid && user.plan_name === 'project'
        ? projects.find(p => p.slug === user.external_subscription_id)
        : null;

    const otherPlan = user.plan_name === 'full' ? 'project' : 'full';

    return (
        <main className={styles.page}>
            <NavBar />
            <div className={styles.container}>
                <div className={styles.header}>
                    <h1 className={styles.pageTitle}>Assinaturas</h1>
                    <p className={styles.pageSubtitle}>
                        {isPaid ? 'Gerencie sua assinatura atual' : 'Escolha o plano ideal para você'}
                    </p>
                </div>

                {error && <p className={styles.errorMsg}>{error}</p>}
                {success && <p className={styles.successMsg}>{success}</p>}

                {isPaid ? (
                    <div className={styles.currentPlanCard}>
                        <div className={styles.currentPlanHeader}>
                            {isCancelling ? (
                                <span className={styles.cancellingBadge}>● Cancela em breve</span>
                            ) : isPastDue ? (
                                <span className={styles.pastDueBadge}>● Pagamento pendente</span>
                            ) : (
                                <span className={styles.activeBadge}>● Ativo</span>
                            )}
                        </div>

                        <h2 className={styles.currentPlanName}>
                            {user.plan_name === 'full'
                                ? 'Site completo'
                                : `1 Projeto${subscribedProject ? ` — ${subscribedProject.title}` : ''}`}
                        </h2>

                        <div className={styles.currentPlanPricing}>
                            <span className={styles.currentPlanCurrency}>R$</span>
                            <span className={styles.currentPlanAmount}>{user.plan_name === 'full' ? '40' : '10'}</span>
                            <span className={styles.currentPlanPeriod}>/mês</span>
                        </div>

                        {user.plan_started_at && (
                            <p className={styles.currentPlanSince}>
                                Assinante desde {new Date(user.plan_started_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                            </p>
                        )}

                        {isCancelling && user.expires_at && (
                            <p className={styles.cancellingNote}>
                                Acesso garantido até {new Date(user.expires_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                            </p>
                        )}

                        {/* Trocar plano */}
                        {!isCancelling && (
                            <div className={styles.changePlanArea}>
                                {!showChangePlan ? (
                                    <button className={styles.btnChangePlan} onClick={() => setShowChangePlan(true)}>
                                        Trocar para {otherPlan === 'full' ? 'Site completo (R$40/mês)' : '1 Projeto (R$10/mês)'}
                                    </button>
                                ) : (
                                    <div className={styles.changePlanForm}>
                                        <p className={styles.changePlanNote}>
                                            O valor proporcional do plano atual será abatido na nova cobrança.
                                        </p>
                                        {otherPlan === 'project' && (
                                            <div className={styles.projectSelectWrap}>
                                                <label className={styles.selectLabel}>Escolha o projeto</label>
                                                <select
                                                    className={styles.select}
                                                    value={selectedChangeProject}
                                                    onChange={e => setSelectedChangeProject(e.target.value)}
                                                >
                                                    {projects.map(p => (
                                                        <option key={p.slug} value={p.slug}>{p.title}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                        <div className={styles.changePlanActions}>
                                            <button className={styles.btnBack} onClick={() => setShowChangePlan(false)}>Voltar</button>
                                            <button
                                                className={styles.btnConfirmChange}
                                                onClick={() => handleChangePlan(otherPlan)}
                                                disabled={changingPlan}
                                            >
                                                {changingPlan && <Spinner />}
                                                {changingPlan ? 'Atualizando...' : 'Confirmar troca'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className={styles.cancelArea}>
                            {isCancelling ? (
                                <button className={styles.btnReactivate} onClick={handleReactivate} disabled={reactivating}>
                                    {reactivating && <Spinner />}
                                    {reactivating ? 'Reativando...' : 'Reativar assinatura'}
                                </button>
                            ) : !showCancelConfirm ? (
                                <button className={styles.btnCancelTrigger} onClick={() => setShowCancelConfirm(true)}>
                                    Cancelar assinatura
                                </button>
                            ) : (
                                <div className={styles.cancelConfirm}>
                                    <p className={styles.cancelConfirmText}>
                                        Tem certeza? Você continuará com acesso até o final do período pago.
                                    </p>
                                    <div className={styles.cancelConfirmActions}>
                                        <button className={styles.btnBack} onClick={() => setShowCancelConfirm(false)}>
                                            Voltar
                                        </button>
                                        <button className={styles.btnCancelConfirm} onClick={handleCancel} disabled={cancelling}>
                                            {cancelling && <Spinner />}
                                            {cancelling ? 'Cancelando...' : 'Confirmar cancelamento'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className={styles.plansGrid}>
                        {/* Plano: 1 projeto */}
                        <div className={styles.planCard}>
                            <div className={styles.planCardTop}>
                                <h2 className={styles.planName}>Assinar 1 projeto</h2>
                                <div className={styles.planPricing}>
                                    <span className={styles.planCurrency}>R$</span>
                                    <span className={styles.planAmount}>10</span>
                                    <span className={styles.planPeriod}>/mês</span>
                                </div>
                            </div>

                            <ul className={styles.featureList}>
                                {PROJECT_FEATURES.map(f => (
                                    <li key={f} className={styles.featureItem}>
                                        <CheckIcon />{f}
                                    </li>
                                ))}
                            </ul>

                            <div className={styles.projectSelectWrap}>
                                <label className={styles.selectLabel}>Escolha o projeto</label>
                                <select
                                    className={styles.select}
                                    value={selectedProject}
                                    onChange={e => setSelectedProject(e.target.value)}
                                    disabled={projects.length === 0}
                                >
                                    {projects.map(p => (
                                        <option key={p.slug} value={p.slug}>{p.title}</option>
                                    ))}
                                </select>
                            </div>

                            <button
                                className={styles.btnSubscribe}
                                onClick={() => handleSubscribe('project')}
                                disabled={subscribing !== null || projects.length === 0}
                            >
                                {subscribing === 'project' && <Spinner />}
                                {subscribing === 'project' ? 'Processando...' : 'Assinar'}
                            </button>
                        </div>

                        {/* Plano: site completo */}
                        <div className={`${styles.planCard} ${styles.planCardFeatured}`}>
                            <span className={styles.featuredBadge}>Mais popular</span>

                            <div className={styles.planCardTop}>
                                <h2 className={styles.planName}>Assinar site completo</h2>
                                <div className={styles.planPricing}>
                                    <span className={styles.planCurrency}>R$</span>
                                    <span className={styles.planAmount}>40</span>
                                    <span className={styles.planPeriod}>/mês</span>
                                </div>
                            </div>

                            <ul className={styles.featureList}>
                                {FULL_FEATURES.map(f => (
                                    <li key={f} className={styles.featureItem}>
                                        <CheckIcon />{f}
                                    </li>
                                ))}
                            </ul>

                            <button
                                className={`${styles.btnSubscribe} ${styles.btnSubscribeFeatured}`}
                                onClick={() => handleSubscribe('full')}
                                disabled={subscribing !== null}
                            >
                                {subscribing === 'full' && <Spinner />}
                                {subscribing === 'full' ? 'Processando...' : 'Assinar'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
