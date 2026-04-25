"use client";

import { useRef, useEffect, useMemo, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import { FurnitureModel } from "./FurnitureModels";

const DEFAULTS = {
    wall: "#ede8e0",
    floor: "#c8b89b",
    ceiling: "#f8f8f6",
    door: "#7a5c2e",
    window: "#a8d8ea",
};

const THICKNESS = 0.12;
const FADE_START = 3.5;
const FADE_END = 0.3;
const SEL_EMISSIVE = "#6699ff";
const SEL_INTENSITY = 0.22;

// ── Wall primitives ───────────────────────────────────────────────────────
// WallSection uses a real boxGeometry so walls have thickness and corners seal
// naturally when side walls are extended by THICKNESS (see Room component).
// Box face indices: 0=+X, 1=-X, 2=+Y, 3=-Y, 4=+Z(inner), 5=-Z(outer)
// The group rotation on every wall ensures local +Z faces the room interior,
// so material-4 is always the inner face and material-5 the outer face.

function WallSection({ w, h, cx, cy, innerColor, outerColor, isSelected }) {
    const emissive = isSelected ? SEL_EMISSIVE : "#000000";
    const ei = isSelected ? SEL_INTENSITY : 0;
    return (
        <mesh position={[cx, cy, 0]} castShadow receiveShadow>
            <boxGeometry args={[w, h, THICKNESS]} />
            {/* cap faces: +X, -X, +Y, -Y — always opaque */}
            <meshStandardMaterial attach="material-0" color={outerColor} />
            <meshStandardMaterial attach="material-1" color={outerColor} />
            <meshStandardMaterial attach="material-2" color={outerColor} />
            <meshStandardMaterial attach="material-3" color={outerColor} />
            {/* +Z = inner face */}
            <meshStandardMaterial attach="material-4" color={innerColor} emissive={emissive} emissiveIntensity={ei}
                transparent opacity={1} depthWrite />
            {/* -Z = outer face */}
            <meshStandardMaterial attach="material-5" color={outerColor} emissive={emissive} emissiveIntensity={ei}
                transparent opacity={1} depthWrite />
        </mesh>
    );
}

function SolidWall({ wallWidth, wallHeight, position, rotation = [0, 0, 0], groupRef, innerColor, outerColor, isSelected, onWallClick }) {
    return (
        <group ref={groupRef} position={position} rotation={rotation} onClick={(e) => { e.stopPropagation(); onWallClick?.(); }}>
            <WallSection w={wallWidth} h={wallHeight} cx={0} cy={wallHeight / 2} innerColor={innerColor} outerColor={outerColor} isSelected={isSelected} />
        </group>
    );
}

function WallWithDoor({ wallWidth, wallHeight, position, rotation, doorW, doorH, groupRef, innerColor, outerColor, doorColor, doorOffset = 0, isSelected, onWallClick }) {
    const maxOff = Math.max(0, (wallWidth - doorW) / 2 - 0.05);
    const off = Math.max(-maxOff, Math.min(maxOff, doorOffset));
    const leftW = Math.max(off - doorW / 2 + wallWidth / 2, 0.01);
    const rightW = Math.max(wallWidth / 2 - off - doorW / 2, 0.01);
    const topH = Math.max(wallHeight - doorH, 0.01);
    return (
        <group ref={groupRef} position={position} rotation={rotation} onClick={(e) => { e.stopPropagation(); onWallClick?.(); }}>
            <WallSection w={leftW} h={wallHeight} cx={-wallWidth / 2 + leftW / 2} cy={wallHeight / 2} innerColor={innerColor} outerColor={outerColor} isSelected={isSelected} />
            <WallSection w={rightW} h={wallHeight} cx={wallWidth / 2 - rightW / 2} cy={wallHeight / 2} innerColor={innerColor} outerColor={outerColor} isSelected={isSelected} />
            <WallSection w={doorW} h={topH} cx={off} cy={doorH + topH / 2} innerColor={innerColor} outerColor={outerColor} isSelected={isSelected} />
            {/* door panel */}
            <mesh position={[off, doorH / 2, THICKNESS / 3]}>
                <boxGeometry args={[doorW - 0.04, doorH - 0.02, 0.04]} />
                <meshStandardMaterial color={doorColor} side={THREE.DoubleSide} />
            </mesh>
        </group>
    );
}

function WallWithWindow({ wallWidth, wallHeight, position, rotation, winW, winH, winY, winOffset = 0, groupRef, innerColor, outerColor, isSelected, onWallClick }) {
    const maxOff = Math.max(0, (wallWidth - winW) / 2 - 0.05);
    const off = Math.max(-maxOff, Math.min(maxOff, winOffset));
    const leftW = Math.max(0.01, off - winW / 2 + wallWidth / 2);
    const rightW = Math.max(0.01, wallWidth / 2 - off - winW / 2);
    const topH = Math.max(wallHeight - winY - winH, 0.01);
    return (
        <group ref={groupRef} position={position} rotation={rotation} onClick={(e) => { e.stopPropagation(); onWallClick?.(); }}>
            <WallSection w={leftW} h={wallHeight} cx={-wallWidth / 2 + leftW / 2} cy={wallHeight / 2} innerColor={innerColor} outerColor={outerColor} isSelected={isSelected} />
            <WallSection w={rightW} h={wallHeight} cx={wallWidth / 2 - rightW / 2} cy={wallHeight / 2} innerColor={innerColor} outerColor={outerColor} isSelected={isSelected} />
            <WallSection w={winW} h={winY} cx={off} cy={winY / 2} innerColor={innerColor} outerColor={outerColor} isSelected={isSelected} />
            <WallSection w={winW} h={topH} cx={off} cy={winY + winH + topH / 2} innerColor={innerColor} outerColor={outerColor} isSelected={isSelected} />
            {/* glass – excluded from wall fading */}
            <mesh position={[off, winY + winH / 2, 0]} userData={{ isGlass: true }}>
                <boxGeometry args={[winW, winH, 0.03]} />
                <meshStandardMaterial color={DEFAULTS.window} transparent opacity={0.45} side={THREE.DoubleSide} />
            </mesh>
        </group>
    );
}

// ── Handle3D ─────────────────────────────────────────────────────────────
// HTML dot rendered at a 3D position via <Html>. Always visible, uses pointer
// capture for reliable drag without conflicting with OrbitControls.
function Handle3D({ pos3d, color, label, size = 22, orbitRef, onDrag, onDragEnd, planeY = 0, dragAxis = "xz" }) {
    const { camera, gl } = useThree();
    const rc = useRef(new THREE.Raycaster());
    const xzPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
    const last = useRef(null);
    const lastClientY = useRef(null); // used for dragAxis="y"
    const absPos = useRef(null); // latest abs world position, for onDragEnd

    // Keep plane at the handle's actual Y so XZ projection is accurate
    xzPlane.current.constant = -planeY;

    const worldPt = (clientX, clientY) => {
        const r = gl.domElement.getBoundingClientRect();
        rc.current.setFromCamera(
            new THREE.Vector2(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1),
            camera
        );
        const p = new THREE.Vector3();
        // intersectPlane returns null when ray is parallel to plane — must check
        return rc.current.ray.intersectPlane(xzPlane.current, p) ? p : null;
    };

    // Convert screen-space pixel delta to world-space Y delta at the handle's depth
    const pixelToWorldY = (dClientY) => {
        const r = gl.domElement.getBoundingClientRect();
        const hPos = new THREE.Vector3(pos3d[0], pos3d[1], pos3d[2]);
        const dist = camera.position.distanceTo(hPos);
        const halfH = Math.tan((camera.fov * Math.PI) / 360) * dist;
        return (-dClientY / r.height) * halfH * 2;
    };

    return (
        <Html position={pos3d} center style={{ pointerEvents: "none" }}>
            <div
                title={label}
                style={{
                    width: size, height: size, borderRadius: "50%",
                    background: color, border: "3px solid white",
                    cursor: dragAxis === "y" ? "ns-resize" : "grab",
                    touchAction: "none", userSelect: "none",
                    pointerEvents: "all",
                    boxShadow: "0 0 0 2px rgba(0,0,0,0.5), 0 3px 8px rgba(0,0,0,0.8)",
                }}
                onPointerDown={(e) => {
                    e.stopPropagation();
                    e.currentTarget.setPointerCapture(e.pointerId);
                    if (dragAxis === "y") {
                        lastClientY.current = e.clientY;
                    } else {
                        const p = worldPt(e.clientX, e.clientY);
                        if (!p) return;
                        last.current = p;
                        absPos.current = { x: p.x, z: p.z };
                    }
                    if (orbitRef.current) orbitRef.current.enabled = false;
                    e.currentTarget.style.cursor = "grabbing";
                }}
                onPointerMove={(e) => {
                    if (dragAxis === "y") {
                        if (lastClientY.current === null) return;
                        const dy = pixelToWorldY(e.clientY - lastClientY.current);
                        lastClientY.current = e.clientY;
                        onDrag?.(0, 0, dy);
                    } else {
                        if (!last.current) return;
                        const p = worldPt(e.clientX, e.clientY);
                        if (!p) return;
                        const ddx = p.x - last.current.x, ddz = p.z - last.current.z;
                        last.current.copy(p);
                        absPos.current = { x: p.x, z: p.z };
                        onDrag?.(ddx, ddz, p.x, p.z);
                    }
                }}
                onPointerUp={(e) => {
                    const endPos = absPos.current;
                    last.current = null;
                    lastClientY.current = null;
                    absPos.current = null;
                    if (orbitRef.current) orbitRef.current.enabled = true;
                    e.currentTarget.style.cursor = dragAxis === "y" ? "ns-resize" : "grab";
                    if (endPos) onDragEnd?.(endPos.x, endPos.z);
                }}
            />
        </Html>
    );
}

// ── Interactive wall handles ──────────────────────────────────────────────
// HTML dots appear on selected wall — always visible, always on top:
//   🔴 Red   at endpoints → drag to move that corner (resizes adjacent walls)
//   🟠 Orange at center  → drag to push/pull entire wall in/out
//   🟢 Green  on door    → drag to slide door along wall
//   🔵 Cyan   on window  → drag to slide window along wall
function WallHandles({ vertices, selectedWall, height, orbitRef, onVertexMove, onWallTranslate }) {
    const n = vertices.length;
    const idx = selectedWall;
    const v0 = vertices[idx];
    const v1 = vertices[(idx + 1) % n];
    const edx = v1[0] - v0[0], edz = v1[1] - v0[1];
    const elen = Math.sqrt(edx * edx + edz * edz) || 1;
    const wdx = edx / elen, wdz = edz / elen; // wall direction unit vector
    // Outward normal (right of travel for CCW polygon) = (wdz, -wdx)
    const wnx = wdz, wnz = -wdx;
    const cx = (v0[0] + v1[0]) / 2, cz = (v0[1] + v1[1]) / 2;
    const hy = height * 0.65; // handle Y — middle of wall height, visible

    return (
        <>
            <Handle3D pos3d={[v0[0], hy, v0[1]]} color="#ff3333" label="Mover canto" orbitRef={orbitRef}
                onDrag={(ddx, ddz) => onVertexMove(idx, ddx, ddz)} />
            <Handle3D pos3d={[v1[0], hy, v1[1]]} color="#ff3333" label="Mover canto" orbitRef={orbitRef}
                onDrag={(ddx, ddz) => onVertexMove((idx + 1) % n, ddx, ddz)} />
            <Handle3D pos3d={[cx, hy, cz]} color="#ff8800" size={28} label="Empurrar parede" orbitRef={orbitRef}
                onDrag={(ddx, ddz) => onWallTranslate(idx, ddx * wnx + ddz * wnz)} />
        </>
    );
}

// ── Feature handles (always visible, cross-wall drag supported) ──────────
// Shows 🟢 green (door) and 🔵 cyan (window) handles for EVERY wall that has
// a feature. onDrag receives (ddx, ddz, absX, absZ) — we use abs coords to
// find the closest wall and transfer the feature there.
// Feature handles commit only on pointer-up (onDragEnd) to avoid re-render
// cascades that would unmount the Html element mid-drag and freeze the scene.
function AllFeatureHandles({ walls, vertices, height, orbitRef, onFeatureLiveMove, onFeatureDrop, onWindowResize, onWindowHeightResize }) {
    const n = vertices.length;
    const hy = height * 0.65;
    return (
        <>
            {walls.map((w, i) => {
                const v0 = vertices[i], v1 = vertices[(i + 1) % n];
                const edx = v1[0] - v0[0], edz = v1[1] - v0[1];
                const elen = Math.sqrt(edx * edx + edz * edz) || 1;
                const wdx = edx / elen, wdz = edz / elen;
                const cx = (v0[0] + v1[0]) / 2, cz = (v0[1] + v1[1]) / 2;
                const winOff = w.windowOffset ?? 0;
                const actualWinW = w.windowWidth ?? Math.min(1.2, elen * 0.4);
                const actualWinH = w.windowHeight ?? Math.min(1.0, height * 0.35);
                const winY = Math.min(0.9, height * 0.3);
                const halfWinW = actualWinW / 2;
                const winTopY = winY + actualWinH;
                return (
                    <group key={i}>
                        {w.hasDoor && (
                            <Handle3D
                                pos3d={[cx + wdx * (w.doorOffset ?? 0), hy * 0.6, cz + wdz * (w.doorOffset ?? 0)]}
                                color="#22cc55" label="Mover porta" orbitRef={orbitRef}
                                planeY={hy * 0.6}
                                onDrag={(ddx, ddz) => onFeatureLiveMove?.("door", i, ddx * wdx + ddz * wdz)}
                                onDragEnd={(absX, absZ) => onFeatureDrop("door", absX, absZ)}
                            />
                        )}
                        {w.hasWindow && (
                            <>
                                {/* move handle — center (cyan) */}
                                <Handle3D
                                    pos3d={[cx + wdx * winOff, hy, cz + wdz * winOff]}
                                    color="#44bbff" label="Mover janela" orbitRef={orbitRef}
                                    planeY={hy}
                                    onDrag={(ddx, ddz) => onFeatureLiveMove?.("window", i, ddx * wdx + ddz * wdz)}
                                    onDragEnd={(absX, absZ) => onFeatureDrop("window", absX, absZ)}
                                />
                                {/* resize width — left edge (white) */}
                                <Handle3D
                                    pos3d={[cx + wdx * (winOff - halfWinW), hy, cz + wdz * (winOff - halfWinW)]}
                                    color="#ffffff" size={16} label="Largura da janela" orbitRef={orbitRef}
                                    planeY={hy}
                                    onDrag={(ddx, ddz) => onWindowResize?.(i, -(ddx * wdx + ddz * wdz))}
                                />
                                {/* resize width — right edge (white) */}
                                <Handle3D
                                    pos3d={[cx + wdx * (winOff + halfWinW), hy, cz + wdz * (winOff + halfWinW)]}
                                    color="#ffffff" size={16} label="Largura da janela" orbitRef={orbitRef}
                                    planeY={hy}
                                    onDrag={(ddx, ddz) => onWindowResize?.(i, ddx * wdx + ddz * wdz)}
                                />
                                {/* resize height — top edge (yellow), drag up/down */}
                                <Handle3D
                                    pos3d={[cx + wdx * winOff, winTopY, cz + wdz * winOff]}
                                    color="#ffee00" size={16} label="Altura da janela" orbitRef={orbitRef}
                                    dragAxis="y"
                                    onDrag={(_, __, dy) => onWindowHeightResize?.(i, dy)}
                                />
                            </>
                        )}
                    </group>
                );
            })}
        </>
    );
}

// ── Rectangular wall handle ───────────────────────────────────────────────
function WallHandlesRect({ wallIndex, width, depth, height, orbitRef, onWallTranslate }) {
    // Wall 0=back(z-), 1=front(z+), 2=right(x+), 3=left(x-)
    const WD = [
        { cx: 0, cz: -depth / 2, wnx: 0, wnz: -1 },
        { cx: 0, cz: depth / 2, wnx: 0, wnz: 1 },
        { cx: width / 2, cz: 0, wnx: 1, wnz: 0 },
        { cx: -width / 2, cz: 0, wnx: -1, wnz: 0 },
    ];
    const wd = WD[wallIndex] || WD[0];
    const hy = height * 0.65;
    return (
        <Handle3D pos3d={[wd.cx, hy, wd.cz]} color="#ff8800" size={28} label="Mover parede" orbitRef={orbitRef}
            onDrag={(ddx, ddz) => onWallTranslate(wallIndex, ddx * wd.wnx + ddz * wd.wnz)} />
    );
}

// ── Camera wall fader ─────────────────────────────────────────────────────
// Accepts two plane formats:
//   - Legacy axis/val:      { ref, axis: 'x'|'z', val }
//   - General plane normal: { ref, normal: [nx, nz], offset }
//     where  normal · [cam.x, cam.z] = offset  defines the wall plane
//     and normal points INWARD (toward room interior).
function CameraWallFader({ wallPlanes }) {
    const { camera } = useThree();
    const dirVec = useRef(new THREE.Vector3());

    useFrame(() => {
        camera.getWorldDirection(dirVec.current);
        const p = camera.position;
        const d = dirVec.current;
        const eps = 1e-6;

        const opacityFor = (dist) => {
            if (dist >= FADE_START) return 1;
            if (dist <= FADE_END) return 0;
            return (dist - FADE_END) / (FADE_START - FADE_END);
        };

        const walls = wallPlanes.map((wp) => {
            let t, dist;
            if (wp.normal) {
                const [nx, nz] = wp.normal;
                const camDot = nx * p.x + nz * p.z;
                const dirDot = nx * d.x + nz * d.z;
                dist = Math.abs(camDot - wp.offset);
                t = Math.abs(dirDot) > eps ? (wp.offset - camDot) / dirDot : Infinity;
            } else {
                const { axis, val } = wp;
                const camVal = axis === "x" ? p.x : p.z;
                const dirVal = axis === "x" ? d.x : d.z;
                dist = Math.abs(camVal - val);
                t = Math.abs(dirVal) > eps ? (val - camVal) / dirVal : Infinity;
            }
            return { ref: wp.ref, t, dist };
        });

        let minT = Infinity;
        for (const w of walls) {
            if (w.t > 0 && w.t < minT) minT = w.t;
        }

        for (const { ref, t, dist } of walls) {
            if (!ref.current) continue;
            const shouldFade = t > 0 && t <= minT * 1.5;
            const opacity = shouldFade ? opacityFor(dist) : 1;
            ref.current.traverse((obj) => {
                if (!obj.isMesh || obj.userData.isGlass) return;
                const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
                for (const m of mats) {
                    m.opacity = opacity;
                    m.depthWrite = opacity > 0.5;
                }
            });
        }
    });

    return null;
}

// ── Polygon room ─────────────────────────────────────────────────────────
// Renders an arbitrary polygon floor plan.
// vertices: [[x,z], ...] world XZ coordinates, CCW when viewed from above.
// walls: [{index, hasDoor, hasWindow}] aligned to vertex edges.
function PolygonRoom({ vertices, height, walls, wallRefsArr, wallColors, floorColor, doorColor, selectedWall, onWallClick }) {
    // THREE.Shape lives in XY plane. We rotate the mesh by [-π/2,0,0] which
    // maps shape (x,y) → world (x,0,-y). So we pass shape coords as (x, -z).
    const shape = useMemo(() => {
        const s = new THREE.Shape();
        s.moveTo(vertices[0][0], -vertices[0][1]);
        for (let i = 1; i < vertices.length; i++) s.lineTo(vertices[i][0], -vertices[i][1]);
        s.closePath();
        return s;
    }, [vertices]); // eslint-disable-line react-hooks/exhaustive-deps

    const n = vertices.length;
    const ic = (i) => wallColors[i]?.inner ?? DEFAULTS.wall;
    const oc = (i) => wallColors[i]?.outer ?? DEFAULTS.wall;

    return (
        <group>
            {/* Floor */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <shapeGeometry args={[shape]} />
                <meshStandardMaterial color={floorColor} side={THREE.DoubleSide} />
            </mesh>

            {/* Ceiling – very transparent */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, height, 0]}>
                <shapeGeometry args={[shape]} />
                <meshStandardMaterial color={DEFAULTS.ceiling} transparent opacity={0.08} side={THREE.DoubleSide} />
            </mesh>

            {/* One wall per polygon edge */}
            {vertices.map((v, i) => {
                const next = vertices[(i + 1) % n];
                const dx = next[0] - v[0];
                const dz = next[1] - v[1];
                const len = Math.sqrt(dx * dx + dz * dz);
                if (len < 0.05) return null; // skip degenerate edges

                const angle = Math.atan2(dz, dx);
                const mx = (v[0] + next[0]) / 2;
                const mz = (v[1] + next[1]) / 2;
                const wallDef = walls?.[i] ?? {};
                // Extend slightly to seal corners (approximates a miter join)
                const wallLen = len + THICKNESS;
                const doorW = Math.min(0.9, len * 0.35);
                const doorH = Math.min(2.1, height * 0.85);
                const winW = wallDef.windowWidth ?? Math.min(1.2, len * 0.4);
                const winH = wallDef.windowHeight ?? Math.min(1.0, height * 0.35);
                const winY = Math.min(0.9, height * 0.3);
                // Callback ref stores the Three.js group for the fader
                const groupRefCb = (el) => { wallRefsArr.current[i] = el; };

                if (wallDef.hasDoor) {
                    return (
                        <WallWithDoor key={i}
                            groupRef={groupRefCb}
                            wallWidth={wallLen} wallHeight={height}
                            position={[mx, 0, mz]} rotation={[0, -angle, 0]}
                            doorW={doorW} doorH={doorH} doorOffset={wallDef.doorOffset ?? 0}
                            innerColor={ic(i)} outerColor={oc(i)} doorColor={doorColor}
                            isSelected={selectedWall === i}
                            onWallClick={() => onWallClick(i)}
                        />
                    );
                }
                if (wallDef.hasWindow) {
                    return (
                        <WallWithWindow key={i}
                            groupRef={groupRefCb}
                            wallWidth={wallLen} wallHeight={height}
                            position={[mx, 0, mz]} rotation={[0, -angle, 0]}
                            winW={winW} winH={winH} winY={winY}
                            winOffset={wallDef.windowOffset ?? 0}
                            innerColor={ic(i)} outerColor={oc(i)}
                            isSelected={selectedWall === i}
                            onWallClick={() => onWallClick(i)}
                        />
                    );
                }
                return (
                    <SolidWall key={i}
                        groupRef={groupRefCb}
                        wallWidth={wallLen} wallHeight={height}
                        position={[mx, 0, mz]} rotation={[0, -angle, 0]}
                        innerColor={ic(i)} outerColor={oc(i)}
                        isSelected={selectedWall === i}
                        onWallClick={() => onWallClick(i)}
                    />
                );
            })}
        </group>
    );
}

// ── Camera view animator ──────────────────────────────────────────────────

function CameraController({ targetView, orbitRef }) {
    const { camera } = useThree();
    const animating = useRef(false);
    const targetPos = useRef(null);
    const targetLookAt = useRef(null);

    useEffect(() => {
        if (!targetView) return;
        targetPos.current = new THREE.Vector3(...targetView.position);
        targetLookAt.current = new THREE.Vector3(...targetView.target);
        animating.current = true;
        if (orbitRef.current) orbitRef.current.enabled = false;
    }, [targetView, orbitRef]);

    useFrame(() => {
        if (!animating.current || !targetPos.current || !targetLookAt.current) return;

        camera.position.lerp(targetPos.current, 0.09);

        if (orbitRef.current) {
            orbitRef.current.target.lerp(targetLookAt.current, 0.09);
            orbitRef.current.update();
        }

        if (camera.position.distanceTo(targetPos.current) < 0.05) {
            camera.position.copy(targetPos.current);
            if (orbitRef.current) {
                orbitRef.current.target.copy(targetLookAt.current);
                orbitRef.current.update();
                orbitRef.current.enabled = true;
            }
            animating.current = false;
        }
    });

    return null;
}

// Wall indices for the rectangular room:
//   0 = back  (z = -depth/2)
//   1 = front (z = +depth/2)
//   2 = right (x = +width/2)
//   3 = left  (x = -width/2)
// Future non-rectangular rooms just add more indices.

function Room({ width, depth, height, features, wallRefs, wallColors, floorColor, doorColor, selectedWall, onWallClick }) {
    const hasDoor = features?.hasDoor !== false;
    const hasWindow = features?.hasWindow !== false;
    const doorW = Math.min(0.9, width * 0.25);
    const doorH = Math.min(2.1, height * 0.85);
    const winW = Math.min(1.2, depth * 0.4);
    const winH = Math.min(1.0, height * 0.35);
    const winY = Math.min(0.9, height * 0.3);

    const doorPosition = features?.doorPosition ?? 0.5;
    const maxOff = Math.max(0, (width - doorW) / 2 - 0.05);
    const doorOffset = (doorPosition - 0.5) * 2 * maxOff;

    // wallColors is an array indexed by wall number
    const ic = (i) => wallColors[i]?.inner ?? DEFAULTS.wall;
    const oc = (i) => wallColors[i]?.outer ?? DEFAULTS.wall;

    return (
        <group>
            {/* Floor */}
            <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
                <planeGeometry args={[width, depth]} />
                <meshStandardMaterial color={floorColor} side={THREE.DoubleSide} />
            </mesh>

            {/* Ceiling – very transparent, visible from inside */}
            <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, height, 0]}>
                <planeGeometry args={[width, depth]} />
                <meshStandardMaterial color={DEFAULTS.ceiling} transparent opacity={0.08} side={THREE.DoubleSide} />
            </mesh>

            {/* Wall 0 – back (z = -depth/2) */}
            {hasDoor ? (
                <WallWithDoor
                    groupRef={wallRefs[0]}
                    wallWidth={width} wallHeight={height}
                    position={[0, 0, -depth / 2]} rotation={[0, 0, 0]}
                    doorW={doorW} doorH={doorH} doorOffset={doorOffset}
                    innerColor={ic(0)} outerColor={oc(0)}
                    doorColor={doorColor}
                    isSelected={selectedWall === 0}
                    onWallClick={() => onWallClick(0)}
                />
            ) : (
                <SolidWall
                    groupRef={wallRefs[0]}
                    wallWidth={width} wallHeight={height}
                    position={[0, 0, -depth / 2]} rotation={[0, 0, 0]}
                    innerColor={ic(0)} outerColor={oc(0)}
                    isSelected={selectedWall === 0}
                    onWallClick={() => onWallClick(0)}
                />
            )}

            {/* Wall 1 – front (z = +depth/2) */}
            <SolidWall
                groupRef={wallRefs[1]}
                wallWidth={width} wallHeight={height}
                position={[0, 0, depth / 2]} rotation={[0, Math.PI, 0]}
                innerColor={ic(1)} outerColor={oc(1)}
                isSelected={selectedWall === 1}
                onWallClick={() => onWallClick(1)}
            />

            {/* Wall 2 – right (x = +width/2), extended by THICKNESS to seal corners */}
            {hasWindow ? (
                <WallWithWindow
                    groupRef={wallRefs[2]}
                    wallWidth={depth + THICKNESS} wallHeight={height}
                    position={[width / 2, 0, 0]} rotation={[0, -Math.PI / 2, 0]}
                    winW={winW} winH={winH} winY={winY}
                    innerColor={ic(2)} outerColor={oc(2)}
                    isSelected={selectedWall === 2}
                    onWallClick={() => onWallClick(2)}
                />
            ) : (
                <SolidWall
                    groupRef={wallRefs[2]}
                    wallWidth={depth + THICKNESS} wallHeight={height}
                    position={[width / 2, 0, 0]} rotation={[0, -Math.PI / 2, 0]}
                    innerColor={ic(2)} outerColor={oc(2)}
                    isSelected={selectedWall === 2}
                    onWallClick={() => onWallClick(2)}
                />
            )}

            {/* Wall 3 – left (x = -width/2), extended by THICKNESS to seal corners */}
            <SolidWall
                groupRef={wallRefs[3]}
                wallWidth={depth + THICKNESS} wallHeight={height}
                position={[-width / 2, 0, 0]} rotation={[0, Math.PI / 2, 0]}
                innerColor={ic(3)} outerColor={oc(3)}
                isSelected={selectedWall === 3}
                onWallClick={() => onWallClick(3)}
            />
        </group>
    );
}

// ── Furniture helpers ─────────────────────────────────────────────────────
const FURN_BTN = {
    background: "rgba(255,255,255,0.09)",
    border: "1px solid rgba(255,255,255,0.18)",
    color: "#fff",
    cursor: "pointer",
    padding: "3px 7px",
    borderRadius: "4px",
    fontSize: "13px",
    lineHeight: "1.2",
    fontFamily: "Poppins, sans-serif",
};
const FURN_BTN_DEL = { ...FURN_BTN, color: "#ff8888", borderColor: "rgba(255,80,80,0.3)" };

// ── Ghost furniture mesh (shown while placing) ────────────────────────────
// Renders a semi-transparent preview that follows the cursor on the floor.
// Uses a large invisible floor plane to capture R3F pointer events.
// Returns nearest-wall projection data for frame placement (floor → wall).
// For rect rooms: finds closest of 4 walls. For polygon rooms: closest edge.
function projectFrameToWall(fx, fz, roomData) {
    const { width = 4, depth = 3.5, shape, vertices } = roomData || {};
    if (shape === "polygon" && Array.isArray(vertices) && vertices.length >= 3) {
        let minDist = Infinity, best = null;
        for (let i = 0; i < vertices.length; i++) {
            const v0 = vertices[i], v1 = vertices[(i + 1) % vertices.length];
            const dx = v1[0] - v0[0], dz = v1[1] - v0[1];
            const len = Math.sqrt(dx * dx + dz * dz);
            if (len < 0.001) continue;
            const t = Math.max(0, Math.min(1, ((fx - v0[0]) * dx + (fz - v0[1]) * dz) / (len * len)));
            const projX = v0[0] + t * dx, projZ = v0[1] + t * dz;
            const dist = Math.sqrt((fx - projX) ** 2 + (fz - projZ) ** 2);
            if (dist < minDist) {
                minDist = dist;
                const nx = -dz / len, nz = dx / len;
                // rotY so that local +Z of frame points toward room interior (= inward normal)
                const rotY = Math.atan2(nx, nz);
                best = { x: projX + nx * THICKNESS, z: projZ + nz * THICKNESS, rotY, normal: [nx, 0, nz] };
            }
        }
        return best;
    }
    // Rectangular room
    const candidates = [
        { dist: Math.abs(fz - (-depth / 2)), x: fx, z: -depth / 2 + THICKNESS, rotY: 0, normal: [0, 0, 1] },
        { dist: Math.abs(fz - (depth / 2)), x: fx, z: depth / 2 - THICKNESS, rotY: Math.PI, normal: [0, 0, -1] },
        { dist: Math.abs(fx - (width / 2)), x: width / 2 - THICKNESS, z: fz, rotY: -Math.PI / 2, normal: [-1, 0, 0] },
        { dist: Math.abs(fx - (-width / 2)), x: -width / 2 + THICKNESS, z: fz, rotY: Math.PI / 2, normal: [1, 0, 0] },
    ];
    return candidates.reduce((a, b) => a.dist < b.dist ? a : b);
}

function FurniturePlacerGhost({ pendingFurniture, onPlace, orbitRef, roomData }) {
    const { gl } = useThree();
    const ghostRef = useRef();
    const ghostRotY = useRef(0);
    const ghostNormal = useRef([0, 0, 1]);
    const ghostWallCenter = useRef(null); // [x, cy, z] — null until mouse has moved
    const pendingRef = useRef(pendingFurniture);
    const onPlaceRef = useRef(onPlace);
    useEffect(() => { pendingRef.current = pendingFurniture; }, [pendingFurniture]);
    useEffect(() => { onPlaceRef.current = onPlace; }, [onPlace]);

    // Disable OrbitControls while in placement mode so camera doesn't spin
    useEffect(() => {
        if (!orbitRef?.current) return;
        orbitRef.current.enabled = !pendingFurniture;
        return () => { if (orbitRef?.current) orbitRef.current.enabled = true; };
    }, [pendingFurniture, orbitRef]);

    // ── Capture-phase click on the canvas DOM element ─────────────────────
    // Fires BEFORE R3F's event system, so clicking on a wall while in
    // frame-placement mode places the frame and never selects the wall.
    useEffect(() => {
        if (!pendingFurniture) return;
        const canvas = gl.domElement;
        const handleClick = (e) => {
            const item = pendingRef.current;
            if (!item) return;
            if (!ghostRef.current?.visible) return; // ghost not positioned yet — ignore
            e.stopPropagation(); // prevent R3F from routing this click to walls
            const isFrame = item.id.startsWith("frame_");
            if (isFrame && ghostWallCenter.current) {
                const [wx, wy, wz] = ghostWallCenter.current;
                onPlaceRef.current?.({
                    x: wx, y: wy, z: wz,
                    rotationY: ghostRotY.current,
                    wallMounted: true,
                    wallNormal: ghostNormal.current,
                });
            }
            // Non-frame items: the floor-plane's onClick still works because the
            // floor plane is in front for those clicks; we don't interfere here.
        };
        canvas.addEventListener("click", handleClick, { capture: true });
        return () => canvas.removeEventListener("click", handleClick, { capture: true });
    }, [pendingFurniture, gl]);

    if (!pendingFurniture) return null;

    const [w, h, d] = pendingFurniture.size;
    const isFrame = pendingFurniture.id.startsWith("frame_");
    const frameDefaultCenterY = 1.3; // eye-level center; adjustable later with Y handle

    return (
        <>
            {/* Ghost — position/rotation set imperatively via onPointerMove */}
            <group ref={ghostRef} visible={false}>
                <FurnitureModel
                    itemId={pendingFurniture.id}
                    w={w} h={h} d={d}
                    color={pendingFurniture.color}
                    emissive="#4488ff"
                    emissiveIntensity={0.3}
                />
            </group>
            {/* Large invisible floor-level plane — tracks cursor for ALL furniture.
                For frames, the floor XZ point is projected to the nearest wall.
                Click is only used for non-frame items (frames use the capture handler above). */}
            <mesh
                rotation={[-Math.PI / 2, 0, 0]}
                position={[0, 0.001, 0]}
                onPointerMove={(e) => {
                    if (!ghostRef.current) return;
                    if (isFrame) {
                        const wall = projectFrameToWall(e.point.x, e.point.z, roomData);
                        if (!wall) return;
                        const cy = frameDefaultCenterY;
                        ghostRef.current.position.set(wall.x, cy - h / 2, wall.z);
                        ghostRef.current.rotation.y = wall.rotY;
                        ghostRef.current.visible = true;
                        ghostRotY.current = wall.rotY;
                        ghostNormal.current = wall.normal;
                        ghostWallCenter.current = [wall.x, cy, wall.z];
                    } else {
                        ghostRef.current.position.set(e.point.x, 0, e.point.z);
                        ghostRef.current.rotation.y = 0;
                        ghostRef.current.visible = true;
                    }
                }}
                onClick={(e) => {
                    e.stopPropagation();
                    if (!isFrame) {
                        onPlace?.({ x: e.point.x, z: e.point.z });
                    }
                    // frames: handled by the canvas capture listener above
                }}
            >
                <planeGeometry args={[200, 200]} />
                <meshStandardMaterial visible={false} side={THREE.DoubleSide} />
            </mesh>
        </>
    );
}

// ── Furniture scale drag handles (world-space, like wall handles) ───────────────
// Rendered OUTSIDE the rotating group so all positions/distances are in world space.
// White dot on +X face → drag to resize width (both sides expand symmetrically).
// White dot on +Z face → drag to resize depth  (boxes only).
// Yellow dot on top    → drag up/down to resize height.
function FurnitureScaleHandles({ item, sw, sh, sd, isCyl, bw, bh, bd, orbitRef, onScale }) {
    const rotY = item.rotationY ?? 0;
    const cx = item.position[0], cz = item.position[2];
    const cosR = Math.cos(rotY), sinR = Math.sin(rotY);

    // Wall-mounted items (frames): center Y is stored in position[1]; group is at position[1]-sh/2
    // Floor items: position[1]=0, group at 0, frame bottom at 0, mid at sh/2, top at sh
    const midY = item.wallMounted ? item.position[1] : sh / 2;
    const topY = item.wallMounted ? item.position[1] + sh / 2 : sh;

    const hxPos = [cx + sw / 2 * cosR, midY, cz - sw / 2 * sinR];
    const hzPos = [cx + sd / 2 * sinR, midY, cz + sd / 2 * cosR];
    const hyPos = [cx, topY, cz];

    return (
        <>
            {/* Width handle — white, +X edge, XZ drag */}
            <Handle3D
                pos3d={hxPos} color="#ffffff" size={16} label="↔ Largura"
                orbitRef={orbitRef} planeY={midY}
                onDrag={(ddx, ddz) => {
                    const d = ddx * cosR + ddz * (-sinR);
                    onScale(item.id, "x", 2 * d / bw);
                }}
            />
            {/* Depth handle — only for non-cylinders and non-wall-mounted */}
            {!isCyl && !item.wallMounted && (
                <Handle3D
                    pos3d={hzPos} color="#ffffff" size={16} label="↔ Profundidade"
                    orbitRef={orbitRef} planeY={midY}
                    onDrag={(ddx, ddz) => {
                        const d = ddx * sinR + ddz * cosR;
                        onScale(item.id, "z", 2 * d / bd);
                    }}
                />
            )}
            {/* Height handle — yellow, top center, Y drag */}
            <Handle3D
                pos3d={hyPos} color="#ffee00" size={16} label="↕ Altura"
                orbitRef={orbitRef} dragAxis="y"
                onDrag={(_, __, dy) => {
                    onScale(item.id, "y", 2 * dy / bh);
                }}
            />
        </>
    );
}

// ── Placed furniture item ─────────────────────────────────────────────────
// Click to select, then click+drag (≥5 px) to move along floor.
// Toolbar (Html): ↺↻ rotate 45°, 🗑 delete.
// Scale handles (3D): white dots on +X/+Z faces, yellow dot on top.
function PlacedFurnitureItem({ item, isSelected, orbitRef, onSelect, onDelete, onMove, onRotate, onScale, roomData }) {
    const { camera, gl } = useThree();
    const rc = useRef(new THREE.Raycaster());
    const floorPlane = useRef(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0));
    const pointerDown = useRef(null);
    const dragging = useRef(false);
    const onMoveRef = useRef(onMove);
    const itemRef = useRef(item);
    const roomDataRef = useRef(roomData);
    useEffect(() => { onMoveRef.current = onMove; }, [onMove]);
    useEffect(() => { itemRef.current = item; }, [item]);
    useEffect(() => { roomDataRef.current = roomData; }, [roomData]);

    useEffect(() => {
        const getFloorPt = (clientX, clientY) => {
            const r = gl.domElement.getBoundingClientRect();
            rc.current.setFromCamera(
                new THREE.Vector2(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1),
                camera
            );
            const p = new THREE.Vector3();
            return rc.current.ray.intersectPlane(floorPlane.current, p) ? p : null;
        };

        const onPointerMove = (e) => {
            if (!pointerDown.current) return;
            const dx = e.clientX - pointerDown.current.x, dy = e.clientY - pointerDown.current.y;
            if (!dragging.current && Math.sqrt(dx * dx + dy * dy) > 5) dragging.current = true;
            if (!dragging.current) return;

            const cur = itemRef.current;
            if (cur.wallMounted) {
                // For wall-mounted frames: project floor point → nearest wall, keep current center Y
                const fp = getFloorPt(e.clientX, e.clientY);
                if (!fp) return;
                const wall = projectFrameToWall(fp.x, fp.z, roomDataRef.current);
                if (!wall) return;
                // Preserve current center Y so the frame doesn't jump vertically
                const cy = cur.position[1];
                onMoveRef.current(cur.id, wall.x, cy, wall.z, wall.rotY, wall.normal);
            } else {
                const p = getFloorPt(e.clientX, e.clientY);
                if (p) onMoveRef.current(cur.id, p.x, 0, p.z);
            }
        };

        const onPointerUp = () => {
            pointerDown.current = null;
            dragging.current = false;
            if (orbitRef.current) orbitRef.current.enabled = true;
        };

        window.addEventListener("pointermove", onPointerMove);
        window.addEventListener("pointerup", onPointerUp);
        return () => {
            window.removeEventListener("pointermove", onPointerMove);
            window.removeEventListener("pointerup", onPointerUp);
        };
    }, [item.id, camera, gl, orbitRef]);

    const sx = item.scaleX ?? 1, sy = item.scaleY ?? 1, sz = item.scaleZ ?? 1;
    const [bw, bh, bd] = item.size;
    const sw = bw * sx, sh = bh * sy, sd = bd * sz;
    const isCyl = item.shape === "cylinder";
    // Wall-mounted frames: item.position[1] = center Y of frame on wall
    // Group is placed at frame bottom so FrameModel (Y=0..h) renders centered at position[1]
    const groupY = item.wallMounted ? item.position[1] - sh / 2 : 0;

    return (
        <>
            <group position={[item.position[0], groupY, item.position[2]]} rotation={[0, item.rotationY ?? 0, 0]}>
                <FurnitureModel
                    itemId={item.id.split("_").slice(0, -1).join("_")}
                    w={sw} h={sh} d={sd}
                    color={item.color}
                    emissive={isSelected ? "#3366ff" : "#000000"}
                    emissiveIntensity={isSelected ? 0.3 : 0}
                    onPointerDown={(e) => {
                        e.stopPropagation();
                        onSelect(item.id);
                        pointerDown.current = { x: e.clientX, y: e.clientY };
                        if (orbitRef.current) orbitRef.current.enabled = false;
                    }}
                />
                {isSelected && (
                    <Html position={[0, sh + 0.35, 0]} center style={{ pointerEvents: "none" }}>
                        <div style={{
                            display: "flex", gap: "4px",
                            background: "rgba(8,8,22,0.93)", padding: "5px 8px",
                            borderRadius: "8px", border: "1px solid rgba(255,255,255,0.12)",
                            pointerEvents: "all", userSelect: "none",
                            boxShadow: "0 2px 12px rgba(0,0,0,0.7)",
                        }}>
                            <button style={FURN_BTN} title="Girar -45°" onClick={(e) => { e.stopPropagation(); onRotate(item.id, -Math.PI / 4); }}>↺</button>
                            <button style={FURN_BTN} title="Girar +45°" onClick={(e) => { e.stopPropagation(); onRotate(item.id, Math.PI / 4); }}>↻</button>
                            <button style={FURN_BTN_DEL} title="Remover" onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}>🗑</button>
                        </div>
                    </Html>
                )}
            </group>
            {isSelected && (
                <FurnitureScaleHandles
                    item={item} sw={sw} sh={sh} sd={sd} isCyl={isCyl}
                    bw={bw} bh={bh} bd={bd}
                    orbitRef={orbitRef} onScale={onScale}
                />
            )}
        </>
    );
}

export default function Room3D({ roomData, targetView, wallColors, floorColor = DEFAULTS.floor, doorColor = DEFAULTS.door, selectedWall, onWallClick, onVertexMove, onWallTranslate, onFeatureLiveMove, onFeatureDrop, onWindowResize, onWindowHeightResize, pendingFurniture, onPlaceFurniture, placedFurniture, selectedFurnitureId, onSelectFurniture, onDeleteFurniture, onMoveFurniture, onRotateFurniture, onScaleFurniture }) {
    const isPolygon = roomData?.shape === "polygon" && Array.isArray(roomData?.vertices) && roomData.vertices.length >= 3;
    const { width = 4, depth = 3.5, height = 2.0, features = {} } = roomData || {};
    const vertices = isPolygon ? roomData.vertices : null;

    const wallCount = isPolygon ? (vertices?.length ?? 4) : 4;
    const resolvedWallColors = Array.from({ length: wallCount }, (_, i) =>
        wallColors?.[i] ?? { inner: DEFAULTS.wall, outer: DEFAULTS.wall }
    );

    const camDist = Math.max(width, depth) * 1.6;

    // Polygon rooms: dynamic ref array via callback refs.
    const wallRefsArr = useRef([]);

    // Rectangular rooms: 4 fixed refs (must always be called — React hooks rules).
    const wallRef0 = useRef();
    const wallRef1 = useRef();
    const wallRef2 = useRef();
    const wallRef3 = useRef();
    const wallRefs = [wallRef0, wallRef1, wallRef2, wallRef3];

    const orbitRef = useRef();

    // Build wall plane descriptors for CameraWallFader.
    // Polygon: {ref (getter-based wrapper), normal: [nx,nz], offset} — general plane eq.
    // Rect:    {ref, axis, val}  — legacy format, fader handles both.
    const wallPlanes = isPolygon
        ? vertices.map((v, i) => {
            const next = vertices[(i + 1) % vertices.length];
            const dx = next[0] - v[0], dz = next[1] - v[1];
            const len = Math.sqrt(dx * dx + dz * dz) || 1;
            // Inward normal for CCW polygon = left-of-travel = (-dz, dx) / len
            const nx = -dz / len, nz = dx / len;
            const offset = nx * v[0] + nz * v[1];
            // Getter wrapper so the fader can read .current after callback refs fire
            return { ref: { get current() { return wallRefsArr.current[i]; } }, normal: [nx, nz], offset };
        })
        : [
            { ref: wallRef0, axis: "z", val: -depth / 2 },
            { ref: wallRef1, axis: "z", val: depth / 2 },
            { ref: wallRef2, axis: "x", val: width / 2 },
            { ref: wallRef3, axis: "x", val: -width / 2 },
        ];

    return (
        <Canvas
            shadows
            style={{ width: "100%", height: "100%" }}
            camera={{ position: [camDist, height * 1.4, camDist], fov: 50, near: 0.01, far: 1000 }}
            onPointerMissed={() => { onWallClick?.(null); onSelectFurniture?.(null); }}
        >
            <color attach="background" args={["#1a1a2e"]} />
            <ambientLight intensity={0.6} />
            <directionalLight
                position={[width, height * 2, depth]}
                intensity={1.2}
                castShadow
                shadow-mapSize={[1024, 1024]}
            />
            <pointLight position={[0, height * 0.85, 0]} intensity={0.5} color="#fff8e7" />
            {isPolygon ? (
                <PolygonRoom
                    vertices={vertices}
                    height={height}
                    walls={roomData.walls}
                    wallRefsArr={wallRefsArr}
                    wallColors={resolvedWallColors}
                    floorColor={floorColor}
                    doorColor={doorColor}
                    selectedWall={selectedWall}
                    onWallClick={onWallClick}
                />
            ) : (
                <Room
                    width={width} depth={depth} height={height} features={features}
                    wallRefs={wallRefs}
                    wallColors={resolvedWallColors}
                    floorColor={floorColor}
                    doorColor={doorColor}
                    selectedWall={selectedWall}
                    onWallClick={onWallClick}
                />
            )}
            <CameraWallFader wallPlanes={wallPlanes} />
            {isPolygon && selectedWall !== null && onVertexMove && (
                <WallHandles
                    vertices={vertices}
                    selectedWall={selectedWall}
                    height={height}
                    orbitRef={orbitRef}
                    onVertexMove={onVertexMove}
                    onWallTranslate={onWallTranslate}
                />
            )}
            {isPolygon && roomData?.walls && onFeatureDrop && (
                <AllFeatureHandles
                    walls={roomData.walls}
                    vertices={vertices}
                    height={height}
                    orbitRef={orbitRef}
                    onFeatureLiveMove={onFeatureLiveMove}
                    onFeatureDrop={onFeatureDrop}
                    onWindowResize={onWindowResize}
                    onWindowHeightResize={onWindowHeightResize}
                />
            )}
            {!isPolygon && selectedWall !== null && onWallTranslate && (
                <WallHandlesRect
                    wallIndex={selectedWall}
                    width={width}
                    depth={depth}
                    height={height}
                    orbitRef={orbitRef}
                    onWallTranslate={onWallTranslate}
                />
            )}
            <CameraController targetView={targetView} orbitRef={orbitRef} />
            <OrbitControls
                ref={orbitRef}
                makeDefault
                minDistance={0}
                maxDistance={camDist * 4}
                target={[0, height / 2, 0]}
            />
            <FurniturePlacerGhost
                pendingFurniture={pendingFurniture}
                onPlace={onPlaceFurniture}
                orbitRef={orbitRef}
                roomData={roomData}
            />
            {placedFurniture?.map((item) => (
                <PlacedFurnitureItem
                    key={item.id}
                    item={item}
                    isSelected={selectedFurnitureId === item.id}
                    orbitRef={orbitRef}
                    onSelect={onSelectFurniture}
                    onDelete={onDeleteFurniture}
                    onMove={onMoveFurniture}
                    onRotate={onRotateFurniture}
                    onScale={onScaleFurniture}
                    roomData={roomData}
                />
            ))}
        </Canvas>
    );
}
