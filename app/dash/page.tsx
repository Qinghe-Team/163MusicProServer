"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import styles from "./dash.module.css";

type DayCount = { day: string; count: number };
type Suggestion = { id: number; content: string; created_at: number };

function authHeaders(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

function formatDateTime(ts: number): string {
  return new Date(ts).toLocaleString("zh-CN");
}

export default function DashboardPage() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);

  // Requests
  const [requests, setRequests] = useState<DayCount[]>([]);
  const [reqLoading, setReqLoading] = useState(false);
  const [reqError, setReqError] = useState("");

  // Suggestions
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [sugTotal, setSugTotal] = useState(0);
  const [sugPage, setSugPage] = useState(0);
  const [sugLoading, setSugLoading] = useState(false);
  const [sugError, setSugError] = useState("");
  const PAGE_SIZE = 10;

  // Auth guard
  useEffect(() => {
    const t = sessionStorage.getItem("dash_token");
    if (!t) {
      router.replace("/dash/login");
    } else {
      setToken(t);
    }
  }, [router]);

  const fetchRequests = useCallback(
    async (t: string) => {
      setReqLoading(true);
      setReqError("");
      try {
        const res = await fetch("/dash/api/requests", { headers: authHeaders(t) });
        const data = await res.json();
        if (data.code === 200) {
          setRequests(data.data);
        } else if (data.code === 401) {
          sessionStorage.removeItem("dash_token");
          router.replace("/dash/login");
        } else {
          setReqError(data.message ?? "Failed to load requests");
        }
      } catch {
        setReqError("Network error");
      } finally {
        setReqLoading(false);
      }
    },
    [router]
  );

  const fetchSuggestions = useCallback(
    async (t: string, page: number) => {
      setSugLoading(true);
      setSugError("");
      try {
        const res = await fetch(
          `/dash/api/suggestions?pageNum=${page}&pageSize=${PAGE_SIZE}`,
          { headers: authHeaders(t) }
        );
        const data = await res.json();
        if (data.code === 200) {
          setSuggestions(data.data.list);
          setSugTotal(data.data.total);
        } else if (data.code === 401) {
          sessionStorage.removeItem("dash_token");
          router.replace("/dash/login");
        } else {
          setSugError(data.message ?? "Failed to load suggestions");
        }
      } catch {
        setSugError("Network error");
      } finally {
        setSugLoading(false);
      }
    },
    [router]
  );

  useEffect(() => {
    if (!token) return;
    fetchRequests(token);
    fetchSuggestions(token, 0);
  }, [token, fetchRequests, fetchSuggestions]);

  function handleLogout() {
    sessionStorage.removeItem("dash_token");
    router.replace("/dash/login");
  }

  function handlePageChange(page: number) {
    if (!token) return;
    setSugPage(page);
    fetchSuggestions(token, page);
  }

  const totalPages = Math.ceil(sugTotal / PAGE_SIZE);

  // Bar chart helpers
  const maxCount = requests.length > 0 ? Math.max(...requests.map((r) => r.count), 1) : 1;
  const todayCount = requests.find(
    (r) => r.day === new Date().toISOString().slice(0, 10)
  )?.count ?? 0;

  if (!token) return null;

  return (
    <div className={styles.page}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <div className={styles.brand}>
            <span className={styles.brandIcon}>♫</span>
            <span className={styles.brandName}>管理面板</span>
          </div>
          <button className={styles.logoutBtn} onClick={handleLogout}>退出</button>
        </div>
      </header>

      <main className={styles.main}>
        {/* Stats row */}
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>今日请求</span>
            <span className={styles.statValue}>{todayCount}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>反馈总数</span>
            <span className={styles.statValue}>{sugTotal}</span>
          </div>
        </div>

        {/* Daily Requests Chart */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>日请求量（近30天）</h2>
            <button
              className={styles.refreshBtn}
              onClick={() => token && fetchRequests(token)}
              disabled={reqLoading}
            >
              {reqLoading ? "加载中…" : "刷新"}
            </button>
          </div>
          {reqError && <p className={styles.errorMsg}>{reqError}</p>}
          {!reqLoading && !reqError && requests.length === 0 && (
            <p className={styles.empty}>暂无请求数据</p>
          )}
          {requests.length > 0 && (
            <div className={styles.chartWrap}>
              <div className={styles.chart}>
                {requests.map((r) => (
                  <div key={r.day} className={styles.barCol}>
                    <span className={styles.barCount}>{r.count}</span>
                    <div
                      className={styles.bar}
                      style={{ height: `${Math.round((r.count / maxCount) * 120)}px` }}
                      title={`${r.day}: ${r.count}`}
                    />
                    <span className={styles.barLabel}>{r.day.slice(5)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Suggestions */}
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>用户反馈（共 {sugTotal} 条）</h2>
            <button
              className={styles.refreshBtn}
              onClick={() => token && fetchSuggestions(token, sugPage)}
              disabled={sugLoading}
            >
              {sugLoading ? "加载中…" : "刷新"}
            </button>
          </div>
          {sugError && <p className={styles.errorMsg}>{sugError}</p>}
          {!sugLoading && !sugError && suggestions.length === 0 && (
            <p className={styles.empty}>暂无反馈</p>
          )}
          {suggestions.length > 0 && (
            <>
              <div className={styles.tableWrap}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.th}>ID</th>
                      <th className={styles.th}>内容</th>
                      <th className={styles.th}>时间</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suggestions.map((s) => (
                      <tr key={s.id} className={styles.tr}>
                        <td className={styles.td}>{s.id}</td>
                        <td className={`${styles.td} ${styles.tdContent}`}>{s.content}</td>
                        <td className={styles.td}>{formatDateTime(s.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination */}
              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <button
                    className={styles.pageBtn}
                    disabled={sugPage === 0}
                    onClick={() => handlePageChange(sugPage - 1)}
                  >
                    上一页
                  </button>
                  <span className={styles.pageInfo}>
                    {sugPage + 1} / {totalPages}
                  </span>
                  <button
                    className={styles.pageBtn}
                    disabled={sugPage >= totalPages - 1}
                    onClick={() => handlePageChange(sugPage + 1)}
                  >
                    下一页
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
