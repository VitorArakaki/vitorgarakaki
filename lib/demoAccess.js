import { createHmac } from 'crypto';
import { jwtVerify } from 'jose';
import { neon } from '@neondatabase/serverless';

export const FREE_LIMIT = 3;

/**
 * Extracts the client IP from request headers.
 * Works behind Vercel / Nginx reverse proxies.
 */
export function getClientIp(request) {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) return forwarded.split(',')[0].trim();
    return request.headers.get('x-real-ip') ?? '127.0.0.1';
}

/**
 * Hashes an IP address with HMAC-SHA256 before it is stored in the database.
 * This prevents storing raw personal data (required by LGPD/GDPR).
 * Rate limiting still works because the same IP always produces the same hash.
 */
function hashIp(ip) {
    const pepper = process.env.IP_HASH_PEPPER;
    if (!pepper) throw new Error('IP_HASH_PEPPER env var is not set.');
    return createHmac('sha256', pepper).update(ip).digest('hex');
}

/** Parse the auth_token JWT from a cookie header string. */
async function getUserIdFromCookie(cookieHeader) {
    if (!cookieHeader) return null;
    const match = cookieHeader.match(/(?:^|;\s*)auth_token=([^;]+)/);
    if (!match) return null;
    try {
        const secret = new TextEncoder().encode(process.env.JWT_SECRET);
        const { payload } = await jwtVerify(match[1], secret);
        return payload?.id ?? null;
    } catch {
        return null;
    }
}

/**
 * Check whether the given user/IP may access a demo.
 *
 * @param {{ cookieHeader: string, ip: string }} ctx
 * @param {string} slug  The project slug (e.g. 'environment-virtualizer')
 * @returns {Promise<{ allowed: boolean, unlimited: boolean, remaining: number|null }>}
 */
export async function checkDemoAccess({ cookieHeader, ip }, slug) {
    const sql = neon(process.env.DATABASE_URL);
    const userId = await getUserIdFromCookie(cookieHeader);

    if (userId) {
        const rows = await sql`
            SELECT plan_name, plan_status, external_subscription_id
            FROM subscriptions
            WHERE user_id = ${userId}
            LIMIT 1
        `;
        const sub = rows[0];
        const activeStatuses = ['active', 'cancelling', 'past_due'];

        if (sub && activeStatuses.includes(sub.plan_status)) {
            if (sub.plan_name === 'full') {
                return { allowed: true, unlimited: true, remaining: null };
            }
            if (sub.plan_name === 'project' && sub.external_subscription_id === slug) {
                return { allowed: true, unlimited: true, remaining: null };
            }
        }
    }

    // IP-based free limit — store hashed IP, never raw
    const ipHash = hashIp(ip);
    const rows = await sql`
        SELECT usage_count FROM demo_usage
        WHERE ip_hash = ${ipHash} AND project_slug = ${slug}
    `;
    const count = rows[0]?.usage_count ?? 0;
    const remaining = FREE_LIMIT - count;

    return {
        allowed: remaining > 0,
        unlimited: false,
        remaining: Math.max(0, remaining),
    };
}

/**
 * Increment the IP-based usage counter for a demo.
 * Call this AFTER a successful analysis/use so failed requests don't count.
 */
export async function incrementDemoUsage(ip, slug) {
    const sql = neon(process.env.DATABASE_URL);
    const ipHash = hashIp(ip);
    await sql`
        INSERT INTO demo_usage (ip_hash, project_slug, usage_count, last_used_at)
        VALUES (${ipHash}, ${slug}, 1, NOW())
        ON CONFLICT (ip_hash, project_slug)
        DO UPDATE SET
            usage_count = demo_usage.usage_count + 1,
            last_used_at = NOW()
    `;
}
