// Server Component — no 'use client'
import Spline from "@splinetool/react-spline/next";
import Link from "next/link";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <main className="login-main">

      {/* ── LEFT — Spline (hidden on mobile, shown on desktop) ─────── */}
      <div className="login-left">
        <div className="spline-bg">
          <Spline
            scene="https://prod.spline.design/a8FoXQJ3PKw-KVEN/scene.splinecode"
          />
        </div>

        {/* Gradient fade right edge */}
        <div className="login-left-fade" />

        {/* Spline watermark cover */}
        <div className="wm-br" />

        {/* Brand back link */}
        <Link href="/" className="login-brand animate-fade-in-down delay-100">
          <span className="animate-pulse-dot" style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(255,255,255,0.5)", display: "inline-block" }} />
          <span className="label-elegant">AI · DMS</span>
        </Link>

        {/* Tagline */}
        <div className="login-tagline-box">
          <p className="animate-letter-spacing delay-500 label-elegant login-tagline-eyebrow">
            Secure · Intelligent · Always On
          </p>
          <h3 className="animate-fade-in-down delay-600 text-shimmer login-tagline-h3">
            Your safety dashboard
            <br />
            <em style={{ fontStyle: "italic", fontWeight: 400 }}>awaits you.</em>
          </h3>
          <p className="animate-fade-in-up delay-800 login-tagline-p">
            Real-time AI monitoring.
            <br />
            Drive smarter. Stay safer.
          </p>
        </div>
      </div>

      {/* ── RIGHT — Form panel ─────────────────────────────────────── */}
      <LoginForm />

    </main>
  );
}
