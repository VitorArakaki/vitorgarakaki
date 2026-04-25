"use client";

import { useState } from "react";
import { FURNITURE_CATALOG } from "../data/furnitureCatalog";
import styles from "../styles/FurniturePanel.module.css";

export default function FurniturePanel({ pendingFurniture, onPickFurniture, onCancelFurniture }) {
    const [open, setOpen] = useState(false);
    const [expandedCat, setExpandedCat] = useState(null);

    const toggle = () => setOpen((v) => !v);
    const toggleCat = (id) => setExpandedCat((v) => (v === id ? null : id));

    const pickItem = (item) => {
        onPickFurniture(item);
        setOpen(false);
    };

    return (
        <div className={`${styles.wrapper} ${open ? styles.wrapperOpen : ""}`}>
            <div className={styles.panel}>
                <div className={styles.header}>
                    <span className={styles.title}>Móveis</span>
                    {pendingFurniture && (
                        <div className={styles.placingBadge}>
                            <span>
                                Posicionando: <b>{pendingFurniture.label}</b>
                            </span>
                            <button
                                className={styles.cancelBtn}
                                onClick={onCancelFurniture}
                                title="Cancelar (Esc)"
                            >
                                ✕
                            </button>
                        </div>
                    )}
                    {!pendingFurniture && (
                        <p className={styles.hint}>
                            Selecione um item para posicionar no ambiente
                        </p>
                    )}
                </div>
                <div className={styles.categories}>
                    {FURNITURE_CATALOG.map((cat) => (
                        <div key={cat.id} className={styles.category}>
                            <button
                                className={`${styles.catHeader} ${expandedCat === cat.id ? styles.catHeaderOpen : ""}`}
                                onClick={() => toggleCat(cat.id)}
                            >
                                <span>
                                    {cat.icon} {cat.label}
                                </span>
                                <span className={styles.chevron}>
                                    {expandedCat === cat.id ? "▾" : "▸"}
                                </span>
                            </button>
                            {expandedCat === cat.id && (
                                <div className={styles.items}>
                                    {cat.items.map((item) => (
                                        <button
                                            key={item.id}
                                            className={`${styles.item} ${pendingFurniture?.id === item.id ? styles.itemActive : ""}`}
                                            onClick={() => pickItem(item)}
                                            title={item.label}
                                        >
                                            <span
                                                className={styles.itemSwatch}
                                                style={{ background: item.color }}
                                            />
                                            <span className={styles.itemLabel}>{item.label}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <button
                className={`${styles.toggleBtn} ${open ? styles.toggleBtnOpen : ""}`}
                onClick={toggle}
                title={open ? "Fechar painel de móveis" : "Adicionar móveis"}
            >
                {open ? "◀" : "🛋️"}
            </button>
        </div>
    );
}
