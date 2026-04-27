import { NextResponse } from 'next/server';
import { checkDemoAccess, incrementDemoUsage, getClientIp, FREE_LIMIT } from '../../../../lib/demoAccess';

// Slugs that use this route for usage tracking (no dedicated backend API)
const VALID_SLUGS = new Set(['custom-excalidraw']);

export async function POST(request) {
    try {
        const body = await request.json();
        const { slug } = body;

        if (!slug || !VALID_SLUGS.has(slug)) {
            return NextResponse.json({ error: 'Slug inválido.' }, { status: 400 });
        }

        const cookieHeader = request.headers.get('cookie') ?? '';
        const ip = getClientIp(request);

        const access = await checkDemoAccess({ cookieHeader, ip }, slug);

        if (!access.allowed) {
            return NextResponse.json(
                { error: 'Limite de usos gratuitos atingido.', remaining: 0 },
                { status: 403 }
            );
        }

        // Only increment for non-unlimited (free tier) users
        if (!access.unlimited) {
            await incrementDemoUsage(ip, slug);
        }

        const remaining = access.unlimited ? null : access.remaining - 1;
        return NextResponse.json({ ok: true, remaining, limit: FREE_LIMIT });
    } catch {
        return NextResponse.json({ error: 'Erro interno.' }, { status: 500 });
    }
}
