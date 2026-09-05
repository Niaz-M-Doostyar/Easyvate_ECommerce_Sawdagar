"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSiteData } from "@/contexts/SiteDataContext";
import { AFGHANISTAN_PROVINCES } from "@/data/afghanistanProvinces";

export default function RegisterPage() {
  const { register } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const { t } = useLanguage();
  const { siteContent } = useSiteData();
  const logoUrl = (siteContent?.header?.logo || "").trim() || "/assets/img/logo/sawdagar.png";
  const [role, setRole] = useState("customer");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", password: "", confirmPassword: "", companyName: "", companyAddress: "", province: "" });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (form.password !== form.confirmPassword) {
      const msg = "Passwords don't match";
      setFormError(msg);
      toast.error(msg);
      return;
    }
    if (form.password.length < 6) {
      const msg = "Password must be at least 6 characters";
      setFormError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);
    const body = { fullName: form.fullName, email: form.email, phone: form.phone, password: form.password, role };
    if (role === "supplier") { body.companyName = form.companyName; body.companyAddress = form.companyAddress; body.province = form.province; }
    const result = await register(body);
    setLoading(false);

    if (result.success) {
      setFormError("");
      toast.success(result.message || t('register_success'));
      router.push("/login");
    } else {
      setFormError(result.error || "Registration failed");
      toast.error(result.error || "Registration failed");
    }
  };

  return (
    <div className="f2-content-page f2-auth-page f2-auth-page--with-crumb">
      <div className="site-breadcrumb f2-content-crumb">
        <div className="site-breadcrumb-bg" style={{ background: "url(/assets/img/breadcrumb/01.jpg)" }} />
        <div className="container">
          <div className="site-breadcrumb-wrap">
            <h1 className="breadcrumb-title">{t('register') || 'Create Account'}</h1>
            <ul className="breadcrumb-menu">
              <li><Link href="/"><i className="far fa-home"></i> Home</Link></li>
              <li className="active">{t('register') || 'Create Account'}</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="f2-auth-shell f2-auth-shell--wide">
        <div className="f2-auth-panel animate-fade-up">
          <header className="f2-auth-heading">
            <Link href="/" className="f2-auth-brand f2-auth-brand--image" aria-label="Sawdagar home">
            <img src={logoUrl} alt="Sawdagar" style={{height:48,objectFit:'contain',maxWidth:200}} />
            </Link>
            <span className="f2-content-eyebrow">Join Sawdagar</span>
            <h2>{t('register') || 'Create Account'}</h2>
            <p>Create your Sawdagar account in seconds</p>
          </header>

          <div className="f2-auth-card">
          <div className="f2-role-picker" aria-label="Account type">
            <button
              type="button"
              className={`f2-role-option${role === 'customer' ? ' active' : ''}`}
              onClick={() => setRole('customer')}
              aria-pressed={role === 'customer'}
            >
              <i className="far fa-user"></i> {t('register_as_customer') || 'Customer'}
            </button>
            <button
              type="button"
              className={`f2-role-option${role === 'supplier' ? ' active' : ''}`}
              onClick={() => setRole('supplier')}
              aria-pressed={role === 'supplier'}
            >
              <i className="far fa-store"></i> {t('register_as_supplier') || 'Supplier'}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="f2-content-form" aria-busy={loading}>
            <div className="f2-content-field">
              <label htmlFor="register-name">{t('full_name') || 'Full name'} *</label>
              <input id="register-name" type="text" placeholder={t('full_name') || 'Full name'} value={form.fullName} onChange={e => set("fullName", e.target.value)} autoComplete="name" required />
            </div>

            <div className="f2-content-form-grid">
              <div className="f2-content-field">
                <label htmlFor="register-email">{t('email') || 'Email'} *</label>
                <input id="register-email" type="email" placeholder={t('email') || 'Email'} value={form.email} onChange={e => set("email", e.target.value)} autoComplete="email" required />
              </div>
              <div className="f2-content-field">
                <label htmlFor="register-phone">{t('phone') || 'Phone'} *</label>
                <input id="register-phone" type="tel" placeholder="07XXXXXXXX" value={form.phone} onChange={e => set("phone", e.target.value)} autoComplete="tel" required />
              </div>
            </div>

            {role === 'supplier' && (
              <div className="f2-content-form-grid">
                <div className="f2-content-field">
                  <label htmlFor="register-company">{t('company_name') || 'Company name'} *</label>
                  <input id="register-company" type="text" placeholder={t('company_name') || 'Company name'} value={form.companyName} onChange={e => set("companyName", e.target.value)} autoComplete="organization" required />
                </div>
                <div className="f2-content-field">
                  <label htmlFor="register-province">{t('province') || 'Province'} *</label>
                  <select id="register-province" value={form.province} onChange={e => set("province", e.target.value)} required>
                    <option value="">Select province</option>
                    {AFGHANISTAN_PROVINCES.map(province => <option key={province} value={province}>{province}</option>)}
                  </select>
                </div>
                <div className="f2-content-field">
                  <label htmlFor="register-address">Company Address</label>
                  <input id="register-address" type="text" placeholder="Company address" value={form.companyAddress} onChange={e => set("companyAddress", e.target.value)} autoComplete="street-address" />
                </div>
              </div>
            )}

            <div className="f2-content-form-grid">
              <div className="f2-content-field">
                <label htmlFor="register-password">{t('password') || 'Password'} *</label>
                <input id="register-password" type="password" placeholder={t('password') || 'Password'} value={form.password} onChange={e => set("password", e.target.value)} autoComplete="new-password" required />
              </div>
              <div className="f2-content-field">
                <label htmlFor="register-confirm">{t('confirm_password') || 'Confirm password'} *</label>
                <input id="register-confirm" type="password" placeholder={t('confirm_password') || 'Confirm password'} value={form.confirmPassword} onChange={e => set("confirmPassword", e.target.value)} autoComplete="new-password" required />
              </div>
            </div>

            <div className="f2-content-check">
              <input type="checkbox" id="terms" required />
              <label htmlFor="terms">
                I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
              </label>
            </div>

            {formError && (
              <div className="f2-content-alert f2-content-alert--error" role="alert">
                {formError}
              </div>
            )}

            <button type="submit" className="f2-content-button f2-content-button--wide" disabled={loading}>
              {loading ? `${t('sending') || 'Creating...'} ` : `${t('register') || 'Create Account'}`}
            </button>

            <p className="f2-auth-alternative">{t('already_have_account') || 'Already have an account?'} <Link href="/login">{t('login') || 'Sign In'}</Link></p>
          </form>
          </div>
        </div>
      </div>
    </div>
  );
}
