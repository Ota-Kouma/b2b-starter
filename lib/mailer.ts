import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendInviteEmail({
  to,
  inviteLink,
  companyName,
}: {
  to: string;
  inviteLink: string;
  companyName: string;
}) {
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL ?? "noreply@example.com",
    to,
    subject: `【${companyName}】招待のご案内`,
    html: `
      <p>${companyName} に招待されました。</p>
      <p>以下のリンクからパスワードを設定してログインしてください。</p>
      <p><a href="${inviteLink}">${inviteLink}</a></p>
      <p>このリンクは24時間有効です。</p>
    `,
  });
}
