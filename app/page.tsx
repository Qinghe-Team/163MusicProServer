import { fetchLatestRelease } from "@/lib/github";
import styles from "./page.module.css";

export const revalidate = 60;

const FEATURES = [
  {
    icon: "🔍",
    title: "在线搜索",
    desc: "搜索网易云音乐全曲库，支持分页加载",
  },
  {
    icon: "📝",
    title: "歌词同步",
    desc: "在线获取 LRC 歌词，逐行高亮滚动显示",
  },
  {
    icon: "⬇️",
    title: "离线下载",
    desc: "下载歌曲到本地存储，支持断网离线播放",
  },
  {
    icon: "⚡",
    title: "倍速播放",
    desc: "0.1x – 5.0x 自由调速，支持音调不变模式",
  },
  {
    icon: "❤️",
    title: "收藏管理",
    desc: "本地与云端双重收藏，重装自动恢复数据",
  },
  {
    icon: "🛡️",
    title: "后台保活",
    desc: "前台服务 + WakeLock，锁屏不被系统杀死",
  },
];

export default async function HomePage() {
  const result = await fetchLatestRelease();
  const latestRelease = result.ok && result.data.length > 0 ? result.data[0] : null;
  const version = latestRelease?.tag_name ?? null;

  return (
    <div className={styles.page}>
      {/* ── Navigation ── */}
      <nav className={styles.nav}>
        <div className={styles.navInner}>
          <div className={styles.navBrand}>
            <span className={styles.navBrandIcon} aria-hidden="true">♫</span>
            <span className={styles.navBrandName}>163MusicPro</span>
          </div>
          <a
            href="https://github.com/9xhk-1/163MusicPro"
            className={styles.navGithub}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="在 GitHub 上查看源码"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
            </svg>
            GitHub
          </a>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroGlow} aria-hidden="true" />
        <div className={styles.heroInner}>
          <div className={styles.heroBadges}>
            <span className={styles.badge}>适用于小天才电话手表</span>
            {version && (
              <span className={styles.badgeVersion}>{version}</span>
            )}
          </div>
          <h1 className={styles.heroTitle}>163MusicPro</h1>
          <p className={styles.heroTagline}>网易云音乐播放器</p>
          <p className={styles.heroDesc}>
            专为小天才电话手表打造的网易云音乐客户端，直接调用官方 API，
            完整支持在线搜索、歌词同步、离线下载与后台播放，无需任何第三方服务。
          </p>
          <div className={styles.heroCtas}>
            <a href="/download" className={styles.ctaPrimary}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              下载 APK
            </a>
            <a
              href="https://github.com/9xhk-1/163MusicPro"
              className={styles.ctaSecondary}
              target="_blank"
              rel="noopener noreferrer"
            >
              查看源码
            </a>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className={styles.features}>
        <div className={styles.featuresInner}>
          <h2 className={styles.sectionTitle}>功能特性</h2>
          <div className={styles.featureGrid}>
            {FEATURES.map((f) => (
              <div key={f.title} className={styles.featureCard}>
                <span className={styles.featureIcon} aria-hidden="true">{f.icon}</span>
                <h3 className={styles.featureTitle}>{f.title}</h3>
                <p className={styles.featureDesc}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Project Meta ── */}
      <section className={styles.meta}>
        <div className={styles.metaInner}>
          <h2 className={styles.sectionTitle}>项目信息</h2>
          <div className={styles.metaGrid}>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>项目名称</span>
              <span className={styles.metaValue}>163MusicPro</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>当前版本</span>
              <span className={styles.metaValue}>{version ?? "—"}</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>作者</span>
              <span className={styles.metaValue}>
                <a
                  href="https://github.com/9xhk-1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.metaLink}
                >
                  9xhk
                </a>
                <span className={styles.metaSep}>/</span>
                <a
                  href="https://github.com/Qinghe-Team"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.metaLink}
                >
                  Qinghe-Team
                </a>
              </span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>平台</span>
              <span className={styles.metaValue}>Android 6.0+ · 320×360</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>简介</span>
              <span className={styles.metaValue}>适用于小天才电话手表的网易云音乐播放器</span>
            </div>
            <div className={styles.metaItem}>
              <span className={styles.metaLabel}>许可证</span>
              <span className={styles.metaValue}>
                <a
                  href="https://github.com/9xhk-1/163MusicPro/blob/main/LICENSE"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.metaLink}
                >
                  MIT License
                </a>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <p>
            163MusicPro &nbsp;·&nbsp;{" "}
            <a
              href="https://github.com/9xhk-1/163MusicPro"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
            &nbsp;·&nbsp; MIT License
          </p>
        </div>
      </footer>
    </div>
  );
}
