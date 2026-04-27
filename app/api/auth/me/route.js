import { NextResponse } from 'next/server';
import { getAuthUser } from '../../../../lib/auth';
import sql from '../../../../lib/db';

export async function GET() {
    const payload = await getAuthUser();
    if (!payload) {
        return NextResponse.json({ user: null }, { status: 401 });
    }

    const [user] = await sql`
        SELECT u.id, u.username, u.email, u.avatar_url, u.created_at,
               s.plan_name, s.plan_status, s.expires_at,
               s.started_at AS plan_started_at, s.price AS plan_price,
               s.external_subscription_id
        FROM users u
        LEFT JOIN subscriptions s ON s.user_id = u.id
        WHERE u.id = ${payload.id}
        LIMIT 1
    `;

    if (!user) {
        return NextResponse.json({ user: null }, { status: 404 });
    }

    return NextResponse.json({ user });
}
