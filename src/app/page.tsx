import Image from "next/image";

const P = {
  teal: "#0D686E",
  dark: "#0A4A50",
  mid: "#158A82",
  light: "#E6F4F2",
  lighter: "#F0F9F8",
  lightest: "#F8FCFC",
  orange: "#FA5203",
  orangeDark: "#D93F00",
  text: "#0F1A19",
  muted: "#527672",
  border: "#C8E2DE",
  white: "#ffffff",
};

function ArrowRight({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

function Stars({ count, color }: { count: number; color: string }) {
  return (
    <span style={{ display: "inline-flex", gap: 2 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <svg key={i} width="15" height="15" viewBox="0 0 24 24" fill={i < count ? color : "#DDE7E5"}>
          <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.7 6.9L12 17.3 5.7 20.8l1.7-6.9L2 9.2l7.1-.6z" />
        </svg>
      ))}
    </span>
  );
}

function CtaButton({ label = "ヨミトク購読を始める", big = false }: { label?: string; big?: boolean }) {
  return (
    <a href="/register" style={{
      display: "inline-flex", alignItems: "center", gap: 10,
      background: P.orange, color: P.white,
      padding: big ? "18px 40px" : "15px 32px",
      borderRadius: 999, fontSize: big ? 17 : 15, fontWeight: 800,
      textDecoration: "none", boxShadow: "0 8px 28px rgba(250,82,3,0.32)",
    }}>
      {label} <ArrowRight size={big ? 20 : 17} />
    </a>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 12, fontWeight: 800, color: P.teal, letterSpacing: "0.2em", marginBottom: 12, textAlign: "center" }}>
      {children}
    </p>
  );
}

const weeklyFeatures = [
  { icon: "icon-clock.png", title: "毎週3分で\nわかりやすく解説", desc: "重要ポイントをゴリ編集長が3分で読める分量に整理" },
  { icon: "icon-tag.png", title: "必要な情報だけを\nタグ設定でお届け", desc: "デイサービス・訪問介護など事業に合わせて絞り込み" },
  { icon: "icon-bell.png", title: "通知・分科会を\nまとめてチェック", desc: "バラバラに発表される情報を1つの号にまとめて配信" },
  { icon: "icon-lightbulb.png", title: "制度の背景や影響まで\nしっかり解説", desc: "「何が」だけでなく「なぜ」「どう影響するか」まで" },
];

const summaryPoints = [
  { icon: "icon-document.png", title: "3行まとめ", desc: "要点を3行で簡潔に整理" },
  { icon: "icon-lightbulb.png", title: "なぜ読む必要があるのか", desc: "現場・経営に与える影響を解説" },
  { icon: "icon-pencil-edit.png", title: "何が変わったのか", desc: "改定点・変更点をわかりやすく" },
  { icon: "icon-search.png", title: "なんでこうなったか", desc: "背景・理由を専門的に解説" },
  { icon: "icon-check-circle.png", title: "次にやること", desc: "具体的な対応・準備を提示" },
  { icon: "icon-calendar.png", title: "スケジュール抜粋", desc: "重要な日程をわかりやすく" },
  { icon: "icon-star.png", title: "編集長の未来予報", desc: "今後の動向・影響を予測" },
  { icon: "icon-link.png", title: "原文リンク", desc: "根拠となる原文・資料にすぐアクセス" },
];

const painPoints = [
  { img: "businessman-smartphone.png", title: "通知が多すぎる", desc: "介護保険関連の通知・分科会資料の確認だけでも数時間かかる" },
  { img: "businesswoman-laptop.png", title: "読む時間がない", desc: "数十〜100ページ以上の資料もあり、時間はいくらあっても足りない" },
  { img: "businesswoman-thinking-worried.png", title: "経営への影響がわからない", desc: "内容は理解できても「自社が何をすべきか」を判断するのが難しい" },
];

const roomFeatures = [
  { icon: "icon-search.png", title: "探す", desc: "知りたい情報をキーワードですぐ探せる" },
  { icon: "icon-document.png", title: "読む", desc: "バックナンバーをいつでも見返せる" },
  { icon: "icon-bookmark-outline.png", title: "保存する", desc: "後で読みたい記事を簡単保存" },
  { icon: "icon-chat-bubble.png", title: "話す", desc: "コメント・いいねで仲間と交流" },
];

const trustPoints = [
  { icon: "icon-check-circle.png", title: "公的情報を確認", desc: "厚生労働省などの公的情報をもとに編集しています" },
  { icon: "icon-link.png", title: "原文にもアクセス", desc: "要約だけでなく、元資料にもすぐアクセスできます" },
  { icon: "icon-chat-outline.png", title: "気づいたら、教えてください", desc: "「報告する」ボタンから訂正や内容確認の情報をお寄せください。ゴリ編集長が確認し、より正確な情報にアップデートします" },
];

const tags: [string, string][] = [
  ["デイサービス", "badge-day-service.png"],
  ["訪問介護", "badge-home-visit-care.png"],
  ["居宅介護支援", "badge-home-care-support.png"],
  ["特養", "badge-special-nursing-home.png"],
  ["制度改正", "badge-system-reform.png"],
  ["加算", "badge-addition-calculation.png"],
  ["人材", "badge-human-resources.png"],
  ["ICT", "badge-ict.png"],
  ["生産性向上", "badge-productivity.png"],
  ["介護予防", "badge-care-prevention.png"],
  ["補助金", "badge-subsidy.png"],
];

const accounts = [
  { role: "経営者", img: "businessman-arms-crossed.png", tagsEx: ["制度改正", "補助金"] },
  { role: "管理者", img: "businesswoman-with-tablet.png", tagsEx: ["加算", "運営基準"] },
  { role: "生活相談員", img: "businesswoman-with-notebook.png", tagsEx: ["デイサービス", "訪問介護"] },
];

const faqs = [
  { q: "情報はどのくらいの頻度で届きますか？", a: "『週刊ヨミトク』として毎週水曜日にLINEでお届けします。その週に発表された介護保険制度の最新動向をまとめて配信します。" },
  { q: "1契約で何人まで使えますか？", a: "1契約で最大3アカウントまでご利用いただけます。経営者・管理者・生活相談員など、役割の異なるメンバーで共有できます。" },
  { q: "タグ設定はあとから変更できますか？", a: "はい、いつでも変更可能です。アカウントごとに個別のタグを設定できるので、必要な情報だけを受け取れます。" },
  { q: "情報源は信頼できますか？", a: "厚生労働省など公的機関が発表した情報のみを情報源としています。原文・資料へのリンクも記事から確認できます。" },
];

export default function LandingPage() {
  return (
    <div style={{ fontFamily: "'Noto Sans JP','Hiragino Kaku Gothic ProN','Hiragino Sans',Meiryo,sans-serif", color: P.text, overflowX: "hidden" }}>

      <style>{`
        @media (max-width: 860px) {
          .nav-links { display: none !important; }
        }
        @media (max-width: 768px) {
          section, footer { padding-left: 20px !important; padding-right: 20px !important; }
          section { padding-top: 56px !important; padding-bottom: 56px !important; }
          .hero-grid { grid-template-columns: 1fr !important; padding-top: 48px !important; padding-bottom: 32px !important; }
          .hero-copy { text-align: center; }
          .hero-image-wrap { order: -1; margin-bottom: 8px; }
          .weekly-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
          .weekly-features-grid { grid-template-columns: 1fr 1fr !important; gap: 14px !important; }
          .phone-card { width: 100% !important; }
          .summary-grid { grid-template-columns: 1fr 1fr !important; gap: 14px !important; }
          .pain-grid { grid-template-columns: 1fr !important; }
          .room-heading-row { flex-direction: column !important; text-align: center !important; }
          .room-heading-row > div { text-align: center !important; }
          .room-features-grid { grid-template-columns: 1fr 1fr !important; gap: 14px !important; }
          .accounts-grid { grid-template-columns: 1fr !important; }
          .trust-grid { grid-template-columns: 1fr !important; }
          .pricing-inner-grid { grid-template-columns: 1fr !important; gap: 28px !important; }
          .pricing-left { border-right: none !important; padding-right: 0 !important; border-bottom: 1px solid ${P.border}; padding-bottom: 28px !important; }
          .pricing-card { padding: 36px 24px !important; }
          .cta-grid { grid-template-columns: 1fr !important; text-align: center !important; justify-items: center !important; }
          .footer-top { flex-direction: column !important; }
          .footer-links { gap: 16px !important; }
        }
        @media (max-width: 480px) {
          .weekly-features-grid, .summary-grid, .room-features-grid { grid-template-columns: 1fr !important; }
          .nav-login { display: none !important; }
          .nav-logo-text { font-size: 15px !important; }
          .nav-cta { padding: 9px 14px !important; font-size: 13px !important; }
        }
      `}</style>

      {/* ─── NAV ─── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(255,255,255,0.95)", backdropFilter: "blur(8px)",
        borderBottom: `1px solid ${P.border}`,
      }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 16px", height: 68, display: "flex", alignItems: "center", gap: 32 }}>
          <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0, textDecoration: "none", minWidth: 0 }}>
            <Image src="/icons/icon-gori-editor.jpg" alt="" width={200} height={200} priority style={{ width: 38, height: 38, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
            <span className="nav-logo-text" style={{ fontSize: 18, fontWeight: 800, color: P.text, whiteSpace: "nowrap" }}>ヨミトク編集部</span>
          </a>
          <div className="nav-links" style={{ display: "flex", gap: 28, marginLeft: 16 }}>
            {([["週刊ヨミトク", "#weekly"], ["編集室", "#room"], ["タグ設定", "#tags"], ["料金", "#pricing"]] as const).map(([label, href]) => (
              <a key={href} href={href} style={{ fontSize: 14, fontWeight: 600, color: P.muted, textDecoration: "none", whiteSpace: "nowrap" }}>{label}</a>
            ))}
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 16, alignItems: "center", flexShrink: 0 }}>
            <a href="/base/login" className="nav-login" style={{ fontSize: 14, fontWeight: 600, color: P.teal, textDecoration: "none", whiteSpace: "nowrap" }}>ログイン</a>
            <a href="/register" className="nav-cta" style={{
              background: P.orange, color: P.white,
              padding: "10px 18px", borderRadius: 999, fontSize: 14, fontWeight: 800,
              textDecoration: "none", whiteSpace: "nowrap",
            }}>
              購読を始める
            </a>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section style={{
        background: "#EBF6F6",
        position: "relative", overflow: "hidden",
      }}>
        <div className="hero-grid" style={{ maxWidth: 1240, margin: "0 auto", padding: "80px 24px 56px", display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 24, alignItems: "center" }}>
          <div className="hero-copy">
            <p style={{ fontSize: "clamp(14px, 1.6vw, 17px)", fontWeight: 800, color: P.teal, letterSpacing: "0.08em", margin: "0 0 14px" }}>
              制度を、読むから、わかるへ。
            </p>
            <h1 style={{ fontSize: "clamp(30px, 3.8vw, 46px)", fontWeight: 900, lineHeight: 1.4, letterSpacing: "-0.01em", color: P.dark, margin: "0 0 20px" }}>
              経営者なら、<br />
              国の動向は<br />
              押さえておきたい。
            </h1>
            <p style={{ fontSize: "clamp(18px, 2.2vw, 23px)", fontWeight: 700, color: P.muted, lineHeight: 1.6, margin: "0 0 28px" }}>
              でも、全部読む時間はない。
            </p>
            <h2 style={{ fontSize: "clamp(22px, 2.8vw, 30px)", fontWeight: 900, lineHeight: 1.5, margin: "0 0 32px" }}>
              読むのは、<br />
              <span style={{ color: P.orange }}>ゴリ編集長</span>の仕事です。
            </h2>
            <CtaButton big label="ヨミトク購読を始める" />
            <p style={{ fontSize: 13, color: P.muted, marginTop: 16 }}>月額300円（税抜）　1契約で最大3アカウント</p>
          </div>

          <div className="hero-image-wrap" style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            <Image
              src="/LP_sozai/hero/hero-gori-desk.png"
              alt="制度資料を読み込むゴリ編集長"
              width={1369}
              height={1053}
              priority
              style={{ width: "100%", maxWidth: 744, height: "auto" }}
            />
          </div>
        </div>
      </section>

      {/* ─── 週刊ヨミトク ─── */}
      <section id="weekly" style={{ background: P.white, padding: "96px 24px" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <span style={{
              display: "inline-block", background: P.dark, color: P.white,
              fontSize: 13, fontWeight: 800, letterSpacing: "0.1em",
              padding: "7px 22px", borderRadius: 999, marginBottom: 18,
            }}>
              毎週水曜日発行
            </span>
            <h2 style={{ fontSize: "clamp(26px, 3.2vw, 40px)", fontWeight: 900, color: P.dark, margin: "0 0 16px" }}>『週刊ヨミトク』</h2>
            <p style={{ fontSize: 17, fontWeight: 700, color: P.muted, lineHeight: 1.85, margin: 0 }}>
              介護保険制度の最新動向を、<span style={{ color: P.orange }}>毎週3分</span>で。
            </p>
          </div>

          <div className="weekly-grid" style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 56, alignItems: "center", marginBottom: 72 }}>
            {/* Phone mockup */}
            <div style={{ justifySelf: "center" }}>
              <div className="phone-card" style={{
                width: 300, borderRadius: 28, background: P.white, border: `8px solid ${P.dark}`,
                boxShadow: "0 24px 60px rgba(13,104,110,0.2)", overflow: "hidden",
              }}>
                <div style={{ background: P.dark, padding: "14px 18px" }}>
                  <p style={{ fontSize: 15, fontWeight: 800, color: P.white, margin: 0 }}>『週刊ヨミトク』</p>
                  <p style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", margin: "2px 0 0" }}>毎週水曜日発行</p>
                </div>
                <div style={{ padding: 16 }}>
                  <p style={{ display: "inline-block", background: "#FEF3C7", color: "#B45309", fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: 999, margin: "0 0 10px" }}>
                    今週の重要ニュース
                  </p>
                  <p style={{ fontSize: 14, fontWeight: 800, lineHeight: 1.5, margin: "0 0 6px" }}>
                    介護職員等の処遇改善に関する加算の取得状況が公表されました
                  </p>
                  <p style={{ fontSize: 10, color: P.muted, margin: "0 0 14px" }}>厚生労働省｜令和6年5月16日｜事務連絡</p>
                  <p style={{ fontSize: 11, fontWeight: 800, color: P.teal, margin: "0 0 6px" }}>3行要約</p>
                  {["処遇改善加算の取得率は全体で67.3%。", "地域やサービス区分で大きな差がある。", "さらなる取得促進に向けた支援が強化される。"].map((t, i) => (
                    <p key={i} style={{ fontSize: 11.5, color: P.text, lineHeight: 1.6, margin: "0 0 4px" }}>{i + 1}. {t}</p>
                  ))}
                  <div style={{ display: "flex", gap: 6, alignItems: "center", margin: "12px 0" }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: P.muted }}>重要度</span>
                    <Stars count={3} color="#F5A623" />
                  </div>
                  <div style={{ background: P.lighter, borderRadius: 10, padding: 12, marginBottom: 12 }}>
                    <p style={{ fontSize: 10, fontWeight: 800, color: P.teal, margin: "0 0 4px" }}>ゴリ編集長の解説</p>
                    <p style={{ fontSize: 11, color: P.muted, lineHeight: 1.6, margin: 0 }}>
                      取得が進んでいない事業所は、今後の加算要件や支援策を確認し、早めの準備をおすすめします。
                    </p>
                  </div>
                  <div style={{ background: P.dark, color: P.white, textAlign: "center", borderRadius: 8, padding: "9px", fontSize: 12, fontWeight: 700 }}>
                    原文はこちらから →
                  </div>
                </div>
              </div>
            </div>

            {/* 4 features */}
            <div className="weekly-features-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              {weeklyFeatures.map((f) => (
                <div key={f.title} style={{
                  background: P.lighter, borderRadius: 18, padding: "26px 24px",
                  border: `1px solid ${P.border}`, display: "flex", flexDirection: "column", gap: 12,
                }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 14, background: P.white,
                    border: `1px solid ${P.border}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Image src={`/LP_sozai/assets/icons/${f.icon}`} alt="" width={140} height={150} style={{ width: 28, height: "auto" }} />
                  </div>
                  <p style={{ fontSize: 16, fontWeight: 800, margin: 0, lineHeight: 1.5, whiteSpace: "pre-line" }}>{f.title}</p>
                  <p style={{ fontSize: 13, color: P.muted, margin: 0, lineHeight: 1.7 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── ゴリ編集長のまとめ方 ─── */}
      <section style={{ background: P.lighter, padding: "96px 24px" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <Eyebrow>GORI EDITOR&apos;S METHOD</Eyebrow>
            <div className="room-heading-row" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20 }}>
              <Image
                src="/LP_sozai/assets/mascot/gori-writing-notebook.png"
                alt=""
                width={194}
                height={206}
                style={{ width: 96, height: "auto" }}
              />
              <div style={{ textAlign: "left" }}>
                <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 900, margin: "0 0 8px" }}>ゴリ編集長のまとめ方</h2>
                <p style={{ fontSize: 16, color: P.muted, lineHeight: 1.85, margin: 0 }}>長い資料も、判断できる情報に。</p>
              </div>
            </div>
          </div>

          <div className="summary-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 44 }}>
            {summaryPoints.map((s, i) => (
              <div key={s.title} style={{
                background: P.white, borderRadius: 18, padding: "24px 20px",
                border: `1px solid ${P.border}`, position: "relative",
                boxShadow: "0 2px 12px rgba(13,104,110,0.05)",
              }}>
                <span style={{
                  position: "absolute", top: 18, right: 18,
                  fontSize: 12, fontWeight: 900, color: P.border, letterSpacing: "0.05em",
                }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div style={{
                  width: 46, height: 46, borderRadius: 12, background: P.light,
                  display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14,
                }}>
                  <Image src={`/LP_sozai/assets/icons/${s.icon}`} alt="" width={130} height={155} style={{ width: 24, height: "auto" }} />
                </div>
                <p style={{ fontSize: 15, fontWeight: 800, margin: "0 0 6px" }}>{s.title}</p>
                <p style={{ fontSize: 12.5, color: P.muted, lineHeight: 1.65, margin: 0 }}>{s.desc}</p>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: 40, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: P.muted }}>重要度</span>
              <Stars count={5} color={P.orange} />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: P.muted }}>緊急度</span>
              <Stars count={4} color={P.teal} />
            </div>
          </div>
        </div>
      </section>

      {/* ─── なぜ、ゴリ編集長が必要なのか ─── */}
      <section style={{ background: P.white, padding: "96px 24px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 900, margin: "0 0 56px" }}>なぜ、ヨミトク編集部が必要なのか</h2>

          <div className="pain-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24, marginBottom: 56 }}>
            {painPoints.map((p) => (
              <div key={p.title} style={{
                background: P.lightest, borderRadius: 20, padding: "32px 26px",
                border: `1px solid ${P.border}`, textAlign: "center",
              }}>
                <Image
                  src={`/LP_sozai/assets/people/${p.img}`}
                  alt=""
                  width={180}
                  height={205}
                  style={{ width: 96, height: "auto", margin: "0 auto 16px" }}
                />
                <p style={{ fontSize: 17, fontWeight: 800, margin: "0 0 10px" }}>{p.title}</p>
                <p style={{ fontSize: 13.5, color: P.muted, lineHeight: 1.75, margin: 0, textAlign: "left" }}>{p.desc}</p>
              </div>
            ))}
          </div>

          <p style={{ fontSize: "clamp(20px, 2.4vw, 26px)", fontWeight: 900, color: P.teal, margin: "0 0 32px" }}>
            だから、ヨミトク編集部が代わりに読みます。
          </p>
          <CtaButton big label="ヨミトク購読を始める" />
          <p style={{ fontSize: 13, color: P.muted, marginTop: 16 }}>月額300円（税抜）　お申し込み後、LINEへご案内します。</p>
        </div>
      </section>

      {/* ─── 編集室 ─── */}
      <section id="room" style={{ background: P.lighter, padding: "96px 24px" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <span style={{
              display: "inline-block", background: P.dark, color: P.white,
              fontSize: 13, fontWeight: 800, letterSpacing: "0.1em",
              padding: "7px 22px", borderRadius: 999, marginBottom: 18,
            }}>
              編集室
            </span>
            <div className="room-heading-row" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 24 }}>
              <div style={{ textAlign: "left" }}>
                <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 900, margin: "0 0 12px" }}>
                  バックナンバー・通知・分科会を、<br />仲間と学ぶ場所。
                </h2>
                <p style={{ fontSize: 15, color: P.muted, lineHeight: 1.85, margin: 0 }}>
                  過去の情報を読み返せる方が、安心して意思決定できます。<br />
                  制度の変化を、チームの共通言語に変える場所です。
                </p>
              </div>
              <Image
                src="/LP_sozai/assets/mascot/gori-laptop-typing.png"
                alt=""
                width={194}
                height={205}
                style={{ width: 130, height: "auto", flexShrink: 0 }}
              />
            </div>
          </div>

          <div className="room-features-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 20, marginBottom: 64 }}>
            {roomFeatures.map((f) => (
              <div key={f.title} style={{
                background: P.white, borderRadius: 18, padding: "28px 20px", textAlign: "center",
                border: `1px solid ${P.border}`, boxShadow: "0 2px 12px rgba(13,104,110,0.05)",
              }}>
                <div style={{
                  width: 54, height: 54, borderRadius: "50%", background: P.light,
                  display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px",
                }}>
                  <Image src={`/LP_sozai/assets/icons/${f.icon}`} alt="" width={140} height={150} style={{ width: 26, height: "auto" }} />
                </div>
                <p style={{ fontSize: 16, fontWeight: 800, margin: "0 0 6px" }}>{f.title}</p>
                <p style={{ fontSize: 12.5, color: P.muted, margin: 0, lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>

          {/* タグ設定 */}
          <div id="tags" style={{ textAlign: "center", marginBottom: 40 }}>
            <h3 style={{ fontSize: "clamp(20px, 2.4vw, 28px)", fontWeight: 900, margin: "0 0 12px" }}>必要な情報だけを、あなたに。</h3>
            <p style={{ fontSize: 14, color: P.muted, margin: "0 0 28px" }}>あなたに必要な情報だけをお届け。タグはいつでも追加・変更できます。</p>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 12, maxWidth: 720, margin: "0 auto" }}>
              {tags.map(([label, badge]) => (
                <Image key={label} src={`/LP_sozai/assets/badges/${badge}`} alt={label} width={190} height={140} style={{ height: 48, width: "auto" }} />
              ))}
              <span style={{
                display: "inline-flex", alignItems: "center", height: 48, padding: "0 20px",
                background: P.white, border: `1.5px solid ${P.border}`, borderRadius: 999,
                fontSize: 13.5, fontWeight: 700, color: P.muted,
              }}>
                その他
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 組織で使う ─── */}
      <section style={{ background: P.white, padding: "96px 24px" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", textAlign: "center" }}>
          <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 900, margin: "0 0 16px" }}>情報を、組織の共通言語に。</h2>
          <p style={{ fontSize: 16, color: P.muted, lineHeight: 1.85, marginBottom: 56 }}>
            1契約で最大3アカウントまで利用可能。役割ごとに必要な情報だけを届けます。
          </p>

          <div className="accounts-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 28 }}>
            {accounts.map((a, i) => (
              <div key={a.role} style={{ background: P.lighter, borderRadius: 20, padding: "32px 24px", border: `1px solid ${P.border}` }}>
                <Image
                  src={`/LP_sozai/assets/people/${a.img}`}
                  alt=""
                  width={160}
                  height={205}
                  style={{ width: 88, height: "auto", margin: "0 auto 16px" }}
                />
                <p style={{ fontSize: 12, fontWeight: 700, color: P.teal, margin: "0 0 4px" }}>アカウント{["①", "②", "③"][i]}</p>
                <p style={{ fontSize: 17, fontWeight: 800, margin: "0 0 14px" }}>{a.role}</p>
                <div style={{ display: "flex", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
                  {a.tagsEx.map((t) => (
                    <span key={t} style={{ fontSize: 12, fontWeight: 700, color: P.teal, background: P.light, padding: "4px 12px", borderRadius: 999 }}>{t}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── みんなで育てる編集部 ─── */}
      <section style={{ background: P.lighter, padding: "96px 24px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 18, marginBottom: 20 }}>
            <Image
              src="/LP_sozai/assets/mascot/gori-thumbs-up.png"
              alt=""
              width={192}
              height={201}
              style={{ width: 88, height: "auto" }}
            />
            <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 900, margin: 0 }}>みんなで育てる編集部。</h2>
          </div>
          <p style={{ fontSize: 15, color: P.muted, lineHeight: 1.85, margin: "0 0 48px" }}>
            不確実な情報は指摘できます。ゴリ編集長が学習し、より正確な情報になります。
          </p>
          <div className="trust-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 24 }}>
            {trustPoints.map((t) => (
              <div key={t.title} style={{
                background: P.white, borderRadius: 18, padding: "30px 26px", textAlign: "center",
                border: `1px solid ${P.border}`, boxShadow: "0 2px 12px rgba(13,104,110,0.05)",
              }}>
                <div style={{
                  width: 54, height: 54, borderRadius: "50%", background: P.light,
                  display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px",
                }}>
                  <Image src={`/LP_sozai/assets/icons/${t.icon}`} alt="" width={140} height={150} style={{ width: 26, height: "auto" }} />
                </div>
                <p style={{ fontSize: 16, fontWeight: 800, margin: "0 0 8px" }}>{t.title}</p>
                <p style={{ fontSize: 13.5, color: P.muted, lineHeight: 1.75, margin: 0 }}>{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section id="pricing" style={{ background: P.white, padding: "96px 24px" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <Eyebrow>PRICING</Eyebrow>
            <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 900, margin: 0 }}>シンプルな料金体系</h2>
          </div>
          <div style={{ maxWidth: 820, margin: "0 auto" }}>
            <div className="pricing-card" style={{
              background: P.lighter, borderRadius: 24, padding: "48px 52px",
              border: `2px solid ${P.teal}`, boxShadow: `0 8px 40px rgba(13,104,110,0.12)`,
            }}>
              <div className="pricing-inner-grid" style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 48, alignItems: "center", marginBottom: 36 }}>
                <div className="pricing-left" style={{ textAlign: "center", borderRight: `1px solid ${P.border}`, paddingRight: 48 }}>
                  <p style={{ fontSize: 13, fontWeight: 800, color: P.teal, letterSpacing: "0.05em", marginBottom: 16 }}>LINE + 編集室 セット</p>
                  <div>
                    <span style={{ fontSize: 14, color: P.muted, fontWeight: 600 }}>月額</span>
                    <span style={{ fontSize: 72, fontWeight: 900, color: P.teal, lineHeight: 1 }}>300</span>
                    <span style={{ fontSize: 24, fontWeight: 700, color: P.teal }}>円</span>
                    <span style={{ fontSize: 13, color: P.muted, display: "block", marginTop: 6 }}>（税抜）</span>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {[
                    "毎週水曜日「週刊ヨミトク」をお届け",
                    "通知・分科会・最新情報を編集して配信",
                    "タグ設定で必要な情報だけ受け取れる",
                    "編集室で検索・保存・コメント",
                    "最大3アカウントまで利用可能",
                  ].map((item) => (
                    <div key={item} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <svg width="20" height="20" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
                        <circle cx="9" cy="9" r="9" fill="#FDE8DC" />
                        <path d="M5 9.5L7.5 12L13 6" stroke={P.orange} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span style={{ fontSize: 15, fontWeight: 700 }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <CtaButton label="ヨミトク購読を始める" />
                <p style={{ fontSize: 12.5, color: P.muted, marginTop: 16 }}>
                  お申し込み後、LINEへご案内します　｜　クレジットカード決済　｜　いつでも解約可能
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section style={{ background: P.lighter, padding: "96px 24px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <Eyebrow>FAQ</Eyebrow>
            <h2 style={{ fontSize: "clamp(24px, 3vw, 36px)", fontWeight: 900, margin: 0 }}>よくある質問</h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {faqs.map((f) => (
              <div key={f.q} style={{ background: P.white, borderRadius: 16, padding: "24px 28px", border: `1px solid ${P.border}` }}>
                <p style={{ display: "flex", gap: 10, fontSize: 15.5, fontWeight: 800, margin: "0 0 10px" }}>
                  <span style={{ color: P.orange }}>Q.</span>{f.q}
                </p>
                <p style={{ display: "flex", gap: 10, fontSize: 14, color: P.muted, lineHeight: 1.8, margin: 0 }}>
                  <span style={{ color: P.teal, fontWeight: 800 }}>A.</span>{f.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section style={{
        background: `linear-gradient(135deg, ${P.dark} 0%, ${P.teal} 60%, ${P.mid} 100%)`,
        padding: "80px 24px",
      }}>
        <div className="cta-grid" style={{ maxWidth: 960, margin: "0 auto", display: "grid", gridTemplateColumns: "auto 1fr", gap: 48, alignItems: "center" }}>
          <Image
            src="/LP_sozai/assets/mascot/gori-book-point-up.png"
            alt=""
            width={193}
            height={200}
            style={{ width: "min(90%, 240px)", height: "auto" }}
          />
          <div>
            <h2 style={{ fontSize: "clamp(26px, 3.4vw, 42px)", fontWeight: 900, color: P.white, lineHeight: 1.45, margin: "0 0 8px" }}>
              読むのは、編集部。
            </h2>
            <p style={{ fontSize: "clamp(24px, 3.2vw, 40px)", fontWeight: 900, color: "#FFC9A8", lineHeight: 1.45, margin: "0 0 24px" }}>
              考えるのは、あなた。
            </p>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.82)", lineHeight: 1.85, margin: "0 0 32px" }}>
              制度を、読むから、わかるへ。<br />
              毎週水曜日、ゴリ編集長がまとめてお届けします。
            </p>
            <a href="/register" style={{
              display: "inline-flex", alignItems: "center", gap: 10,
              background: P.orange, color: P.white,
              padding: "18px 40px", borderRadius: 999, fontSize: 17, fontWeight: 800,
              textDecoration: "none", boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
            }}>
              ヨミトク購読を始める <ArrowRight size={20} />
            </a>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 18 }}>
              月額300円（税抜）　お申し込み後、LINEへご案内します。
            </p>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{ background: P.dark, padding: "48px 24px 32px" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto" }}>
          <div className="footer-top" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 32, marginBottom: 40 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <Image src="/icons/icon-gori-editor.jpg" alt="" width={200} height={200} style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }} />
                <span style={{ fontSize: 16, fontWeight: 800, color: P.white }}>ヨミトク編集部</span>
              </div>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.85, margin: 0, maxWidth: 360 }}>
                介護保険に関する最新の制度・通知・分科会資料を、<br />
                ゴリ編集長が整理してLINEでお届けする情報サービスです。
              </p>
            </div>
            <div className="footer-links" style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
              {([["週刊ヨミトク", "#weekly"], ["編集室", "/base"], ["ログイン", "/base/login"], ["利用規約", "/legal/terms"], ["プライバシーポリシー", "/legal/privacy"], ["特定商取引法に基づく表記", "/legal/commercial"]] as const).map(([label, href]) => (
                <a key={href} href={href} style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", textDecoration: "none", fontWeight: 600 }}>{label}</a>
              ))}
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 24, textAlign: "center" }}>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.28)", margin: 0 }}>
              © 2026 ヨミトク編集部 / 株式会社ONZiii Act
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
