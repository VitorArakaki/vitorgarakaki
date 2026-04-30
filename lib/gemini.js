/**
 * Gemini API helper with automatic model fallback.
 *
 * When the primary model is overloaded (503 / 429 / demand error),
 * the call is retried transparently with the next model in the list.
 */

const MODELS = [
    'gemini-2.5-flash-lite',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
];

function isOverloaded(status, errData) {
    if (status === 503 || status === 429) return true;
    const msg = (errData?.error?.message ?? '').toLowerCase();
    return /high demand|overloaded|capacity|unavailable|quota/i.test(msg);
}

/**
 * Call the Gemini generateContent API with automatic model fallback.
 *
 * @param {string} apiKey
 * @param {object} body  — the full request body (contents, generationConfig, …)
 * @param {{ timeout?: number }} opts
 * @returns {Promise<{ ok: true, data: object, model: string }
 *                 | { ok: false, status: number, error: string }>}
 */
export async function callGemini(apiKey, body, { timeout = 30_000 } = {}) {
    for (const model of MODELS) {
        const url =
            `https://generativelanguage.googleapis.com/v1beta/models/` +
            `${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

        let res;
        try {
            res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
                signal: AbortSignal.timeout(timeout),
            });
        } catch (fetchErr) {
            // Network / timeout error — not an overload, surface immediately
            return { ok: false, status: 500, error: 'Erro de conexão com a Gemini API.' };
        }

        if (res.ok) {
            const data = await res.json();
            return { ok: true, data, model };
        }

        const errData = await res.json().catch(() => ({}));

        if (isOverloaded(res.status, errData)) {
            // Try next model silently
            continue;
        }

        // Non-recoverable API error (bad key, invalid request, etc.)
        const msg = errData?.error?.message ?? 'Erro na Gemini API.';
        return { ok: false, status: res.status, error: msg };
    }

    return {
        ok: false,
        status: 503,
        error: 'O serviço de IA está com alta demanda no momento. Tente novamente em alguns instantes.',
    };
}
