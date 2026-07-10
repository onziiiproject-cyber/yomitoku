import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY!);
}

export async function sendWelcomeEmail(to: string, companyName: string) {
  await getResend().emails.send({
    from: "YOMITOKU <onboarding@resend.dev>",
    to,
    subject: "【YOMITOKU】ご登録ありがとうございます",
    html: `
<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"></head>
<body style="font-family: 'Hiragino Sans', sans-serif; color: #1F2E2A; max-width: 600px; margin: 0 auto; padding: 32px 24px;">
  <div style="text-align: center; margin-bottom: 32px;">
    <span style="font-size: 24px; font-weight: bold;">
      <span style="color: #1F2E2A;">ヨミ</span><span style="color: #84B59F;">トク</span>
    </span>
  </div>
  <h1 style="font-size: 20px; font-weight: bold; margin-bottom: 16px;">ご登録ありがとうございます</h1>
  <p style="line-height: 1.8; margin-bottom: 24px;">
    ${companyName} 様<br><br>
    YOMITOKUへのご登録が完了しました。<br>
    翌朝より、介護保険の最新情報がLINEに届きます。
  </p>
  <div style="background: #F5FBF8; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
    <p style="font-size: 14px; margin: 0; line-height: 1.8;">
      ■ 配信開始：登録翌朝より<br>
      ■ 配信頻度：新着情報があり次第（原則毎日）<br>
      ■ 料金：月額300円（税抜）
    </p>
  </div>
  <p style="font-size: 13px; color: #888; line-height: 1.8;">
    ご不明な点はこのメールへの返信でお問い合わせください。<br>
    今後ともYOMITOKUをよろしくお願いいたします。
  </p>
  <hr style="border: none; border-top: 1px solid #D0E8DC; margin: 24px 0;">
  <p style="font-size: 11px; color: #aaa; text-align: center;">
    © 2025 YOMITOKU / 株式会社ONZiii Act
  </p>
</body>
</html>
    `.trim(),
  });
}
