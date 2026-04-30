"use client";

import Link from "next/link";
import styles from "../styles/CardShow.module.css";

const CardShow = ({ items }) => {
    return (
        <div className={styles.grid}>
            {items.map((item, index) => (
                <div key={index} className={styles.card}>
                    <img
                        src={item.image}
                        alt={item.title}
                        className={styles.cardImage}
                    />

                    {/* Always-visible demo badge */}
                    {item.hasDemo && (
                        <Link
                            href={`${item.pagePath}/demo`}
                            className={styles.demoBadge}
                        >
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                                <polygon points="2,1 9,5 2,9" />
                            </svg>
                            Demo
                        </Link>
                    )}

                    {/* Hover overlay */}
                    <div className={styles.overlay}>
                        {/* Stretched transparent link — covers the whole card, navigates to project */}
                        <Link
                            href={item.pagePath}
                            className={styles.cardLink}
                            aria-label={`Ver projeto ${item.title}`}
                        />

                        <div className={styles.overlayBody}>
                            <span className={styles.title}>{item.title}</span>
                            <span className={styles.description}>{item.description}</span>
                        </div>

                        {item.hasDemo && (
                            <Link
                                href={`${item.pagePath}/demo`}
                                className={styles.demoLink}
                            >
                                Abrir demo
                                <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                                    <path
                                        d="M2.5 6.5H10.5M10.5 6.5L7 3M10.5 6.5L7 10"
                                        stroke="currentColor"
                                        strokeWidth="1.4"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </Link>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default CardShow;
