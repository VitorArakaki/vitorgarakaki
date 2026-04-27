import { NextResponse } from 'next/server';
import { getAuthUser } from '../../../../lib/auth';
import sql from '../../../../lib/db';
import stripe from '../../../../lib/stripe';

// Cancela ao final do período — usuário mantém acesso até o fim do mês pago
export async function POST() {
    const authUser = await getAuthUser();
    if (!authUser) {
        return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    const [sub] = await sql`
        SELECT stripe_subscription_id, plan_status FROM subscriptions WHERE user_id = ${authUser.id}
    `;

    if (!sub?.stripe_subscription_id) {
        return NextResponse.json({ error: 'Nenhuma assinatura ativa encontrada.' }, { status: 404 });
    }

    if (sub.plan_status === 'cancelling') {
        return NextResponse.json({ error: 'A assinatura já está agendada para cancelamento.' }, { status: 400 });
    }

    const stripeSub = await stripe.subscriptions.update(sub.stripe_subscription_id, {
        cancel_at_period_end: true,
    });

    const periodEnd = new Date(stripeSub.current_period_end * 1000);

    await sql`
        UPDATE subscriptions
        SET plan_status = 'cancelling',
            expires_at = ${periodEnd},
            updated_at = NOW()
        WHERE user_id = ${authUser.id}
    `;

    return NextResponse.json({ ok: true, expires_at: periodEnd });
}
