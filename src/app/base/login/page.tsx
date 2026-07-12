"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "ログインに失敗しました");
      setLoading(false);
      return;
    }
    router.push("/base");
  }

  return (
    <div className="min-h-screen bg-[#E8F5F2] flex flex-col">
      <div className="flex-1 flex items-center justify-center p-5 lg:p-8">
        <div className="w-full max-w-5xl flex flex-col-reverse lg:flex-row gap-8 lg:gap-16 items-center">

          {/* ── Left: Branding ── */}
          <div className="flex-1 w-full">
            {/* Logo */}
            <div className="flex items-center gap-2.5 mb-10">
              <div className="w-10 h-10 bg-[#1B5E52] rounded-xl flex items-center justify-center shadow">
                <span className="text-white font-black text-xl leading-none">Y</span>
              </div>
              <div>
                <div className="text-[#1B5E52] font-black text-xl leading-tight tracking-tight">ヨミトク BASE</div>
                <div className="text-[#6B9E96] text-[11px] leading-none mt-0.5">介護保険情報の知識基地</div>
              </div>
            </div>

            {/* Hero */}
            <h1 className="text-[2.6rem] font-black text-[#1B3D35] leading-[1.2] tracking-wide mb-4">
              必要な情報を、<br />必要な時に。
            </h1>
            <p className="text-[#4A7A70] text-sm leading-relaxed mb-8">
              介護保険に関する最新情報を、<br />AIがわかりやすく整理してお届けします。
            </p>

            {/* Illustration */}
            <div className="w-full rounded-2xl overflow-hidden mb-8 bg-[#C8E8E1] flex items-end justify-center pt-6" style={{ minHeight: 200 }}>
              {/* People illustration – SVG placeholder */}
              <svg viewBox="0 0 420 200" className="w-full max-w-md" fill="none" xmlns="http://www.w3.org/2000/svg">
                {/* desk */}
                <rect x="60" y="148" width="300" height="8" rx="4" fill="#8EC8BE"/>
                {/* laptop */}
                <rect x="160" y="108" width="100" height="40" rx="4" fill="#fff" opacity="0.8"/>
                <rect x="150" y="146" width="120" height="4" rx="2" fill="#8EC8BE"/>
                {/* screen lines */}
                <rect x="168" y="116" width="60" height="4" rx="2" fill="#C8E8E1"/>
                <rect x="168" y="124" width="40" height="4" rx="2" fill="#C8E8E1"/>
                <rect x="168" y="132" width="50" height="4" rx="2" fill="#C8E8E1"/>
                {/* Person 1 (left, standing) */}
                <circle cx="110" cy="64" r="22" fill="#A8D5CB"/>
                <rect x="88" y="90" width="44" height="58" rx="10" fill="#5A9E90"/>
                {/* Person 2 (center) */}
                <circle cx="210" cy="68" r="20" fill="#8EC8BE"/>
                <rect x="190" y="92" width="40" height="56" rx="10" fill="#3D8A7C"/>
                {/* Person 3 (right) */}
                <circle cx="300" cy="60" r="24" fill="#B8DDD8"/>
                <rect x="276" y="88" width="48" height="60" rx="10" fill="#6AADA0"/>
                {/* document icons */}
                <rect x="320" y="30" width="28" height="36" rx="4" fill="#fff" opacity="0.7"/>
                <rect x="326" y="38" width="16" height="2" rx="1" fill="#8EC8BE"/>
                <rect x="326" y="43" width="12" height="2" rx="1" fill="#8EC8BE"/>
                <rect x="326" y="48" width="14" height="2" rx="1" fill="#8EC8BE"/>
                {/* plus decorations */}
                <text x="72" y="36" fontSize="14" fill="#8EC8BE" opacity="0.6">+</text>
                <text x="350" y="80" fontSize="14" fill="#8EC8BE" opacity="0.6">+</text>
                <text x="140" y="20" fontSize="14" fill="#8EC8BE" opacity="0.6">+</text>
              </svg>
            </div>

            {/* Features */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: "🔔", title: "最新情報を受け取る", desc: "介護保険の最新情報をLINEでお知らせ" },
                { icon: "🔍", title: "探して見つかる", desc: "過去の情報も簡単検索ですぐに見つかる♪" },
                { icon: "🔖", title: "保存して活用", desc: "気になる情報を保存してあとで確認できる" },
              ].map((f) => (
                <div key={f.title} className="text-center">
                  <div className="text-[#1B7A6D] font-bold text-xs mb-1">
                    <span className="mr-1">{f.icon}</span>{f.title}
                  </div>
                  <div className="text-[#6B9E96] text-[11px] leading-relaxed">{f.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: Login form ── */}
          <div className="w-full lg:w-[420px] bg-white rounded-3xl shadow-sm border border-white/60 p-8 lg:p-10">
            <h2 className="text-[1.75rem] font-black text-center text-[#1a1a1a] mb-1">ログイン</h2>
            <p className="text-[#999] text-sm text-center mb-8">ヨミトクBASEにログインします</p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-[#1a1a1a] mb-2">メールアドレス</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#bbb] text-base">✉</span>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    placeholder="例）yomitoku@example.com"
                    className="w-full pl-10 pr-4 py-3.5 border border-[#E0E0E0] rounded-xl text-sm text-[#1a1a1a] placeholder-[#ccc] outline-none focus:border-[#1B7A6D] focus:ring-2 focus:ring-[#1B7A6D]/10 transition"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-[#1a1a1a] mb-2">パスワード</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#bbb] text-base">🔒</span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    placeholder="パスワードを入力してください"
                    className="w-full pl-10 pr-12 py-3.5 border border-[#E0E0E0] rounded-xl text-sm text-[#1a1a1a] placeholder-[#ccc] outline-none focus:border-[#1B7A6D] focus:ring-2 focus:ring-[#1B7A6D]/10 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#bbb] hover:text-[#888] transition text-base"
                  >
                    {showPassword ? "🙈" : "👁"}
                  </button>
                </div>
              </div>

              {/* Remember me + Forgot */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-[#555] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-[#ccc] accent-[#1B5E52]"
                  />
                  ログインしたままにする
                </label>
                <a href="#" className="text-sm text-[#1B7A6D] font-semibold hover:underline">
                  パスワードをお忘れの方
                </a>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700">
                  {error}
                </div>
              )}

              {/* Login button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1B5E52] hover:bg-[#164e44] disabled:bg-gray-300 text-white font-bold py-4 rounded-xl text-base transition cursor-pointer disabled:cursor-not-allowed"
              >
                {loading ? "ログイン中..." : "ログイン"}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px bg-[#eee]" />
                <span className="text-[#bbb] text-xs">または</span>
                <div className="flex-1 h-px bg-[#eee]" />
              </div>

              {/* LINE login */}
              <button
                type="button"
                className="w-full border-2 border-[#06C755] text-[#06C755] hover:bg-[#06C755]/5 font-bold py-3.5 rounded-xl text-sm flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#06C755"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.281.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>
                LINEでログイン
              </button>

              <p className="text-center text-sm text-[#888]">
                アカウントをお持ちでない方は{" "}
                <a href="/register" className="text-[#1B7A6D] font-semibold hover:underline">こちら</a>
              </p>
            </form>
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="py-5 border-t border-[#C8E8E1]">
        <div className="flex justify-center gap-6 mb-2">
          {[
            { label: "利用規約", href: "/legal/terms" },
            { label: "プライバシーポリシー", href: "/legal/privacy" },
            { label: "特定商取引法に基づく表記", href: "/legal/commercial" },
          ].map(l => (
            <a key={l.label} href={l.href} className="text-xs text-[#888] hover:text-[#1B7A6D] transition">
              {l.label}
            </a>
          ))}
        </div>
        <p className="text-center text-xs text-[#aaa]">© 2025 ONZiii Act Inc.</p>
      </footer>
    </div>
  );
}
