"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSiteData } from "@/contexts/SiteDataContext";

export default function LoginPage() {
  const { login } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const { t } = useLanguage();
  const { siteContent } = useSiteData();
  const logoUrl = (siteContent?.header?.logo || "").trim() || "/assets/img/logo/logo.png";
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const result = await login(form.email, form.password);
    setLoading(false);
    if (result.success) {
      toast.success(t('login_success') || "Welcome back!");
      router.push("/dashboard");
    } else {
      toast.error(result.error || "Invalid credentials");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary/5 flex items-center justify-center py-20 px-4">
      <div className="w-full max-w-md animate-fade-up">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <img src={logoUrl} alt="Sawdagar" className="h-12 object-contain" />
            <span className="text-2xl font-extrabold text-midnight font-display">Sawdagar</span>
          </Link>
          <h2 className="text-2xl font-bold text-midnight font-display">{t('login')}</h2>
          <p className="text-body mt-2">{t('welcome') || 'Login with your Sawdagar account'}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-semibold text-midnight mb-1.5 block font-display">{t('email')}</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-midnight placeholder:text-body focus:border-theme-color focus:outline-none focus:ring-2 focus:ring-theme-color/30"
                placeholder={t('email')}
                required
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-midnight mb-1.5 block font-display">{t('password')}</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-midnight placeholder:text-body focus:border-theme-color focus:outline-none focus:ring-2 focus:ring-theme-color/30"
                placeholder={t('password')}
                required
              />
            </div>

            <div className="flex items-center justify-between">
              <Link href="/forgot-password" className="text-sm font-semibold text-gold hover:text-gold/80">
                {t('forgot_password')}
              </Link>
              <span className="text-sm text-body">{t('dont_have_account')} <Link href="/register" className="font-semibold text-gold hover:text-gold/80">{t('register')}</Link></span>
            </div>

            <button type="submit" disabled={loading} className="theme-btn w-full justify-center text-base py-3.5 disabled:opacity-60">
              {loading ? `${t('sending') || 'Sending...'} ` : `${t('login')}`}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
