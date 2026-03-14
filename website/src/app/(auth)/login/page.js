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
    <>
      {/* Breadcrumb */}
      <div className="site-breadcrumb">
        <div className="site-breadcrumb-bg" style={{ background: 'url(/assets/img/breadcrumb/01.jpg)' }}></div>
        <div className="container">
          <div className="site-breadcrumb-wrap">
            <h4 className="breadcrumb-title">{t('login')}</h4>
            <ul className="breadcrumb-menu">
              <li><Link href="/"><i className="far fa-home"></i> {t('home')}</Link></li>
              <li className="active">{t('login')}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Login Area */}
      <div className="login-area py-100">
        <div className="container">
          <div className="col-md-7 col-lg-5 mx-auto">
            <div className="login-form">
              <div className="login-header">
                <img src={logoUrl} alt="Sawdagar" style={{ maxHeight: 100, width: 'auto', objectFit: 'contain' }} />
                <p>{t('welcome') || 'Login with your Sawdagar account'}</p>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>{t('email')}</label>
                  <input
                    type="email"
                    className="form-control"
                    placeholder={t('email')}
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>{t('password')}</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder={t('password')}
                    value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    required
                  />
                </div>
                <div className="d-flex justify-content-between mb-4">
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox" id="remember" />
                    <label className="form-check-label" htmlFor="remember">
                      Remember Me
                    </label>
                  </div>
                  <Link href="/forgot-password" className="forgot-pass">{t('forgot_password')}</Link>
                </div>
                <div className="d-flex align-items-center">
                  <button type="submit" className="theme-btn" disabled={loading}>
                    {loading ? (
                      <><i className="fas fa-spinner fa-spin"></i> Signing in...</>
                    ) : (
                      <><i className="far fa-sign-in"></i> {t('login')}</>
                    )}
                  </button>
                </div>
              </form>
              <div className="login-footer">
                <p>{t('dont_have_account')} <Link href="/register">{t('register')}.</Link></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
