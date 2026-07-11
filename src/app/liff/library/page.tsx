"use client";

import { useEffect, useState, useCallback } from "react";
import styles from "./page.module.css";
import { TAGS_BY_CATEGORY } from "@/lib/anthropic";

interface Doc {
  id: string;
  title: string;
  summary: string | null;
  tags: string[];
  importance: string;
  publishedAt: string | null;
  url: string;
  source: string;
  createdAt: string;
}

const MONTHS = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2];

export default function LibraryPage() {
  const [status, setStatus] = useState<"loading" | "unauth" | "ready" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const [docs, setDocs] = useState<Doc[]>([]);
  const [total, setTotal] = useState(0);
  const [fetching, setFetching] = useState(false);

  const [keyword, setKeyword] = useState("");
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [year, setYear] = useState<number>(CURRENT_YEAR);
  const [month, setMonth] = useState<number | null>(null);
  const [showTagFilter, setShowTagFilter] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const liff = (await import("@line/liff")).default;
        const liffId = process.env.NEXT_PUBLIC_LIFF_LIBRARY_ID ?? process.env.NEXT_PUBLIC_LIFF_ID!;
        await liff.init({ liffId });

        if (!liff.isLoggedIn()) {
          liff.login();
          return;
        }

        const token = liff.getAccessToken();
        if (!token) throw new Error("アクセストークンが取得できませんでした");

        const res = await fetch("/api/liff/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        if (!res.ok) {
          if (!cancelled) setStatus("unauth");
          return;
        }

        if (!cancelled) {
          setAccessToken(token);
          setStatus("ready");
        }
      } catch (e) {
        if (!cancelled) {
          setErrorMsg(String(e));
          setStatus("error");
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const search = useCallback(async (token: string) => {
    setFetching(true);
    try {
      const params = new URLSearchParams();
      if (keyword.trim()) params.set("q", keyword.trim());
      if (selectedTags.size > 0) params.set("tags", [...selectedTags].join(","));
      params.set("year", String(year));
      if (month !== null) params.set("month", String(month));

      const res = await fetch(`/api/liff/documents?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setDocs(data.docs ?? []);
      setTotal(data.total ?? 0);
    } catch (e) {
      console.error(e);
    } finally {
      setFetching(false);
    }
  }, [keyword, selectedTags, year, month]);

  useEffect(() => {
    if (status === "ready" && accessToken) {
      search(accessToken);
    }
  }, [status, accessToken, search]);

  function toggleTag(tag: string) {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      next.has(tag) ? next.delete(tag) : next.add(tag);
      return next;
    });
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (accessToken) search(accessToken);
  }

  function formatDate(date: string | null) {
    if (!date) return "";
    return new Date(date).toLocaleDateString("ja-JP", { year: "numeric", month: "short", day: "numeric" });
  }

  if (status === "loading") {
    return (
      <div className={styles.center}>
        <div className={styles.spinner} />
        <p>読み込み中...</p>
      </div>
    );
  }

  if (status === "unauth") {
    return (
      <div className={styles.center}>
        <div className={styles.unauthIcon}>🔒</div>
        <h2>会員限定ページ</h2>
        <p>ヨミトクに登録済みのLINEアカウントでのみ閲覧できます。</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className={styles.center}>
        <p className={styles.errorText}>エラーが発生しました</p>
        <p className={styles.errorDetail}>{errorMsg}</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.headerTitle}>📚 資料ライブラリ</h1>
        <p className={styles.headerSub}>介護保険最新情報のアーカイブ</p>
      </div>

      {/* Search form */}
      <form className={styles.searchForm} onSubmit={handleSearch}>
        <div className={styles.searchBar}>
          <input
            type="search"
            className={styles.searchInput}
            placeholder="キーワードで検索..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <button type="submit" className={styles.searchBtn}>検索</button>
        </div>

        {/* Date filter */}
        <div className={styles.dateFilter}>
          <select
            className={styles.select}
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {YEARS.map((y) => (
              <option key={y} value={y}>{y}年</option>
            ))}
          </select>
          <select
            className={styles.select}
            value={month ?? ""}
            onChange={(e) => setMonth(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">全月</option>
            {MONTHS.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>

        {/* Tag filter toggle */}
        <button
          type="button"
          className={styles.tagToggle}
          onClick={() => setShowTagFilter((v) => !v)}
        >
          🏷️ タグで絞り込む
          {selectedTags.size > 0 && (
            <span className={styles.tagCount}>{selectedTags.size}</span>
          )}
          <span>{showTagFilter ? " ▲" : " ▼"}</span>
        </button>

        {showTagFilter && (
          <div className={styles.tagPanel}>
            {Object.entries(TAGS_BY_CATEGORY).map(([category, tags]) => (
              <div key={category} className={styles.tagGroup}>
                <p className={styles.tagGroupLabel}>{category}</p>
                <div className={styles.tagList}>
                  {tags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className={`${styles.tagChip} ${selectedTags.has(tag) ? styles.tagChipActive : ""}`}
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </form>

      {/* Results */}
      <div className={styles.results}>
        <p className={styles.resultCount}>
          {fetching ? "検索中..." : `${total}件の資料`}
        </p>

        {docs.map((doc) => (
          <a
            key={doc.id}
            href={doc.url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.docCard}
          >
            <div className={styles.docCardTop}>
              <span className={styles.docSource}>
                {doc.source === "shingi" ? "🏛️ 分科会" : "📋 最新情報"}
              </span>
              {doc.importance === "high" && (
                <span className={styles.docImportant}>⚠️ 重要</span>
              )}
              <span className={styles.docDate}>{formatDate(doc.publishedAt)}</span>
            </div>
            <h3 className={styles.docTitle}>{doc.title}</h3>
            {doc.summary && (
              <p className={styles.docSummary}>{doc.summary}</p>
            )}
            <div className={styles.docTags}>
              {doc.tags.slice(0, 4).map((tag) => (
                <span key={tag} className={styles.docTag}>{tag}</span>
              ))}
            </div>
          </a>
        ))}

        {!fetching && docs.length === 0 && (
          <div className={styles.empty}>
            <p>該当する資料が見つかりませんでした</p>
            <p className={styles.emptySub}>条件を変えて検索してみてください</p>
          </div>
        )}
      </div>
    </div>
  );
}
