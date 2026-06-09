"use client";

import { useState, useEffect } from "react";


const IconImg = ({ src }: { src: string }) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img src={src} alt="icon" style={{ width: 36, height: 36, objectFit: "contain" }} />
);

const ITEMS = [
  { icon: <IconImg src="/inspection_images/car-insurance.png" />, title: "Drive Responsibly",       desc: "I pledge to follow all traffic rules and drive with care at all times.",              color: "#5BBFEA" },
  { icon: <IconImg src="/inspection_images/no-phone.png" />,      title: "No Phone While Driving",   desc: "I will keep my phone away and avoid all distractions while driving.",                color: "#5BBFEA" },
  { icon: <IconImg src="/inspection_images/coffee-break.png" />,  title: "Take Breaks If Tired",     desc: "I will pull over and rest whenever I feel drowsy or fatigued.",                      color: "#5BBFEA" },
  { icon: <IconImg src="/inspection_images/seat-belt (1).png" />, title: "Seat Belt Fastened",       desc: "My seat belt is securely fastened before the vehicle starts moving.",                color: "#5BBFEA" },
  { icon: <IconImg src="/inspection_images/rear-mirror.png" />,   title: "Adjust Mirrors",            desc: "Rear-view and side mirrors are adjusted for maximum visibility.",                    color: "#5BBFEA" },
  { icon: <IconImg src="/inspection_images/seat-belt.png" />,     title: "Proper Seating Position",  desc: "Seated upright with both hands comfortably on the steering wheel.",                  color: "#5BBFEA" },
  { icon: <IconImg src="/inspection_images/view.png" />,          title: "Eyes on the Road",         desc: "I am fully focused and ready to avoid any unnecessary distractions.",                color: "#5BBFEA" },
  { icon: <IconImg src="/inspection_images/idea.png" />,          title: "Adequate Lighting",        desc: "My face is clearly visible and well-lit for accurate AI monitoring.",                color: "#5BBFEA" },
  { icon: <IconImg src="/inspection_images/camera.png" />,        title: "Camera Positioned",        desc: "Camera is placed directly in front of my face, aligned properly.",                   color: "#5BBFEA" },
  { icon: <IconImg src="/inspection_images/notification.png" />,  title: "Stay Alert",               desc: "I am fully awake and alert — not driving if excessively tired or unwell.",           color: "#5BBFEA" },
];

type Phase = "idle" | "flipped" | "exit";

export default function InspectionPage() {
  const [index, setIndex]       = useState(0);
  const [phase, setPhase]       = useState<Phase>("idle");   // idle → flipped → exit
  const [entering, setEntering] = useState(true);            // card sliding in
  const [done, setDone]         = useState(false);

  // reset "entering" flag after mount / card change
  useEffect(() => {
    setEntering(true);
    const t = setTimeout(() => setEntering(false), 50);
    return () => clearTimeout(t);
  }, [index]);

  const handleFlip = () => {
    if (phase === "idle") setPhase("flipped");
  };

  const handleConfirm = () => {
    if (phase !== "flipped") return;
    setPhase("exit");

    setTimeout(() => {
      const next = index + 1;
      if (next >= ITEMS.length) {
        setDone(true);
      } else {
        setIndex(next);
        setPhase("idle");
      }
    }, 500); // matches exit animation
  };

  const item = ITEMS[index];

  /* ── dynamic transforms ── */
  const cardTransform =
    phase === "exit"
      ? "translateX(-110%) scale(0.85)"
      : entering
      ? "translateX(110%) scale(0.85)"
      : "translateX(0) scale(1)";

  const cardOpacity = phase === "exit" || entering ? 0 : 1;

  /* ─────────────────────────── RENDER ─────────────────────── */
  return (
    <main style={{
      minHeight: "100vh",
      background: "#ffffff",
      fontFamily: "var(--font-inter, sans-serif)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
    }}>

      {/* ── Header ── */}
      <header style={{ width: "100%", padding: "28px 32px 0", display: "flex", alignItems: "center", justifyContent: "space-between", boxSizing: "border-box" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#5BBFEA", animation: "blink 1.8s ease-in-out infinite" }} />
          <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.38em", textTransform: "uppercase", color: "#ccc" }}>AI · DMS</span>
        </div>
        {!done && (
          <span style={{ fontSize: "0.7rem", fontWeight: 700, color: "#ccc", letterSpacing: "0.06em" }}>
            {index + 1} <span style={{ color: "#e5e5e5" }}>/ {ITEMS.length}</span>
          </span>
        )}
      </header>

      {/* ════════════════ CARD FLOW ════════════════ */}
      {!done && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%", padding: "20px 20px 60px" }}>

          {/* progress dots */}
          <div style={{ display: "flex", gap: 6, marginBottom: 40 }}>
            {ITEMS.map((it, i) => (
              <div key={i} style={{
                width:  i === index ? 22 : 7,
                height: 7,
                borderRadius: 99,
                background: i < index ? it.color : i === index ? item.color : "#eee",
                transition: "all 0.4s ease",
              }} />
            ))}
          </div>

          {/* title above card */}
          <div style={{
            textAlign: "center",
            marginBottom: 28,
            opacity: cardOpacity,
            transition: "opacity 0.4s ease",
          }}>
            <p style={{ margin: 0, fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.42em", textTransform: "uppercase", color: "#ccc" }}>
              {index < 3 ? "Safety Pledge" : "Pre-Drive Check"}
            </p>
            <h1 style={{ margin: "8px 0 0", fontSize: "clamp(1.4rem,4vw,2rem)", fontWeight: 900, color: "#111", letterSpacing: "-0.02em" }}>
              {item.title}
            </h1>
          </div>

          {/* ── Flip card ── */}
          <div
            style={{
              perspective: "1000px",
              width: "min(320px, 88vw)",
              height: 380,
              cursor: phase === "idle" ? "pointer" : "default",
              transform: cardTransform,
              opacity: cardOpacity,
              transition: "transform 0.45s cubic-bezier(0.4,0,0.2,1), opacity 0.45s ease",
            }}
            onClick={handleFlip}
          >
            <div style={{
              position: "relative",
              width: "100%",
              height: "100%",
              transformStyle: "preserve-3d",
              transition: "transform 0.75s cubic-bezier(0.4, 0.2, 0.2, 1)",
              transform: phase === "flipped" ? "rotateY(180deg)" : "rotateY(0deg)",
            }}>

              {/* ── FRONT ── */}
              <div style={{
                position: "absolute",
                inset: 0,
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                borderRadius: 28,
                border: `2px solid ${item.color}55`,
                boxShadow: `0 12px 48px ${item.color}22, 0 2px 8px rgba(0,0,0,0.06)`,
                background: `linear-gradient(145deg, #fff 0%, ${item.color}10 100%)`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 18,
                padding: "32px 24px",
              }}>
                {/* big emoji */}
                <div style={{
                  width: 100,
                  height: 100,
                  borderRadius: "50%",
                  background: `${item.color}14`,
                  border: `2.5px solid ${item.color}44`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 44,
                  boxShadow: `0 4px 24px ${item.color}22`,
                }}>
                  <div style={{ color: item.color, display: "flex" }}>
                    {item.icon}
                  </div>
                </div>

                <div style={{ textAlign: "center" }}>
                  <p style={{ margin: 0, fontSize: "1.1rem", fontWeight: 900, color: "#1a1a1a" }}>{item.title}</p>
                  <p style={{ margin: "8px 0 0", fontSize: "0.75rem", color: "#bbb", lineHeight: 1.55 }}>{item.desc}</p>
                </div>

                {/* tap hint */}
                <div style={{
                  marginTop: 4,
                  padding: "8px 20px",
                  borderRadius: 99,
                  background: `${item.color}18`,
                  border: `1.5px solid ${item.color}44`,
                  color: item.color,
                  fontSize: "0.62rem",
                  fontWeight: 800,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                }}>
                  Tap to flip →
                </div>
              </div>

              {/* ── BACK ── */}
              <div style={{
                position: "absolute",
                inset: 0,
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
                borderRadius: 28,
                border: `2px solid ${item.color}`,
                boxShadow: `0 16px 56px ${item.color}44`,
                background: `linear-gradient(145deg, ${item.color}, ${item.color}cc)`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 20,
                padding: "32px 28px",
              }}>
                <div style={{ color: "#fff", display: "flex", transform: "scale(0.85)" }}>{item.icon}</div>

                <p style={{
                  margin: 0,
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  color: "rgba(255,255,255,0.95)",
                  textAlign: "center",
                  lineHeight: 1.6,
                }}>
                  {item.desc}
                </p>

                {/* confirm checkbox button */}
                <button
                  onClick={(e) => { e.stopPropagation(); handleConfirm(); }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "13px 24px",
                    borderRadius: 14,
                    border: "2px solid rgba(255,255,255,0.8)",
                    background: "rgba(255,255,255,0.2)",
                    backdropFilter: "blur(8px)",
                    color: "#fff",
                    fontWeight: 800,
                    fontSize: "0.75rem",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                    width: "100%",
                    justifyContent: "center",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.35)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.2)")}
                >
                  {/* checkbox icon */}
                  <span style={{
                    width: 20,
                    height: 20,
                    borderRadius: 6,
                    border: "2px solid rgba(255,255,255,0.9)",
                    background: "rgba(255,255,255,0.25)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                      <path d="M1 4.5L4 7.5L10 1" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  Confirm &amp; Next
                </button>

                {/* flip back */}
                <span
                  onClick={(e) => { e.stopPropagation(); setPhase("idle"); }}
                  style={{ fontSize: "0.58rem", color: "rgba(255,255,255,0.45)", letterSpacing: "0.08em", cursor: "pointer", textTransform: "uppercase" }}
                >
                  ← flip back
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ DONE ════════════════ */}
      {done && (
        <div style={{
          flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", gap: 40, padding: "60px 24px", textAlign: "center",
          animation: "fadeUp 0.6s ease forwards",
        }}>

          {/* shield icon */}
          <div style={{
            width: 80, height: 80, borderRadius: "50%",
            background: "linear-gradient(135deg, #e8f7fd, #c8ecf7)",
            border: "2px solid #b1dae7",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 24px rgba(91,191,234,0.2)",
          }}>
            <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="#5BBFEA" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>

          {/* heading */}
          <div style={{ maxWidth: 480 }}>
            <p style={{ margin: "0 0 10px", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.42em", textTransform: "uppercase", color: "#b1dae7" }}>
              Pre-Drive Check Complete
            </p>
            <h2 style={{ margin: 0, fontSize: "clamp(1.8rem, 5vw, 2.6rem)", fontWeight: 900, color: "#1a2a3a", letterSpacing: "-0.02em", lineHeight: 1.15 }}>
              You&apos;re ready to drive safely.
            </h2>
          </div>

          {/* professional quote */}
          <div style={{
            maxWidth: 420,
            padding: "28px 32px",
            borderRadius: 20,
            background: "#f7fcfe",
            border: "1.5px solid #d6eff8",
            boxShadow: "0 2px 16px rgba(91,191,234,0.08)",
          }}>
            <svg width="28" height="20" viewBox="0 0 28 20" fill="#b1dae7" style={{ marginBottom: 12 }}>
              <path d="M0 20V12.727C0 5.697 4.364 1.576 13.091 0l1.455 2.424C10.788 3.394 8.788 5.03 8.303 8h4.242V20H0zm14.667 0V12.727C14.667 5.697 19.03 1.576 27.758 0l1.455 2.424c-3.758.97-5.758 2.606-6.243 5.576h4.242V20H14.667z"/>
            </svg>
            <p style={{ margin: 0, fontSize: "1rem", fontWeight: 600, color: "#234567", lineHeight: 1.7, fontStyle: "italic" }}>
              "The road is a shared responsibility. Every check you complete today protects not just you — but everyone around you."
            </p>
            <p style={{ margin: "14px 0 0", fontSize: "0.65rem", fontWeight: 700, color: "#b1dae7", letterSpacing: "0.12em", textTransform: "uppercase" }}>
              AI Driver Monitoring System
            </p>
          </div>

          {/* CTA button */}
          <a href="/dashboard" style={{ textDecoration: "none" }}>
            <button className="cta">
              <span>Start Monitoring</span>
              <svg width="15px" height="10px" viewBox="0 0 13 10">
                <path d="M1,5 L11,5"></path>
                <polyline points="8 1 12 5 8 9"></polyline>
              </svg>
            </button>
          </a>
        </div>
      )}

      <style>{`
        @keyframes blink {
          0%,100% { opacity:1; transform:scale(1); }
          50%      { opacity:0.4; transform:scale(1.35); }
        }
        @keyframes ring {
          0%,100% { transform:scale(1); opacity:0.3; }
          50%      { transform:scale(1.12); opacity:0.6; }
        }
        @keyframes fadeUp {
          from { opacity:0; transform:translateY(24px); }
          to   { opacity:1; transform:translateY(0); }
        }

        .cta {
          position: relative;
          margin: auto;
          padding: 12px 18px;
          transition: all 0.2s ease;
          border: none;
          background: none;
          cursor: pointer;
        }

        .cta:before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          display: block;
          border-radius: 50px;
          background: #b1dae7;
          width: 45px;
          height: 45px;
          transition: all 0.3s ease;
        }

        .cta span {
          position: relative;
          font-family: "Ubuntu", sans-serif;
          font-size: 18px;
          font-weight: 700;
          letter-spacing: 0.05em;
          color: #234567;
        }

        .cta svg {
          position: relative;
          top: 0;
          margin-left: 10px;
          fill: none;
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke: #234567;
          stroke-width: 2;
          transform: translateX(-5px);
          transition: all 0.3s ease;
        }

        .cta:hover:before {
          width: 100%;
          background: #b1dae7;
        }

        .cta:hover svg {
          transform: translateX(0);
        }

        .cta:active {
          transform: scale(0.95);
        }

        .cta:active svg {
          transform: translateX(15px);
        }
      `}</style>
    </main>
  );
}
