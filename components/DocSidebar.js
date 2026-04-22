"use client";

import { useState, useEffect } from "react";
import styles from "../styles/DocSidebar.module.css";

const DocSidebar = ({ sections }) => {
    const [showTop, setShowTop] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setShowTop(window.scrollY > 300);
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    const handleClick = (e, id) => {
        e.preventDefault();
        setDrawerOpen(false);
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: "smooth" });
        }
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <>
            {/* Desktop sidebar */}
            <nav className={styles.sidebar}>
                <span className={styles.sidebarTitle}>Conteúdo</span>
                <ul className={styles.sidebarList}>
                    {sections.map((section) => (
                        <li key={section.id}>
                            <a
                                href={`#section-${section.id}`}
                                className={styles.sidebarLink}
                                onClick={(e) => handleClick(e, `section-${section.id}`)}
                            >
                                {section.title}
                            </a>
                        </li>
                    ))}
                </ul>
                <button
                    className={`${styles.scrollTopBtn} ${showTop ? styles.scrollTopBtnVisible : ""}`}
                    onClick={scrollToTop}
                    aria-label="Voltar ao topo"
                >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                        <polyline points="18 15 12 9 6 15" />
                    </svg>
                </button>
            </nav>

            {/* Mobile FAB + drawer */}
            <div className={styles.mobileFab}>
                {drawerOpen && (
                    <div className={styles.mobileDrawer}>
                        <span className={styles.sidebarTitle}>Conteúdo</span>
                        <ul className={styles.sidebarList}>
                            {sections.map((section) => (
                                <li key={section.id}>
                                    <a
                                        href={`#section-${section.id}`}
                                        className={styles.sidebarLink}
                                        onClick={(e) => handleClick(e, `section-${section.id}`)}
                                    >
                                        {section.title}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                <div className={styles.mobileFabButtons}>
                    <button
                        className={`${styles.scrollTopBtn} ${styles.scrollTopBtnMobile} ${showTop ? styles.scrollTopBtnVisible : ""}`}
                        onClick={scrollToTop}
                        aria-label="Voltar ao topo"
                    >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
                            <polyline points="18 15 12 9 6 15" />
                        </svg>
                    </button>
                    <button
                        className={styles.fabToggle}
                        onClick={() => setDrawerOpen((prev) => !prev)}
                        aria-label="Toggle menu de conteúdo"
                    >
                        {drawerOpen ? "✕" : "☰"}
                    </button>
                </div>
            </div>
        </>
    );
};

export default DocSidebar;
