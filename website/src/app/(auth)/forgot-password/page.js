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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary/5 flex items-center justify-center py-20 px-4">
      <div className="w-full max-w-md animate-fade-up">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-12 h-12 bg-gold rounded-xl flex items-center justify-center shadow-lg shadow-gold/20"><span className="text-white font-extrabold text-2xl font-display">S</span></div>
            <span className="text-2xl font-extrabold text-midnight font-display">Sawdagar</span>
          </Link>
          <h2 className="text-2xl font-bold text-midnight font-display">Forgot Password</h2>
          <p className="text-body mt-2">Enter your email and we&apos;ll send you a reset link</p>
        </div>
        <div className="bg-white rounded-2xl shadow-card p-8">
          {sent ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="text-lg font-bold text-midnight mb-2">Check Your Email</h3>
              <p className="text-body text-sm mb-6">We&apos;ve sent a password reset link to <strong className="text-midnight">{email}</strong></p>
              <Link href="/login" className="theme-btn inline-flex">Back to Login</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-sm font-semibold text-midnight mb-1.5 block font-display">Email Address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="form-field" placeholder="Enter your email" required />
              </div>
              <button type="submit" disabled={loading} className="theme-btn w-full justify-center text-base py-3.5 disabled:opacity-60">
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
              <p className="text-center text-sm text-body">Remember your password? <Link href="/login" className="font-semibold text-gold">Sign In</Link></p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
