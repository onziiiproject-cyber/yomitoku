import type { Metadata } from "next";
import styles from "../legal.module.css";

export const metadata: Metadata = {
  title: "プライバシーポリシー | ヨミトク編集部",
};

export default function PrivacyPage() {
  return (
    <div className={styles.doc}>
      <h1>プライバシーポリシー</h1>
      <p className={styles.updated}>最終更新日：2025年7月11日</p>

      <p>株式会社ONZiii Act（以下「当社」）は、ヨミトク編集部（以下「本サービス」）において取得する個人情報を以下のとおり取り扱います。</p>

      <h2>1. 取得する情報</h2>
      <ul>
        <li>事業所名・担当者名・メールアドレス（登録時に入力）</li>
        <li>LINE ユーザーID・表示名（LINE連携時に取得）</li>
        <li>決済情報（Stripeにより処理。当社はカード番号を保持しません）</li>
        <li>サービス利用ログ</li>
      </ul>

      <h2>2. 利用目的</h2>
      <p>取得した情報は、以下の目的で利用します。</p>
      <ul>
        <li>本サービスの提供・運営・改善</li>
        <li>LINEへの情報配信</li>
        <li>請求・領収書の送付</li>
        <li>重要なお知らせの送付</li>
        <li>お問い合わせへの対応</li>
      </ul>

      <p>登録時に別途同意をいただいた場合、以下の目的でも利用します。</p>
      <ul>
        <li><strong>広告・協賛コンテンツの配信：</strong>介護事業に関連する製品・サービス・セミナー等の広告・PR情報をメールまたはLINEでお届けします。月1〜2回程度を上限とし、「広告」と明示した上で配信します。</li>
      </ul>
      <p>上記の任意同意はいつでも撤回できます。撤回をご希望の場合は <strong>info@yomitoku-base.com</strong> までご連絡ください。</p>

      <h2>3. 第三者提供</h2>
      <p>当社は、以下の場合を除き、取得した個人情報を第三者に提供しません。</p>
      <ul>
        <li>利用者の同意がある場合</li>
        <li>法令に基づく場合</li>
        <li>人の生命・身体・財産の保護のために必要な場合</li>
      </ul>

      <h2>4. 業務委託先への提供</h2>
      <p>本サービスの運営にあたり、以下の事業者にデータを提供することがあります。いずれも適切な安全管理措置を講じています。</p>
      <ul>
        <li>Stripe, Inc.（決済処理）</li>
        <li>LINE株式会社（メッセージ配信）</li>
        <li>Resend Inc.（メール送信）</li>
        <li>Vercel Inc.（サービス基盤）</li>
        <li>Neon Inc.（データベース）</li>
      </ul>

      <h2>5. 安全管理</h2>
      <p>当社は、個人情報の漏洩・滅失・毀損を防止するため、適切な安全管理措置を講じます。</p>

      <h2>6. 開示・訂正・削除</h2>
      <p>個人情報の開示・訂正・削除を希望される場合は、<strong>info@yomitoku-base.com</strong> までご連絡ください。本人確認の上、合理的な範囲で対応します。</p>

      <h2>7. お問い合わせ</h2>
      <p>個人情報の取り扱いに関するお問い合わせは以下までご連絡ください。</p>
      <p>株式会社ONZiii Act　個人情報管理担当<br />
      メール：info@yomitoku-base.com</p>
    </div>
  );
}
