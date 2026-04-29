import nodemailer from 'nodemailer';

function createTransporter() {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
}

export async function sendPasswordResetEmail(to, resetUrl) {
    const transporter = createTransporter();
    const from = process.env.SMTP_FROM || process.env.SMTP_USER;

    await transporter.sendMail({
        from,
        to,
        subject: 'Redefinição de senha — Vitor Arakaki',
        html: `
        <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#1e1e1e;border-radius:12px;padding:32px;color:#fff;">
            <div style="text-align:center;margin-bottom:24px;">
                <span style="display:inline-flex;align-items:center;justify-content:center;width:40px;height:40px;background:#fff;color:#171717;font-size:14px;font-weight:800;border-radius:10px;letter-spacing:-0.5px;">VA</span>
            </div>
            <h2 style="margin:0 0 8px;font-size:1.3rem;font-weight:700;text-align:center;">Redefinir senha</h2>
            <p style="color:rgba(255,255,255,0.55);font-size:0.875rem;text-align:center;margin:0 0 24px;">
                Você solicitou a redefinição da sua senha. O link abaixo é válido por <strong style="color:#fff;">1 hora</strong>.
            </p>
            <div style="text-align:center;margin-bottom:24px;">
                <a href="${resetUrl}" style="display:inline-block;background:#ffffff;color:#171717;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:600;font-size:0.9rem;">
                    Redefinir senha
                </a>
            </div>
            <p style="color:rgba(255,255,255,0.3);font-size:0.75rem;text-align:center;margin:0;">
                Se você não solicitou isso, ignore este email — sua senha permanece a mesma.
            </p>
        </div>
        `,
        text: `Clique no link para redefinir sua senha (válido por 1 hora):\n\n${resetUrl}\n\nSe você não solicitou isso, ignore este email.`,
    });
}
