"use client";

import { useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import styles from "../styles/ArchitectureDeployment.module.css";

const ArchitectureDrawCanvas = dynamic(
    () => import("./ArchitectureDrawCanvas"),
    { ssr: false }
);

const STEPS = {
    UPLOAD: "upload",
    DRAW: "draw",
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
    const [files, setFiles] = useState([]);
    const [activeFile, setActiveFile] = useState(0);
    const [error, setError] = useState(null);
    const [copied, setCopied] = useState(false);
    const fileInputRef = useRef(null);

    // Core API submission — shared by file upload and canvas draw
    const submitDiagram = useCallback(async (content, format, displayName, fallbackStep = STEPS.UPLOAD) => {
        setFileName(displayName);
        setStep(STEPS.PROCESSING);

        try {
            const res = await fetch("/api/analyze-architecture", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content, format }),
            });
            const data = await res.json();
            if (!res.ok || data.error) {
                setError(data.error || "Erro ao gerar o código Terraform.");
                setStep(fallbackStep);
                return;
            }
            setFiles(data.files ?? []);
            setActiveFile(0);
            setStep(STEPS.RESULT);
        } catch {
            setError("Erro de conexão. Verifique sua rede e tente novamente.");
            setStep(fallbackStep);
        }
    }, []);

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

        await submitDiagram(text, format, file.name, STEPS.UPLOAD);
    }, [submitDiagram]);

    const handleGenerateFromCanvas = useCallback(async (content, displayName) => {
        setError(null);
        await submitDiagram(content, "excalidraw", displayName, STEPS.UPLOAD);
    }, [submitDiagram]);

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
        const content = files[activeFile]?.content ?? "";
        navigator.clipboard.writeText(content).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const handleDownloadActive = () => {
        const f = files[activeFile];
        if (!f) return;
        triggerDownload(f.filename, f.content);
    };

    const handleDownloadAll = () => {
        files.forEach((f, i) => {
            setTimeout(() => triggerDownload(f.filename, f.content), i * 200);
        });
    };

    const triggerDownload = (filename, content) => {
        const blob = new Blob([content], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleReset = () => {
        setStep(STEPS.UPLOAD);
        setFileName("");
        setFiles([]);
        setActiveFile(0);
        setError(null);
        setCopied(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const currentFile = files[activeFile];

    // Drawing mode — renders full-bleed canvas outside the padded container
    if (step === STEPS.DRAW) {
        return (
            <ArchitectureDrawCanvas
                onGenerate={handleGenerateFromCanvas}
                onBack={() => { setError(null); setStep(STEPS.UPLOAD); }}
            />
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>ARCHITECTURE DEPLOYMENT</h1>
                <p className={styles.subtitle}>
                    Importe um diagrama do{" "}
                    <span className={styles.highlight}>Excalidraw</span> ou{" "}
                    <span className={styles.highlight}>draw.io</span> — ou desenhe
                    aqui mesmo — e gere automaticamente o código{" "}
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

                    <div className={styles.orDivider}>
                        <span>ou</span>
                    </div>

                    <button
                        className={styles.drawBtn}
                        onClick={() => setStep(STEPS.DRAW)}
                    >
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                            <path
                                d="M13.5 2.5a1.414 1.414 0 0 1 2 2L6 14l-3.5 1 1-3.5L13.5 2.5Z"
                                stroke="currentColor"
                                strokeWidth="1.4"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                        Desenhe sua arquitetura aqui
                    </button>

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
                    <div className={styles.shimmerWrap}>
                        <div className={styles.shimmerBar} />
                        <div className={styles.shimmerBar} />
                        <div className={styles.shimmerBar} />
                        <div className={styles.shimmerBar} />
                        <div className={styles.shimmerBar} />
                    </div>
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
                            <span className={styles.resultBadge}>
                                {files.length} {files.length === 1 ? "arquivo" : "arquivos"}
                            </span>
                        </div>
                        <div className={styles.resultActions}>
                            <button className={styles.actionBtn} onClick={handleCopy}>
                                {copied ? "✓ Copiado!" : "Copiar"}
                            </button>
                            <button
                                className={`${styles.actionBtn} ${styles.downloadBtn}`}
                                onClick={handleDownloadActive}
                            >
                                ↓ {currentFile?.filename}
                            </button>
                            {files.length > 1 && (
                                <button
                                    className={`${styles.actionBtn} ${styles.downloadAllBtn}`}
                                    onClick={handleDownloadAll}
                                >
                                    ↓ Todos ({files.length})
                                </button>
                            )}
                            <button
                                className={`${styles.actionBtn} ${styles.resetBtn}`}
                                onClick={handleReset}
                            >
                                Novo diagrama
                            </button>
                        </div>
                    </div>

                    {files.length > 1 && (
                        <div className={styles.fileTabs}>
                            {files.map((f, i) => (
                                <button
                                    key={f.filename}
                                    className={`${styles.fileTab} ${i === activeFile ? styles.fileTabActive : ""}`}
                                    onClick={() => { setActiveFile(i); setCopied(false); }}
                                >
                                    {f.filename}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className={styles.codeWrapper}>
                        <div className={styles.codeHeader}>
                            <span className={styles.codeFilename}>{currentFile?.filename}</span>
                            <span className={styles.codeLang}>HCL</span>
                        </div>
                        <pre className={styles.codeBlock}>
                            <code>{currentFile?.content}</code>
                        </pre>
                    </div>
                </div>
            )}
        </div>
    );
}
