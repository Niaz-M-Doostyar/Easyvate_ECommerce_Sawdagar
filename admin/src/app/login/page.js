"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";

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
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input" placeholder="Enter your email" required />
          </div>
          <div>
            <label className="label">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input" placeholder="••••••••" required />
          </div>
          <button type="submit" disabled={submitting} className="btn btn-primary w-full justify-center text-base py-3 disabled:opacity-50">
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
