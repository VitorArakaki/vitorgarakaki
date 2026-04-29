import { NextResponse } from 'next/server';
import crypto from 'crypto';
import sql from '../../../../lib/db';
import { sendPasswordResetEmail } from '../../../../lib/email';

export async function POST(request) {
    try {
        const { email } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'Email é obrigatório.' }, { status: 400 });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json({ error: 'Email inválido.' }, { status: 400 });
        }

        const [user] = await sql`
            SELECT id, email FROM users
            WHERE email = ${email.toLowerCase()}
            LIMIT 1
        `;

        // Always return success to avoid email enumeration attacks
        const successMsg = { message: 'Se o email estiver cadastrado, você receberá um link para redefinir a senha.' };

        if (!user) {
            return NextResponse.json(successMsg);
        }

        // Generate a secure random token and store only its hash
        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Invalidate any existing tokens for this user
        await sql`DELETE FROM password_reset_tokens WHERE user_id = ${user.id}`;

        await sql`
            INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
            VALUES (${user.id}, ${tokenHash}, ${expiresAt})
        `;

        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        const resetUrl = `${baseUrl}/reset-password?token=${rawToken}`;

        await sendPasswordResetEmail(user.email, resetUrl);

        return NextResponse.json(successMsg);
    } catch (error) {
        console.error('Erro no forgot-password:', error);
        return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
    }
}
