'use client'
import { useState, useEffect } from 'react';
import styles from '../styles/navbar.module.css';
import Link from 'next/link';

const NavBar = () => {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

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

    return (
        <nav className={`${styles.nav} ${isScrolled ? styles.scrolled : ''}`}>
            <button className={styles.hamburger} onClick={toggleMenu} aria-label="Toggle menu">
                <span className={`${styles.hamburgerLine} ${isMenuOpen ? styles.hamburgerLine1Open : ''}`}></span>
                <span className={`${styles.hamburgerLine} ${isMenuOpen ? styles.hamburgerLine2Open : ''}`}></span>
                <span className={`${styles.hamburgerLine} ${isMenuOpen ? styles.hamburgerLine3Open : ''}`}></span>
            </button>
            <ul className={`${styles.list} ${isMenuOpen ? styles.listOpen : ''}`}>
                <li className={styles.item}><Link href="/" className={styles.navigationLink} onClick={closeMenu}>Inicio</Link></li>
                <li className={styles.item}><Link href="/about" className={styles.navigationLink} onClick={closeMenu}>Sobre</Link></li>
                <li className={styles.item}><Link href="/blog" className={styles.navigationLink} onClick={closeMenu}>Blog</Link></li>
                <li className={styles.item}><Link href="/projects" className={styles.navigationLink} onClick={closeMenu}>Projetos</Link></li>
                <li className={styles.item}><Link href="/videos" className={styles.navigationLink} onClick={closeMenu}>Videos</Link></li>
                <li className={styles.item}><Link href="https://patreon.com/VitorArakaki?utm_medium=unknown&utm_source=join_link&utm_campaign=creatorshare_creator&utm_content=copyLink" className={styles.navigationLink} onClick={closeMenu}>Apoie</Link></li>
            </ul>
        </nav>
    );
};

export default NavBar;
