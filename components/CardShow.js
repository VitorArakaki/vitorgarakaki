"use client";

import Link from "next/link";
import styles from "../styles/CardShow.module.css";

const CardShow = ({ items }) => {
    return (
        <div className={styles.grid}>
            {items.map((item, index) => (
                <Link key={index} href={item.pagePath} className={styles.card}>
                    <img
                        src={item.image}
                        alt={item.title}
                        className={styles.cardImage}
                    />
                    <div className={styles.overlay}>
                        <span className={styles.title}>{item.title}</span>
                        <span className={styles.description}>{item.description}</span>
                    </div>
                </Link>
            ))}
        </div>
    );
};

export default CardShow;
