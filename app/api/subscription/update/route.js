import { NextResponse } from 'next/server';
import { getAuthUser } from '../../../../lib/auth';
import sql from '../../../../lib/db';
import stripe, { PRICE_IDS } from '../../../../lib/stripe';

// Troca de plano com prorate: crédito do plano atual abate no novo
export async function POST(request) {
    const authUser = await getAuthUser();
    if (!authUser) {
        return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    const body = await request.json();
    const { plan, projectSlug } = body;

    if (!plan || !PRICE_IDS[plan]) {
        return NextResponse.json({ error: 'Plano inválido.' }, { status: 400 });
    }

    if (plan === 'project' && !projectSlug?.trim()) {
        return NextResponse.json({ error: 'Selecione um projeto.' }, { status: 400 });
    }

    const [sub] = await sql`
        SELECT stripe_subscription_id, plan_name FROM subscriptions WHERE user_id = ${authUser.id}
    `;

    if (!sub?.stripe_subscription_id) {
        return NextResponse.json({ error: 'Nenhuma assinatura ativa encontrada.' }, { status: 404 });
    }

    if (sub.plan_name === plan) {
        return NextResponse.json({ error: 'Você já está neste plano.' }, { status: 400 });
    }

    // Busca subscription do Stripe para pegar o item ID
    const stripeSub = await stripe.subscriptions.retrieve(sub.stripe_subscription_id);
    const itemId = stripeSub.items.data[0]?.id;

    if (!itemId) {
        return NextResponse.json({ error: 'Erro ao recuperar assinatura do Stripe.' }, { status: 500 });
    }

    const metadata = { userId: authUser.id, plan };
    if (plan === 'project') metadata.projectSlug = projectSlug.trim();

    // Atualiza preço com proration imediata — gera invoice com crédito/débito
    await stripe.subscriptions.update(sub.stripe_subscription_id, {
        cancel_at_period_end: false,
        proration_behavior: 'always_invoice',
        items: [{ id: itemId, price: PRICE_IDS[plan] }],
        metadata,
    });

    // O webhook customer.subscription.updated vai atualizar o DB
    // mas já atualiza localmente para resposta rápida
    const extId = plan === 'project' ? projectSlug.trim() : null;
    await sql`
        UPDATE subscriptions
        SET plan_name = ${plan},
            plan_status = 'active',
            external_subscription_id = ${extId},
            updated_at = NOW()
        WHERE user_id = ${authUser.id}
    `;

    return NextResponse.json({ ok: true });
}
