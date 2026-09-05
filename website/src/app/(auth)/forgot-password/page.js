"use client";
import { useState } from "react";
import Link from "next/link";
import { useToast } from "@/contexts/ToastContext";

export default function ForgotPasswordPage() {
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const r = await fetch("/api/auth/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const d = await r.json();
      if (r.ok) { setSent(true); toast.success("Reset link sent to your email!"); }
      else toast.error(d.error || "Failed to send reset link");
    } catch { toast.error("Something went wrong"); }
    setLoading(false);
  };

  return (
    <div className="f2-content-page f2-auth-page">
      <div className="f2-auth-shell">
        <div className="f2-auth-panel animate-fade-up">
          <header className="f2-auth-heading">
            <Link href="/" className="f2-auth-brand" aria-label="Sawdagar home">
              <span className="f2-auth-brand__mark" aria-hidden="true">S</span>
              <span className="f2-auth-brand__name">Sawdagar</span>
            </Link>
            <span className="f2-content-eyebrow">Account recovery</span>
            <h1>Forgot Password</h1>
            <p>Enter your email and we&apos;ll send you a reset link</p>
          </header>
          <div className="f2-auth-card">
          {sent ? (
            <div className="f2-auth-state f2-auth-state--success" role="status">
              <div className="f2-auth-state__icon">
                <svg className="w-8 h-8 text-green" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h2>Check Your Email</h2>
              <p>We&apos;ve sent a password reset link to <strong>{email}</strong></p>
              <Link href="/login" className="f2-content-button">Back to Login</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="f2-content-form" aria-busy={loading}>
              <div className="f2-content-field">
                <label htmlFor="forgot-email">Email Address</label>
                <input id="forgot-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Enter your email" autoComplete="email" required />
              </div>
              <button type="submit" disabled={loading} className="f2-content-button f2-content-button--wide">
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
              <p className="f2-auth-alternative">Remember your password? <Link href="/login">Sign In</Link></p>
            </form>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}
