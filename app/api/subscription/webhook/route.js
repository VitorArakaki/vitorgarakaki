import { NextResponse } from 'next/server';
import stripe from '../../../../lib/stripe';
import sql from '../../../../lib/db';

export const config = { api: { bodyParser: false } };

async function upsertSubscription(stripeSubId, data) {
    const { plan_name, plan_status, external_subscription_id, price, period_end } = data;

    const [existing] = await sql`SELECT id FROM subscriptions WHERE stripe_subscription_id = ${stripeSubId}`;

    if (existing) {
        await sql`
            UPDATE subscriptions
            SET plan_name = ${plan_name},
                plan_status = ${plan_status},
                external_subscription_id = ${external_subscription_id ?? null},
                price = ${price ?? null},
                expires_at = ${period_end ?? null},
                cancelled_at = ${plan_status === 'cancelled' ? new Date() : null},
                updated_at = NOW()
            WHERE stripe_subscription_id = ${stripeSubId}
        `;
    }
}

export async function POST(request) {
    const body = await request.text();
    const sig = request.headers.get('stripe-signature');

    let event;
    try {
        event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
        return NextResponse.json({ error: `Webhook error: ${err.message}` }, { status: 400 });
    }

    try {
        switch (event.type) {

            case 'checkout.session.completed': {
                const session = event.data.object;
                if (session.mode !== 'subscription') break;

                const stripeSubId = session.subscription;
                const userId = session.metadata?.userId;
                const plan = session.metadata?.plan;
                const projectSlug = session.metadata?.projectSlug ?? null;

                if (!userId || !plan) break;

                const stripeSub = await stripe.subscriptions.retrieve(stripeSubId);
                const periodEnd = new Date(stripeSub.current_period_end * 1000);
                const priceAmount = stripeSub.items.data[0]?.price?.unit_amount / 100;

                const [existing] = await sql`SELECT id FROM subscriptions WHERE user_id = ${userId}`;

                if (existing) {
                    await sql`
                        UPDATE subscriptions
                        SET plan_name = ${plan},
                            plan_status = 'active',
                            price = ${priceAmount},
                            currency = 'BRL',
                            started_at = NOW(),
                            expires_at = ${periodEnd},
                            cancelled_at = NULL,
                            stripe_subscription_id = ${stripeSubId},
                            external_subscription_id = ${projectSlug},
                            updated_at = NOW()
                        WHERE user_id = ${userId}
                    `;
                } else {
                    await sql`
                        INSERT INTO subscriptions
                            (id, user_id, plan_name, plan_status, price, currency, started_at, expires_at, stripe_subscription_id, external_subscription_id)
                        VALUES
                            (gen_random_uuid(), ${userId}, ${plan}, 'active', ${priceAmount}, 'BRL', NOW(), ${periodEnd}, ${stripeSubId}, ${projectSlug})
                    `;
                }

                break;
            }

            case 'customer.subscription.updated': {
                const sub = event.data.object;
                const userId = sub.metadata?.userId;
                if (!userId) break;

                const plan = sub.metadata?.plan ?? 'free';
                const projectSlug = sub.metadata?.projectSlug ?? null;
                const periodEnd = new Date(sub.current_period_end * 1000);
                const priceAmount = sub.items.data[0]?.price?.unit_amount / 100;

                let status = 'active';
                if (sub.cancel_at_period_end) status = 'cancelling';
                if (sub.status === 'past_due' || sub.status === 'unpaid') status = 'past_due';

                await sql`
                    UPDATE subscriptions
                    SET plan_name = ${plan},
                        plan_status = ${status},
                        price = ${priceAmount},
                        expires_at = ${periodEnd},
                        external_subscription_id = ${projectSlug},
                        updated_at = NOW()
                    WHERE user_id = ${userId}
                `;

                break;
            }

            case 'customer.subscription.deleted': {
                const sub = event.data.object;
                const userId = sub.metadata?.userId;
                if (!userId) break;

                await sql`
                    UPDATE subscriptions
                    SET plan_name = 'free',
                        plan_status = 'active',
                        price = 0,
                        stripe_subscription_id = NULL,
                        external_subscription_id = NULL,
                        cancelled_at = NOW(),
                        expires_at = NULL,
                        updated_at = NOW()
                    WHERE user_id = ${userId}
                `;

                break;
            }

            case 'invoice.payment_failed': {
                const invoice = event.data.object;
                const stripeSubId = invoice.subscription;
                if (!stripeSubId) break;

                await sql`
                    UPDATE subscriptions
                    SET plan_status = 'past_due',
                        updated_at = NOW()
                    WHERE stripe_subscription_id = ${stripeSubId}
                `;

                break;
            }

            case 'invoice.payment_succeeded': {
                const invoice = event.data.object;
                const stripeSubId = invoice.subscription;
                if (!stripeSubId) break;

                await sql`
                    UPDATE subscriptions
                    SET plan_status = 'active',
                        updated_at = NOW()
                    WHERE stripe_subscription_id = ${stripeSubId}
                `;

                break;
            }
        }
    } catch (err) {
        console.error('Webhook handler error:', err);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }

    return NextResponse.json({ received: true });
}
