import type { Metadata } from "next";
import styles from "../legal.module.css";

export const metadata: Metadata = {
  title: "特定商取引法に基づく表記 | YOMITOKU",
};

const rows = [
  { label: "販売事業者", value: "株式会社ONZiii Act" },
  { label: "代表者", value: "代表取締役　長谷川昌弘" },
  { label: "所在地", value: "愛知県安城市美園町1-23-1" },
  { label: "電話番号", value: "0566-91-0257（受付：平日10:00〜17:00）" },
  { label: "メールアドレス", value: "onziii.project@gmail.com" },
  { label: "サービス名", value: "YOMITOKU（ヨミトク）｜介護保険最新情報" },
  { label: "サービスの内容", value: "介護保険に関する公的機関の最新情報をAIで要約し、LINEメッセージで配信するSaaS型情報サービス" },
  { label: "料金", value: "月額300円（税抜）／年額3,000円（税抜）\n※別途消費税がかかります" },
  { label: "支払方法", value: "クレジットカード（Visa・Mastercard・American Express・JCB）" },
  { label: "支払時期", value: "お申し込み時に初月分を決済。以降は契約更新日に自動引き落とし" },
  { label: "契約期間", value: "月単位または年単位（自動更新）" },
  {
    label: "解約方法",
    value: "LINEの公式アカウントより解約申し込みを受け付けます。解約申し込み後、当月末をもってサービスを終了します。日割り返金はございません。",
  },
  { label: "動作環境", value: "LINEアプリがインストールされたスマートフォン（iOS / Android）" },
  { label: "個人情報の取扱い", value: "当社プライバシーポリシーに従い適切に管理します" },
];

export default function CommercialPage() {
  return (
    <div className={styles.doc}>
      <h1>特定商取引法に基づく表記</h1>
      <p className={styles.updated}>最終更新日：2025年7月11日</p>

      <table className={styles.table}>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <th>{row.label}</th>
              <td style={{ whiteSpace: "pre-line" }}>{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
