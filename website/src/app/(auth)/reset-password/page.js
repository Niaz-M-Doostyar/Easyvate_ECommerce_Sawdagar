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
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="text-sm font-semibold text-midnight mb-1.5 block font-display">New Password</label>
        <input type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="form-field" placeholder="Min 6 characters" required />
      </div>
      <div>
        <label className="text-sm font-semibold text-midnight mb-1.5 block font-display">Confirm Password</label>
        <input type="password" value={form.confirmPassword} onChange={e => setForm({...form, confirmPassword: e.target.value})} className="form-field" placeholder="••••••••" required />
      </div>
      <button type="submit" disabled={loading} className="theme-btn w-full justify-center text-base py-3.5 disabled:opacity-60">{loading ? "Resetting..." : "Reset Password"}</button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary/5 flex items-center justify-center py-20 px-4">
      <div className="w-full max-w-md animate-fade-up">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-12 h-12 bg-gold rounded-xl flex items-center justify-center shadow-lg shadow-gold/20"><span className="text-white font-extrabold text-2xl font-display">S</span></div>
            <span className="text-2xl font-extrabold text-midnight font-display">Sawdagar</span>
          </Link>
          <h2 className="text-2xl font-bold text-midnight font-display">Reset Password</h2>
          <p className="text-body mt-2">Choose a new password for your account</p>
        </div>
        <div className="bg-white rounded-2xl shadow-card p-8">
          <Suspense fallback={<div className="text-center py-8 text-body">Loading...</div>}>
            <ResetForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
