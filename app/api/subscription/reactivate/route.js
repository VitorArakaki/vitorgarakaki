import { NextResponse } from 'next/server';
import { getAuthUser } from '../../../../lib/auth';
import sql from '../../../../lib/db';
import stripe from '../../../../lib/stripe';

// Remove o agendamento de cancelamento, mantendo a assinatura ativa
export async function POST() {
    const authUser = await getAuthUser();
    if (!authUser) {
        return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    const [sub] = await sql`
        SELECT stripe_subscription_id, plan_status FROM subscriptions WHERE user_id = ${authUser.id}
    `;

    if (!sub?.stripe_subscription_id) {
        return NextResponse.json({ error: 'Nenhuma assinatura encontrada.' }, { status: 404 });
    }

    if (sub.plan_status !== 'cancelling') {
        return NextResponse.json({ error: 'Assinatura não está em estado de cancelamento.' }, { status: 400 });
    }

    await stripe.subscriptions.update(sub.stripe_subscription_id, {
        cancel_at_period_end: false,
    });

    await sql`
        UPDATE subscriptions
        SET plan_status = 'active',
            expires_at = NULL,
            updated_at = NOW()
        WHERE user_id = ${authUser.id}
    `;

    return NextResponse.json({ ok: true });
}
