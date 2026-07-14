import Image from "next/image";

const LINE_OA_URL = "https://line.me/R/ti/p/@324eesis";

const P = {
  teal: "#0D686E",
  dark: "#0A4A50",
  mid: "#158A82",
  light: "#E6F4F2",
  lighter: "#F0F9F8",
  lightest: "#F8FCFC",
  text: "#0F1A19",
  muted: "#527672",
  border: "#C8E2DE",
  line: "#06C755",
  white: "#ffffff",
};

function LineIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.105.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
    </svg>
  );
}

function ArrowRight() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

export default function LandingPage() {
  return (
    <div style={{ fontFamily: "'Noto Sans JP','Hiragino Kaku Gothic ProN','Hiragino Sans',Meiryo,sans-serif", color: P.text, overflowX: "hidden" }}>

      {/* ─── NAV ─── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(255,255,255,0.95)", backdropFilter: "blur(8px)",
        borderBottom: `1px solid ${P.border}`,
      }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", gap: 32 }}>
          <a href="/" style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
            <Image src="/design/assets/08-brand/logos/logo-yomitoku-main.png" alt="ヨミトク" width={160} height={44} style={{ height: 36, width: "auto" }} priority />
          </a>
          <div style={{ display: "flex", gap: 28, marginLeft: 16 }}>
            {([["機能紹介", "#features"], ["使い方", "#how"], ["料金", "#pricing"]] as const).map(([label, href]) => (
              <a key={href} href={href} style={{ fontSize: 14, fontWeight: 600, color: P.muted, textDecoration: "none" }}>{label}</a>
            ))}
          </div>
          <div style={{ marginLeft: "auto", display: "flex", gap: 12, alignItems: "center" }}>
            <a href="/base/login" style={{ fontSize: 14, fontWeight: 600, color: P.teal, textDecoration: "none" }}>ログイン</a>
            <a href="/register" style={{
              display: "flex", alignItems: "center", gap: 7,
              background: P.line, color: P.white,
              padding: "9px 20px", borderRadius: 8, fontSize: 14, fontWeight: 700,
              textDecoration: "none",
            }}>
              <LineIcon size={17} />無料登録
            </a>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section style={{
        background: `linear-gradient(135deg, ${P.lightest} 0%, #E3F4F2 60%, ${P.light} 100%)`,
        position: "relative", overflow: "hidden", minHeight: 620,
      }}>
        {/* テキスト：左半分に固定 */}
        <div style={{ maxWidth: 928, margin: "0 auto", padding: "80px 24px 80px", position: "relative", zIndex: 1 }}>
          <div style={{ maxWidth: 500 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: P.light, border: `1px solid ${P.border}`, color: P.teal,
              padding: "5px 14px", borderRadius: 100, fontSize: 12, fontWeight: 700,
              marginBottom: 28, letterSpacing: "0.05em",
            }}>
              <span style={{ width: 6, height: 6, background: P.teal, borderRadius: "50%" }} />
              介護保険 × AI情報サービス
            </div>

            <h1 style={{ fontSize: "clamp(28px, 3.6vw, 44px)", fontWeight: 900, lineHeight: 1.45, letterSpacing: "-0.01em", margin: "0 0 20px" }}>
              経営者なら、<br />
              国の動向は<br />
              押さえておきたい。
            </h1>

            <p style={{ fontSize: "clamp(18px, 2.2vw, 24px)", fontWeight: 700, color: P.muted, lineHeight: 1.6, margin: "0 0 32px" }}>
              でも、全部読む時間はない。
            </p>

            <p style={{ fontSize: 16, fontWeight: 800, color: P.teal, margin: "0 0 10px" }}>
              情報収集は、AIに任せる時代。
            </p>
            <p style={{ fontSize: 15, color: P.muted, lineHeight: 1.85, margin: "0 0 40px", maxWidth: 420 }}>
              ヨミトクは、介護保険に関する最新の制度・通知・分科会資料を
              AIが整理し、LINEでお届けします。必要な情報はBASEでいつでも検索。
              読む時間を減らし、考える時間を増やします。
            </p>

            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              <a href="/register" style={{
                display: "flex", alignItems: "center", gap: 10,
                background: P.line, color: P.white,
                padding: "15px 28px", borderRadius: 12, fontSize: 16, fontWeight: 800,
                textDecoration: "none", boxShadow: "0 4px 20px rgba(6,199,85,0.3)",
              }}>
                <LineIcon size={20} />無料で登録する
              </a>
              <a href="/base" style={{
                display: "flex", alignItems: "center", gap: 8,
                background: P.white, color: P.teal, border: `2px solid ${P.teal}`,
                padding: "15px 24px", borderRadius: 12, fontSize: 15, fontWeight: 700,
                textDecoration: "none",
              }}>
                BASEを見る <ArrowRight />
              </a>
            </div>

            <p style={{ fontSize: 13, color: P.muted, marginTop: 16 }}>月額300円（税抜）　1契約で最大3アカウント</p>
          </div>
        </div>

        {/* イラスト：右側にブリード */}
        <Image
          src="/design/assets/hero-characters/characters-couple-line-share.png"
          alt="LINEで情報を共有するビジネスパーソン"
          width={900}
          height={900}
          style={{
            position: "absolute",
            right: "4%",
            top: "50%",
            transform: "translateY(-50%)",
            height: 400,
            width: "auto",
            objectFit: "contain",
          }}
          priority
        />
      </section>

      {/* ─── BRAND STRIP ─── */}
      <section style={{ background: P.teal, padding: "32px 24px" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: "clamp(16px, 2vw, 24px)", fontWeight: 900, color: P.white, letterSpacing: "0.04em", margin: "0 0 20px" }}>
            制度を味方に、経営をもっと前へ。
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 0, flexWrap: "wrap" }}>
            {[
              { num: "01", text: "読む時間を減らす" },
              { num: "02", text: "探す時間を減らす" },
              { num: "03", text: "考える時間を増やす" },
            ].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center" }}>
                <div style={{
                  background: "rgba(255,255,255,0.12)", padding: "12px 28px", borderRadius: 10,
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.55)", letterSpacing: "0.1em" }}>{item.num}</span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: P.white }}>{item.text}</span>
                </div>
                {i < 2 && (
                  <svg width="32" height="16" viewBox="0 0 32 16" fill="none" style={{ margin: "0 4px" }}>
                    <path d="M1 8h26M21 2l6 6-6 6" stroke="rgba(255,255,255,0.45)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how" style={{ background: P.white, padding: "96px 24px" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: P.teal, letterSpacing: "0.2em", marginBottom: 12 }}>HOW IT WORKS</p>
            <h2 style={{ fontSize: "clamp(22px, 2.8vw, 36px)", fontWeight: 900, lineHeight: 1.4, margin: "0 0 20px" }}>
              読むための情報から、<br />判断するための情報へ。
            </h2>
            <p style={{ fontSize: 16, color: P.muted, lineHeight: 1.85, maxWidth: 560, margin: "0 auto" }}>
              難しい制度情報を、AIが「読みやすく」「探しやすく」整理。<br />
              読む時間を減らし、考える時間を増やします。
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center" }}>
            <Image
              src="/design/assets/06-flow-diagrams/flow-gov-ai-line-manager.png"
              alt="情報の流れ"
              width={520}
              height={380}
              style={{ width: "100%", height: "auto", borderRadius: 16 }}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
              {[
                {
                  step: "STEP 1",
                  img: "/design/assets/03-government/gov-building-shakaihoshou.png",
                  title: "国が情報を発表",
                  body: "厚生労働省から介護保険の最新情報・通知・分科会資料が随時公開されます。",
                  color: "#6366F1",
                },
                {
                  step: "STEP 2",
                  img: "/design/assets/02-ai/ai-robot-color.png",
                  title: "AIが整理・要約",
                  body: "難しい制度文書をAIが読みやすく整理。重要なポイントを抽出し、わかりやすい言葉に変換します。",
                  color: P.teal,
                },
                {
                  step: "STEP 3",
                  img: "/design/assets/04-line-base/mockup-line-notification-message.png",
                  title: "LINEで届く・BASEで探せる",
                  body: "整理された情報がLINEに届き、過去のものはBASEでいつでも検索できます。",
                  color: P.line,
                },
              ].map((item) => (
                <div key={item.step} style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: 14, flexShrink: 0,
                    background: item.color + "14", overflow: "hidden",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Image src={item.img} alt={item.title} width={56} height={56} style={{ width: 44, height: 44, objectFit: "contain" }} />
                  </div>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 800, color: item.color, letterSpacing: "0.1em", margin: "0 0 5px" }}>{item.step}</p>
                    <p style={{ fontSize: 17, fontWeight: 800, margin: "0 0 7px" }}>{item.title}</p>
                    <p style={{ fontSize: 14, color: P.muted, lineHeight: 1.75, margin: 0 }}>{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── LINE + BASE ─── */}
      <section id="features" style={{ background: P.lighter, padding: "96px 24px" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: P.teal, letterSpacing: "0.2em", marginBottom: 12 }}>FEATURES</p>
            <h2 style={{ fontSize: "clamp(22px, 2.8vw, 36px)", fontWeight: 900, lineHeight: 1.4, margin: "0 0 16px" }}>
              LINEで届く。BASEで探せる。
            </h2>
            <p style={{ fontSize: 16, color: P.muted, lineHeight: 1.85, maxWidth: 480, margin: "0 auto" }}>
              2つのツールが連携して、制度情報の収集から活用まで完結します。
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
            {/* LINE card */}
            <div style={{ background: P.white, borderRadius: 20, overflow: "hidden", border: `1px solid ${P.border}`, boxShadow: "0 4px 24px rgba(13,104,110,0.07)" }}>
              <div style={{ background: "linear-gradient(135deg, #00B900 0%, #06C755 100%)", padding: "32px 36px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 42, height: 42, background: "rgba(255,255,255,0.2)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <LineIcon size={24} />
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", margin: "0 0 2px", fontWeight: 700, letterSpacing: "0.08em" }}>ヨミトクLINE</p>
                    <p style={{ fontSize: 20, fontWeight: 900, color: P.white, margin: 0 }}>情報を届ける</p>
                  </div>
                </div>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", lineHeight: 1.75, margin: 0 }}>
                  AIが要約した最新情報を、LINEでわかりやすくお届けします。
                </p>
              </div>
              <div style={{ padding: "28px 36px 36px" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
                  <Image
                    src="/design/assets/line-mockups/line-mockup-subcommittee-explainer.png"
                    alt="LINEの分科会解説メッセージ"
                    width={300}
                    height={280}
                    style={{ width: "100%", maxWidth: 280, height: "auto", objectFit: "contain" }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    { label: "AI要約", benefit: "難しい通知を、読まずに理解できる", detail: "100ページの文書が要点3行で届く" },
                    { label: "速報配信", benefit: "重要な変更を、誰より早くキャッチ", detail: "厚労省の発表当日に速報として届く" },
                    { label: "週刊ダイジェスト", benefit: "1週間の変化を月曜の朝に把握", detail: "チーム全員が同じ情報から始められる" },
                    { label: "タグ配信", benefit: "自事業所に関係する情報だけを受信", detail: "余計なノイズなし、本当に必要な情報に集中" },
                  ].map((f) => (
                    <div key={f.label} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "12px 14px", background: P.lighter, borderRadius: 10 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#06C755", flexShrink: 0, marginTop: 7 }} />
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 700, color: "#05a044", margin: "0 0 3px", letterSpacing: "0.05em" }}>{f.label}</p>
                        <p style={{ fontSize: 13, fontWeight: 800, margin: "0 0 2px", color: P.text }}>{f.benefit}</p>
                        <p style={{ fontSize: 12, color: P.muted, margin: 0, lineHeight: 1.45 }}>{f.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* BASE card */}
            <div style={{ background: P.white, borderRadius: 20, overflow: "hidden", border: `1px solid ${P.border}`, boxShadow: "0 4px 24px rgba(13,104,110,0.07)" }}>
              <div style={{ background: `linear-gradient(135deg, ${P.dark} 0%, ${P.teal} 100%)`, padding: "32px 36px 24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 42, height: 42, background: "rgba(255,255,255,0.2)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                    </svg>
                  </div>
                  <div>
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", margin: "0 0 2px", fontWeight: 700, letterSpacing: "0.08em" }}>ヨミトクBASE</p>
                    <p style={{ fontSize: 20, fontWeight: 900, color: P.white, margin: 0 }}>必要な時に探せる</p>
                  </div>
                </div>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.85)", lineHeight: 1.75, margin: 0 }}>
                  過去の通知も、分科会も、ガイドラインも。必要な情報をすぐ見つけ、経営判断に集中できます。
                </p>
              </div>
              <div style={{ padding: "28px 36px 36px" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
                  <Image
                    src="/design/assets/04-line-base/mockup-base-pc-browser.png"
                    alt="BASE画面"
                    width={320}
                    height={220}
                    style={{ width: "100%", maxWidth: 320, height: "auto", objectFit: "contain" }}
                  />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[
                    { label: "通知・最新情報", benefit: "「あの通知」を30秒で見つける", detail: "キーワード検索で過去の情報もすぐ取り出せる" },
                    { label: "分科会資料", benefit: "分科会の審議を経営判断に変える", detail: "複雑な議論をわかりやすく解説、要点だけ読める" },
                    { label: "カテゴリ検索", benefit: "介護保険のすべてが一箇所に", detail: "通知・ガイドライン・Q&Aを目的別に整理" },
                    { label: "お気に入り保存", benefit: "重要な情報をチームでストック", detail: "後から見返せるブックマークで情報を資産化" },
                  ].map((f) => (
                    <div key={f.label} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "12px 14px", background: P.lighter, borderRadius: 10 }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: P.teal, flexShrink: 0, marginTop: 7 }} />
                      <div>
                        <p style={{ fontSize: 11, fontWeight: 700, color: P.teal, margin: "0 0 3px", letterSpacing: "0.05em" }}>{f.label}</p>
                        <p style={{ fontSize: 13, fontWeight: 800, margin: "0 0 2px", color: P.text }}>{f.benefit}</p>
                        <p style={{ fontSize: 12, color: P.muted, margin: 0, lineHeight: 1.45 }}>{f.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── ORGANIZATION ─── */}
      <section style={{ background: P.white, padding: "96px 24px" }}>
        <div style={{ maxWidth: 920, margin: "0 auto", display: "grid", gridTemplateColumns: "3fr 2fr", gap: 32, alignItems: "flex-start" }}>
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: P.teal, letterSpacing: "0.2em", marginBottom: 14 }}>FOR TEAMS</p>
            <h2 style={{ fontSize: "clamp(28px, 3.6vw, 44px)", fontWeight: 900, lineHeight: 1.45, margin: "0 0 24px" }}>
              組織で、<br />サキを読み解く。
            </h2>
            <p style={{ fontSize: 15, color: P.muted, lineHeight: 1.9, margin: "0 0 32px" }}>
              経営者だけでなく、管理者や生活相談員とも同じ情報・同じ視点を共有。<br />
              制度の変化をいち早くキャッチし、現場の判断や行動につなげます。
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 36 }}>
              {[
                "共通の情報で認識のズレを防ぐ",
                "同じ視点で現場の判断を強化",
                "先手の対応で事業運営を安定化",
              ].map((item) => (
                <div key={item} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <div style={{ width: 22, height: 22, background: P.light, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2.5 6.5L5 9L9.5 4" stroke={P.teal} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span style={{ fontSize: 15, fontWeight: 600 }}>{item}</span>
                </div>
              ))}
            </div>
            <div style={{ background: P.lighter, border: `1px solid ${P.border}`, borderRadius: 12, padding: "16px 20px", display: "flex", alignItems: "flex-start", gap: 12 }}>
              <span style={{ fontSize: 24, flexShrink: 0 }}>👥</span>
              <p style={{ fontSize: 14, color: P.muted, margin: 0, lineHeight: 1.7 }}>
                <strong style={{ color: P.text }}>1契約で最大3アカウントまで利用できます。</strong><br />
                経営者・管理者・生活相談員で一緒に使えます。
              </p>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", alignSelf: "center" }}>
            <Image
              src="/design/assets/06-flow-diagrams/flow-line-share-3people.png"
              alt="組織で共有"
              width={572}
              height={462}
              style={{ width: "110%", height: "auto", borderRadius: 16 }}
            />
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section id="pricing" style={{ background: P.lighter, padding: "96px 24px" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: P.teal, letterSpacing: "0.2em", marginBottom: 12 }}>PRICING</p>
            <h2 style={{ fontSize: "clamp(22px, 2.8vw, 36px)", fontWeight: 900, lineHeight: 1.4, margin: 0 }}>
              シンプルな料金体系
            </h2>
          </div>
          <div style={{ maxWidth: 480, margin: "0 auto" }}>
            <div style={{
              background: P.white, borderRadius: 20, padding: "48px 48px",
              border: `2px solid ${P.teal}`, boxShadow: `0 8px 40px rgba(13,104,110,0.12)`,
              textAlign: "center",
            }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: P.light, padding: "4px 14px", borderRadius: 100, marginBottom: 24 }}>
                <svg width="8" height="8" viewBox="0 0 8 8" fill={P.teal}><circle cx="4" cy="4" r="4" /></svg>
                <span style={{ fontSize: 12, fontWeight: 700, color: P.teal }}>月額プラン</span>
              </div>
              <div style={{ marginBottom: 28 }}>
                <span style={{ fontSize: 14, color: P.muted, fontWeight: 600 }}>月額</span>
                <span style={{ fontSize: 72, fontWeight: 900, color: P.teal, lineHeight: 1 }}>300</span>
                <span style={{ fontSize: 26, fontWeight: 700, color: P.teal }}>円</span>
                <span style={{ fontSize: 13, color: P.muted, display: "block", marginTop: 6 }}>（税抜）　LINE + BASE セット</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 11, textAlign: "left", marginBottom: 32 }}>
                {[
                  "LINEで最新情報を受け取る",
                  "BASEで過去情報を検索",
                  "最大3アカウントで利用可能",
                  "AI要約・速報・週刊ダイジェスト",
                ].map((item) => (
                  <div key={item} style={{ display: "flex", gap: 9, alignItems: "center" }}>
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <circle cx="9" cy="9" r="9" fill={P.light} />
                      <path d="M5 9.5L7.5 12L13 6" stroke={P.teal} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span style={{ fontSize: 14, fontWeight: 600 }}>{item}</span>
                  </div>
                ))}
              </div>
              <a href="/register" style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                background: P.line, color: P.white,
                padding: "16px", borderRadius: 12, fontSize: 16, fontWeight: 800,
                textDecoration: "none", width: "100%",
              }}>
                <LineIcon size={20} />無料で登録する
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section style={{
        background: `linear-gradient(135deg, ${P.dark} 0%, ${P.teal} 60%, ${P.mid} 100%)`,
        padding: "96px 24px", textAlign: "center",
      }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
            <Image
              src="/design/assets/hero-characters/character-yomibot-mascot-main.png"
              alt="ヨミトク"
              width={120}
              height={120}
              style={{ width: 100, height: "auto" }}
            />
          </div>
          <h2 style={{ fontSize: "clamp(24px, 3.2vw, 40px)", fontWeight: 900, color: P.white, lineHeight: 1.45, margin: "0 0 20px" }}>
            まず、LINE登録から。
          </h2>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.78)", lineHeight: 1.85, margin: "0 0 40px" }}>
            登録は無料。月額300円（税抜）で介護保険の最新情報が<br />
            毎日LINEに届き、BASEでいつでも検索できます。
          </p>
          <a href="/register" style={{
            display: "inline-flex", alignItems: "center", gap: 12,
            background: P.line, color: P.white,
            padding: "18px 40px", borderRadius: 14, fontSize: 18, fontWeight: 800,
            textDecoration: "none", boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
          }}>
            <LineIcon size={22} />無料で登録する
          </a>
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 18 }}>
            月額300円（税抜）・クレジットカード決済
          </p>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{ background: P.dark, padding: "48px 24px 32px" }}>
        <div style={{ maxWidth: 1160, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 32, marginBottom: 40 }}>
            <div>
              <Image
                src="/design/assets/08-brand/logos/logo-yomitoku-main.png"
                alt="ヨミトク"
                width={140}
                height={40}
                style={{ height: 32, width: "auto", filter: "brightness(0) invert(1)", marginBottom: 14 }}
              />
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.45)", lineHeight: 1.85, margin: 0, maxWidth: 360 }}>
                介護保険に関する最新の制度・通知・分科会資料を<br />
                AIが整理してLINEでお届けする情報サービスです。
              </p>
            </div>
            <div style={{ display: "flex", gap: 32 }}>
              {([["ヨミトクLINE", LINE_OA_URL], ["ヨミトクBASE", "/base"], ["ログイン", "/base/login"]] as const).map(([label, href]) => (
                <a key={href} href={href} style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", textDecoration: "none", fontWeight: 600 }}>{label}</a>
              ))}
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 24, textAlign: "center" }}>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.28)", margin: 0 }}>
              © 2025 ヨミトク. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}
