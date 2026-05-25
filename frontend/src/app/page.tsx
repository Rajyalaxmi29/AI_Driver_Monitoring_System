import Link from "next/link";
import Spline from "@splinetool/react-spline/next";

export default function Home() {
  return (
    <main className="home-main">

      {/* ── Spline 3D Car – full screen background ─────────────────── */}
      <div className="spline-bg">
        <Spline
          scene="https://prod.spline.design/pszJP-lA66pylPCC/scene.splinecode"
        />
      </div>

      {/* ── Dark vignette for text legibility (left on desktop, full on mobile) */}
      <div className="home-vignette" />

      {/* ── Watermark covers ───────────────────────────────────────── */}
      <div className="wm-br" />
      <div className="wm-bl" />

      {/* ── Top nav ────────────────────────────────────────────────── */}
      <header className="home-header animate-fade-in-down delay-100">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span className="animate-pulse-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(255,255,255,0.5)", display: "inline-block" }} />
          <span className="label-elegant">AI · DMS</span>
        </div>
        <nav className="home-nav">
          {["Features", "Technology", "Analytics", "Contact"].map((item) => (
            <a key={item} href="#" className="label-elegant home-nav-link">{item}</a>
          ))}
        </nav>
      </header>

      {/* ── Hero text ──────────────────────────────────────────────── */}
      <section className="home-hero">

        <p className="animate-letter-spacing delay-300 label-elegant home-eyebrow">
          Intelligent Safety · Real-Time Vision
        </p>

        <span className="animate-line-grow delay-400 home-line" />

        <h1 className="animate-fade-in-down delay-500 text-shimmer home-h1">
          Where Intelligence
          <br />
          <em style={{ fontStyle: "italic", fontWeight: 400 }}>Meets the Road.</em>
        </h1>

        <p className="animate-fade-in-up delay-700 home-tagline">
          Every journey. Every heartbeat. Perfectly monitored.
          <br />
          <span style={{ color: "rgba(255,255,255,0.18)" }}>
            Precision AI. Engineered for life at speed.
          </span>
        </p>

        <div className="animate-fade-in delay-1000 home-cta">
          <Link href="/login" className="home-btn-primary">
            Start Monitoring
          </Link>
          <a href="#" className="label-elegant home-btn-ghost">
            View Analytics →
          </a>
        </div>

        <div className="animate-fade-in delay-1200 home-stats">
          {[
            { value: "99.8%", label: "Accuracy" },
            { value: "<10ms", label: "Latency" },
            { value: "24/7",  label: "Monitoring" },
          ].map(({ value, label }) => (
            <div key={label} className="home-stat">
              <span className="home-stat-value">{value}</span>
              <span className="label-elegant home-stat-label">{label}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
