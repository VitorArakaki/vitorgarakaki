import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import sql from '../../../../lib/db';
import { signToken, COOKIE_NAME } from '../../../../lib/auth';

export async function POST(request) {
    try {
        const { username, email, password, confirmPassword } = await request.json();

        // Validações básicas
        if (!username || !email || !password || !confirmPassword) {
            return NextResponse.json({ error: 'Todos os campos são obrigatórios.' }, { status: 400 });
        }

        if (password !== confirmPassword) {
            return NextResponse.json({ error: 'As senhas não coincidem.' }, { status: 400 });
        }

        if (password.length < 6) {
            return NextResponse.json({ error: 'A senha deve ter no mínimo 6 caracteres.' }, { status: 400 });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json({ error: 'Email inválido.' }, { status: 400 });
        }

        if (username.length < 3 || username.length > 50) {
            return NextResponse.json({ error: 'Nome de usuário deve ter entre 3 e 50 caracteres.' }, { status: 400 });
        }

        // Verificar se email ou username já existem
        const existing = await sql`
            SELECT id FROM users
            WHERE email = ${email.toLowerCase()} OR username = ${username.toLowerCase()}
            LIMIT 1
        `;

        if (existing.length > 0) {
            return NextResponse.json({ error: 'Email ou nome de usuário já cadastrado.' }, { status: 409 });
        }

        // Hash da senha
        const password_hash = await bcrypt.hash(password, 10);

        // Inserir usuário
        const [user] = await sql`
            INSERT INTO users (username, email, password_hash)
            VALUES (${username.toLowerCase()}, ${email.toLowerCase()}, ${password_hash})
            RETURNING id, username, email, created_at
        `;

        // Criar assinatura gratuita padrão
        await sql`
            INSERT INTO subscriptions (user_id, plan_name, plan_status)
            VALUES (${user.id}, 'free', 'active')
        `;

        // Gerar JWT e setar cookie
        const token = await signToken({ id: user.id, username: user.username, email: user.email });

        const response = NextResponse.json({
            message: 'Usuário criado com sucesso.',
            user: { id: user.id, username: user.username, email: user.email }
        }, { status: 201 });

        response.cookies.set(COOKIE_NAME, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 7 dias
            path: '/',
        });

        return response;
    } catch (error) {
        console.error('Erro no registro:', error);
        return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
    }
}
