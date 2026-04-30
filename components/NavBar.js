'use client'
import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import styles from '../styles/navbar.module.css';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

function DemosDropdown({ demos, currentSlug }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        if (!open) return;
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const handler = (e) => { if (e.key === 'Escape') setOpen(false); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [open]);

    const current = demos.find(d => d.slug === currentSlug);

    return (
        <div className={styles.demosWrapper} ref={ref}>
            <button
                className={`${styles.demosTrigger} ${open ? styles.demosTriggerOpen : ''}`}
                onClick={() => setOpen(v => !v)}
                aria-expanded={open}
                aria-haspopup="true"
            >
                <svg width="9" height="9" viewBox="0 0 9 9" fill="currentColor" aria-hidden="true">
                    <polygon points="1,0.5 8.5,4.5 1,8.5" />
                </svg>
                {current?.title ?? 'Demos'}
                <svg className={`${styles.demosChevron} ${open ? styles.demosChevronOpen : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </button>

            {open && (
                <div className={styles.demosDropdown}>
                    <p className={styles.demosDropdownLabel}>Demos ao vivo</p>
                    {demos.map(demo => {
                        const isCurrent = demo.slug === currentSlug;
                        return isCurrent ? (
                            <div key={demo.slug} className={`${styles.demosItem} ${styles.demosItemActive}`}>
                                <img src={demo.image} alt="" className={styles.demosThumb} aria-hidden="true" />
                                <div className={styles.demosMeta}>
                                    <span className={styles.demosName}>{demo.title}</span>
                                    <span className={styles.demosStatus}>● Em uso</span>
                                </div>
                            </div>
                        ) : (
                            <Link
                                key={demo.slug}
                                href={`${demo.pagePath}/demo`}
                                className={styles.demosItem}
                                onClick={() => setOpen(false)}
                            >
                                <img src={demo.image} alt="" className={styles.demosThumb} aria-hidden="true" />
                                <div className={styles.demosMeta}>
                                    <span className={styles.demosName}>{demo.title}</span>
                                    <span className={styles.demosOpen}>Abrir →</span>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function UserAvatar({ user, size = 28 }) {
    if (user?.avatar_url) {
        return (
            <img
                src={user.avatar_url}
                alt={user.username}
                className={styles.userAvatar}
                style={{ width: size, height: size, objectFit: 'cover' }}
            />
        );
    }
    return (
        <span className={styles.userAvatar} style={{ width: size, height: size, fontSize: size * 0.4 }}>
            {user?.username?.[0]?.toUpperCase()}
        </span>
    );
}

const NavBar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const userMenuRef = useRef(null);
    const { user, logout, openAuthModal, loading } = useAuth();
    const pathname = usePathname();
    const [aiDemos, setAiDemos] = useState([]);

    const isActive = (href) => {
        if (!href || href.startsWith('http')) return false;
        if (href === '/') return pathname === '/';
        return pathname.startsWith(href);
    };

    const isDemoPage = pathname.includes('/demo');
    const currentDemoSlug = isDemoPage
        ? pathname.split('/projects/')[1]?.split('/')[0] ?? null
        : null;

    useEffect(() => {
        if (!isDemoPage) return;
        fetch('/assets/data/projects/project-items.json')
            .then(r => r.json())
            .then(data => setAiDemos(data.filter(p => p.isAiDemo && p.hasDemo)))
            .catch(() => {});
    }, [isDemoPage]);

    useEffect(() => {
        const handleScroll = () => {
            const offset = window.scrollY;
            if (offset > 50) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };

        window.addEventListener('scroll', handleScroll);

        return () => {
            window.removeEventListener('scroll', handleScroll);
        };
    }, []);

    const toggleMenu = () => setIsMenuOpen(prev => !prev);
    const closeMenu = () => setIsMenuOpen(false);
    const closeUserMenu = () => setIsUserMenuOpen(false);

    const handleLogout = async () => {
        await logout();
        closeMenu();
        closeUserMenu();
    };

    useEffect(() => {
        if (!isUserMenuOpen) return;
        const handleClick = (e) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
                setIsUserMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [isUserMenuOpen]);

    return (
        <nav className={`${styles.nav} ${isScrolled ? styles.scrolled : ''}`}>
            {/* Marca — esquerda */}
            <Link href="/" className={styles.brand} onClick={closeMenu}>VA</Link>

            {/* Links centrais — desktop */}
            <ul className={`${styles.list} ${isMenuOpen ? styles.listOpen : ''}`}>
                {[
                    { href: '/',         label: 'Inicio'   },
                    { href: '/about',    label: 'Sobre'    },
                    { href: '/blog',     label: 'Blog'     },
                    { href: '/projects', label: 'Projetos' },
                    { href: '/demos',    label: 'Demos'    },
                    { href: '/videos',   label: 'Videos'   },
                    { href: 'https://patreon.com/VitorArakaki?utm_medium=unknown&utm_source=join_link&utm_campaign=creatorshare_creator&utm_content=copyLink', label: 'Apoie' },
                ].map(({ href, label }) => (
                    <li key={href} className={styles.item}>
                        <Link
                            href={href}
                            className={`${styles.navigationLink} ${isActive(href) ? styles.navigationLinkActive : ''}`}
                            onClick={closeMenu}
                        >
                            {label}
                        </Link>
                    </li>
                ))}

                {/* Auth dentro do menu mobile */}
                {loading ? (
                    <li className={`${styles.item} ${styles.mobileAuthRow}`}>
                        <div className={styles.avatarShimmer} />
                    </li>
                ) : user ? (
                    <>
                        <li className={`${styles.item} ${styles.mobileAuthRow}`}>
                            <span className={styles.navigationUser}>
                                <UserAvatar user={user} />
                                {user.username}
                            </span>
                        </li>
                        <li className={`${styles.item} ${styles.mobileAuthRow}`}>
                            <Link href="/account" className={styles.navigationLink} onClick={closeMenu}>Minha conta</Link>
                        </li>
                        <li className={`${styles.item} ${styles.mobileAuthRow}`}>
                            <Link href="/subscription" className={styles.navigationLink} onClick={closeMenu}>Assinatura</Link>
                        </li>
                        <li className={`${styles.item} ${styles.mobileAuthRow}`}>
                            <button className={styles.navBtnGhost} onClick={handleLogout}>Sair</button>
                        </li>
                    </>
                ) : (
                    <li className={`${styles.item} ${styles.mobileAuthRow}`}>
                        <button className={styles.navBtnGhost} onClick={() => { closeMenu(); openAuthModal('login'); }}>Entrar</button>
                        <button className={styles.navBtnFilled} onClick={() => { closeMenu(); openAuthModal('register'); }}>Cadastrar</button>
                    </li>
                )}
            </ul>

            {/* Auth — direita (desktop) */}
            <div className={styles.authSection}>
                {isDemoPage && aiDemos.length >= 2 && (
                    <DemosDropdown demos={aiDemos} currentSlug={currentDemoSlug} />
                )}
                {loading ? (
                    <div className={styles.avatarShimmer} />
                ) : user ? (
                    <div className={styles.userMenuWrapper} ref={userMenuRef}>
                        <button
                            className={styles.userMenuTrigger}
                            onClick={() => setIsUserMenuOpen(prev => !prev)}
                            aria-expanded={isUserMenuOpen}
                            aria-haspopup="true"
                        >
                            <UserAvatar user={user} />
                            <span className={styles.userMenuName}>{user.username}</span>
                            <svg className={`${styles.userMenuChevron} ${isUserMenuOpen ? styles.userMenuChevronOpen : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                        </button>
                        {isUserMenuOpen && (
                            <div className={styles.userDropdown}>
                                <Link href="/account" className={styles.userDropdownItem} onClick={closeUserMenu}>Minha conta</Link>
                                <Link href="/subscription" className={styles.userDropdownItem} onClick={closeUserMenu}>Assinatura</Link>
                                <div className={styles.userDropdownDivider} />
                                <button className={`${styles.userDropdownItem} ${styles.userDropdownItemDanger}`} onClick={handleLogout}>Sair</button>
                            </div>
                        )}
                    </div>
                ) : (
                    <>
                        <button className={styles.navBtnGhost} onClick={() => openAuthModal('login')}>Entrar</button>
                        <button className={styles.navBtnFilled} onClick={() => openAuthModal('register')}>Cadastrar</button>
                    </>
                )}
            </div>

            {/* Hamburger — mobile */}
            <button className={styles.hamburger} onClick={toggleMenu} aria-label="Toggle menu">
                <span className={`${styles.hamburgerLine} ${isMenuOpen ? styles.hamburgerLine1Open : ''}`}></span>
                <span className={`${styles.hamburgerLine} ${isMenuOpen ? styles.hamburgerLine2Open : ''}`}></span>
                <span className={`${styles.hamburgerLine} ${isMenuOpen ? styles.hamburgerLine3Open : ''}`}></span>
            </button>
        </nav>
    );
};

export default NavBar;
