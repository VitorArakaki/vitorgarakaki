import { createHmac } from 'crypto';
import { jwtVerify } from 'jose';
import { neon } from '@neondatabase/serverless';

export const FREE_LIMIT = 3;

/** Slugs whose demos require an AI backend call. */
export const AI_SLUGS = new Set(['environment-virtualizer', 'architecture-deployment']);

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
 * Returns the login and subscription status of the current user.
 * Used to decide whether to show the free-user banner on non-AI demos.
 */
export async function getUserSubscription({ cookieHeader }) {
    const userId = await getUserIdFromCookie(cookieHeader);
    if (!userId) return { isLoggedIn: false, isSubscribed: false };

    const sql = neon(process.env.NEON_DATABASE_URL || process.env.NEON_POSTGRES_URL);
    const rows = await sql`
        SELECT plan_name, plan_status
        FROM subscriptions
        WHERE user_id = ${userId}
        LIMIT 1
    `;
    const sub = rows[0];
    const activeStatuses = ['active', 'cancelling', 'past_due'];
    const isSubscribed = !!(sub && activeStatuses.includes(sub.plan_status) && sub.plan_name !== 'free');
    return { isLoggedIn: true, isSubscribed };
}

/**
 * Check whether the given user/IP may access an AI demo.
 * Limit resets daily — up to FREE_LIMIT uses per demo per day for non-subscribers.
 *
 * @param {{ cookieHeader: string, ip: string }} ctx
 * @param {string} slug  The project slug (e.g. 'environment-virtualizer')
 * @returns {Promise<{ allowed: boolean, unlimited: boolean, remaining: number|null }>}
 */
export async function checkDemoAccess({ cookieHeader, ip }, slug) {
    const sql = neon(process.env.NEON_DATABASE_URL || process.env.NEON_POSTGRES_URL);
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

    // Daily IP-based free limit — count resets each calendar day
    const ipHash = hashIp(ip);
    const rows = await sql`
        SELECT usage_count, last_used_at::date AS usage_date
        FROM demo_usage
        WHERE ip_hash = ${ipHash} AND project_slug = ${slug}
    `;

    const record = rows[0];
    let count = 0;
    if (record) {
        const today = new Date().toISOString().slice(0, 10);
        const usageDate = record.usage_date instanceof Date
            ? record.usage_date.toISOString().slice(0, 10)
            : String(record.usage_date).slice(0, 10);
        if (usageDate === today) {
            count = record.usage_count;
        }
        // Different day → count resets to 0
    }

    const remaining = FREE_LIMIT - count;

    return {
        allowed: remaining > 0,
        unlimited: false,
        remaining: Math.max(0, remaining),
    };
}

/**
 * Increment the IP-based daily usage counter for a demo.
 * Automatically resets to 1 on a new calendar day.
 * Call this AFTER a successful analysis so failed requests don't count.
 */
export async function incrementDemoUsage(ip, slug) {
    const sql = neon(process.env.NEON_DATABASE_URL || process.env.NEON_POSTGRES_URL);
    const ipHash = hashIp(ip);
    await sql`
        INSERT INTO demo_usage (ip_hash, project_slug, usage_count, last_used_at)
        VALUES (${ipHash}, ${slug}, 1, NOW())
        ON CONFLICT (ip_hash, project_slug) DO UPDATE SET
            usage_count = CASE
                WHEN demo_usage.last_used_at::date < CURRENT_DATE THEN 1
                ELSE demo_usage.usage_count + 1
            END,
            last_used_at = NOW()
    `;
}

