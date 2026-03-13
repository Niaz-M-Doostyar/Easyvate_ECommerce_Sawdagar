"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

const DEMO_ACCOUNTS = [
  { label: "Admin", email: "admin@sawdagar.af", password: "admin123", role: "admin", color: "bg-primary" },
  { label: "Supplier", email: "supplier@sawdagar.af", password: "supplier123", role: "supplier", color: "bg-green" },
];

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    if (!loading && user) {
      if (user.role === "admin") router.replace("/admin");
      else if (user.role === "supplier") router.replace("/supplier");
    }
  }, [user, loading, router]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const r = await login(email, password);
    setSubmitting(false);
    if (r.success) {
      toast.success("Welcome back!");
      if (r.user.role === "admin") router.push("/admin");
      else if (r.user.role === "supplier") router.push("/supplier");
      else toast.error("Access denied. Admin or Supplier only.");
    } else toast.error(r.error);
  };
  const fillCredentials = (account) => {
    setEmail(account.email);
    setPassword(account.password);
  };
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-navy-dark via-navy to-primary/20">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-extrabold text-3xl font-heading">S</span>
          </div>
          <h1 className="text-2xl font-extrabold text-white font-heading">Sawdagar Panel</h1>
          <p className="text-white/50 mt-1 text-sm">Admin & Supplier Dashboard</p>
        </div>
        <form onSubmit={handleSubmit} className="card card-p space-y-5">
          <div>
            <label className="label">Email Address</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input" placeholder="admin@sawdagar.af" required />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input" placeholder="••••••••" required />
          </div>
          <button type="submit" disabled={submitting} className="btn btn-primary w-full justify-center text-base py-3 disabled:opacity-50">
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </form>
        <div className="mt-6 space-y-3">
          <p className="text-center text-xs text-white/50 font-medium uppercase tracking-wider">Quick Login</p>
          <div className="grid grid-cols-2 gap-3">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => fillCredentials(acc)}
                className="flex flex-col items-center gap-1.5 p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all group"
              >
                <span className={`w-9 h-9 rounded-full ${acc.color} flex items-center justify-center`}>
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d={acc.role === "admin" ? "M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" : "M13.5 21v-7.5a.75.75 0 01.75-.75h3a.75.75 0 01.75.75V21m-4.5 0H2.36m11.14 0H18m0 0h3.64m-1.39 0V9.349m-16.5 11.65V9.35m0 0a3.001 3.001 0 003.75-.615A2.993 2.993 0 009.75 9.75c.896 0 1.7-.393 2.25-1.016a2.993 2.993 0 002.25 1.016c.896 0 1.7-.393 2.25-1.016a3.001 3.001 0 003.75.614m-16.5 0a3.004 3.004 0 01-.621-4.72L4.318 3.44A1.5 1.5 0 015.378 3h13.243a1.5 1.5 0 011.06.44l1.19 1.189a3 3 0 01-.621 4.72m-13.5 8.65h3.75a.75.75 0 00.75-.75V13.5a.75.75 0 00-.75-.75H6.75a.75.75 0 00-.75.75v3.75c0 .415.336.75.75.75z"} />
                  </svg>
                </span>
                <span className="text-white font-semibold text-sm">{acc.label}</span>
                <span className="text-white/40 text-[11px] leading-tight font-mono">{acc.email}</span>
                <span className="text-white/30 text-[10px]">Password: {acc.password}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
