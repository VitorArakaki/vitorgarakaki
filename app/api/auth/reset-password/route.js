import { NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import sql from '../../../../lib/db';

export async function POST(request) {
    try {
        const { token, password, confirmPassword } = await request.json();

        if (!token || !password || !confirmPassword) {
            return NextResponse.json({ error: 'Todos os campos são obrigatórios.' }, { status: 400 });
        }

        if (password !== confirmPassword) {
            return NextResponse.json({ error: 'As senhas não coincidem.' }, { status: 400 });
        }

        if (password.length < 6) {
            return NextResponse.json({ error: 'A senha deve ter no mínimo 6 caracteres.' }, { status: 400 });
        }

        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

        const [record] = await sql`
            SELECT id, user_id, expires_at, used_at
            FROM password_reset_tokens
            WHERE token_hash = ${tokenHash}
            LIMIT 1
        `;

        if (!record) {
            return NextResponse.json({ error: 'Token inválido ou expirado.' }, { status: 400 });
        }

        if (record.used_at) {
            return NextResponse.json({ error: 'Este link já foi utilizado.' }, { status: 400 });
        }

        if (new Date(record.expires_at) < new Date()) {
            return NextResponse.json({ error: 'Token inválido ou expirado.' }, { status: 400 });
        }

        const password_hash = await bcrypt.hash(password, 10);

        await sql`UPDATE users SET password_hash = ${password_hash} WHERE id = ${record.user_id}`;
        await sql`UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ${record.id}`;

        return NextResponse.json({ message: 'Senha redefinida com sucesso.' });
    } catch (error) {
        console.error('Erro no reset-password:', error);
        return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
    }
}
