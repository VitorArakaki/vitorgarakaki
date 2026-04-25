"use client";

import { useState, useCallback, useRef } from "react";
import styles from "../styles/ArchitectureDeployment.module.css";

const STEPS = {
    UPLOAD: "upload",
    PROCESSING: "processing",
    RESULT: "result",
};

function detectFormat(filename, content) {
    const lower = filename.toLowerCase();
    if (lower.endsWith(".excalidraw")) return "excalidraw";
    if (lower.endsWith(".drawio") || lower.endsWith(".xml")) return "drawio";
    const trimmed = content.trim();
    if (trimmed.startsWith("{")) return "excalidraw";
    if (trimmed.startsWith("<")) return "drawio";
    return "unknown";
}

export default function ArchitectureDeployment() {
    const [step, setStep] = useState(STEPS.UPLOAD);
    const [isDragging, setIsDragging] = useState(false);
    const [fileName, setFileName] = useState("");
    const [terraform, setTerraform] = useState("");
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);
    const [activeTab, setActiveTab] = useState("main");
    const fileInputRef = useRef(null);

    const processFile = useCallback(async (file) => {
        setError(null);
        let text;
        try {
            text = await file.text();
        } catch {
            setError("Não foi possível ler o arquivo.");
            return;
        }

        const format = detectFormat(file.name, text);
        if (format === "unknown") {
            setError(
                "Formato não suportado. Envie um arquivo .excalidraw ou .drawio / .xml."
            );
            return;
        }

        setFileName(file.name);
        setStep(STEPS.PROCESSING);

        try {
            const res = await fetch("/api/analyze-architecture", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: text, format }),
            });
            const data = await res.json();
            if (!res.ok || data.error) {
                setError(data.error || "Erro ao gerar o código Terraform.");
                setStep(STEPS.UPLOAD);
                return;
            }
            setTerraform(data.terraform);
            setActiveTab("main");
            setStep(STEPS.RESULT);
        } catch {
            setError("Erro de conexão. Verifique sua rede e tente novamente.");
            setStep(STEPS.UPLOAD);
        }
    }, []);

    const onDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };
    const onDragLeave = () => setIsDragging(false);
    const onDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file) processFile(file);
    };
    const onFileChange = (e) => {
        const file = e.target.files[0];
        if (file) processFile(file);
    };

    const handleCopy = () => {
        const content = getActiveContent();
        navigator.clipboard.writeText(content).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const handleDownload = () => {
        const content = getActiveContent();
        const filename = activeTab === "main" ? "main.tf" : `${activeTab}.tf`;
        const blob = new Blob([content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleDownloadAll = () => {
        const blob = new Blob([terraform], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "main.tf";
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleReset = () => {
        setStep(STEPS.UPLOAD);
        setFileName("");
        setTerraform("");
        setError(null);
        setCopied(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // Split terraform output into logical sections for tabs
    const parseSections = (tf) => {
        const sections = { main: tf };
        const providerMatch = tf.match(/^(terraform\s*\{[\s\S]*?\}[\s\S]*?^provider\s+"[^"]*"\s*\{[\s\S]*?\})/m);
        const resourceMatches = [...tf.matchAll(/^resource\s+"([^"]+)"/gm)];
        const uniqueTypes = [...new Set(resourceMatches.map((m) => m[1]))];
        if (uniqueTypes.length > 1) {
            sections["Recursos (" + resourceMatches.length + ")"] = tf;
        }
        return sections;
    };

    const getActiveContent = () => terraform;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>ARCHITECTURE DEPLOYMENT</h1>
                <p className={styles.subtitle}>
                    Importe um diagrama do{" "}
                    <span className={styles.highlight}>Excalidraw</span> ou{" "}
                    <span className={styles.highlight}>draw.io</span> e gere
                    automaticamente o código{" "}
                    <span className={styles.highlight}>Terraform</span> para
                    provisionar toda a infraestrutura AWS.
                </p>
            </div>

            {error && (
                <div className={styles.errorBanner}>
                    <span className={styles.errorIcon}>⚠</span> {error}
                </div>
            )}

            {step === STEPS.UPLOAD && (
                <div className={styles.uploadSection}>
                    <div
                        className={`${styles.dropzone} ${isDragging ? styles.dropzoneActive : ""}`}
                        onDragOver={onDragOver}
                        onDragLeave={onDragLeave}
                        onDrop={onDrop}
                        onClick={() => fileInputRef.current?.click()}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".excalidraw,.drawio,.xml"
                            style={{ display: "none" }}
                            onChange={onFileChange}
                        />
                        <div className={styles.uploadIcon}>
                            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
                                <path
                                    d="M24 32V16M24 16L17 23M24 16L31 23"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                                <path
                                    d="M8 36C8 38.2 9.8 40 12 40H36C38.2 40 40 38.2 40 36"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </div>
                        <p className={styles.dropzoneText}>
                            Arraste seu diagrama aqui ou clique para selecionar
                        </p>
                        <p className={styles.dropzoneHint}>
                            .excalidraw &nbsp;·&nbsp; .drawio &nbsp;·&nbsp; .xml
                        </p>
                    </div>

                    <div className={styles.infoCards}>
                        <div className={styles.infoCard}>
                            <span className={styles.infoCardIcon}>✏</span>
                            <div>
                                <strong>Excalidraw</strong>
                                <p>Exporte como .excalidraw via File → Save to disk</p>
                            </div>
                        </div>
                        <div className={styles.infoCard}>
                            <span className={styles.infoCardIcon}>◈</span>
                            <div>
                                <strong>draw.io / diagrams.net</strong>
                                <p>Exporte como .drawio ou .xml via File → Save As</p>
                            </div>
                        </div>
                        <div className={styles.infoCard}>
                            <span className={styles.infoCardIcon}>☁</span>
                            <div>
                                <strong>Somente AWS</strong>
                                <p>Identifica serviços EC2, S3, RDS, Lambda, VPC, IAM e mais</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {step === STEPS.PROCESSING && (
                <div className={styles.processingBox}>
                    <div className={styles.spinnerRing} />
                    <p className={styles.processingTitle}>Gerando Terraform…</p>
                    <p className={styles.processingMsg}>
                        Analisando diagrama e identificando recursos AWS
                    </p>
                    <div className={styles.processingSteps}>
                        <span className={styles.processingStep}>▸ Lendo diagrama</span>
                        <span className={styles.processingStep}>▸ Identificando serviços AWS</span>
                        <span className={styles.processingStep}>▸ Mapeando dependências</span>
                        <span className={styles.processingStep}>▸ Gerando IAM roles</span>
                        <span className={styles.processingStep}>▸ Escrevendo HCL</span>
                    </div>
                </div>
            )}

            {step === STEPS.RESULT && (
                <div className={styles.resultSection}>
                    <div className={styles.resultToolbar}>
                        <div className={styles.resultMeta}>
                            <span className={styles.resultFileName}>{fileName}</span>
                            <span className={styles.resultBadge}>Terraform HCL</span>
                        </div>
                        <div className={styles.resultActions}>
                            <button className={styles.actionBtn} onClick={handleCopy}>
                                {copied ? "✓ Copiado!" : "Copiar"}
                            </button>
                            <button
                                className={`${styles.actionBtn} ${styles.downloadBtn}`}
                                onClick={handleDownloadAll}
                            >
                                ↓ main.tf
                            </button>
                            <button
                                className={`${styles.actionBtn} ${styles.resetBtn}`}
                                onClick={handleReset}
                            >
                                Novo diagrama
                            </button>
                        </div>
                    </div>

                    <div className={styles.codeWrapper}>
                        <div className={styles.codeHeader}>
                            <span className={styles.codeFilename}>main.tf</span>
                            <span className={styles.codeLang}>HCL</span>
                        </div>
                        <pre className={styles.codeBlock}>
                            <code>{terraform}</code>
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );
}
