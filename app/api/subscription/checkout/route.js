import { NextResponse } from 'next/server';
import { getAuthUser } from '../../../../lib/auth';
import sql from '../../../../lib/db';
import stripe, { PRICE_IDS, getOrCreateStripeCustomer } from '../../../../lib/stripe';

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

    if (plan === 'project') {
        if (!projectSlug?.trim()) {
            return NextResponse.json({ error: 'Selecione um projeto.' }, { status: 400 });
        }
    }

    const [userRow] = await sql`SELECT id, email, username FROM users WHERE id = ${authUser.id}`;
    const customerId = await getOrCreateStripeCustomer(authUser.id, userRow.email, userRow.username, sql);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    const metadata = { userId: authUser.id, plan };
    if (plan === 'project') metadata.projectSlug = projectSlug.trim();

    const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [
            {
                price: PRICE_IDS[plan],
                quantity: 1,
            },
        ],
        subscription_data: {
            metadata,
        },
        metadata,
        success_url: `${baseUrl}/subscription?success=1`,
        cancel_url: `${baseUrl}/subscription?cancelled=1`,
        locale: 'pt-BR',
        currency: 'brl',
    });

    return NextResponse.json({ url: session.url });
}
