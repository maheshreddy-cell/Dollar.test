import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT ?? '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendInviteEmail(
  toEmail: string,
  toName: string,
  inviteToken: string
): Promise<void> {
  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
  const inviteUrl = `${baseUrl}/invite?token=${inviteToken}`;

  await transporter.sendMail({
    from: `"Target Management" <${process.env.SMTP_USER}>`,
    to: toEmail,
    subject: 'You have been invited to Target Management Tool',
    html: `
      <h2>Hello ${toName},</h2>
      <p>You have been invited to join the Target Management Tool.</p>
      <p>Click the link below to set your password and activate your account:</p>
      <a href="${inviteUrl}" style="background:#2563eb;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:12px;">
        Accept Invite
      </a>
      <p style="margin-top:24px;color:#6b7280;font-size:12px;">
        This link expires in 48 hours. If you didn't expect this email, please ignore it.
      </p>
    `,
  });
}
