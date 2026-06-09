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

      {/* Menu */}
      <div style={{ display: "flex", justifyContent: "center", width: "100%", paddingBottom: 24, position: "fixed", bottom: 0, zIndex: 100 }}>
        <div className="menu" style={{ "--ease-spring": "cubic-bezier(0.175, 0.885, 0.32, 1.275)" } as any}>
          <a href="/dashboard" className="active">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
              <path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z"></path>
              <path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z"></path>
            </svg>
            <span>Home</span>
          </a>
          <a href="#">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
              <path d="M19.5 21a3 3 0 0 0 3-3v-4.5a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3V18a3 3 0 0 0 3 3h15ZM1.5 10.146V6a3 3 0 0 1 3-3h5.379a2.25 2.25 0 0 1 1.59.659l2.122 2.121c.14.141.331.22.53.22H19.5a3 3 0 0 1 3 3v1.146A4.483 4.483 0 0 0 19.5 9h-15a4.483 4.483 0 0 0-3 1.146Z"></path>
            </svg>
            <span>Files</span>
          </a>
          <a href="#">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
              <path fillRule="evenodd" d="M6.75 2.25A.75.75 0 0 1 7.5 3v1.5h9V3A.75.75 0 0 1 18 3v1.5h.75a3 3 0 0 1 3 3v11.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V7.5a3 3 0 0 1 3-3H6V3a.75.75 0 0 1 .75-.75Zm13.5 9a1.5 1.5 0 0 0-1.5-1.5H5.25a1.5 1.5 0 0 0-1.5 1.5v7.5a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5v-7.5Z" clipRule="evenodd"></path>
            </svg>
            <span>Plans</span>
          </a>
          <a href="#">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-6">
              <path d="M17.004 10.407c.138.435-.216.842-.672.842h-3.465a.75.75 0 0 1-.65-.375l-1.732-3c-.229-.396-.053-.907.393-1.004a5.252 5.252 0 0 1 6.126 3.537ZM8.12 8.464c.307-.338.838-.235 1.066.16l1.732 3a.75.75 0 0 1 0 .75l-1.732 3c-.229.397-.76.5-1.067.161A5.23 5.23 0 0 1 6.75 12a5.23 5.23 0 0 1 1.37-3.536ZM10.878 17.13c-.447-.098-.623-.608-.394-1.004l1.733-3.002a.75.75 0 0 1 .65-.375h3.465c.457 0 .81.407.672.842a5.252 5.252 0 0 1-6.126 3.539Z"></path>
              <path fillRule="evenodd" d="M21 12.75a.75.75 0 1 0 0-1.5h-.783a8.22 8.22 0 0 0-.237-1.357l.734-.267a.75.75 0 1 0-.513-1.41l-.735.268a8.24 8.24 0 0 0-.689-1.192l.6-.503a.75.75 0 1 0-.964-1.149l-.6.504a8.3 8.3 0 0 0-1.054-.885l.391-.678a.75.75 0 1 0-1.299-.75l-.39.676a8.188 8.188 0 0 0-1.295-.47l.136-.77a.75.75 0 0 0-1.477-.26l-.136.77a8.36 8.36 0 0 0-1.377 0l-.136-.77a.75.75 0 1 0-1.477.26l.136.77c-.448.121-.88.28-1.294.47l-.39-.676a.75.75 0 0 0-1.3.75l.392.678a8.29 8.29 0 0 0-1.054.885l-.6-.504a.75.75 0 1 0-.965 1.149l.6.503a8.243 8.243 0 0 0-.689 1.192L3.8 8.216a.75.75 0 1 0-.513 1.41l.735.267a8.222 8.222 0 0 0-.238 1.356h-.783a.75.75 0 0 0 0 1.5h.783c.042.464.122.917.238 1.356l-.735.268a.75.75 0 0 0 .513 1.41l.735-.268c.197.417.428.816.69 1.191l-.6.504a.75.75 0 0 0 .963 1.15l.601-.505c.326.323.679.62 1.054.885l-.392.68a.75.75 0 0 0 1.3.75l.39-.679c.414.192.847.35 1.294.471l-.136.77a.75.75 0 0 0 1.477.261l.137-.772a8.332 8.332 0 0 0 1.376 0l.136.772a.75.75 0 1 0 1.477-.26l-.136-.771a8.19 8.19 0 0 0 1.294-.47l.391.677a.75.75 0 0 0 1.3-.75l-.393-.679a8.29 8.29 0 0 0 1.054-.885l.601.504a.75.75 0 0 0 .964-1.15l-.6-.503c.261-.375.492-.774.69-1.191l.735.267a.75.75 0 1 0 .512-1.41l-.734-.267c.115-.439.195-.892.237-1.356h.784Zm-2.657-3.06a6.744 6.744 0 0 0-1.19-2.053 6.784 6.784 0 0 0-1.82-1.51A6.705 6.705 0 0 0 12 5.25a6.8 6.8 0 0 0-1.225.11 6.7 6.7 0 0 0-2.15.793 6.784 6.784 0 0 0-2.952 3.489.76.76 0 0 1-.036.098A6.74 6.74 0 0 0 5.251 12a6.74 6.74 0 0 0 3.366 5.842l.009.005a6.704 6.704 0 0 0 2.18.798l.022.003a6.792 6.792 0 0 0 2.368-.004 6.704 6.704 0 0 0 2.205-.811 6.785 6.785 0 0 0 1.762-1.484l.009-.01.009-.01a6.743 6.743 0 0 0 1.18-2.066c.253-.707.39-1.469.39-2.263a6.74 6.74 0 0 0-.408-2.309Z" clipRule="evenodd"></path>
            </svg>
            <span>Settings</span>
          </a>
        </div>
      </div>

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
        .menu {
          /* position: fixed;
          left: 50%;
          bottom: 12px;
          bottom: calc(12px + env(safe-area-inset-bottom)); */
          /* transform: translateX(-50%); */
          width: calc(100% - 20px);
          max-width: 520px;
          backdrop-filter: blur(12px) saturate(180%) contrast(200%);
          -webkit-backdrop-filter: blur(12px) saturate(180%) contrast(200%);
          background: rgba(0, 122, 255, 0.404);
          border: 1px solid var(--glass-border);
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
          padding: 8px;
          border-radius: 99rem;
          display: flex;
          justify-content: center;
          gap: 8px;
          z-index: 50;
        }

        .menu::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          box-shadow:
            inset 2px 2px 5px -2px rgba(255, 255, 255, 0.4),
            inset -2px -2px 5px 2px rgba(255, 255, 255, 0.4),
            inset 0 -2px 0 rgba(255, 255, 255, 0.2);
          pointer-events: none;
          z-index: -1;
        }

        .menu a {
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1 1 0;
          min-width: 0;
          color: rgba(255, 255, 255, 90%);
          text-decoration: none;
          padding: 10px 6px;
          border-radius: 999rem;
          -webkit-tap-highlight-color: transparent;
          transition:
            background 0.18s var(--ease-spring),
            color 0.18s var(--ease-spring),
            transform 0.18s var(--ease-spring),
            box-shadow 0.3s ease-in-out;
        }

        .menu a:hover {
          transition:
            background 0.18s var(--ease-spring),
            color 0.18s var(--ease-spring),
            transform 0.18s var(--ease-spring),
            box-shadow 0.3s ease-in-out;
          background-color: rgba(255, 255, 255, 30%);
          box-shadow:
            inset 2px 2px 5px -2px rgba(255, 255, 255, 0.4),
            inset -2px -1px 5px 0 rgba(255, 255, 255, 0.4),
            inset 0 -2px 0 rgba(255, 255, 255, 0.2);
          transform: rotate(2.2);
          color: rgba(0, 122, 255, 70%);
        }

        .menu a svg {
          width: 1.4rem;
          font-size: 1.4rem;
        }

        .menu a span {
          font-size: 0.8rem;
          font-weight: 600;
          line-height: 1;
          margin-top: 4px;
        }

        .menu a.active {
          background: rgb(237, 237, 237, 60%);
          color: rgba(0, 122, 255, 90%);
        }

        .menu a:active {
          transform: scale(0.98);
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
