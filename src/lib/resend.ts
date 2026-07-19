import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY!);
}

const LINE_ADD_URL = "https://line.me/R/ti/p/@324eesis";

export async function sendWelcomeEmail(to: string, companyName: string, inviteCode: string) {
  await getResend().emails.send({
    from: "ヨミトク編集部（送信専用） <noreply@yomitoku-base.com>",
    to,
    subject: "【ヨミトク編集部】ご登録ありがとうございます｜次のステップをご確認ください",
    html: `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f0f4f4;font-family:'Hiragino Sans',Meiryo,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f4;">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;">

        <!-- ロゴ -->
        <tr>
          <td style="padding:32px 32px 20px;text-align:center;">
            <span style="font-size:22px;font-weight:bold;color:#0D686E;">ヨミトク編集部</span>
          </td>
        </tr>

        <!-- 挨拶 -->
        <tr>
          <td style="padding:0 32px 28px;">
            <h1 style="margin:0 0 12px;font-size:20px;font-weight:bold;color:#1F2E2A;">ご登録ありがとうございます</h1>
            <p style="margin:0;font-size:15px;color:#555;line-height:1.85;">
              ${companyName} 様<br>
              お支払いが完了し、ご登録が確認できました。<br>
              情報を受け取るには、次のステップでLINEの友だち追加をしてください。
            </p>
          </td>
        </tr>

        <!-- STEP 1 完了 -->
        <tr>
          <td style="padding:0 32px 8px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;border-radius:10px;">
              <tr>
                <td style="padding:14px 16px;">
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td valign="middle">
                        <span style="display:inline-block;font-size:11px;font-weight:bold;color:#aaa;background:#e0e0e0;border-radius:6px;padding:4px 10px;">STEP 1</span>
                      </td>
                      <td valign="middle" style="padding-left:12px;">
                        <span style="font-size:14px;color:#aaa;text-decoration:line-through;">ユーザー登録・お支払い ✓</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- STEP 2 アクション -->
        <tr>
          <td style="padding:0 32px 28px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#E6F4F2;border:2px solid #0D686E;border-radius:10px;">
              <tr>
                <td style="padding:16px 16px 12px;">
                  <table cellpadding="0" cellspacing="0">
                    <tr>
                      <td valign="middle">
                        <span style="display:inline-block;font-size:11px;font-weight:bold;color:#ffffff;background:#0D686E;border-radius:6px;padding:4px 10px;">STEP 2</span>
                      </td>
                      <td valign="middle" style="padding-left:12px;">
                        <span style="font-size:15px;font-weight:bold;color:#0A4A50;">LINEを友だち追加する</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:0 16px 16px;">
                  <a href="${LINE_ADD_URL}" style="display:block;text-align:center;background:#06C755;color:#ffffff;font-size:16px;font-weight:bold;padding:14px 20px;border-radius:10px;text-decoration:none;">
                    LINEで友だち追加する →
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- 事業所コード -->
        <tr>
          <td style="padding:0 32px 28px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#F5FBF8;border-radius:12px;">
              <tr>
                <td style="padding:20px;">
                  <p style="margin:0 0 6px;font-size:14px;font-weight:bold;color:#0D686E;">事業所内メンバーへの共有方法</p>
                  <p style="margin:0 0 16px;font-size:13px;color:#555;line-height:1.85;">
                    1アカウントで3名まで共有できます。<br>
                    他のメンバーも同じURLから友だち追加してください。
                  </p>
                  <p style="margin:0 0 8px;font-size:13px;color:#555;">事業所コード（LINE登録時に必要です）</p>
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center" style="border:2px dashed #0D686E;border-radius:8px;padding:14px;">
                        <span style="font-size:22px;font-weight:bold;letter-spacing:4px;color:#0D686E;">${inviteCode}</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- 配信案内 -->
        <tr>
          <td style="padding:0 32px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;border-radius:10px;">
              <tr>
                <td style="padding:16px;">
                  <p style="margin:0;font-size:13px;color:#888;line-height:2.0;">
                    ■ 配信開始：LINE友だち追加後、翌週の配信より<br>
                    ■ 配信頻度：毎週水曜日「週刊ヨミトク」<br>
                    ■ 料金：月額300円（税抜）・自動更新
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- 送信専用注記 -->
        <tr>
          <td style="padding:0 32px 28px;">
            <p style="margin:0;font-size:12px;color:#aaa;line-height:1.8;">
              ※ このメールは送信専用です。返信はお受けできません。<br>
              ご不明な点はLINEの公式アカウントよりお問い合わせください。
            </p>
          </td>
        </tr>

        <!-- フッター -->
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #D0E8DC;text-align:center;">
            <p style="margin:0;font-size:11px;color:#bbb;">© 2026 ヨミトク編集部 / 株式会社ONZiii Act</p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>
    `.trim(),
  });
}

export async function sendFeatureRequestNotification(opts: {
  displayName: string;
  companyName: string;
  title: string;
  body: string;
}) {
  await getResend().emails.send({
    from: "ヨミトク編集部（送信専用） <noreply@yomitoku-base.com>",
    to: "onziii.project@gmail.com",
    subject: `【ヨミトク編集部】機能要望｜${opts.title}`,
    html: `
<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f0f4f4;font-family:'Hiragino Sans',Meiryo,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f4;">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border-radius:16px;">
        <tr>
          <td style="padding:28px 32px 16px;">
            <span style="font-size:18px;font-weight:bold;color:#0D686E;">ヨミトク編集部</span>
            <span style="margin-left:8px;font-size:12px;color:#888;">機能要望通知</span>
          </td>
        </tr>
        <tr>
          <td style="padding:0 32px 24px;">
            <h2 style="margin:0 0 16px;font-size:18px;color:#1F2E2A;">新しい機能要望が届きました</h2>
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1.5px solid #E8F0EE;border-radius:10px;">
              <tr><td style="padding:12px 16px;background:#F5F7F6;font-size:12px;font-weight:700;color:#555;border-radius:10px 10px 0 0;">送信者</td></tr>
              <tr><td style="padding:12px 16px;font-size:14px;color:#1a1a1a;">${opts.displayName}（${opts.companyName}）</td></tr>
              <tr><td style="padding:12px 16px;background:#F5F7F6;font-size:12px;font-weight:700;color:#555;">要望タイトル</td></tr>
              <tr><td style="padding:12px 16px;font-size:15px;font-weight:700;color:#0D686E;">${opts.title}</td></tr>
              <tr><td style="padding:12px 16px;background:#F5F7F6;font-size:12px;font-weight:700;color:#555;border-radius:0 0 0 0;">詳細内容</td></tr>
              <tr><td style="padding:12px 16px;font-size:14px;color:#333;line-height:1.8;border-radius:0 0 10px 10px;white-space:pre-wrap;">${opts.body}</td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:0 32px 24px;">
            <p style="margin:0;font-size:12px;color:#aaa;">送信日時：${new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px;border-top:1px solid #E8F0EE;text-align:center;">
            <p style="margin:0;font-size:11px;color:#bbb;">© 2026 ヨミトク編集部 / 株式会社ONZiii Act</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`.trim(),
  });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  await getResend().emails.send({
    from: "ヨミトク編集部（送信専用） <noreply@yomitoku-base.com>",
    to,
    subject: "【ヨミトク編集部】パスワードのリセット",
    html: `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#f0f4f4;font-family:'Hiragino Sans',Meiryo,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f4;">
  <tr>
    <td align="center" style="padding:32px 16px;">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;">

        <tr>
          <td style="padding:32px 32px 20px;text-align:center;">
            <span style="font-size:22px;font-weight:bold;color:#0D686E;">ヨミトク編集部</span>
          </td>
        </tr>

        <tr>
          <td style="padding:0 32px 24px;">
            <h1 style="margin:0 0 12px;font-size:20px;font-weight:bold;color:#1F2E2A;">パスワードのリセット</h1>
            <p style="margin:0;font-size:15px;color:#555;line-height:1.85;">
              パスワードリセットのリクエストを受け付けました。<br>
              下のボタンから新しいパスワードを設定してください。
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:0 32px 28px;">
            <a href="${resetUrl}" style="display:block;text-align:center;background:#0D686E;color:#ffffff;font-size:16px;font-weight:bold;padding:16px 20px;border-radius:10px;text-decoration:none;">
              パスワードを再設定する →
            </a>
          </td>
        </tr>

        <tr>
          <td style="padding:0 32px 28px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;border-radius:10px;">
              <tr>
                <td style="padding:16px;">
                  <p style="margin:0;font-size:13px;color:#888;line-height:2.0;">
                    ■ このリンクの有効期限は1時間です<br>
                    ■ 心当たりのない場合は無視してください<br>
                    ■ アカウントへの影響はありません
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td style="padding:0 32px 28px;">
            <p style="margin:0;font-size:12px;color:#aaa;line-height:1.8;">
              ※ このメールは送信専用です。返信はお受けできません。
            </p>
          </td>
        </tr>

        <tr>
          <td style="padding:20px 32px;border-top:1px solid #D0E8DC;text-align:center;">
            <p style="margin:0;font-size:11px;color:#bbb;">© 2026 ヨミトク編集部 / 株式会社ONZiii Act</p>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>
    `.trim(),
  });
}
