import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import sql from '../../../../lib/db';
import { signToken, COOKIE_NAME } from '../../../../lib/auth';

export async function POST(request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email e senha são obrigatórios.' }, { status: 400 });
        }

        // Buscar usuário
        const [user] = await sql`
            SELECT id, username, email, password_hash
            FROM users
            WHERE email = ${email.toLowerCase()}
            LIMIT 1
        `;

        if (!user) {
            return NextResponse.json({ error: 'Email ou senha incorretos.' }, { status: 401 });
        }

        const passwordMatch = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatch) {
            return NextResponse.json({ error: 'Email ou senha incorretos.' }, { status: 401 });
        }

        const token = await signToken({ id: user.id, username: user.username, email: user.email });

        const response = NextResponse.json({
            message: 'Login realizado com sucesso.',
            user: { id: user.id, username: user.username, email: user.email }
        });

        response.cookies.set(COOKIE_NAME, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
        });

        return response;
    } catch (error) {
        console.error('Erro no login:', error);
        return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
    }
}
