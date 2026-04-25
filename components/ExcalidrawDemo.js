"use client";

import dynamic from "next/dynamic";
import styles from "../styles/ExcalidrawDemo.module.css";
import "@excalidraw/excalidraw/index.css";

const Excalidraw = dynamic(
    async () => (await import("@excalidraw/excalidraw")).Excalidraw,
    { ssr: false, loading: () => null }
);

export default function ExcalidrawDemo() {
    return (
        <div className={styles.excalidrawWrapper}>
            <Excalidraw />
        </div>
    );
}
