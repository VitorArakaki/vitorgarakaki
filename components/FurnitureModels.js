"use client";
// ── FurnitureModels.js ────────────────────────────────────────────────────
// Parametric 3D models for every furniture item in the catalog.
// Each model is a React component that receives { w, h, d, color, emissive, emissiveIntensity, onPointerDown }
// and renders in a local coordinate system where:
//   • Y=0 is the BOTTOM of the bounding box (placed on the floor)
//   • +X = width direction, +Z = depth direction
//   • width=w, height=h, depth=d are the CURRENT scaled dimensions

import * as THREE from "three";

// ---------- helpers ---------------------------------------------------------
const mat = (color, ems, emi, extras = {}) => (
    <meshStandardMaterial
        color={color}
        emissive={ems || "#000"}
        emissiveIntensity={emi || 0}
        {...extras}
    />
);

// Round a value to avoid sub-millimeter precision issues
const R = 0.001;

// ---------- SOFAS -----------------------------------------------------------
function SofaModel({ w, h, d, color, emissive, emissiveIntensity, onPointerDown }) {
    const legH = h * 0.12, legR = 0.03;
    const seatH = h * 0.35, seatY = legH + seatH / 2;
    const backH = h - legH - seatH, backY = legH + seatH + backH / 2;
    const armW = Math.min(0.12, w * 0.08), armH = h * 0.5, armY = legH + armH / 2;
    const innerW = w - armW * 2;
    const ems = emissive || "#000", emi = emissiveIntensity || 0;

    return (
        <group onPointerDown={onPointerDown}>
            {/* Seat */}
            <mesh castShadow receiveShadow position={[0, seatY, 0]}>
                <boxGeometry args={[innerW, seatH, d * 0.55]} />
                {mat(color, ems, emi)}
            </mesh>
            {/* Back */}
            <mesh castShadow receiveShadow position={[0, backY, -d / 2 + d * 0.12]}>
                <boxGeometry args={[innerW, backH, d * 0.18]} />
                {mat(color, ems, emi)}
            </mesh>
            {/* Left arm */}
            <mesh castShadow receiveShadow position={[-w / 2 + armW / 2, armY, -d * 0.05]}>
                <boxGeometry args={[armW, armH, d * 0.75]} />
                {mat(color, ems, emi)}
            </mesh>
            {/* Right arm */}
            <mesh castShadow receiveShadow position={[w / 2 - armW / 2, armY, -d * 0.05]}>
                <boxGeometry args={[armW, armH, d * 0.75]} />
                {mat(color, ems, emi)}
            </mesh>
            {/* Legs — 4 corners */}
            {[[-innerW / 2 + 0.06, d * 0.25], [innerW / 2 - 0.06, d * 0.25],
            [-innerW / 2 + 0.06, -d * 0.25], [innerW / 2 - 0.06, -d * 0.25]].map(([lx, lz], i) => (
                <mesh key={i} castShadow position={[lx, legH / 2, lz]}>
                    <cylinderGeometry args={[legR, legR, legH, 8]} />
                    {mat("#5A4A3A")}
                </mesh>
            ))}
        </group>
    );
}

function ChaiseModel({ w, h, d, color, emissive, emissiveIntensity, onPointerDown }) {
    const legH = h * 0.12, seatH = h * 0.32, backH = h * 0.56;
    const ems = emissive || "#000", emi = emissiveIntensity || 0;
    return (
        <group onPointerDown={onPointerDown}>
            {/* Main seat */}
            <mesh castShadow receiveShadow position={[0, legH + seatH / 2, 0]}>
                <boxGeometry args={[w * 0.7, seatH, d]} />
                {mat(color, ems, emi)}
            </mesh>
            {/* Chaise extension (shorter) */}
            <mesh castShadow receiveShadow position={[w * 0.2, legH + seatH * 0.55, d * 0.15]}>
                <boxGeometry args={[w * 0.3, seatH * 0.7, d * 0.7]} />
                {mat(color, ems, emi)}
            </mesh>
            {/* Back */}
            <mesh castShadow receiveShadow position={[-w * 0.27, legH + seatH + backH / 2, -d / 2 + 0.1]}>
                <boxGeometry args={[w * 0.45, backH, 0.16]} />
                {mat(color, ems, emi)}
            </mesh>
            {/* Left arm */}
            <mesh castShadow receiveShadow position={[-w / 2 + 0.07, legH + h * 0.28, 0]}>
                <boxGeometry args={[0.12, h * 0.44, d * 0.75]} />
                {mat(color, ems, emi)}
            </mesh>
        </group>
    );
}

function CornerSofaModel({ w, h, d, color, emissive, emissiveIntensity, onPointerDown }) {
    const legH = h * 0.12, seatH = h * 0.32, backH = h * 0.56;
    const armW = 0.12;
    const ems = emissive || "#000", emi = emissiveIntensity || 0;
    return (
        <group onPointerDown={onPointerDown}>
            {/* Horizontal wing */}
            <mesh castShadow receiveShadow position={[0, legH + seatH / 2, -d * 0.25]}>
                <boxGeometry args={[w, seatH, d * 0.5]} />
                {mat(color, ems, emi)}
            </mesh>
            {/* Vertical wing */}
            <mesh castShadow receiveShadow position={[w * 0.25, legH + seatH / 2, d * 0.125]}>
                <boxGeometry args={[w * 0.5, seatH, d * 0.75]} />
                {mat(color, ems, emi)}
            </mesh>
            {/* Back horizontal */}
            <mesh castShadow receiveShadow position={[0, legH + seatH + backH / 2, -d / 2 + 0.09]}>
                <boxGeometry args={[w, backH, 0.15]} />
                {mat(color, ems, emi)}
            </mesh>
            {/* Back vertical */}
            <mesh castShadow receiveShadow position={[-w / 2 + 0.09, legH + seatH + backH / 2, d * 0.125]}>
                <boxGeometry args={[0.15, backH, d * 0.75]} />
                {mat(color, ems, emi)}
            </mesh>
            {/* Corner block */}
            <mesh castShadow receiveShadow position={[w * 0.25, legH + seatH / 2, -d * 0.25]}>
                <boxGeometry args={[w * 0.5, seatH, d * 0.5]} />
                {mat(color, ems, emi)}
            </mesh>
        </group>
    );
}

// ---------- CHAIRS ----------------------------------------------------------
function ArmchairModel({ w, h, d, color, emissive, emissiveIntensity, onPointerDown }) {
    const legH = h * 0.14, seatH = h * 0.3, backH = h * 0.56, armW = Math.min(0.1, w * 0.12);
    const innerW = w - armW * 2;
    const ems = emissive || "#000", emi = emissiveIntensity || 0;
    return (
        <group onPointerDown={onPointerDown}>
            <mesh castShadow receiveShadow position={[0, legH + seatH / 2, 0]}>
                <boxGeometry args={[innerW, seatH, d * 0.55]} />
                {mat(color, ems, emi)}
            </mesh>
            <mesh castShadow receiveShadow position={[0, legH + seatH + backH / 2, -d / 2 + 0.1]}>
                <boxGeometry args={[innerW, backH, 0.15]} />
                {mat(color, ems, emi)}
            </mesh>
            <mesh castShadow receiveShadow position={[-w / 2 + armW / 2, legH + h * 0.32, 0]}>
                <boxGeometry args={[armW, h * 0.38, d * 0.7]} />
                {mat(color, ems, emi)}
            </mesh>
            <mesh castShadow receiveShadow position={[w / 2 - armW / 2, legH + h * 0.32, 0]}>
                <boxGeometry args={[armW, h * 0.38, d * 0.7]} />
                {mat(color, ems, emi)}
            </mesh>
            {[[-innerW / 2 + 0.05, d * 0.22], [innerW / 2 - 0.05, d * 0.22],
            [-innerW / 2 + 0.05, -d * 0.22], [innerW / 2 - 0.05, -d * 0.22]].map(([lx, lz], i) => (
                <mesh key={i} position={[lx, legH / 2, lz]}>
                    <cylinderGeometry args={[0.025, 0.025, legH, 6]} />
                    {mat("#6A5040")}
                </mesh>
            ))}
        </group>
    );
}

function DiningChairModel({ w, h, d, color, emissive, emissiveIntensity, onPointerDown }) {
    const legH = h * 0.52, seatH = h * 0.08, seatY = legH + seatH / 2;
    const backH = h - legH - seatH, backY = legH + seatH + backH / 2;
    const legR = 0.022;
    const ems = emissive || "#000", emi = emissiveIntensity || 0;
    return (
        <group onPointerDown={onPointerDown}>
            <mesh castShadow receiveShadow position={[0, seatY, 0]}>
                <boxGeometry args={[w, seatH, d]} />
                {mat(color, ems, emi)}
            </mesh>
            <mesh castShadow receiveShadow position={[0, backY, -d / 2 + 0.03]}>
                <boxGeometry args={[w * 0.88, backH, 0.06]} />
                {mat(color, ems, emi)}
            </mesh>
            {[[-w / 2 + 0.05, d / 2 - 0.05], [w / 2 - 0.05, d / 2 - 0.05],
            [-w / 2 + 0.05, -d / 2 + 0.05], [w / 2 - 0.05, -d / 2 + 0.05]].map(([lx, lz], i) => (
                <mesh key={i} position={[lx, legH / 2, lz]}>
                    <cylinderGeometry args={[legR, legR, legH, 6]} />
                    {mat(color, ems, emi)}
                </mesh>
            ))}
        </group>
    );
}

function OfficeChairModel({ w, h, d, color, emissive, emissiveIntensity, onPointerDown }) {
    const seatH_total = h * 0.42, seatH = 0.08, backH = h * 0.48;
    const seatY = seatH_total - seatH / 2;
    const ems = emissive || "#000", emi = emissiveIntensity || 0;
    return (
        <group onPointerDown={onPointerDown}>
            {/* Base star */}
            {[0, 72, 144, 216, 288].map((deg, i) => {
                const rad = deg * Math.PI / 180;
                return (
                    <mesh key={i} position={[Math.cos(rad) * w * 0.35, 0.04, Math.sin(rad) * w * 0.35]}>
                        <boxGeometry args={[w * 0.7, 0.04, 0.06]} />
                        <meshStandardMaterial color="#222" />
                    </mesh>
                );
            })}
            {/* Gas cylinder */}
            <mesh position={[0, seatH_total * 0.4, 0]}>
                <cylinderGeometry args={[0.04, 0.05, seatH_total * 0.75, 10]} />
                <meshStandardMaterial color="#444" />
            </mesh>
            {/* Seat */}
            <mesh castShadow receiveShadow position={[0, seatY, 0]}>
                <boxGeometry args={[w, seatH, d]} />
                {mat(color, ems, emi)}
            </mesh>
            {/* Backrest */}
            <mesh castShadow receiveShadow position={[0, seatY + seatH / 2 + backH / 2, -d / 2 + 0.04]}>
                <boxGeometry args={[w * 0.88, backH, 0.08]} />
                {mat(color, ems, emi)}
            </mesh>
            {/* Armrests */}
            {[-1, 1].map((side, i) => (
                <mesh key={i} position={[side * w * 0.45, seatY + 0.12, 0]}>
                    <boxGeometry args={[0.05, 0.04, d * 0.55]} />
                    <meshStandardMaterial color="#333" />
                </mesh>
            ))}
        </group>
    );
}

function BarStoolModel({ w, h, d, color, emissive, emissiveIntensity, onPointerDown }) {
    const ems = emissive || "#000", emi = emissiveIntensity || 0;
    return (
        <group onPointerDown={onPointerDown}>
            {/* Seat */}
            <mesh castShadow receiveShadow position={[0, h - 0.04, 0]}>
                <cylinderGeometry args={[w / 2, w / 2, 0.06, 16]} />
                {mat(color, ems, emi)}
            </mesh>
            {/* Stem */}
            <mesh position={[0, h * 0.5, 0]}>
                <cylinderGeometry args={[0.03, 0.04, h * 0.85, 8]} />
                {mat(color, ems, emi)}
            </mesh>
            {/* Foot ring */}
            <mesh position={[0, h * 0.33, 0]}>
                <torusGeometry args={[w * 0.32, 0.018, 6, 20]} />
                {mat(color, ems, emi)}
            </mesh>
            {/* Base */}
            <mesh position={[0, 0.03, 0]}>
                <cylinderGeometry args={[w * 0.38, w * 0.38, 0.04, 16]} />
                <meshStandardMaterial color="#333" />
            </mesh>
        </group>
    );
}

// ---------- TABLES ----------------------------------------------------------
function TableModel({ w, h, d, color, emissive, emissiveIntensity, onPointerDown }) {
    const topH = 0.05, legH = h - topH, legR = 0.04;
    const ems = emissive || "#000", emi = emissiveIntensity || 0;
    return (
        <group onPointerDown={onPointerDown}>
            {/* Top */}
            <mesh castShadow receiveShadow position={[0, h - topH / 2, 0]}>
                <boxGeometry args={[w, topH, d]} />
                {mat(color, ems, emi)}
            </mesh>
            {/* 4 legs */}
            {[[-w / 2 + 0.07, d / 2 - 0.07], [w / 2 - 0.07, d / 2 - 0.07],
            [-w / 2 + 0.07, -d / 2 + 0.07], [w / 2 - 0.07, -d / 2 + 0.07]].map(([lx, lz], i) => (
                <mesh key={i} castShadow position={[lx, legH / 2, lz]}>
                    <cylinderGeometry args={[legR, legR, legH, 8]} />
                    {mat(color, ems, emi)}
                </mesh>
            ))}
        </group>
    );
}

function CoffeeTableModel({ w, h, d, color, emissive, emissiveIntensity, onPointerDown }) {
    const topH = 0.04, shelfH = 0.04, legH = h - topH, legR = 0.025;
    const ems = emissive || "#000", emi = emissiveIntensity || 0;
    return (
        <group onPointerDown={onPointerDown}>
            <mesh castShadow receiveShadow position={[0, h - topH / 2, 0]}>
                <boxGeometry args={[w, topH, d]} />
                {mat(color, ems, emi)}
            </mesh>
            {/* Lower shelf */}
            <mesh receiveShadow position={[0, h * 0.38, 0]}>
                <boxGeometry args={[w * 0.82, shelfH, d * 0.82]} />
                {mat(color, ems, emi)}
            </mesh>
            {[[-w / 2 + 0.06, d / 2 - 0.06], [w / 2 - 0.06, d / 2 - 0.06],
            [-w / 2 + 0.06, -d / 2 + 0.06], [w / 2 - 0.06, -d / 2 + 0.06]].map(([lx, lz], i) => (
                <mesh key={i} castShadow position={[lx, legH / 2, lz]}>
                    <cylinderGeometry args={[legR, legR, legH, 6]} />
                    {mat(color, ems, emi)}
                </mesh>
            ))}
        </group>
    );
}

function SideTableModel({ w, h, d, color, emissive, emissiveIntensity, onPointerDown }) {
    const topH = 0.04, legH = h - topH;
    const ems = emissive || "#000", emi = emissiveIntensity || 0;
    return (
        <group onPointerDown={onPointerDown}>
            <mesh castShadow receiveShadow position={[0, h - topH / 2, 0]}>
                <cylinderGeometry args={[w / 2, w / 2, topH, 20]} />
                {mat(color, ems, emi)}
            </mesh>
            <mesh castShadow position={[0, legH / 2, 0]}>
                <cylinderGeometry args={[0.03, 0.04, legH, 8]} />
                {mat(color, ems, emi)}
            </mesh>
            <mesh position={[0, 0.03, 0]}>
                <cylinderGeometry args={[w * 0.38, w * 0.38, 0.04, 16]} />
                {mat(color, ems, emi)}
            </mesh>
        </group>
    );
}

function DeskModel({ w, h, d, color, emissive, emissiveIntensity, onPointerDown }) {
    const topH = 0.04, drawerH = h * 0.55, drawerW = w * 0.28;
    const legH = h - topH, legR = 0.035;
    const ems = emissive || "#000", emi = emissiveIntensity || 0;
    return (
        <group onPointerDown={onPointerDown}>
            <mesh castShadow receiveShadow position={[0, h - topH / 2, 0]}>
                <boxGeometry args={[w, topH, d]} />
                {mat(color, ems, emi)}
            </mesh>
            {/* Right pedestal (drawers) */}
            <mesh castShadow receiveShadow position={[w / 2 - drawerW / 2, drawerH / 2, 0]}>
                <boxGeometry args={[drawerW, drawerH, d * 0.9]} />
                {mat(color, ems, emi)}
            </mesh>
            {/* Left leg */}
            <mesh castShadow position={[-w / 2 + 0.06, legH * 0.35, d / 2 - 0.06]}>
                <cylinderGeometry args={[legR, legR, legH * 0.7, 8]} />
                {mat(color, ems, emi)}
            </mesh>
            <mesh castShadow position={[-w / 2 + 0.06, legH * 0.35, -d / 2 + 0.06]}>
                <cylinderGeometry args={[legR, legR, legH * 0.7, 8]} />
                {mat(color, ems, emi)}
            </mesh>
        </group>
    );
}

// ---------- BEDS ------------------------------------------------------------
function BedModel({ w, h, d, color, emissive, emissiveIntensity, onPointerDown }) {
    const frameH = h * 0.35, mattressH = h * 0.42, pillowH = 0.12;
    const headH = h, footH = h * 0.48, frameThick = 0.12;
    const ems = emissive || "#000", emi = emissiveIntensity || 0;
    const frameColor = "#5A4030";

    return (
        <group onPointerDown={onPointerDown}>
            {/* Frame sides */}
            <mesh castShadow receiveShadow position={[-w / 2 + frameThick / 2, frameH / 2, 0]}>
                <boxGeometry args={[frameThick, frameH, d]} />
                {mat(frameColor)}
            </mesh>
            <mesh castShadow receiveShadow position={[w / 2 - frameThick / 2, frameH / 2, 0]}>
                <boxGeometry args={[frameThick, frameH, d]} />
                {mat(frameColor)}
            </mesh>
            {/* Headboard */}
            <mesh castShadow receiveShadow position={[0, headH / 2, -d / 2 + frameThick / 2]}>
                <boxGeometry args={[w, headH, frameThick]} />
                {mat(frameColor)}
            </mesh>
            {/* Footboard */}
            <mesh castShadow receiveShadow position={[0, footH / 2, d / 2 - frameThick / 2]}>
                <boxGeometry args={[w, footH, frameThick]} />
                {mat(frameColor)}
            </mesh>
            {/* Mattress */}
            <mesh castShadow receiveShadow position={[0, frameH + mattressH / 2, d * 0.02]}>
                <boxGeometry args={[w - frameThick * 2.2, mattressH, d - frameThick * 2.2]} />
                {mat("#E8E0D0", ems, emi)}
            </mesh>
            {/* Duvet */}
            <mesh receiveShadow position={[0, frameH + mattressH + 0.04, d * 0.1]}>
                <boxGeometry args={[w - frameThick * 2.4, 0.08, d * 0.65]} />
                {mat(color, ems, emi)}
            </mesh>
            {/* Pillows */}
            {(w > 1.5 ? [-w * 0.18, w * 0.18] : [0]).map((px, i) => (
                <mesh key={i} receiveShadow position={[px, frameH + mattressH + pillowH / 2, -d * 0.3]}>
                    <boxGeometry args={[w > 1.5 ? w * 0.34 : w * 0.7, pillowH, d * 0.19]} />
                    {mat("#F5F0E8")}
                </mesh>
            ))}
        </group>
    );
}

// ---------- PLANTS ----------------------------------------------------------
function PlantModel({ w, h, d, color, emissive, emissiveIntensity, onPointerDown }) {
    const potH = h * 0.28, potR = w * 0.42, stemH = h * 0.12;
    const leafR = w * 0.48, leafY = potH + stemH + leafR * 0.55;
    const darkGreen = color;
    const potColor = "#7A5C3A";
    const ems = emissive || "#000", emi = emissiveIntensity || 0;
    return (
        <group onPointerDown={onPointerDown}>
            {/* Pot */}
            <mesh castShadow position={[0, potH / 2, 0]}>
                <cylinderGeometry args={[potR * 0.8, potR * 0.65, potH, 14]} />
                {mat(potColor)}
            </mesh>
            {/* Soil disk */}
            <mesh position={[0, potH, 0]}>
                <cylinderGeometry args={[potR * 0.78, potR * 0.78, 0.02, 14]} />
                <meshStandardMaterial color="#3A2A1A" />
            </mesh>
            {/* Foliage sphere */}
            <mesh castShadow position={[0, leafY, 0]}>
                <sphereGeometry args={[leafR, 12, 10]} />
                {mat(darkGreen, ems, emi)}
            </mesh>
            {/* Second smaller sphere for volume */}
            <mesh castShadow position={[leafR * 0.45, leafY + leafR * 0.2, 0]}>
                <sphereGeometry args={[leafR * 0.62, 10, 8]} />
                {mat(darkGreen, ems, emi)}
            </mesh>
        </group>
    );
}

function TreeModel({ w, h, d, color, emissive, emissiveIntensity, onPointerDown }) {
    const potH = h * 0.18, trunkH = h * 0.42, trunkR = w * 0.1;
    const crownH = h * 0.48, crownR = w * 0.44;
    const ems = emissive || "#000", emi = emissiveIntensity || 0;
    return (
        <group onPointerDown={onPointerDown}>
            <mesh castShadow position={[0, potH / 2, 0]}>
                <cylinderGeometry args={[w * 0.38, w * 0.32, potH, 12]} />
                {mat("#6B4A2A")}
            </mesh>
            <mesh castShadow position={[0, potH + trunkH / 2, 0]}>
                <cylinderGeometry args={[trunkR, trunkR * 1.1, trunkH, 8]} />
                {mat("#6B4A2A")}
            </mesh>
            {/* Layered canopy */}
            <mesh castShadow position={[0, potH + trunkH + crownH * 0.28, 0]}>
                <sphereGeometry args={[crownR, 10, 8]} />
                {mat(color, ems, emi)}
            </mesh>
            <mesh castShadow position={[crownR * 0.5, potH + trunkH + crownH * 0.45, 0]}>
                <sphereGeometry args={[crownR * 0.65, 8, 7]} />
                {mat(color, ems, emi)}
            </mesh>
            <mesh castShadow position={[-crownR * 0.4, potH + trunkH + crownH * 0.5, crownR * 0.25]}>
                <sphereGeometry args={[crownR * 0.55, 8, 7]} />
                {mat(color, ems, emi)}
            </mesh>
        </group>
    );
}

// ---------- PICTURE FRAMES --------------------------------------------------
function FrameModel({ w, h, d, color, emissive, emissiveIntensity, onPointerDown }) {
    const thick = Math.max(d, 0.04), border = 0.045;
    const ems = emissive || "#000", emi = emissiveIntensity || 0;
    return (
        <group onPointerDown={onPointerDown}>
            {/* Frame border (4 strips) */}
            <mesh castShadow position={[0, h / 2, 0]}>
                <boxGeometry args={[w, h, thick]} />
                {mat(color, ems, emi)}
            </mesh>
            {/* Canvas inner */}
            <mesh position={[0, h / 2, thick / 2 + 0.001]}>
                <boxGeometry args={[w - border * 2, h - border * 2, 0.005]} />
                {mat("#E8E0D0")}
            </mesh>
            {/* Simple "painting" color block */}
            <mesh position={[0, h / 2, thick / 2 + 0.003]}>
                <boxGeometry args={[w - border * 2.8, h - border * 2.8, 0.004]} />
                <meshStandardMaterial color="#7090B0" />
            </mesh>
        </group>
    );
}

// ---------- ELECTRONICS -----------------------------------------------------
function TVModel({ w, h, d, color, emissive, emissiveIntensity, onPointerDown }) {
    const screenH = h * 0.88, borderT = 0.04;
    const ems = emissive || "#000", emi = emissiveIntensity || 0;
    return (
        <group onPointerDown={onPointerDown}>
            {/* Panel */}
            <mesh castShadow position={[0, h / 2, 0]}>
                <boxGeometry args={[w, h, d]} />
                {mat(color, ems, emi)}
            </mesh>
            {/* Screen glass */}
            <mesh position={[0, h / 2 + borderT * 0.1, d / 2 + 0.002]}>
                <boxGeometry args={[w - borderT * 2.2, screenH, 0.006]} />
                <meshStandardMaterial color="#0A1428" emissive="#0A1A2E" emissiveIntensity={0.35} />
            </mesh>
            {/* Stand neck */}
            <mesh position={[0, 0.06, 0]}>
                <boxGeometry args={[0.06, 0.12, 0.06]} />
                {mat(color)}
            </mesh>
            {/* Stand base */}
            <mesh position={[0, 0.02, 0]}>
                <boxGeometry args={[w * 0.42, 0.03, d * 3]} />
                {mat(color)}
            </mesh>
        </group>
    );
}

function FridgeModel({ w, h, d, color, emissive, emissiveIntensity, onPointerDown }) {
    const ems = emissive || "#000", emi = emissiveIntensity || 0;
    const handleColor = "#888";
    return (
        <group onPointerDown={onPointerDown}>
            {/* Body */}
            <mesh castShadow receiveShadow position={[0, h / 2, 0]}>
                <boxGeometry args={[w, h, d]} />
                {mat(color, ems, emi)}
            </mesh>
            {/* Door divider line */}
            <mesh position={[0, h * 0.35, d / 2 + 0.001]}>
                <boxGeometry args={[w * 0.96, 0.015, 0.004]} />
                <meshStandardMaterial color="#aaaaaa" />
            </mesh>
            {/* Handle (freezer) */}
            <mesh position={[w * 0.35, h * 0.22, d / 2 + 0.04]}>
                <boxGeometry args={[0.025, h * 0.15, 0.025]} />
                {mat(handleColor)}
            </mesh>
            {/* Handle (fridge) */}
            <mesh position={[w * 0.35, h * 0.64, d / 2 + 0.04]}>
                <boxGeometry args={[0.025, h * 0.25, 0.025]} />
                {mat(handleColor)}
            </mesh>
        </group>
    );
}

function WashingMachineModel({ w, h, d, color, emissive, emissiveIntensity, onPointerDown }) {
    const ems = emissive || "#000", emi = emissiveIntensity || 0;
    return (
        <group onPointerDown={onPointerDown}>
            <mesh castShadow receiveShadow position={[0, h / 2, 0]}>
                <boxGeometry args={[w, h, d]} />
                {mat(color, ems, emi)}
            </mesh>
            {/* Door circle */}
            <mesh position={[0, h * 0.42, d / 2 + 0.005]}>
                <cylinderGeometry args={[w * 0.3, w * 0.3, 0.015, 24]} rotation={[Math.PI / 2, 0, 0]} />
                <meshStandardMaterial color="#888" />
            </mesh>
            {/* Inner glass */}
            <mesh position={[0, h * 0.42, d / 2 + 0.01]}>
                <cylinderGeometry args={[w * 0.23, w * 0.23, 0.008, 24]} rotation={[Math.PI / 2, 0, 0]} />
                <meshStandardMaterial color="#334455" transparent opacity={0.7} />
            </mesh>
            {/* Controls panel */}
            <mesh position={[0, h * 0.82, d / 2 + 0.003]}>
                <boxGeometry args={[w * 0.8, h * 0.12, 0.01]} />
                <meshStandardMaterial color="#ccccdd" />
            </mesh>
        </group>
    );
}

// ---------- LARGE FURNITURE -------------------------------------------------
function WardrobeModel({ w, h, d, color, emissive, emissiveIntensity, onPointerDown }) {
    const ems = emissive || "#000", emi = emissiveIntensity || 0;
    const doorW = w / 2 - 0.01;
    return (
        <group onPointerDown={onPointerDown}>
            {/* Carcass */}
            <mesh castShadow receiveShadow position={[0, h / 2, 0]}>
                <boxGeometry args={[w, h, d]} />
                {mat(color, ems, emi)}
            </mesh>
            {/* Door gap */}
            <mesh position={[0, h / 2, d / 2 + 0.001]}>
                <boxGeometry args={[0.012, h * 0.97, 0.003]} />
                <meshStandardMaterial color="#222" />
            </mesh>
            {/* Left door handle */}
            <mesh position={[-0.09, h * 0.5, d / 2 + 0.03]}>
                <cylinderGeometry args={[0.018, 0.018, 0.12, 8]} rotation={[0, 0, Math.PI / 2]} />
                <meshStandardMaterial color="#888" metalness={0.8} roughness={0.2} />
            </mesh>
            {/* Right door handle */}
            <mesh position={[0.09, h * 0.5, d / 2 + 0.03]}>
                <cylinderGeometry args={[0.018, 0.018, 0.12, 8]} rotation={[0, 0, Math.PI / 2]} />
                <meshStandardMaterial color="#888" metalness={0.8} roughness={0.2} />
            </mesh>
        </group>
    );
}

function BookshelfModel({ w, h, d, color, emissive, emissiveIntensity, onPointerDown }) {
    const ems = emissive || "#000", emi = emissiveIntensity || 0;
    const numShelves = 4;
    return (
        <group onPointerDown={onPointerDown}>
            {/* Sides */}
            <mesh castShadow receiveShadow position={[-w / 2 + 0.025, h / 2, 0]}>
                <boxGeometry args={[0.05, h, d]} />
                {mat(color, ems, emi)}
            </mesh>
            <mesh castShadow receiveShadow position={[w / 2 - 0.025, h / 2, 0]}>
                <boxGeometry args={[0.05, h, d]} />
                {mat(color, ems, emi)}
            </mesh>
            {/* Back panel */}
            <mesh receiveShadow position={[0, h / 2, -d / 2 + 0.01]}>
                <boxGeometry args={[w, h, 0.02]} />
                {mat(color, ems, emi)}
            </mesh>
            {/* Shelves */}
            {Array.from({ length: numShelves + 1 }, (_, i) => {
                const sy = (h / (numShelves + 1)) * i;
                return (
                    <mesh key={i} receiveShadow position={[0, sy + 0.015, 0]}>
                        <boxGeometry args={[w, 0.03, d]} />
                        {mat(color, ems, emi)}
                    </mesh>
                );
            })}
            {/* Book groups on shelves */}
            {Array.from({ length: numShelves }, (_, i) => {
                const sy = (h / (numShelves + 1)) * (i + 1) + 0.03;
                const maxBooks = Math.floor((w - 0.1) / 0.065);
                const nBooks = Math.min(maxBooks, Math.round(maxBooks * 0.7 + Math.random() * maxBooks * 0.3));
                return Array.from({ length: nBooks }, (_, j) => {
                    const bx = -w / 2 + 0.08 + j * 0.065;
                    const bh = 0.16 + (j % 3) * 0.04;
                    const bookColor = ["#A04040", "#4060A0", "#40804A", "#9A7A30", "#705080"][j % 5];
                    return (
                        <mesh key={`${i}_${j}`} position={[bx, sy + bh / 2, 0]}>
                            <boxGeometry args={[0.055, bh, d * 0.85]} />
                            <meshStandardMaterial color={bookColor} />
                        </mesh>
                    );
                });
            })}
        </group>
    );
}

function DresserModel({ w, h, d, color, emissive, emissiveIntensity, onPointerDown }) {
    const ems = emissive || "#000", emi = emissiveIntensity || 0;
    const numDrawers = 3, drawerH = (h * 0.85) / numDrawers, legH = h * 0.12;
    return (
        <group onPointerDown={onPointerDown}>
            {/* Body */}
            <mesh castShadow receiveShadow position={[0, legH + (h - legH) / 2, 0]}>
                <boxGeometry args={[w, h - legH, d]} />
                {mat(color, ems, emi)}
            </mesh>
            {/* Top panel (slightly lighter) */}
            <mesh position={[0, h - 0.01, 0]}>
                <boxGeometry args={[w, 0.02, d]} />
                {mat(color, ems, emi)}
            </mesh>
            {/* Drawer faces */}
            {Array.from({ length: numDrawers }, (_, i) => (
                <group key={i}>
                    <mesh position={[0, legH + drawerH * (i + 0.5) - 0.005, d / 2 + 0.003]}>
                        <boxGeometry args={[w * 0.94, drawerH * 0.86, 0.01]} />
                        <meshStandardMaterial color="#888" metalness={0.5} roughness={0.3} />
                    </mesh>
                    {/* Handle */}
                    <mesh position={[0, legH + drawerH * (i + 0.5), d / 2 + 0.03]}>
                        <cylinderGeometry args={[0.014, 0.014, w * 0.28, 8]} rotation={[0, 0, Math.PI / 2]} />
                        <meshStandardMaterial color="#999" metalness={0.9} roughness={0.1} />
                    </mesh>
                </group>
            ))}
            {/* Legs */}
            {[[-w / 2 + 0.08, d / 2 - 0.07], [w / 2 - 0.08, d / 2 - 0.07],
            [-w / 2 + 0.08, -d / 2 + 0.07], [w / 2 - 0.08, -d / 2 + 0.07]].map(([lx, lz], i) => (
                <mesh key={i} position={[lx, legH / 2, lz]}>
                    <cylinderGeometry args={[0.025, 0.025, legH, 6]} />
                    {mat(color, ems, emi)}
                </mesh>
            ))}
        </group>
    );
}

function TVStandModel({ w, h, d, color, emissive, emissiveIntensity, onPointerDown }) {
    const ems = emissive || "#000", emi = emissiveIntensity || 0;
    const legH = h * 0.22, shelfY = legH + (h - legH) * 0.5;
    return (
        <group onPointerDown={onPointerDown}>
            {/* Top surface */}
            <mesh castShadow receiveShadow position={[0, h - 0.02, 0]}>
                <boxGeometry args={[w, 0.04, d]} />
                {mat(color, ems, emi)}
            </mesh>
            {/* Body */}
            <mesh castShadow receiveShadow position={[0, legH + (h - legH) * 0.5 - 0.02, 0]}>
                <boxGeometry args={[w, h - legH - 0.04, d]} />
                {mat(color, ems, emi)}
            </mesh>
            {/* Middle shelf line */}
            <mesh position={[0, shelfY, d / 2 + 0.003]}>
                <boxGeometry args={[w * 0.92, 0.01, 0.006]} />
                <meshStandardMaterial color="#111" />
            </mesh>
            {/* Legs */}
            {[[-w / 2 + 0.07, d / 2 - 0.06], [w / 2 - 0.07, d / 2 - 0.06],
            [-w / 2 + 0.07, -d / 2 + 0.06], [w / 2 - 0.07, -d / 2 + 0.06]].map(([lx, lz], i) => (
                <mesh key={i} position={[lx, legH / 2, lz]}>
                    <boxGeometry args={[0.05, legH, 0.05]} />
                    {mat(color, ems, emi)}
                </mesh>
            ))}
        </group>
    );
}

function BathtubModel({ w, h, d, color, emissive, emissiveIntensity, onPointerDown }) {
    const ems = emissive || "#000", emi = emissiveIntensity || 0;
    const wallT = 0.07;
    return (
        <group onPointerDown={onPointerDown}>
            {/* Outer shell */}
            <mesh castShadow receiveShadow position={[0, h / 2, 0]}>
                <boxGeometry args={[w, h, d]} />
                {mat(color, ems, emi)}
            </mesh>
            {/* Inner cavity (dark) */}
            <mesh position={[0, h * 0.55, 0]}>
                <boxGeometry args={[w - wallT * 2, h * 0.65, d - wallT * 2]} />
                <meshStandardMaterial color="#B8D4E8" transparent opacity={0.7} />
            </mesh>
            {/* Faucet */}
            <mesh position={[w * 0.3, h + 0.06, -d / 2 + wallT + 0.05]}>
                <cylinderGeometry args={[0.02, 0.02, 0.12, 8]} />
                <meshStandardMaterial color="#aaa" metalness={0.9} roughness={0.1} />
            </mesh>
        </group>
    );
}

function ToiletModel({ w, h, d, color, emissive, emissiveIntensity, onPointerDown }) {
    const ems = emissive || "#000", emi = emissiveIntensity || 0;
    const tankH = h * 0.38, tankW = w * 0.72, tankD = d * 0.32;
    const bowlH = h * 0.52, seatH = 0.06;
    return (
        <group onPointerDown={onPointerDown}>
            {/* Tank */}
            <mesh castShadow receiveShadow position={[0, bowlH + tankH / 2, -d / 2 + tankD / 2]}>
                <boxGeometry args={[tankW, tankH, tankD]} />
                {mat(color, ems, emi)}
            </mesh>
            {/* Bowl outer */}
            <mesh castShadow receiveShadow position={[0, bowlH / 2, d * 0.05]}>
                <cylinderGeometry args={[w / 2, w * 0.38, bowlH, 16]} />
                {mat(color, ems, emi)}
            </mesh>
            {/* Seat */}
            <mesh position={[0, bowlH + seatH / 2, d * 0.05]}>
                <cylinderGeometry args={[w * 0.46, w * 0.46, seatH, 16]} />
                {mat("#E0E0E0")}
            </mesh>
            {/* Bowl interior */}
            <mesh position={[0, bowlH - 0.02, d * 0.05]}>
                <cylinderGeometry args={[w * 0.3, w * 0.3, 0.12, 16]} />
                <meshStandardMaterial color="#B8D4E8" transparent opacity={0.6} />
            </mesh>
        </group>
    );
}

// ---------- Router -----------------------------------------------------------
// Maps catalog item id → model component
const MODEL_MAP = {
    // Sofas
    sofa_2p: SofaModel,
    sofa_3p: SofaModel,
    sofa_chaise: ChaiseModel,
    sofa_canto: CornerSofaModel,
    // Chairs
    chair_arm: ArmchairModel,
    chair_dining: DiningChairModel,
    chair_office: OfficeChairModel,
    chair_bar: BarStoolModel,
    // Tables
    table_coffee: CoffeeTableModel,
    table_dining4: TableModel,
    table_dining6: TableModel,
    table_desk: DeskModel,
    table_side: SideTableModel,
    // Beds
    bed_single: BedModel,
    bed_double: BedModel,
    bed_queen: BedModel,
    bed_king: BedModel,
    // Plants
    plant_small: PlantModel,
    plant_floor: PlantModel,
    plant_tree: TreeModel,
    // Frames
    frame_small: FrameModel,
    frame_medium: FrameModel,
    frame_large: FrameModel,
    // Electronics
    tv_55: TVModel,
    tv_65: TVModel,
    fridge: FridgeModel,
    washing: WashingMachineModel,
    // Big furniture
    wardrobe: WardrobeModel,
    bookshelf: BookshelfModel,
    dresser: DresserModel,
    tv_stand: TVStandModel,
    bathtub: BathtubModel,
    toilet: ToiletModel,
};

export function FurnitureModel({ itemId, w, h, d, color, emissive, emissiveIntensity, onPointerDown }) {
    const Component = MODEL_MAP[itemId];
    if (!Component) {
        // Fallback generic box
        return (
            <mesh castShadow receiveShadow position={[0, h / 2, 0]} onPointerDown={onPointerDown}>
                <boxGeometry args={[w, h, d]} />
                <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={emissiveIntensity} />
            </mesh>
        );
    }
    return (
        <Component
            w={w} h={h} d={d}
            color={color}
            emissive={emissive}
            emissiveIntensity={emissiveIntensity}
            onPointerDown={onPointerDown}
        />
    );
}
