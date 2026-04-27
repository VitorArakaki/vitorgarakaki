import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-04-10',
});

export default stripe;

export const PRICE_IDS = {
    project: process.env.STRIPE_PRICE_PROJECT,
    full: process.env.STRIPE_PRICE_FULL,
};

// Garante ou cria um customer Stripe para o usuário
export async function getOrCreateStripeCustomer(userId, email, username, sql) {
    const [row] = await sql`SELECT stripe_customer_id FROM users WHERE id = ${userId}`;

    if (row?.stripe_customer_id) return row.stripe_customer_id;

    const customer = await stripe.customers.create({
        email,
        name: username,
        metadata: { userId },
    });

    await sql`UPDATE users SET stripe_customer_id = ${customer.id} WHERE id = ${userId}`;

    return customer.id;
}
