'use client'
import { useState, useEffect, useRef } from 'react';
import styles from '../styles/navbar.module.css';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

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
                <li className={styles.item}><Link href="/" className={styles.navigationLink} onClick={closeMenu}>Inicio</Link></li>
                <li className={styles.item}><Link href="/about" className={styles.navigationLink} onClick={closeMenu}>Sobre</Link></li>
                <li className={styles.item}><Link href="/blog" className={styles.navigationLink} onClick={closeMenu}>Blog</Link></li>
                <li className={styles.item}><Link href="/projects" className={styles.navigationLink} onClick={closeMenu}>Projetos</Link></li>
                <li className={styles.item}><Link href="/videos" className={styles.navigationLink} onClick={closeMenu}>Videos</Link></li>
                <li className={styles.item}><Link href="https://patreon.com/VitorArakaki?utm_medium=unknown&utm_source=join_link&utm_campaign=creatorshare_creator&utm_content=copyLink" className={styles.navigationLink} onClick={closeMenu}>Apoie</Link></li>

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
