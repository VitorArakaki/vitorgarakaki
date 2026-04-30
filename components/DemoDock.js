"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import styles from "../styles/DemoDock.module.css";

export default function DemoDock({ demos, currentSlug }) {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [isOpen]);

    // Close on Escape
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e) => { if (e.key === "Escape") setIsOpen(false); };
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [isOpen]);

    if (!demos || demos.length < 2) return null;

    const current = demos.find((d) => d.slug === currentSlug);

    return (
        <div className={styles.wrapper} ref={wrapperRef}>
            {/* ── Expanded panel ── */}
            <div
                className={`${styles.panel} ${isOpen ? styles.panelOpen : ""}`}
                aria-hidden={!isOpen}
            >
                <p className={styles.panelLabel}>Demos ao vivo</p>

                <div className={styles.grid}>
                    {demos.map((demo) => {
                        const isCurrent = demo.slug === currentSlug;

                        if (isCurrent) {
                            return (
                                <div
                                    key={demo.slug}
                                    className={`${styles.demoCard} ${styles.demoCardActive}`}
                                >
                                    <div className={styles.thumbWrap}>
                                        <img
                                            src={demo.image}
                                            alt=""
                                            className={styles.thumb}
                                            aria-hidden="true"
                                        />
                                        <span className={styles.activeDot} aria-hidden="true" />
                                    </div>
                                    <span className={styles.demoName}>{demo.title}</span>
                                    <span className={styles.activePill}>Em uso</span>
                                </div>
                            );
                        }

                        return (
                            <Link
                                key={demo.slug}
                                href={`${demo.pagePath}/demo`}
                                className={styles.demoCard}
                                onClick={() => setIsOpen(false)}
                                aria-label={`Abrir demo: ${demo.title}`}
                            >
                                <div className={styles.thumbWrap}>
                                    <img
                                        src={demo.image}
                                        alt=""
                                        className={styles.thumb}
                                        aria-hidden="true"
                                    />
                                </div>
                                <span className={styles.demoName}>{demo.title}</span>
                                <span className={styles.openPill}>
                                    Abrir
                                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                                        <path d="M2 5h6M8 5L5.5 2.5M8 5L5.5 7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </div>

            {/* ── Trigger pill ── */}
            <button
                className={`${styles.trigger} ${isOpen ? styles.triggerOpen : ""}`}
                onClick={() => setIsOpen((v) => !v)}
                aria-expanded={isOpen}
                aria-label="Ver todas as demos"
            >
                {/* Play icon */}
                <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor" aria-hidden="true">
                    <polygon points="2,1 9,5 2,9" />
                </svg>

                <span className={styles.triggerText}>Demos</span>

                <span className={styles.triggerCount}>{demos.length}</span>

                {/* Chevron */}
                <svg
                    className={`${styles.chevron} ${isOpen ? styles.chevronUp : ""}`}
                    width="12"
                    height="12"
                    viewBox="0 0 12 12"
                    fill="none"
                    aria-hidden="true"
                >
                    <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>
        </div>
    );
}
