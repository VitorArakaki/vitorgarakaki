'use client'
import { useState, useEffect } from 'react';
import styles from '../styles/navbar.module.css';
import Link from 'next/link';

const NavBar = () => {
    const [isScrolled, setIsScrolled] = useState(false);

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

    return (
        <nav className={`${styles.nav} ${isScrolled ? styles.scrolled : ''}`}>
            <ul className={styles.list}>
                <li className={styles.item}><Link href="/" className={styles.navigationLink}>Inicio</Link></li>
                <li className={styles.item}><Link href="/about" className={styles.navigationLink}>Sobre</Link></li>
                <li className={styles.item}><Link href="/blog" className={styles.navigationLink}>Blog</Link></li>
                <li className={styles.item}><Link href="/projects" className={styles.navigationLink}>Projetos</Link></li>
                <li className={styles.item}><Link href="/videos" className={styles.navigationLink}>Videos</Link></li>
                <li className={styles.item}><Link href="https://patreon.com/VitorArakaki?utm_medium=unknown&utm_source=join_link&utm_campaign=creatorshare_creator&utm_content=copyLink" className={styles.navigationLink}>Apoie</Link></li>
            </ul>
        </nav>
    );
};

export default NavBar;
