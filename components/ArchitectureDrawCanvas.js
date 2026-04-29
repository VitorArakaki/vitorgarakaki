"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import "@excalidraw/excalidraw/index.css";
import styles from "../styles/ArchitectureDrawCanvas.module.css";

const Excalidraw = dynamic(
    async () => (await import("@excalidraw/excalidraw")).Excalidraw,
    {
        ssr: false,
        loading: () => <div className={styles.loading}>Carregando editor…</div>,
    }
);

export default function ArchitectureDrawCanvas({ onGenerate, onBack }) {
    const [excalidrawAPI, setExcalidrawAPI] = useState(null);

    // Load bundled AWS icon library once the Excalidraw API is ready
    useEffect(() => {
        if (!excalidrawAPI) return;

        fetch("/assets/libraries/aws-icons.excalidrawlib")
            .then((r) => r.json())
            .then((data) => {
                const libraryItems = data.libraryItems ?? [];
                if (libraryItems.length > 0) {
                    excalidrawAPI.updateLibrary({
                        libraryItems,
                        merge: true,
                        openLibraryMenu: false,
                    });
                }
            })
            .catch(() => {}); // silent — canvas works fine without pre-loaded icons
    }, [excalidrawAPI]);

    const handleGenerate = () => {
        if (!excalidrawAPI) return;

        const elements = excalidrawAPI.getSceneElements();
        const appState = excalidrawAPI.getAppState();
        const files = excalidrawAPI.getFiles();

        const excalidrawData = {
            type: "excalidraw",
            version: 2,
            source: "in-platform",
            elements,
            appState: {
                gridSize: appState.gridSize,
                viewBackgroundColor: appState.viewBackgroundColor,
            },
            files,
        };

        onGenerate(JSON.stringify(excalidrawData), "diagram.excalidraw");
    };

    return (
        <div className={styles.wrapper}>
            <div className={styles.toolbar}>
                <button className={styles.backBtn} onClick={onBack}>
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                        <path
                            d="M9.5 12L5.5 7.5L9.5 3"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                    Voltar
                </button>

                <span className={styles.hint}>
                    Adicione formas e labels para os serviços AWS, use setas para as conexões
                </span>

                <button className={styles.generateBtn} onClick={handleGenerate}>
                    Gerar Terraform
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                        <path
                            d="M3 7.5H12M12 7.5L8 3.5M12 7.5L8 11.5"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />
                    </svg>
                </button>
            </div>

            <div className={styles.canvas}>
                <Excalidraw excalidrawAPI={(api) => setExcalidrawAPI(api)} />
            </div>
        </div>
    );
}
