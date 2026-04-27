"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import styles from "../styles/EnvironmentVirtualizer.module.css";
import FurniturePanel from "./FurniturePanel";

const WALL_PRESETS = [
    "#ede8e0", "#ffffff", "#f5f0e8", "#e8e0d5",
    "#c8d8e8", "#d5e8d5", "#e8d5e8", "#e8d5d5",
    "#2a2a2a", "#1a1a2e",
];
const FLOOR_PRESETS = [
    "#c8b89b", "#8b6914", "#d4a574", "#6b4226",
    "#b8a898", "#4a4a4a", "#8b7355", "#e8dcc8",
    "#5c5c5c", "#a0856a",
];
const DOOR_PRESETS = [
    "#7a5c2e", "#5c3d1e", "#a0784a", "#c8a97e",
    "#3d2b1a", "#b87333", "#ffffff", "#2a2a2a",
];
const DEFAULT_WALL_COLOR = "#ede8e0";
const DEFAULT_WALL = { inner: DEFAULT_WALL_COLOR, outer: DEFAULT_WALL_COLOR };
const mkWallColors = (n) => Array.from({ length: n }, () => ({ ...DEFAULT_WALL }));

// Derive wall count from roomData. roomData.walls is an optional explicit array;
// rectangular rooms always have 4 walls so we default to 4.
const wallCountFromRoomData = (rd) => rd?.walls?.length ?? 4;

const Room3D = dynamic(() => import("./Room3D"), {
    ssr: false,
    loading: () => <div className={styles.loadingScene}><div className={styles.shimmerScene} /></div>,
});

const STEPS = { UPLOAD: "upload", PROCESSING: "processing", RESULT: "result", MANUAL: "manual" };

export default function EnvironmentVirtualizer() {
    const [step, setStep] = useState(STEPS.UPLOAD);
    const [preview, setPreview] = useState(null);
    const [roomData, setRoomData] = useState(null);
    const [error, setError] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [processingMsg, setProcessingMsg] = useState("");
    const [manual, setManual] = useState({ width: "4", depth: "3.5", height: "2.0" });
    const [targetView, setTargetView] = useState(null);
    const [activeViewKey, setActiveViewKey] = useState("perspective");
    const [config, setConfig] = useState({
        wallColors: mkWallColors(4),
        floorColor: "#c8b89b",
        doorColor: "#7a5c2e",
    });
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [selectedWall, setSelectedWall] = useState(null); // null | number index
    const [wallFace, setWallFace] = useState("inner"); // "inner" | "outer"

    // ── Furniture state ──────────────────────────────────────────────────
    const [pendingFurniture, setPendingFurniture] = useState(null); // catalog item being placed
    const [placedFurniture, setPlacedFurniture] = useState([]);     // placed items in scene
    const [selectedFurnitureId, setSelectedFurnitureId] = useState(null); // selected placed id
    const pendingFurnitureRef = useRef(null);
    pendingFurnitureRef.current = pendingFurniture;

    // Keep wallColors array in sync whenever roomData changes (different wall count).
    useEffect(() => {
        const n = wallCountFromRoomData(roomData);
        setConfig((v) => {
            if (v.wallColors.length === n) return v;
            // Expand: keep existing colours, pad with defaults.
            // Shrink: keep first n.
            const next = Array.from({ length: n }, (_, i) => v.wallColors[i] ?? { ...DEFAULT_WALL });
            return { ...v, wallColors: next };
        });
        // Reset wall selection if it's out of range.
        setSelectedWall((prev) => (prev !== null && prev >= n ? null : prev));
    }, [roomData]);

    const handleWallClick = (key) => {
        setSelectedWall(key);
        if (key !== null) setSidebarOpen(true);
    };

    const setWallColor = (color) => {
        const face = wallFace; // "inner" | "outer"
        if (selectedWall !== null) {
            setConfig((v) => {
                const wc = [...v.wallColors];
                wc[selectedWall] = { ...wc[selectedWall], [face]: color };
                return { ...v, wallColors: wc };
            });
        } else {
            setConfig((v) => ({
                ...v,
                wallColors: v.wallColors.map((w) => ({ ...w, [face]: color })),
            }));
        }
    };

    const handleWallDrag = useCallback((wallIndex, delta) => {
        setRoomData((prev) => {
            if (!prev) return prev;
            // Polygon room: shift two vertices along the wall's outward normal
            if (prev.shape === "polygon" && Array.isArray(prev.vertices)) {
                const verts = prev.vertices.map((v) => [v[0], v[1]]);
                const n = verts.length;
                const v0 = verts[wallIndex];
                const v1 = verts[(wallIndex + 1) % n];
                const dx = v1[0] - v0[0], dz = v1[1] - v0[1];
                const len = Math.sqrt(dx * dx + dz * dz) || 1;
                // outward normal for CCW polygon = right-of-travel = (dz, -dx) / len
                const nx = dz / len, nz = -dx / len;
                verts[wallIndex] = [v0[0] + nx * delta, v0[1] + nz * delta];
                verts[(wallIndex + 1) % n] = [v1[0] + nx * delta, v1[1] + nz * delta];
                return { ...prev, vertices: verts };
            }
            // Rectangular room: move the relevant wall by changing width/depth
            const { width = 4, depth = 3.5 } = prev;
            if (wallIndex === 0) return { ...prev, depth: Math.max(0.5, depth - delta) };
            if (wallIndex === 1) return { ...prev, depth: Math.max(0.5, depth + delta) };
            if (wallIndex === 2) return { ...prev, width: Math.max(0.5, width + delta) };
            if (wallIndex === 3) return { ...prev, width: Math.max(0.5, width - delta) };
            return prev;
        });
    }, []);

    const handleVertexMove = useCallback((vertexIndex, ddx, ddz) => {
        setRoomData((prev) => {
            if (!prev?.vertices) return prev;
            const verts = prev.vertices.map((v) => [v[0], v[1]]);
            verts[vertexIndex] = [verts[vertexIndex][0] + ddx, verts[vertexIndex][1] + ddz];
            return { ...prev, vertices: verts };
        });
    }, []);

    const handleWindowHeightResize = useCallback((wallIndex, dy) => {
        setRoomData((prev) => {
            if (!prev?.walls || !prev?.vertices) return prev;
            const verts = prev.vertices;
            const n = verts.length;
            const v0 = verts[wallIndex], v1 = verts[(wallIndex + 1) % n];
            const wallLen = Math.hypot(v1[0] - v0[0], v1[1] - v0[1]);
            const { height = 2.0 } = prev;
            const winY = Math.min(0.9, height * 0.3);
            const maxH = height - winY - 0.1;
            const walls = prev.walls.map((w, i) => {
                if (i !== wallIndex || !w.hasWindow) return w;
                const defaultH = Math.min(1.0, height * 0.35);
                const newH = Math.max(0.2, Math.min(maxH, (w.windowHeight ?? defaultH) + dy));
                return { ...w, windowHeight: newH };
            });
            return { ...prev, walls };
        });
    }, []);

    const handleFeatureLiveMove = useCallback((featureType, wallIndex, delta) => {
        setRoomData((prev) => {
            if (!prev?.walls || !prev?.vertices) return prev;
            const verts = prev.vertices;
            const n = verts.length;
            const v0 = verts[wallIndex], v1 = verts[(wallIndex + 1) % n];
            const wallLen = Math.hypot(v1[0] - v0[0], v1[1] - v0[1]);
            const walls = prev.walls.map((w, i) => {
                if (i !== wallIndex) return w;
                if (featureType === "door" && w.hasDoor) {
                    const doorW = Math.min(0.9, wallLen * 0.35);
                    const maxOff = Math.max(0, (wallLen - doorW) / 2 - 0.05);
                    return { ...w, doorOffset: Math.max(-maxOff, Math.min(maxOff, (w.doorOffset ?? 0) + delta)) };
                }
                if (featureType === "window" && w.hasWindow) {
                    const winW = w.windowWidth ?? Math.min(1.2, wallLen * 0.4);
                    const maxOff = Math.max(0, (wallLen - winW) / 2 - 0.05);
                    return { ...w, windowOffset: Math.max(-maxOff, Math.min(maxOff, (w.windowOffset ?? 0) + delta)) };
                }
                return w;
            });
            return { ...prev, walls };
        });
    }, []);

    const handleWindowResize = useCallback((wallIndex, delta) => {
        setRoomData((prev) => {
            if (!prev?.walls || !prev?.vertices) return prev;
            const verts = prev.vertices;
            const n = verts.length;
            const v0 = verts[wallIndex], v1 = verts[(wallIndex + 1) % n];
            const wallLen = Math.hypot(v1[0] - v0[0], v1[1] - v0[1]);
            const walls = prev.walls.map((w, i) => {
                if (i !== wallIndex || !w.hasWindow) return w;
                const defaultW = Math.min(1.2, wallLen * 0.4);
                const newW = Math.max(0.3, Math.min(wallLen - 0.3, (w.windowWidth ?? defaultW) + delta));
                const maxOff = Math.max(0, (wallLen - newW) / 2 - 0.05);
                const clampedOff = Math.max(-maxOff, Math.min(maxOff, w.windowOffset ?? 0));
                return { ...w, windowWidth: newW, windowOffset: clampedOff };
            });
            return { ...prev, walls };
        });
    }, []);

    const handleFeatureDrop = useCallback((featureType, worldX, worldZ) => {
        setRoomData((prev) => {
            if (!prev?.walls || !prev?.vertices) return prev;
            const verts = prev.vertices;
            const n = verts.length;
            const isDoor = featureType === "door";
            // Find the closest wall that doesn't have a conflicting feature
            let bestWall = -1, bestDist = Infinity, bestT = 0;
            for (let i = 0; i < n; i++) {
                const w = prev.walls[i];
                // Don't place window on a door wall or door on a window wall
                if (isDoor && w.hasWindow && !w.hasDoor) continue;
                if (!isDoor && w.hasDoor && !w.hasWindow) continue;
                const v0 = verts[i], v1 = verts[(i + 1) % n];
                const dx = v1[0] - v0[0], dz = v1[1] - v0[1];
                const len2 = dx * dx + dz * dz;
                if (len2 < 1e-10) continue;
                const t = Math.max(0, Math.min(1, ((worldX - v0[0]) * dx + (worldZ - v0[1]) * dz) / len2));
                const px = v0[0] + t * dx, pz = v0[1] + t * dz;
                const dist = Math.hypot(worldX - px, worldZ - pz);
                if (dist < bestDist) { bestWall = i; bestDist = dist; bestT = t; }
            }
            // No valid candidate — keep state unchanged
            if (bestWall === -1) return prev;
            const v0 = verts[bestWall], v1 = verts[(bestWall + 1) % n];
            const wallLen = Math.hypot(v1[0] - v0[0], v1[1] - v0[1]);
            const rawOffset = (bestT - 0.5) * wallLen;
            const featW = isDoor ? Math.min(0.9, wallLen * 0.35) : Math.min(1.2, wallLen * 0.4);
            const maxOff = Math.max(0, (wallLen - featW) / 2 - 0.05);
            const clampedOff = Math.max(-maxOff, Math.min(maxOff, rawOffset));
            const walls = prev.walls.map((w, i) => {
                if (i === bestWall) {
                    return isDoor
                        ? { ...w, hasDoor: true, doorOffset: clampedOff }
                        : { ...w, hasWindow: true, windowOffset: clampedOff };
                }
                return isDoor ? { ...w, hasDoor: false } : { ...w, hasWindow: false };
            });
            return { ...prev, walls };
        });
    }, []);

    // ── Furniture callbacks ───────────────────────────────────────────────
    // Escape key cancels pending placement
    useEffect(() => {
        if (!pendingFurniture) return;
        const fn = (e) => { if (e.key === "Escape") setPendingFurniture(null); };
        window.addEventListener("keydown", fn);
        return () => window.removeEventListener("keydown", fn);
    }, [pendingFurniture]);

    const handlePickFurniture = useCallback((item) => {
        setPendingFurniture(item);
        setSelectedFurnitureId(null);
    }, []);

    // Stable callback — reads pendingFurniture via ref to avoid dep-array issues
    const handlePlaceFurniture = useCallback(({ x, y = 0, z, rotationY = 0, wallMounted = false, wallNormal = null }) => {
        const item = pendingFurnitureRef.current;
        if (!item) return;
        const id = `${item.id}_${Date.now()}`;
        setPlacedFurniture((prev) => [
            ...prev,
            {
                id, label: item.label, color: item.color, size: item.size, shape: item.shape,
                position: [x, wallMounted ? y : 0, z],
                rotationY: wallMounted ? rotationY : 0,
                wallMounted: wallMounted || false,
                wallNormal: wallNormal || null,
                scale: 1,
            },
        ]);
        setPendingFurniture(null);
    }, []);

    const handleSelectFurniture = useCallback((id) => {
        setSelectedFurnitureId(id);
    }, []);

    const handleDeleteFurniture = useCallback((id) => {
        setPlacedFurniture((prev) => prev.filter((f) => f.id !== id));
        setSelectedFurnitureId(null);
    }, []);

    const handleMoveFurniture = useCallback((id, x, y, z, rotationY, wallNormal) => {
        setPlacedFurniture((prev) => prev.map((f) => {
            if (f.id !== id) return f;
            const update = { ...f, position: [x, f.wallMounted ? y : 0, z] };
            // If coming from a wall-mounted drag with a new wall snap, update rotation+normal
            if (f.wallMounted && rotationY !== undefined) {
                update.rotationY = rotationY;
                if (wallNormal) update.wallNormal = wallNormal;
            }
            return update;
        }));
    }, []);

    const handleRotateFurniture = useCallback((id, delta) => {
        setPlacedFurniture((prev) => prev.map((f) => (f.id === id ? { ...f, rotationY: (f.rotationY ?? 0) + delta } : f)));
    }, []);

    const handleScaleFurniture = useCallback((id, axis, delta) => {
        // axis: "x" = largura, "y" = altura, "z" = profundidade
        // cylinders keep scaleX === scaleZ (radius is uniform)
        setPlacedFurniture((prev) =>
            prev.map((f) => {
                if (f.id !== id) return f;
                const key = axis === "x" ? "scaleX" : axis === "y" ? "scaleY" : "scaleZ";
                const cur = f[key] ?? 1;
                const next = Math.max(0.05, Math.min(8.0, cur + delta));
                const update = { [key]: next };
                // for cylinders radius is always square — sync X and Z together
                if (f.shape === "cylinder" && (axis === "x" || axis === "z")) update.scaleZ = next;
                return { ...f, ...update };
            })
        );
    }, []);

    const setWallLength = useCallback((wallIndex, newLen) => {
        if (!roomData?.shape === "polygon" || !Array.isArray(roomData?.vertices)) return;
        setRoomData((prev) => {
            if (!prev?.vertices) return prev;
            const verts = prev.vertices.map((v) => [v[0], v[1]]);
            const n = verts.length;
            const v0 = verts[wallIndex];
            const v1 = verts[(wallIndex + 1) % n];
            const dx = v1[0] - v0[0], dz = v1[1] - v0[1];
            const curLen = Math.sqrt(dx * dx + dz * dz) || 1;
            const ratio = Math.max(0.2, newLen) / curLen;
            // Extend v1 away from v0 by ratio, keeping v0 fixed
            verts[(wallIndex + 1) % n] = [v0[0] + dx * ratio, v0[1] + dz * ratio];
            return { ...prev, vertices: verts };
        });
    }, [roomData]);

    const exportRoom = () => {
        const payload = JSON.stringify({ version: 1, type: "evroom", roomData, config }, null, 2);
        const blob = new Blob([payload], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "ambiente.evroom.json";
        a.click();
        URL.revokeObjectURL(url);
    };

    const importRoom = (file) => {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (data.type !== "evroom" || !data.roomData) {
                    setError("Arquivo inválido. Selecione um .evroom.json exportado por este site.");
                    return;
                }
                setRoomData(data.roomData);
                if (data.config) setConfig(data.config);
                setPreview(null);
                setError(null);
                setStep(STEPS.RESULT);
            } catch {
                setError("Não foi possível ler o arquivo.");
            }
        };
        reader.readAsText(file);
    };

    const goToView = (key) => {
        if (!roomData) return;
        const { width, depth, height } = roomData;
        const d = Math.max(width, depth);
        const mid = height / 2;
        const views = {
            perspective: { position: [d * 1.6, height * 1.4, d * 1.6], target: [0, mid, 0] },
            top: { position: [0, height * 4, 0.001], target: [0, 0, 0] },
            front: { position: [0, mid, depth * 2.8], target: [0, mid, 0] },
            left: { position: [-width * 2.8, mid, 0], target: [0, mid, 0] },
            right: { position: [width * 2.8, mid, 0], target: [0, mid, 0] },
        };
        setActiveViewKey(key);
        setTargetView({ ...views[key], _t: Date.now() });
    };

    const processFile = useCallback(async (file) => {
        if (!file || !file.type.startsWith("image/")) {
            setError("Arquivo inválido. Por favor, envie uma imagem PNG, JPG ou WEBP.");
            return;
        }
        setError(null);
        const reader = new FileReader();
        reader.onload = async (e) => {
            const dataUrl = e.target.result;
            const base64 = dataUrl.split(",")[1];
            setPreview(dataUrl);
            setStep(STEPS.PROCESSING);
            setProcessingMsg("Enviando para Google Vision API…");

            try {
                const res = await fetch("/api/analyze-room", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ imageBase64: base64 }),
                });
                const data = await res.json();

                if (!res.ok) throw new Error(data.error || "Erro ao processar imagem.");

                setProcessingMsg("Construindo modelo 3D…");
                await new Promise((r) => setTimeout(r, 400));
                setRoomData(data);
                setStep(STEPS.RESULT);
            } catch (err) {
                setError(err.message);
                setStep(STEPS.MANUAL);
            }
        };
        reader.readAsDataURL(file);
    }, []);

    const handleDrop = useCallback(
        (e) => {
            e.preventDefault();
            setIsDragging(false);
            processFile(e.dataTransfer.files[0]);
        },
        [processFile]
    );

    const applyManual = () => {
        const w = parseFloat(manual.width);
        const d = parseFloat(manual.depth);
        const h = parseFloat(manual.height);
        if (isNaN(w) || isNaN(d) || isNaN(h) || w <= 0 || d <= 0 || h <= 0) {
            setError("Insira dimensões válidas (números positivos).");
            return;
        }
        setRoomData({
            width: w,
            depth: d,
            height: h,
            features: { hasDoor: true, hasWindow: true },
            allMeasurements: [],
        });
        setError(null);
        setStep(STEPS.RESULT);
    };

    const reset = () => {
        setStep(STEPS.UPLOAD);
        setPreview(null);
        setRoomData(null);
        setError(null);
    };

    // ── UPLOAD ──────────────────────────────────────────────────────────────
    if (step === STEPS.UPLOAD) {
        return (
            <div className={styles.container}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Environment Virtualizer</h2>
                    <p className={styles.subtitle}>
                        Envie uma foto de planta baixa com medidas das paredes, portas e janelas.
                        O sistema interpreta a imagem com Google Vision API e gera uma visualização 3D
                        interativa do ambiente.
                    </p>
                </div>
                {error && <div className={styles.errorBanner}>{error}</div>}
                <div
                    className={`${styles.dropzone} ${isDragging ? styles.dragging : ""}`}
                    onDrop={handleDrop}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onClick={() => document.getElementById("ev-file-input").click()}
                >
                    <div className={styles.dropzoneIcon}>📐</div>
                    <p className={styles.dropzoneText}>Arraste e solte a planta baixa aqui</p>
                    <p className={styles.dropzoneSubtext}>ou clique para selecionar</p>
                    <p className={styles.dropzoneFormats}>PNG · JPG · WEBP · até 10 MB</p>
                </div>
                <input
                    id="ev-file-input"
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={(e) => processFile(e.target.files[0])}
                />
                <label className={styles.importModelButton}>
                    Carregar modelo salvo
                    <input
                        type="file"
                        accept=".json,.evroom.json"
                        style={{ display: "none" }}
                        onChange={(e) => importRoom(e.target.files[0])}
                    />
                </label>
            </div>
        );
    }

    // ── PROCESSING ──────────────────────────────────────────────────────────
    if (step === STEPS.PROCESSING) {
        return (
            <div className={styles.container}>
                <div className={styles.processingContainer}>
                    <div className={styles.shimmerWrap}>
                        <div className={styles.shimmerBar} />
                        <div className={styles.shimmerBar} />
                        <div className={styles.shimmerBar} />
                    </div>
                    <p className={styles.processingText}>{processingMsg}</p>
                    {preview && (
                        <div className={styles.previewThumb}>
                            <img src={preview} alt="Pré-visualização" />
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ── MANUAL FALLBACK ─────────────────────────────────────────────────────
    if (step === STEPS.MANUAL) {
        return (
            <div className={styles.container}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Dimensões Manuais</h2>
                    <p className={styles.subtitle}>
                        A análise automática não está disponível. Insira as dimensões manualmente para
                        gerar a visualização 3D.
                    </p>
                </div>
                {error && <div className={styles.errorBanner}>{error}</div>}
                <div className={styles.manualForm}>
                    {[
                        { key: "width", label: "Largura (m)" },
                        { key: "depth", label: "Profundidade (m)" },
                        { key: "height", label: "Altura do teto (m)" },
                    ].map(({ key, label }) => (
                        <label key={key} className={styles.manualLabel}>
                            <span>{label}</span>
                            <input
                                type="number"
                                min="0.5"
                                max="50"
                                step="0.1"
                                value={manual[key]}
                                onChange={(e) => setManual((p) => ({ ...p, [key]: e.target.value }))}
                                className={styles.manualInput}
                            />
                        </label>
                    ))}
                    <div className={styles.manualActions}>
                        <button className={styles.primaryButton} onClick={applyManual}>
                            Gerar 3D
                        </button>
                        <button className={styles.secondaryButton} onClick={reset}>
                            Voltar
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ── RESULT ──────────────────────────────────────────────────────────────
    return (
        <div className={styles.resultContainer}>
            <div className={styles.resultToolbar}>
                <div className={styles.resultInfo}>
                    <span className={styles.resultDims}>
                        {roomData?.width?.toFixed(1)} m &times; {roomData?.depth?.toFixed(1)} m &times;{" "}
                        {roomData?.height?.toFixed(1)} m
                    </span>
                    {roomData?.features?.hasDoor && <span className={styles.badge}>🚪 Porta</span>}
                    {roomData?.features?.hasWindow && <span className={styles.badge}>🪟 Janela</span>}
                </div>
                <div className={styles.viewButtons}>
                    {[
                        { key: "perspective", label: "3D" },
                        { key: "top", label: "Topo" },
                        { key: "front", label: "Frente" },
                        { key: "left", label: "Esquerda" },
                        { key: "right", label: "Direita" },
                    ].map(({ key, label }) => (
                        <button
                            key={key}
                            className={`${styles.viewButton} ${activeViewKey === key ? styles.viewButtonActive : ""}`}
                            onClick={() => goToView(key)}
                        >
                            {label}
                        </button>
                    ))}
                </div>
                <button
                    className={`${styles.sidebarToggle} ${sidebarOpen ? styles.sidebarToggleActive : ""}`}
                    onClick={() => setSidebarOpen((v) => !v)}
                    title="Personalizar ambiente"
                >
                    ✏
                </button>
                <button onClick={reset} className={styles.resetButton}>
                    Nova planta
                </button>
            </div>

            <div className={styles.splitView}>
                {preview && (
                    <div className={styles.imagePanel}>
                        <p className={styles.panelLabel}>Planta original</p>
                        <img src={preview} alt="Planta baixa" className={styles.originalImage} />
                    </div>
                )}
                <div className={styles.scenePanel} style={{ position: "relative" }}>
                    <p className={styles.panelLabel}>
                        Clique numa parede para selecionar
                        {roomData?.shape === "polygon" ? " · arraste as esferas vermelhas para redimensionar ou a laranja para empurrar a parede" : " · arraste a esfera laranja para mover a parede"}
                        {" · arraste a cena para rotacionar"}
                    </p>
                    <FurniturePanel
                        pendingFurniture={pendingFurniture}
                        onPickFurniture={handlePickFurniture}
                        onCancelFurniture={() => setPendingFurniture(null)}
                    />
                    <Room3D
                        roomData={roomData}
                        targetView={targetView}
                        wallColors={config.wallColors}
                        floorColor={config.floorColor}
                        doorColor={config.doorColor}
                        selectedWall={selectedWall}
                        onWallClick={handleWallClick}
                        onVertexMove={handleVertexMove}
                        onWallTranslate={handleWallDrag}
                        onFeatureLiveMove={handleFeatureLiveMove}
                        onFeatureDrop={handleFeatureDrop}
                        onWindowResize={handleWindowResize}
                        onWindowHeightResize={handleWindowHeightResize}
                        pendingFurniture={pendingFurniture}
                        onPlaceFurniture={handlePlaceFurniture}
                        placedFurniture={placedFurniture}
                        selectedFurnitureId={selectedFurnitureId}
                        onSelectFurniture={handleSelectFurniture}
                        onDeleteFurniture={handleDeleteFurniture}
                        onMoveFurniture={handleMoveFurniture}
                        onRotateFurniture={handleRotateFurniture}
                        onScaleFurniture={handleScaleFurniture}
                    />
                </div>

                {sidebarOpen && (
                    <aside className={styles.sidebar}>
                        <p className={styles.sidebarTitle}>Personalizar</p>

                        {/* ── PAREDES ── */}
                        <div className={styles.sidebarSection}>
                            <p className={styles.sidebarLabel}>Paredes</p>
                            {/* Generic select — works with any wall count */}
                            <select
                                className={styles.wallSelect}
                                value={selectedWall === null ? "" : String(selectedWall)}
                                onChange={(e) => setSelectedWall(e.target.value === "" ? null : Number(e.target.value))}
                            >
                                <option value="">Todas as paredes</option>
                                {config.wallColors.map((_, i) => (
                                    <option key={i} value={i}>Parede {i + 1}</option>
                                ))}
                            </select>
                            {/* Wall length control — only for polygon rooms with a selected wall */}
                            {roomData?.shape === "polygon" && selectedWall !== null && Array.isArray(roomData?.vertices) && (() => {
                                const verts = roomData.vertices;
                                const n = verts.length;
                                const v0 = verts[selectedWall];
                                const v1 = verts[(selectedWall + 1) % n];
                                const dx = v1[0] - v0[0], dz = v1[1] - v0[1];
                                const curLen = Math.sqrt(dx * dx + dz * dz);
                                return (
                                    <label className={styles.wallLengthLabel}>
                                        <span>Comprimento (m)</span>
                                        <input
                                            type="number"
                                            min="0.2"
                                            max="30"
                                            step="0.05"
                                            value={curLen.toFixed(2)}
                                            onChange={(e) => setWallLength(selectedWall, parseFloat(e.target.value))}
                                            className={styles.manualInput}
                                        />
                                    </label>
                                );
                            })()}
                            {/* Inner / outer face */}
                            <div className={styles.wallTabs} style={{ marginTop: "0.5rem" }}>
                                <button
                                    className={`${styles.wallTab} ${wallFace === "inner" ? styles.wallTabActive : ""}`}
                                    onClick={() => setWallFace("inner")}
                                >
                                    Interior
                                </button>
                                <button
                                    className={`${styles.wallTab} ${wallFace === "outer" ? styles.wallTabActive : ""}`}
                                    onClick={() => setWallFace("outer")}
                                >
                                    Exterior
                                </button>
                            </div>
                            <p className={styles.sidebarHint}>
                                {selectedWall !== null ? `Parede ${selectedWall + 1}` : "Todas"} · {wallFace === "inner" ? "interior" : "exterior"}
                            </p>
                            <div className={styles.swatches}>
                                {WALL_PRESETS.map((c) => {
                                    const curColor = selectedWall !== null
                                        ? config.wallColors[selectedWall][wallFace]
                                        : config.wallColors[0][wallFace];
                                    return (
                                        <button
                                            key={c}
                                            title={c}
                                            className={`${styles.swatch} ${curColor === c ? styles.swatchActive : ""}`}
                                            style={{ background: c }}
                                            onClick={() => setWallColor(c)}
                                        />
                                    );
                                })}
                            </div>
                            <input
                                type="color"
                                value={selectedWall !== null ? config.wallColors[selectedWall][wallFace] : config.wallColors[0][wallFace]}
                                onChange={(e) => setWallColor(e.target.value)}
                                className={styles.colorPicker}
                            />
                        </div>

                        {/* ── PISO ── */}
                        <div className={styles.sidebarSection}>
                            <p className={styles.sidebarLabel}>Piso</p>
                            <div className={styles.swatches}>
                                {FLOOR_PRESETS.map((c) => (
                                    <button
                                        key={c}
                                        title={c}
                                        className={`${styles.swatch} ${config.floorColor === c ? styles.swatchActive : ""}`}
                                        style={{ background: c }}
                                        onClick={() => setConfig((v) => ({ ...v, floorColor: c }))}
                                    />
                                ))}
                            </div>
                            <input
                                type="color"
                                value={config.floorColor}
                                onChange={(e) => setConfig((v) => ({ ...v, floorColor: e.target.value }))}
                                className={styles.colorPicker}
                            />
                        </div>

                        {/* ── PORTA ── */}
                        {roomData?.features?.hasDoor && (
                            <div className={styles.sidebarSection}>
                                <p className={styles.sidebarLabel}>Porta</p>
                                <div className={styles.swatches}>
                                    {DOOR_PRESETS.map((c) => (
                                        <button
                                            key={c}
                                            title={c}
                                            className={`${styles.swatch} ${config.doorColor === c ? styles.swatchActive : ""}`}
                                            style={{ background: c }}
                                            onClick={() => setConfig((v) => ({ ...v, doorColor: c }))}
                                        />
                                    ))}
                                </div>
                                <input
                                    type="color"
                                    value={config.doorColor}
                                    onChange={(e) => setConfig((v) => ({ ...v, doorColor: e.target.value }))}
                                    className={styles.colorPicker}
                                />
                            </div>
                        )}

                        {/* ── MODELO ── */}
                        <div className={styles.sidebarSection}>
                            <p className={styles.sidebarLabel}>Modelo</p>
                            <button className={styles.sidebarBtn} onClick={exportRoom}>
                                ↓ Exportar
                            </button>
                            <label className={styles.sidebarBtn}>
                                ↑ Importar
                                <input
                                    type="file"
                                    accept=".json,.evroom.json"
                                    style={{ display: "none" }}
                                    onChange={(e) => importRoom(e.target.files[0])}
                                />
                            </label>
                        </div>
                    </aside>
                )}
            </div>
        </div>
    );
}