"use client";
import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useToast } from "@/contexts/ToastContext";

function ResetForm() {
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) { toast.error("Passwords don't match"); return; }
    setLoading(true);
    try {
      const r = await fetch("/api/auth/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password: form.password }) });
      const d = await r.json();
      if (r.ok) { toast.success("Password reset successfully!"); router.push("/login"); }
      else toast.error(d.error || "Reset failed");
    } catch { toast.error("Something went wrong"); }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="f2-content-form" aria-busy={loading}>
      <div className="f2-content-field">
        <label htmlFor="reset-password">New Password</label>
        <input id="reset-password" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Min 6 characters" autoComplete="new-password" required />
      </div>
      <div className="f2-content-field">
        <label htmlFor="reset-confirm-password">Confirm Password</label>
        <input id="reset-confirm-password" type="password" value={form.confirmPassword} onChange={e => setForm({...form, confirmPassword: e.target.value})} placeholder="••••••••" autoComplete="new-password" required />
      </div>
      <button type="submit" disabled={loading} className="f2-content-button f2-content-button--wide">{loading ? "Resetting..." : "Reset Password"}</button>
    </form>
  );
}

export default function ResetPasswordPage() {
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
            <h1>Reset Password</h1>
            <p>Choose a new password for your account</p>
          </header>
          <div className="f2-auth-card">
          <Suspense fallback={<div className="f2-content-loading" role="status"><span className="f2-content-spinner" aria-hidden="true" />Loading...</div>}>
            <ResetForm />
          </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
