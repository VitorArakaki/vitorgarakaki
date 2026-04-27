import { NextResponse } from 'next/server';
import { getAuthUser } from '../../../lib/auth';
import sql from '../../../lib/db';

const PLANS = {
    project: { price: 10.00 },
    full: { price: 40.00 },
};

export async function POST(request) {
    const authUser = await getAuthUser();
    if (!authUser) {
        return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    const body = await request.json();
    const { plan, projectSlug } = body;

    if (!plan || !PLANS[plan]) {
        return NextResponse.json({ error: 'Plano inválido.' }, { status: 400 });
    }

    if (plan === 'project') {
        if (!projectSlug || typeof projectSlug !== 'string' || !projectSlug.trim()) {
            return NextResponse.json({ error: 'Selecione um projeto.' }, { status: 400 });
        }
    }

    const { price } = PLANS[plan];
    const extId = plan === 'project' ? projectSlug.trim() : null;

    const updated = await sql`
        UPDATE subscriptions
        SET plan_name = ${plan},
            plan_status = 'active',
            price = ${price},
            currency = 'BRL',
            started_at = NOW(),
            expires_at = NULL,
            cancelled_at = NULL,
            external_subscription_id = ${extId},
            updated_at = NOW()
        WHERE user_id = ${authUser.id}
        RETURNING id
    `;

    if (updated.length === 0) {
        await sql`
            INSERT INTO subscriptions (id, user_id, plan_name, plan_status, price, currency, started_at, external_subscription_id)
            VALUES (gen_random_uuid(), ${authUser.id}, ${plan}, 'active', ${price}, 'BRL', NOW(), ${extId})
        `;
    }

    return NextResponse.json({ ok: true });
}

export async function DELETE() {
    const authUser = await getAuthUser();
    if (!authUser) {
        return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    await sql`
        UPDATE subscriptions
        SET plan_name = 'free',
            plan_status = 'active',
            price = 0,
            currency = 'BRL',
            external_subscription_id = NULL,
            cancelled_at = NOW(),
            updated_at = NOW()
        WHERE user_id = ${authUser.id}
    `;

    return NextResponse.json({ ok: true });
}
