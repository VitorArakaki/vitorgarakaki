import { NextResponse } from "next/server";
import { checkDemoAccess, incrementDemoUsage, getClientIp } from "../../../lib/demoAccess";
import { callGemini } from "../../../lib/gemini";

const SLUG = 'environment-virtualizer';

// ── Gemini prompt ─────────────────────────────────────────────────────────
// Instructs Gemini 1.5 Flash to extract the floor plan geometry as structured JSON.
const GEMINI_PROMPT = `You are an expert architectural floor plan interpreter and spatial reasoning AI. Your task is to analyze the provided 2D floor plan, extract the outer wall perimeter, and identify the presence of doors and windows on those walls.

IGNORE all interior elements: furniture (beds, pianos, desks, closets, rugs), interior partitions, annotations, and labels. Focus EXCLUSIVELY on the main outer boundary walls.

Follow these steps strictly:

STEP 1: SPATIAL ANALYSIS (Think step-by-step)
Briefly analyze the image. 
1. Identify the overall shape of the room (e.g., rectangular, L-shaped).
2. Count the total number of outer corners.
3. Locate the doors. Look for a quarter-circle arc connected to a straight line. Assume a standard door width is 0.9 meters to establish a mental scale for the rest of the room.
4. Locate the windows. Look for distinct parallel lines cut into the thick outer walls (often 3 or 4 parallel lines).
5. Mentally map the corners counter-clockwise, noting which walls (edges between corners) contain the doors and windows you found.

STEP 2: JSON OUTPUT
Generate a JSON object representing the geometry. 
- "height": Default to 2.7 (meters).
- "vertices": Array of [x, z] coordinates in meters for each OUTER WALL CORNER, centered roughly at [0, 0]. List them COUNTER-CLOCKWISE. Do NOT add vertices for interior room features.
- "walls": One entry per polygon edge. Edge index [i] connects vertices[i] to vertices[(i+1) mod n].
  - "hasDoor": true ONLY if the door symbol is on this specific edge.
  - "hasWindow": true ONLY if the window symbol is on this specific edge.

Output ONLY a raw JSON object. No markdown, no code fences, no extra text.

Example: {"height": 2.7, "vertices": [[-2,-2],[2,-2],[2,2],[-2,2]], "walls": [{"index":0,"hasDoor":true,"hasWindow":false},{"index":1,"hasDoor":false,"hasWindow":false},{"index":2,"hasDoor":false,"hasWindow":true},{"index":3,"hasDoor":false,"hasWindow":false}]}`;

function detectMimeType(base64) {
    if (base64.startsWith("/9j/")) return "image/jpeg";
    if (base64.startsWith("iVBOR")) return "image/png";
    if (base64.startsWith("UklG") || base64.startsWith("AAAA")) return "image/webp";
    return "image/jpeg";
}

function extractJSON(text) {
    const trimmed = text.trim();
    try { return JSON.parse(trimmed); } catch { /* fall through */ }
    const stripped = trimmed.replace(/```(?:json)?\s*/gi, "").replace(/```\s*/g, "").trim();
    try { return JSON.parse(stripped); } catch { /* fall through */ }
    const match = stripped.match(/\{[\s\S]*\}/);
    if (match) { try { return JSON.parse(match[0]); } catch { /* fall through */ } }
    return null;
}

export async function POST(request) {
    try {
        const cookieHeader = request.headers.get('cookie') ?? '';
        const ip = getClientIp(request);
        const access = await checkDemoAccess({ cookieHeader, ip }, SLUG);

        if (!access.allowed) {
            return NextResponse.json(
                { error: 'Você atingiu o limite de 3 usos gratuitos. Assine um plano para continuar.', paywall: true },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { imageBase64 } = body;

        if (!imageBase64 || typeof imageBase64 !== "string") {
            return NextResponse.json({ error: "Imagem não fornecida." }, { status: 400 });
        }

        if (imageBase64.length > 14_000_000) {
            return NextResponse.json({ error: "Imagem muito grande. Limite de 10MB." }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                {
                    error:
                        "GEMINI_API_KEY não configurada. Obtenha uma chave gratuita em https://aistudio.google.com e adicione GEMINI_API_KEY ao .env.local.",
                },
                { status: 503 }
            );
        }

        const mimeType = detectMimeType(imageBase64);

        const geminiResult = await callGemini(
            apiKey,
            {
                contents: [
                    {
                        parts: [
                            { text: GEMINI_PROMPT },
                            { inline_data: { mime_type: mimeType, data: imageBase64 } },
                        ],
                    },
                ],
                generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 2000,
                },
            },
            { timeout: 30_000 }
        );

        if (!geminiResult.ok) {
            return NextResponse.json({ error: geminiResult.error }, { status: 502 });
        }

        const rawText = geminiResult.data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        const parsed = extractJSON(rawText);

        if (!parsed) {
            return NextResponse.json(
                { error: "Gemini retornou resposta inválida. Tente novamente com outra imagem." },
                { status: 502 }
            );
        }

        // Increment usage only after a successful response
        if (!access.unlimited) await incrementDemoUsage(ip, SLUG);

        return NextResponse.json(buildRoomData(parsed));
    } catch {
        return NextResponse.json({ error: "Erro interno ao processar imagem." }, { status: 500 });
    }
}

function buildRoomData(parsed) {
    let vertices = Array.isArray(parsed.vertices) ? parsed.vertices : null;

    if (!vertices || vertices.length < 3) {
        // Fallback: 4 m × 3.5 m rectangle
        vertices = [[-2, -1.75], [2, -1.75], [2, 1.75], [-2, 1.75]];
    }

    // Sanitize: ensure numeric, clamp to reasonable range
    vertices = vertices.map(([x, z]) => [
        Math.max(-30, Math.min(30, Number(x) || 0)),
        Math.max(-30, Math.min(30, Number(z) || 0)),
    ]);

    // Re-center at centroid (Gemini sometimes drifts)
    const cx = vertices.reduce((s, v) => s + v[0], 0) / vertices.length;
    const cz = vertices.reduce((s, v) => s + v[1], 0) / vertices.length;
    vertices = vertices.map(([x, z]) => [
        Math.round((x - cx) * 1000) / 1000,
        Math.round((z - cz) * 1000) / 1000,
    ]);

    const height = Math.max(1.8, Math.min(6.0, Number(parsed.height) || 2.7));
    const n = vertices.length;
    const rawWalls = Array.isArray(parsed.walls) ? parsed.walls : [];

    // Build walls array aligned to vertex count
    const walls = Array.from({ length: n }, (_, i) => {
        const w = rawWalls.find((rw) => Number(rw.index) === i) ?? rawWalls[i] ?? {};
        return { index: i, hasDoor: Boolean(w.hasDoor), hasWindow: Boolean(w.hasWindow) };
    });

    const xs = vertices.map(([x]) => x);
    const zs = vertices.map(([, z]) => z);
    const width = Math.round((Math.max(...xs) - Math.min(...xs)) * 100) / 100;
    const depth = Math.round((Math.max(...zs) - Math.min(...zs)) * 100) / 100;

    return {
        shape: "polygon",
        vertices,
        walls,
        height,
        width,
        depth,
        features: {
            hasDoor: walls.some((w) => w.hasDoor),
            hasWindow: walls.some((w) => w.hasWindow),
        },
    };
}
