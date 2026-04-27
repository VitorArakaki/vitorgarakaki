import { NextResponse } from 'next/server';
import { getAuthUser } from '../../../../lib/auth';
import sql from '../../../../lib/db';
import bcrypt from 'bcryptjs';

export async function PATCH(request) {
    const authUser = await getAuthUser();
    if (!authUser) {
        return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
    }

    const body = await request.json();
    const { username, currentPassword, newPassword, confirmNewPassword, avatarUrl } = body;

    const errors = {};

    // --- Validate username ---
    if (username !== undefined) {
        const trimmed = username.trim();
        if (trimmed.length < 3 || trimmed.length > 50) {
            errors.username = 'Nome de usuário deve ter entre 3 e 50 caracteres.';
        } else {
            const [existing] = await sql`
                SELECT id FROM users WHERE username = ${trimmed} AND id != ${authUser.id}
            `;
            if (existing) errors.username = 'Este nome de usuário já está em uso.';
        }
    }

    // --- Validate password change ---
    let hashedNewPassword = null;
    if (newPassword || currentPassword) {
        if (!currentPassword) {
            errors.currentPassword = 'Informe a senha atual.';
        } else if (!newPassword) {
            errors.newPassword = 'Informe a nova senha.';
        } else {
            const [row] = await sql`SELECT password_hash FROM users WHERE id = ${authUser.id}`;
            const valid = await bcrypt.compare(currentPassword, row.password_hash);
            if (!valid) {
                errors.currentPassword = 'Senha atual incorreta.';
            } else {
                if (newPassword.length < 6) {
                    errors.newPassword = 'A nova senha deve ter pelo menos 6 caracteres.';
                } else if (newPassword !== confirmNewPassword) {
                    errors.confirmNewPassword = 'As senhas não coincidem.';
                } else {
                    hashedNewPassword = await bcrypt.hash(newPassword, 10);
                }
            }
        }
    }

    if (Object.keys(errors).length > 0) {
        return NextResponse.json({ errors }, { status: 400 });
    }

    // --- Apply updates ---
    if (username !== undefined) {
        await sql`
            UPDATE users SET username = ${username.trim()}, updated_at = NOW()
            WHERE id = ${authUser.id}
        `;
    }

    if (hashedNewPassword) {
        await sql`
            UPDATE users SET password_hash = ${hashedNewPassword}, updated_at = NOW()
            WHERE id = ${authUser.id}
        `;
    }

    if (avatarUrl !== undefined) {
        await sql`
            UPDATE users SET avatar_url = ${avatarUrl}, updated_at = NOW()
            WHERE id = ${authUser.id}
        `;
    }

    const [updatedUser] = await sql`
        SELECT id, username, email, avatar_url, created_at FROM users WHERE id = ${authUser.id}
    `;

    return NextResponse.json({ user: updatedUser });
}
