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
  const logoUrl = (siteContent?.header?.logo || "").trim() || "/assets/img/logo/sawdagar.png";
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
    <div className="f2-content-page f2-auth-page f2-auth-page--with-crumb">
      <div className="site-breadcrumb f2-content-crumb">
        <div className="site-breadcrumb-bg" style={{ background: "url(/assets/img/breadcrumb/01.jpg)" }} />
        <div className="container">
          <div className="site-breadcrumb-wrap">
            <h1 className="breadcrumb-title">{t('login') || 'Sign In'}</h1>
            <ul className="breadcrumb-menu">
              <li><Link href="/"><i className="far fa-home"></i> Home</Link></li>
              <li className="active">{t('login') || 'Sign In'}</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="f2-auth-shell">
        <div className="f2-auth-panel animate-fade-up">
          <header className="f2-auth-heading">
            <Link href="/" className="f2-auth-brand f2-auth-brand--image" aria-label="Sawdagar home">
            <img src={logoUrl} alt="Sawdagar" style={{height:48,objectFit:'contain',maxWidth:200}} />
            </Link>
            <span className="f2-content-eyebrow">Welcome back</span>
            <h2>{t('login') || 'Sign In'}</h2>
            <p>{t('welcome') || 'Login with your Sawdagar account'}</p>
          </header>

          <div className="f2-auth-card">
          <form onSubmit={handleSubmit} className="f2-content-form" aria-busy={loading}>
            <div className="f2-content-field">
              <label htmlFor="login-email">{t('email') || 'Email'}</label>
              <input
                id="login-email"
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder={t('email') || 'Email'}
                autoComplete="email"
                required
              />
            </div>

            <div className="f2-content-field">
              <label htmlFor="login-password">{t('password') || 'Password'}</label>
              <input
                id="login-password"
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                placeholder={t('password') || 'Password'}
                autoComplete="current-password"
                required
              />
            </div>

            <div className="f2-auth-form-links">
              <Link href="/forgot-password">
                {t('forgot_password') || 'Forgot password?'}
              </Link>
              <span>{t('dont_have_account') || "Don't have an account?"} <Link href="/register">{t('register') || 'Register'}</Link></span>
            </div>

            <button type="submit" disabled={loading} className="f2-content-button f2-content-button--wide">
              {loading ? `${t('sending') || 'Sending...'} ` : `${t('login') || 'Sign In'}`}
            </button>
          </form>
          </div>
        </div>
      </div>
    </div>
  );
}
