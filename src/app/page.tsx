"use client";
import { useState } from "react";
import styles from "./page.module.css";

const LIFF_URL = `https://liff.line.me/${process.env.NEXT_PUBLIC_LIFF_ID ?? "2010669020-VWbQJE9b"}`;

/* ──────── SVG / Icon components ──────── */
const LogoMark = ({ size = 36 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <path d="M6 5 L17 20 L17 35" stroke="#1B7A6D" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M32 5 L17 20" stroke="#1B7A6D" strokeWidth="4" strokeLinecap="round"/>
    <line x1="9"  y1="10" x2="16" y2="10" stroke="#1B7A6D" strokeWidth="2.5" strokeLinecap="round"/>
    <line x1="8"  y1="15" x2="16" y2="15" stroke="#1B7A6D" strokeWidth="2.5" strokeLinecap="round"/>
    <line x1="7"  y1="20" x2="14" y2="20" stroke="#1B7A6D" strokeWidth="2.5" strokeLinecap="round"/>
  </svg>
);

const LineIcon = ({ size = 20, color = "currentColor" }: { size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.105.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
  </svg>
);

const Check = ({ color = "#1B7A6D" }: { color?: string }) => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
    <circle cx="10" cy="10" r="10" fill={color}/>
    <path d="M5.5 10.5L8.5 13.5L14.5 7.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const Shield = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0 }}>
    <path d="M9 1.5L2.5 4.5v5c0 3.6 2.8 7 6.5 7.5 3.7-.5 6.5-3.9 6.5-7.5v-5L9 1.5z" fill="#1B7A6D" opacity="0.15" stroke="#1B7A6D" strokeWidth="1.4"/>
    <path d="M6 9l2.5 2.5L13 7" stroke="#1B7A6D" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/* ──────── Reusable CTA button ──────── */
const LineBtn = ({ label = "今すぐLINEで登録する", size = "md" }: { label?: string; size?: "sm" | "md" | "lg" }) => (
  <a href={LIFF_URL} className={size === "lg" ? styles.lineBtnLg : size === "sm" ? styles.lineBtnSm : styles.lineBtn}>
    <LineIcon size={size === "lg" ? 24 : 20} color="#fff" />
    {label}
    <span>›</span>
  </a>
);

/* ──────── Phone Mockup ──────── */
const PhoneMock = ({ variant }: { variant: "digest" | "breaking" | "analysis" }) => {
  const c = {
    digest: { badge: "週刊ダイジェスト", badgeBg: "#2D9B8A", date: "6/18（水）",
      title: "今週の介護保険最新情報をまとめました。",
      items: ["高齢者虐待防止の推進について（通知）", "ケアプランデータ連携システムの運用状況について", "介護報酬に関するQ&A（Vol.○○）"],
    },
    breaking: { badge: "速報", badgeBg: "#E05A2B", date: "6/17（火）",
      title: "介護保険最新情報（速報）最新の通知が発出されましたので、お知らせします。",
      items: ["介護報酬改定に関する最新動向", "感染症対策に関する通知", "その他、重要なお知らせ"],
    },
    analysis: { badge: "分科会解説", badgeBg: "#6B5B9E", date: "6/16（月）",
      title: "介護給付費分科会のポイント解説 複雑な議論の内容をわかりやすく解説します。",
      items: ["第236回 介護給付費分科会", "・議題の概要", "・委員の主な意見", "・今後の動向とポイント"],
    },
  }[variant];

  return (
    <div className={styles.phoneMock}>
      <div className={styles.phoneMockFrame}>
        <div className={styles.phoneMockTop}>
          <span className={styles.phoneMockBack}>＜ <span className={styles.phoneYLogo}>Y</span> ヨミトク</span>
          <div className={styles.phoneMockIcons}><span>🔍</span><span>≡</span></div>
        </div>
        <div className={styles.phoneMockBody}>
          <div className={styles.phoneMockDay}>今日</div>
          <div className={styles.phoneMockMsg}>
            <div className={styles.phoneMsgRow}>
              <span className={styles.phoneMsgBadge} style={{ background: c.badgeBg }}>{c.badge}</span>
              <span className={styles.phoneMsgDate}>{c.date}</span>
            </div>
            <p className={styles.phoneMsgTitle}>{c.title}</p>
            {c.items.map((item, i) => (
              <div key={i} className={styles.phoneMsgItem}>
                {variant !== "breaking" && <Check color={c.badgeBg} />}
                <span>{item}</span>
              </div>
            ))}
            <p className={styles.phoneMsgMore}>続きはこちら ▶</p>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ──────── FAQ item with state ──────── */
const FaqItem = ({ q, a }: { q: string; a: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className={styles.faqItem}>
      <button className={styles.faqQ} onClick={() => setOpen(!open)}>
        <span className={styles.faqLabel}>Q</span>
        <span className={styles.faqQText}>{q}</span>
        <span className={`${styles.faqChevron} ${open ? styles.open : ""}`}>▾</span>
      </button>
      {open && (
        <div className={styles.faqA}>
          <span className={styles.faqLabelA}>A</span>
          <p>{a}</p>
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════
   PAGE
══════════════════════════════════════════ */
export default function Page() {
  return (
    <main className={styles.main}>

      {/* ── HEADER ── */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.logo}>
            <LogoMark size={34} />
            <span className={styles.logoName}>ヨミトク</span>
            <span className={styles.logoDivider}>|</span>
            <span className={styles.logoSub}>介護保険最新情報</span>
          </div>
          <LineBtn label="無料で始める" size="sm" />
        </div>
      </header>

      {/* ═══ HERO ═══ */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          {/* Left */}
          <div className={styles.heroLeft}>
            <h1 className={styles.heroH1}>
              制度を味方に、<br />経営をもっと前へ。
            </h1>
            <div className={styles.heroAiBanner}>
              情報収集は、<strong>AI</strong>に任せる時代。
            </div>
            <p className={styles.heroP}>
              経営者なら、<br />
              国の動向は押さえておきたい。
            </p>
            <p className={styles.heroP}>
              でも、<br />
              全部読む<strong className={styles.heroBold}>時間がない。</strong>
            </p>
            <div className={styles.heroIcons}>
              {[
                { icon: "🤖", label: "毎日AIが\nチェック・要約" },
                { icon: "line", label: "LINEで\nタイムリーに届く" },
                { icon: "🏷️", label: "タグ機能で\n必要な情報だけ" },
                { icon: "👥", label: "最大3アカウント\nまで登録可能" },
              ].map((f) => (
                <div key={f.label} className={styles.heroIconItem}>
                  {f.icon === "line"
                    ? <div className={styles.heroIconLine}><LineIcon size={26} color="#06C755" /></div>
                    : <span className={styles.heroIconEmoji}>{f.icon}</span>}
                  <p className={styles.heroIconLabel}>{f.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Right — phone */}
          <div className={styles.heroRight}>
            <div className={styles.heroBadgeCircle}>
              <span>👑</span>
              <span>介護事業の<br />経営者を<br /><strong>強力サポート</strong></span>
            </div>
            <div className={styles.heroPhoneWrap}>
              <div className={styles.heroPhone}>
                <div className={styles.heroPhoneTop}>
                  <span>＜ <span style={{fontWeight:900}}>Y</span> ヨミトク</span>
                  <span>🔍 ≡</span>
                </div>
                <div className={styles.heroPhoneBody}>
                  <div className={styles.heroPhoneDay}>今日</div>
                  <div className={styles.heroPhoneCard}>
                    <div className={styles.heroPhoneRow}>
                      <span className={styles.heroPhoneBadge} style={{ background: "#2D9B8A" }}>週刊ダイジェスト</span>
                      <span className={styles.heroPhoneDate}>6/18（水）</span>
                    </div>
                    <p className={styles.heroPhoneTitle}>今週の介護保険最新情報をまとめました。</p>
                    {["高齢者虐待防止の推進について（通知）", "ケアプランデータ連携システムの運用状況について", "介護報酬に関するQ&A（Vol.○○）"].map((item, i) => (
                      <div key={i} className={styles.heroPhoneItem}><Check color="#2D9B8A" /><span>{item}</span></div>
                    ))}
                    <p className={styles.heroPhoneMore}>続きはこちら ▶</p>
                    <p className={styles.heroPhoneTime}>10:00</p>
                  </div>
                  {/* Bottom tabs */}
                  <div className={styles.heroPhoneTabs}>
                    {[
                      { icon: "📄", label: "週刊ダイジェスト" },
                      { icon: "🔔", label: "速報", badge: "1" },
                      { icon: "👥", label: "分科会解説" },
                    ].map((tab) => (
                      <div key={tab.label} className={styles.heroPhoneTab}>
                        <span className={styles.heroPhoneTabIcon}>{tab.icon}</span>
                        {tab.badge && <span className={styles.heroPhoneTabBadge}>{tab.badge}</span>}
                        <span className={styles.heroPhoneTabLabel}>{tab.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hero CTA bar */}
        <div className={styles.heroCtaBar}>
          <div className={styles.heroCtaLeft}>
            <LineBtn label="LINEで今すぐ登録する" size="lg" />
          </div>
          <div className={styles.heroCtaRight}>
            <span>月額 <strong>300円</strong>（税別）</span>
            <span className={styles.heroCtaDivider}>/</span>
            <span>最大3アカウントまで登録可能</span>
            <span className={styles.heroCtaDivider}>/</span>
            <span>いつでも解約可能</span>
          </div>
        </div>
      </section>

      {/* ═══ PROBLEM + FLOW (2-col on PC) ═══ */}
      <section className={styles.problemFlow}>
        {/* Left — problems */}
        <div className={styles.problemCol}>
          <h2 className={styles.problemTitle}>
            こんな<span>お悩み</span><br />ありませんか？
          </h2>
          <div className={styles.problemList}>
            {[
              { icon: "🤔", title: "通知や制度改正まで手が回らない", desc: "日々の業務で精一杯で、情報収集に時間を割けない。" },
              { icon: "📚", title: "分科会資料や通知が長くて読み切れない", desc: "ボリュームが多く、要点を把握するのに時間がかかる。" },
              { icon: "⚠️", title: "補助金・助成金の情報を見逃してしまう", desc: "公募や申請期限を知らず、活用できるチャンスを逃してしまう。" },
              { icon: "👥", title: "必要な情報をスタッフとスムーズに共有できない", desc: "情報の共有に手間がかかり、現場との認識のズレが生じる。" },
            ].map((item, i) => (
              <div key={i} className={styles.problemItem}>
                <Check />
                <span className={styles.problemEmoji}>{item.icon}</span>
                <div>
                  <p className={styles.problemItemTitle}>{item.title}</p>
                  <p className={styles.problemItemDesc}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — solution flow */}
        <div className={styles.solutionCol}>
          <h2 className={styles.solutionTitle}>
            ヨミトクなら、<span>AI</span>が情報を整理して、<br />
            <span className={styles.solutionUnder}>経営判断に役立つ形</span>でお届けします。
          </h2>
          <div className={styles.solutionSteps}>
            {[
              { badge: "AIが毎日チェック", badgeBg: "#2D9B8A", icon: "🤖",
                desc: "国の公式情報をAIが毎日確認。重要な情報を自動で抽出・要約します。" },
              { badge: "LINEでお届け", badgeBg: "#06C755", icon: "line",
                desc: "必要な情報だけを、LINEでタイムリーにお届け。いつもどこでも確認できます。" },
              { badge: "経営判断に活用", badgeBg: "#1B7A6D", icon: "📈",
                desc: "最新情報をもとに、判断やサービス改善、経営戦略にすぐに活かせます。" },
            ].map((step, i) => (
              <div key={i} className={styles.solutionStep}>
                <div>
                  <span className={styles.solutionBadge} style={{ background: step.badgeBg }}>{step.badge}</span>
                  <div className={styles.solutionIconWrap}>
                    {step.icon === "line"
                      ? <LineIcon size={40} color="#06C755" />
                      : <span className={styles.solutionEmoji}>{step.icon}</span>}
                  </div>
                  <p className={styles.solutionDesc}>{step.desc}</p>
                </div>
                {i < 2 && <div className={styles.solutionArrow}>▶</div>}
              </div>
            ))}
          </div>
          <div className={styles.solutionCallout}>
            <span className={styles.solutionCalloutIcon}>💡</span>
            <div>
              <p className={styles.solutionCalloutH}>情報収集の時間を削減し、<br />本来やるべきことに集中できる環境をつくります。</p>
              <p className={styles.solutionCalloutSub}>制度を味方に、経営をもっと前へ。</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ MESSAGES ═══ */}
      <section className={styles.messages}>
        <div className={styles.container}>
          <h2 className={styles.messagesH2}>
            必要な情報を、<span className={styles.lineGreen}>LINE</span>でわかりやすくお届けします。
          </h2>
          <p className={styles.messagesSub}>
            国の最新情報を、AIが要約・整理。忙しい経営者のために、<strong>重要ポイント</strong>をギュッと凝縮してお届けします。
          </p>
          <div className={styles.messagesCols}>
            {[
              { variant: "digest" as const, badge: "週刊ダイジェスト", badgeBg: "#1B7A6D", icon: "📄",
                subtitle: "週に1回、重要な情報をまとめてお届け",
                desc: "1週間の動きをまとめて把握。重要ポイントを見逃しません。" },
              { variant: "breaking" as const, badge: "速報", badgeBg: "#1B7A6D", icon: "🔔",
                subtitle: "重要な情報をいち早くお知らせ",
                desc: "新しい通知や制度の動きなど、速報性の高い情報をすぐにお届けします。" },
              { variant: "analysis" as const, badge: "分科会解説", badgeBg: "#1B7A6D", icon: "👥",
                subtitle: "分科会の議論をわかりやすく解説",
                desc: "専門的で難しい内容も、要点を整理してわかりやすくお届けします。" },
            ].map((col) => (
              <div key={col.badge} className={styles.messagesCol}>
                <div className={styles.messagesColHeader} style={{ background: col.badgeBg }}>{col.badge}</div>
                <div className={styles.messagesColBody}>
                  <div className={styles.messagesColLeft}>
                    <div className={styles.messagesColIcon}>{col.icon}</div>
                    <p className={styles.messagesColSubtitle}>{col.subtitle}</p>
                    <p className={styles.messagesColDesc}>{col.desc}</p>
                  </div>
                  <PhoneMock variant={col.variant} />
                </div>
              </div>
            ))}
          </div>

          {/* AI summary strip */}
          <div className={styles.messagesAiStrip}>
            <div className={styles.messagesAiLeft}>
              <span className={styles.messagesAiIcon}>💡</span>
              <div>
                <p className={styles.messagesAiTitle}>AIがポイントを要約・整理！</p>
                <p className={styles.messagesAiDesc}>長文の通知や資料も、AIが重要ポイントを抽出して要約。「何が変わるのか？」「自社にどう影響するのか？」が一目でわかります。</p>
              </div>
            </div>
            <div className={styles.messagesAiFlow}>
              {[
                { icon: "📄", label: "元の情報（例）", sub: "長文の通知や分科会資料" },
                { icon: "🤖", label: "AIが要約・整理", sub: "重要ポイントを抽出・要約" },
                { icon: "📋", label: "わかりやすくお届け", sub: "ポイントが整理された情報をLINEでお届け" },
              ].map((step, i) => (
                <div key={i} className={styles.messagesAiStep}>
                  <div className={styles.messagesAiStepIcon}>{step.icon}</div>
                  {i < 2 && <div className={styles.messagesAiArrow}>▶</div>}
                  <p className={styles.messagesAiStepLabel}>{step.label}</p>
                  <p className={styles.messagesAiStepSub}>{step.sub}</p>
                </div>
              ))}
            </div>
          </div>
          <p className={styles.messagesTagline}>
            ╲ 毎日の情報収集を、もっとラクに、もっと確実に。<strong>ヨミトク</strong>があなたの経営をサポートします。 ╱
          </p>
        </div>
      </section>

      {/* ═══ TAGS ═══ */}
      <section className={styles.tags}>
        <div className={styles.container}>
          <h2 className={styles.tagsH2}>
            タグ機能で、自分に<span className={styles.teal}>必要な情報だけ</span>を受け取れる。
          </h2>
          <p className={styles.tagsSub}>
            事業所の種類や関心のあるテーマをタグで登録するだけ。<br />
            <span className={styles.teal}>AI</span>があなたに<strong>最適な情報</strong>を選別してお届けします。
          </p>
          <div className={styles.tagsLayout}>
            {/* Left — phone */}
            <div className={styles.tagsLeft}>
              <div className={styles.tagsSimple}>
                <div className={styles.tagsSimpleIcon}>🏷️</div>
                <p className={styles.tagsSimpleTitle}>選ぶだけの簡単設定</p>
                <p className={styles.tagsSimpleDesc}>タグはいつでも追加・変更可能。関心の変化にも柔軟に対応します。</p>
              </div>
              <div className={styles.tagsPhoneFrame}>
                <div className={styles.tagsPhoneTop}>
                  <span>＜ <span style={{fontWeight:900}}>Y</span> ヨミトク</span>
                  <span>🔍 ≡</span>
                </div>
                <div className={styles.tagsPhoneBody}>
                  <p className={styles.tagsPhoneLabel}>タグ設定</p>
                  <p className={styles.tagsPhoneSubLabel}>興味のある分野を選択してください。<br />選択したタグに関連する情報をお届けします。</p>
                  <p className={styles.tagsPhoneSec}>事業所の種類（複数選択可）</p>
                  <div className={styles.tagsPhoneChips}>
                    {["デイサービス", "訪問介護", "訪問看護", "居宅介護支援", "グループホーム", "有料老人ホーム", "その他"].map((t, i) => (
                      <span key={t} className={`${styles.tagsPhoneChip} ${i < 6 ? styles.tagsPhipeChecked : ""}`}>{i < 6 ? "✓ " : ""}{t}</span>
                    ))}
                  </div>
                  <p className={styles.tagsPhoneSec}>関心のあるテーマ（複数選択可）</p>
                  <div className={styles.tagsPhoneChips}>
                    {["制度改正・通知", "報酬改定", "運営・管理", "人材・採用", "IT・DX", "経営・財務", "補助金・助成金", "イベント・研修"].map((t, i) => (
                      <span key={t} className={`${styles.tagsPhoneChip} ${i < 6 ? styles.tagsPhipeChecked : ""}`}>{i < 6 ? "✓ " : ""}{t}</span>
                    ))}
                  </div>
                  <div className={styles.tagsPhoneSaveBtn}>保存する</div>
                </div>
              </div>
            </div>

            {/* Center — tag table */}
            <div className={styles.tagsCenterWrap}>
              <div className={styles.tagsCenterLabel}>タグの一例</div>
              <div className={styles.tagsTable}>
                <div className={styles.tagsTableCol}>
                  <div className={styles.tagsTableHeader}>事業所の種類</div>
                  {["デイサービス", "訪問介護", "訪問看護", "居宅介護支援", "グループホーム", "有料老人ホーム", "その他"].map((t) => (
                    <div key={t} className={styles.tagsTableRow}><span>👤</span>{t}</div>
                  ))}
                </div>
                <div className={styles.tagsTableCol}>
                  <div className={styles.tagsTableHeader}>関心のあるテーマ</div>
                  {["制度改正・通知", "報酬改定", "運営・管理", "人材・採用", "IT・DX", "経営・財務", "補助金・助成金", "イベント・研修", "その他"].map((t) => (
                    <div key={t} className={styles.tagsTableRow}><span>📋</span>{t}</div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right — AI features */}
            <div className={styles.tagsRight}>
              <p className={styles.tagsRightTitle}>AIがあなたに最適な情報を選別！</p>
              {[
                { icon: "🤖", title: "AIが毎日チェック・分析", desc: "国の公式情報をAIが毎日確認し、あなたのタグに関連する情報を抽出。" },
                { icon: "📋", title: "重要度を判定して整理", desc: "影響度や優先度をAIが判定。必要な情報をわかりやすく整理します。" },
                { icon: "line", title: "LINEで必要な情報だけ届く", desc: "あなたに必要な情報だけを厳選して、LINEでタイムリーにお届けします。" },
              ].map((f) => (
                <div key={f.title} className={styles.tagsRightItem}>
                  <div className={styles.tagsRightIcon}>
                    {f.icon === "line" ? <LineIcon size={28} color="#06C755" /> : <span>{f.icon}</span>}
                  </div>
                  <div>
                    <p className={styles.tagsRightItemTitle}>{f.title}</p>
                    <p className={styles.tagsRightItemDesc}>{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom strip */}
          <div className={styles.tagsBottomStrip}>
            <div className={styles.tagsBottomLeft}>
              <span>💡</span>
              <div>
                <p className={styles.tagsBottomTitle}>情報のムダをなくし、<br />大事な情報を見逃さない。</p>
                <p className={styles.tagsBottomDesc}>必要な情報を必要なタイミングで受け取ることで、経営判断のスピードと質を高めます。</p>
              </div>
            </div>
            <div className={styles.tagsBottomFlow}>
              {[
                { icon: "👔", label: "タグを選んで登録" },
                { icon: "🤖", label: "AIが情報を分析・選別" },
                { icon: "line", label: "LINEでお届け" },
                { icon: "📈", label: "経営判断・現場改善へ" },
              ].map((step, i) => (
                <div key={i} className={styles.tagsBottomStep}>
                  <div className={styles.tagsBottomStepIcon}>
                    {step.icon === "line" ? <LineIcon size={22} color="#06C755" /> : <span>{step.icon}</span>}
                  </div>
                  {i < 3 && <div className={styles.tagsBottomArr}>▶</div>}
                  <p className={styles.tagsBottomStepLabel}>{step.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ TRUST + SOURCES ═══ */}
      <section className={styles.trust}>
        <div className={styles.trustGrid}>
          {/* Left */}
          <div className={styles.trustLeft}>
            <div className={styles.trustPhoneWrap}>
              <PhoneMock variant="digest" />
            </div>
            <h2 className={styles.trustH2}>
              信頼できる情報源から、<br /><span className={styles.teal}>正確な情報</span>をお届けします。
            </h2>
            <p className={styles.trustSub}>国の公式情報をもとに、AIが毎日チェック。<br />信頼できる情報だけを、わかりやすく整理してお届けします。</p>
            <div className={styles.trustBullets}>
              {[
                { icon: "🛡️", title: "信頼できる情報源のみを使用", desc: "公的機関の公式情報を中心に収集。" },
                { icon: "🤖", title: "AIが毎日チェック", desc: "重要な情報を見逃さず、素早く要約。" },
                { icon: "❤️", title: "わかりやすく整理してお届け", desc: "難しい内容も、要点をまとめて配信。" },
              ].map((b) => (
                <div key={b.title} className={styles.trustBullet}>
                  <span className={styles.trustBulletIcon}>{b.icon}</span>
                  <div>
                    <p className={styles.trustBulletTitle}>{b.title}</p>
                    <p className={styles.trustBulletDesc}>{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right */}
          <div className={styles.trustRight}>
            <div className={styles.trustSourcesBadge}>主な情報源</div>
            <div className={styles.trustSourceCards}>
              <div className={styles.trustSourceCard}>
                <div className={styles.trustSourceNum}>1</div>
                <div>
                  <h3>社会保障審議会<br />（介護給付費分科会）</h3>
                  <div className={styles.trustSourceImg}>🏛️ 政府審議会議室</div>
                  <p>介護保険制度の見直しや報酬改定などを審議する会議の最新情報をお届けします。</p>
                </div>
              </div>
              <div className={styles.trustSourceCard}>
                <div className={styles.trustSourceNum}>2</div>
                <div>
                  <h3>介護保険最新情報<br />（厚生労働省）</h3>
                  <div className={styles.trustSourceImg}>🏢 厚生労働省</div>
                  <p>厚生労働省が発出する通知やQ&Aなど、現場に直結する最新情報をお届けします。</p>
                </div>
              </div>
            </div>
            <div className={styles.trustAiFlow}>
              <p className={styles.trustAiFlowTitle}>AIが毎日情報をチェック！</p>
              <p className={styles.trustAiFlowSub}>あなたに関係のある重要な情報だけを、もれなくお届けします。</p>
              <div className={styles.trustAiSteps}>
                {[
                  { icon: "🏛️", label: "国の公式情報" },
                  { icon: "🤖", label: "AIが要約・整理" },
                  { icon: "line", label: "でお届け" },
                ].map((s, i) => (
                  <div key={i} className={styles.trustAiStep}>
                    <div className={styles.trustAiIcon}>
                      {s.icon === "line" ? <LineIcon size={24} color="#06C755" /> : <span>{s.icon}</span>}
                    </div>
                    {i < 2 && <div className={styles.trustAiArr}>▶</div>}
                    <p className={styles.trustAiLabel}>{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ PRICING + FAQ (2-col) ═══ */}
      <section className={styles.pricingFaq}>
        {/* Left — pricing */}
        <div className={styles.pricingCol}>
          <div className={styles.pricingCard}>
            <div className={styles.pricingCardBadge}>ご利用料金</div>
            <div className={styles.pricingCardBody}>
              <div className={styles.priceNum}>
                月額 <span className={styles.price300}>300</span>円
                <span className={styles.priceTax}>（税別）</span>
              </div>
              <p className={styles.priceNote}>シンプルな料金で、<br />必要な情報をしっかりサポートします。</p>
            </div>
            <div className={styles.pricingFeatures}>
              {["LINEでお届け", "最大3アカウントまで登録可能", "タグ機能で必要な情報だけ受信", "いつでも解約可能"].map((f) => (
                <div key={f} className={styles.pricingFeatureRow}><Check /><span>{f}</span></div>
              ))}
            </div>
            <div className={styles.pricingLinePhone}>
              <div className={styles.pricingLinePhoneFrame}>
                <LineIcon size={40} color="#06C755" />
              </div>
            </div>
          </div>
          <div className={styles.accountStrip}>
            <span className={styles.accountStripIcon}>👥</span>
            <div className={styles.accountStripText}>
              <p className={styles.accountStripTitle}>最大3アカウントまで登録可能</p>
              <p className={styles.accountStripDesc}>経営者・管理者・生活相談員など、必要な方に同じ情報を共有できます。</p>
            </div>
            <div className={styles.accountAvatars}>
              {[{ e: "👔", l: "経営者" }, { e: "👩‍⚕️", l: "管理者" }, { e: "👨‍⚕️", l: "生活相談員" }].map((a) => (
                <div key={a.l} className={styles.accountAvatar}>
                  <span>{a.e}</span><p>{a.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right — FAQ + Final CTA */}
        <div className={styles.faqCol}>
          <h2 className={styles.faqTitle}><span className={styles.faqQMark}>?</span> よくあるご質問</h2>
          <div className={styles.faqList}>
            {[
              { q: "解約はできますか？", a: "はい、いつでも解約可能です。違約金はかかりません。" },
              { q: "どんな情報が届きますか？", a: "介護保険制度の改定や通知、分科会の最新動向、補助金情報などをわかりやすく要約してお届けします。" },
              { q: "どんな人が登録できますか？", a: "介護事業所の経営者・管理者・現場スタッフなど、どなたでもご登録いただけます。" },
              { q: "速報はありますか？", a: "はい。重要な通知や法改正の情報は、いち早く「速報」としてお届けします。" },
              { q: "LINEは何人まで登録できますか？", a: "最大3アカウントまでご登録いただけます。同じ情報を共有できます。" },
            ].map((item) => (
              <FaqItem key={item.q} q={item.q} a={item.a} />
            ))}
          </div>

          {/* Final CTA (inside FAQ column) */}
          <div className={styles.finalCta}>
            <div className={styles.finalCtaBadge}>
              <span>たった</span>
              <strong>1分で</strong>
              <span>登録完了！</span>
            </div>
            <div className={styles.finalCtaContent}>
              <p className={styles.finalCtaTitle}>LINEで簡単登録！</p>
              <LineBtn label="今すぐ始める！" size="lg" />
              <p className={styles.finalCtaSub}>QRコードを読み取ってLINEで登録するだけ！</p>
            </div>
            <div className={styles.finalQrPlaceholder}>
              <LineIcon size={32} color="#06C755" />
              <p>QR</p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerLeft}>
            <div className={styles.footerLogo}>
              <LogoMark size={28} />
              <div>
                <div className={styles.footerLogoName}>株式会社ONZiii Act</div>
              </div>
            </div>
          </div>
          <div className={styles.footerCenter}>
            <p>📍 〒446-0076 愛知県安城市美園町1-23-1</p>
            <p>📞 TEL：0566-91-0257</p>
            <p>✉ Mail：onziii.project@gmail.com</p>
          </div>
          <div className={styles.footerRight}>
            <p>ご不明な点がございましたら、<br />お気軽にお問い合わせください。</p>
            <div className={styles.footerLinks}>
              <a href="/legal/terms">利用規約</a>
              <a href="/legal/privacy">プライバシーポリシー</a>
              <a href="/legal/commercial">特定商取引法</a>
            </div>
          </div>
        </div>
        <p className={styles.footerCopy}>© 2025 株式会社ONZiii Act</p>
      </footer>
    </main>
  );
}
