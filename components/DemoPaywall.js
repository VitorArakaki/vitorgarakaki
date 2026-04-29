'use client';

import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import styles from '../styles/DemoPaywall.module.css';

function LockIcon() {
    return (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
    );
}

function ClockIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
        </svg>
    );
}

function SparkleIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
        </svg>
    );
}

function CheckIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
        </svg>
    );
}

function UsagePips({ used, total }) {
    return (
        <span className={styles.pips}>
            {Array.from({ length: total }).map((_, i) => (
                <span key={i} className={i < used ? styles.pipUsed : styles.pipFree} />
            ))}
        </span>
    );
}

const PROJECT_NAMES = {
    'environment-virtualizer': 'Environment Virtualizer',
    'architecture-deployment': 'Architecture Deployment',
    'custom-excalidraw': 'Custom Excalidraw',
};

const FREE_LIMIT = 3;

export default function DemoPaywall({ slug }) {
    const { user, openAuthModal } = useAuth();
    const projectName = PROJECT_NAMES[slug] ?? slug;

    return (
        <div className={styles.paywall}>
            <div className={styles.paywallCard}>
                <div className={styles.iconWrap}>
                    <LockIcon />
                </div>

                <div className={styles.usageRow}>
                    <UsagePips used={FREE_LIMIT} total={FREE_LIMIT} />
                    <span className={styles.usageLabel}>{FREE_LIMIT}/{FREE_LIMIT} usos de IA hoje</span>
                </div>

                <div className={styles.textBlock}>
                    <h2 className={styles.title}>Limite diário atingido</h2>
                    <p className={styles.description}>
                        Você utilizou os {FREE_LIMIT} usos gratuitos de IA do demo{' '}
                        <strong className={styles.projectName}>{projectName}</strong> de hoje.
                    </p>
                </div>

                <div className={styles.resetNote}>
                    <ClockIcon />
                    <span>Resets automaticamente à meia-noite</span>
                </div>

                <div className={styles.actions}>
                    <Link href="/subscription" className={styles.btnSubscribe}>
                        <SparkleIcon />
                        Assinar — acesso ilimitado
                    </Link>
                    {!user && (
                        <button className={styles.btnLogin} onClick={() => openAuthModal('login')}>
                            Já tenho conta — entrar
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

/**
 * Slim banner shown below the navbar to non-subscribed users.
 * - AI demos: shows remaining daily uses with pip indicator.
 * - Non-AI demos: shows that this demo is free.
 */
export function FreeUserBanner({ isAiDemo, remaining }) {
    const { user, openAuthModal } = useAuth();
    const used = FREE_LIMIT - (remaining ?? 0);
    const isLow = isAiDemo && remaining !== null && remaining <= 1;

    if (!isAiDemo) {
        return (
            <div className={styles.banner}>
                <div className={styles.bannerLeft}>
                    <span className={styles.bannerIconWrap + ' ' + styles.bannerIconGreen}>
                        <CheckIcon />
                    </span>
                    <span className={styles.bannerText}>
                        Demo <strong>gratuito e ilimitado</strong>
                        <span className={styles.bannerSub}> — demos de IA têm 3 usos/dia para não assinantes</span>
                    </span>
                </div>
                <Link href="/subscription" className={styles.bannerCta}>
                    Ver planos
                </Link>
            </div>
        );
    }

    return (
        <div className={`${styles.banner} ${isLow ? styles.bannerWarn : ''}`}>
            <div className={styles.bannerLeft}>
                <span className={`${styles.bannerIconWrap} ${isLow ? styles.bannerIconYellow : styles.bannerIconBlue}`}>
                    <SparkleIcon />
                </span>
                <span className={styles.bannerText}>
                    {isLow
                        ? <><strong>Último uso gratuito</strong> de IA hoje</>
                        : <><strong>{remaining}</strong> de {FREE_LIMIT} usos gratuitos de IA restantes hoje</>
                    }
                </span>
                <UsagePips used={used} total={FREE_LIMIT} />
            </div>
            <div className={styles.bannerActions}>
                {!user && (
                    <button className={styles.bannerLoginBtn} onClick={() => openAuthModal('login')}>
                        Entrar
                    </button>
                )}
                <Link href="/subscription" className={styles.bannerCta}>
                    Assinar
                </Link>
            </div>
        </div>
    );
}

/** @deprecated Use FreeUserBanner instead */
export function UsageWarningBanner({ remaining }) {
    return <FreeUserBanner isAiDemo={true} remaining={remaining} />;
}

