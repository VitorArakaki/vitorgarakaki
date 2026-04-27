'use client';

import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/DemoPaywall.module.css';

const PROJECT_NAMES = {
    'environment-virtualizer': 'Environment Virtualizer',
    'architecture-deployment': 'Architecture Deployment',
    'custom-excalidraw': 'Custom Excalidraw',
};

export default function DemoPaywall({ slug }) {
    const { user, openAuthModal } = useAuth();
    const projectName = PROJECT_NAMES[slug] ?? slug;

    return (
        <div className={styles.paywall}>
            <div className={styles.icon}>🔒</div>
            <h2 className={styles.title}>Limite de usos atingido</h2>
            <p className={styles.description}>
                Você usou seus {3} acessos gratuitos ao demo <strong>{projectName}</strong>.
                Assine para ter acesso ilimitado.
            </p>

            <div className={styles.actions}>
                <Link href={`/subscription`} className={styles.btnSubscribe}>
                    Ver planos de assinatura
                </Link>
                {!user && (
                    <button className={styles.btnLogin} onClick={() => openAuthModal('login')}>
                        Já tenho conta — entrar
                    </button>
                )}
            </div>
        </div>
    );
}

/** Banner shown when user has 1 or 2 free uses remaining. */
export function UsageWarningBanner({ remaining, slug }) {
    return (
        <div className={styles.usageBanner}>
            <span className={styles.usageBannerIcon}>⚠️</span>
            <span>
                {remaining === 1
                    ? 'Este é seu último uso gratuito deste demo. '
                    : `Você tem ${remaining} usos gratuitos restantes. `}
                <Link href="/subscription" className={styles.usageBannerLink}>
                    Assinar para acesso ilimitado
                </Link>
            </span>
        </div>
    );
}
