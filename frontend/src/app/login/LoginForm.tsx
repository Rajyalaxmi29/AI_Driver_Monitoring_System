"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [showPass, setShowPass] = useState(false);

  return (
    <div className="login-panel">
      {/* Top toggle */}
      <div className="absolute top-8 right-8 animate-fade-in-down delay-200">
        <span className="label-elegant">
          {mode === "login" ? "New here? " : "Already a member? "}
          <button
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="text-white/55 hover:text-white underline underline-offset-4 transition-colors duration-300 cursor-pointer"
          >
            {mode === "login" ? "Create account" : "Sign in"}
          </button>
        </span>
      </div>

      {/* Form content */}
      <div className="px-10 py-8">
        {/* Heading */}
        <div className="mb-8">
          <p className="animate-letter-spacing delay-300 label-elegant mb-3">
            {mode === "login" ? "Welcome back" : "Get started"}
          </p>
          <h2
            className="animate-fade-in-down delay-400 text-shimmer"
            style={{
              fontFamily: "var(--font-playfair)",
              fontSize: "2rem",
              fontWeight: 700,
              lineHeight: 1.2,
            }}
          >
            {mode === "login" ? (
              <>Sign in to<br /><em style={{ fontWeight: 400, fontStyle: "italic" }}>your dashboard.</em></>
            ) : (
              <>Create your<br /><em style={{ fontWeight: 400, fontStyle: "italic" }}>free account.</em></>
            )}
          </h2>
        </div>

        {/* Form */}
        <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); router.push("/inspection"); }}>
          {mode === "signup" && (
            <div className="animate-fade-in-down delay-400">
              <InputField label="Full Name" type="text" placeholder="John Doe" />
            </div>
          )}

          <div className="animate-fade-in-down delay-500">
            <InputField label="Email Address" type="email" placeholder="you@example.com" />
          </div>

          <div className="animate-fade-in-down delay-600 relative">
            <InputField
              label="Password"
              type={showPass ? "text" : "password"}
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 bottom-3 label-elegant text-white/30 hover:text-white/60 transition-colors cursor-pointer"
              style={{ fontSize: "0.58rem" }}
            >
              {showPass ? "HIDE" : "SHOW"}
            </button>
          </div>

          {mode === "signup" && (
            <div className="animate-fade-in-down delay-700">
              <InputField label="Confirm Password" type="password" placeholder="••••••••" />
            </div>
          )}

          {mode === "login" && (
            <div className="flex justify-end -mt-1">
              <a
                href="#"
                className="label-elegant text-white/25 hover:text-white/50 transition-colors"
                style={{ fontSize: "0.58rem" }}
              >
                Forgot password?
              </a>
            </div>
          )}

          <button
            type="submit"
            className="animate-fade-in delay-700 mt-2 w-full rounded-full bg-white py-3 text-xs font-semibold tracking-widest text-black uppercase hover:bg-white/90 active:scale-95 transition-all duration-300 cursor-pointer"
          >
            {mode === "login" ? "Sign In →" : "Create Account →"}
          </button>

          {/* Divider */}
          <div className="animate-fade-in delay-800 flex items-center gap-4 my-1">
            <span className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
            <span className="label-elegant" style={{ fontSize: "0.55rem" }}>or continue with</span>
            <span className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.07)" }} />
          </div>

          <div className="animate-fade-in delay-900 flex gap-3">
            {["Google", "GitHub"].map((provider) => (
              <button
                key={provider}
                type="button"
                className="flex-1 rounded-full border py-2.5 label-elegant text-white/40 hover:text-white/65 active:scale-95 transition-all duration-300 cursor-pointer"
                style={{ fontSize: "0.6rem", borderColor: "rgba(255,255,255,0.1)" }}
                onMouseEnter={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.28)")}
                onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
              >
                {provider}
              </button>
            ))}
          </div>
        </form>

        {mode === "signup" && (
          <p
            className="animate-fade-in delay-1000 mt-5 text-center label-elegant"
            style={{ fontSize: "0.55rem", lineHeight: 1.8 }}
          >
            By creating an account you agree to our{" "}
            <a href="#" className="text-white/40 hover:text-white/65 underline underline-offset-2 transition-colors">Terms</a>
            {" & "}
            <a href="#" className="text-white/40 hover:text-white/65 underline underline-offset-2 transition-colors">Privacy Policy</a>.
          </p>
        )}
      </div>
    </div>
  );
}

/* ── Reusable Input ─────────────────────────────────────────────── */
function InputField({ label, type, placeholder }: { label: string; type: string; placeholder: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="label-elegant" style={{ fontSize: "0.6rem" }}>{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.09)",
          borderRadius: "10px",
          padding: "11px 14px",
          fontSize: "0.82rem",
          color: "rgba(255,255,255,0.8)",
          fontFamily: "var(--font-inter)",
          letterSpacing: "0.02em",
          outline: "none",
          transition: "border-color 0.3s",
          width: "100%",
        }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.28)")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.09)")}
      />
    </div>
  );
}
