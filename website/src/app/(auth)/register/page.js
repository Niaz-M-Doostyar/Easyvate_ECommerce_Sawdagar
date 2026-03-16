"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSiteData } from "@/contexts/SiteDataContext";

export default function RegisterPage() {
  const { register } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const { t } = useLanguage();
  const { siteContent } = useSiteData();
  const logoUrl = (siteContent?.header?.logo || "").trim() || "/assets/img/logo/logo.png";
  const [role, setRole] = useState("customer");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", password: "", confirmPassword: "", companyName: "", companyAddress: "" });
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
    if (role === "supplier") { body.companyName = form.companyName; body.companyAddress = form.companyAddress; }
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
    <>
      <div className="site-breadcrumb">
        <div className="site-breadcrumb-bg" style={{ background: "url(/assets/img/breadcrumb/01.jpg)" }} />
        <div className="container">
          <div className="site-breadcrumb-wrap">
            <h4 className="breadcrumb-title">{t('register')}</h4>
            <ul className="breadcrumb-menu">
              <li><Link href="/"><i className="far fa-home"></i> Home</Link></li>
              <li className="active">{t('register')}</li>
            </ul>
          </div>
        </div>
      </div>

    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary/5 flex items-center justify-center py-20 px-4">
      <div className="w-full max-w-lg animate-fade-up">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <img src={logoUrl} alt="Sawdagar" className="h-12 object-contain" />
            <span className="text-2xl font-extrabold text-midnight font-display">Sawdagar</span>
          </Link>
          <h2 className="text-2xl font-bold text-midnight font-display">{t('register')}</h2>
          <p className="text-body mt-2">Create your Sawdagar account in seconds</p>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-8">
          <div className="flex flex-wrap gap-2 justify-center mb-6">
            <button
              type="button"
              className={`role-btn${role === 'customer' ? ' active' : ''}`}
              onClick={() => setRole('customer')}
            >
              <i className="far fa-user"></i> {t('register_as_customer') || 'Customer'}
            </button>
            <button
              type="button"
              className={`role-btn${role === 'supplier' ? ' active' : ''}`}
              onClick={() => setRole('supplier')}
            >
              <i className="far fa-store"></i> {t('register_as_supplier') || 'Supplier'}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-semibold text-midnight mb-1.5 block font-display">{t('full_name')} *</label>
              <input type="text" className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-midnight placeholder:text-body focus:border-theme-color focus:outline-none focus:ring-2 focus:ring-theme-color/30" placeholder={t('full_name')} value={form.fullName} onChange={e => set("fullName", e.target.value)} required />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-midnight mb-1.5 block font-display">{t('email')} *</label>
                <input type="email" className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-midnight placeholder:text-body focus:border-theme-color focus:outline-none focus:ring-2 focus:ring-theme-color/30" placeholder={t('email')} value={form.email} onChange={e => set("email", e.target.value)} required />
              </div>
              <div>
                <label className="text-sm font-semibold text-midnight mb-1.5 block font-display">{t('phone')} *</label>
                <input type="tel" className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-midnight placeholder:text-body focus:border-theme-color focus:outline-none focus:ring-2 focus:ring-theme-color/30" placeholder="07XXXXXXXX" value={form.phone} onChange={e => set("phone", e.target.value)} required />
              </div>
            </div>

            {role === 'supplier' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-midnight mb-1.5 block font-display">{t('company_name')} *</label>
                  <input type="text" className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-midnight placeholder:text-body focus:border-theme-color focus:outline-none focus:ring-2 focus:ring-theme-color/30" placeholder={t('company_name')} value={form.companyName} onChange={e => set("companyName", e.target.value)} required />
                </div>
                <div>
                  <label className="text-sm font-semibold text-midnight mb-1.5 block font-display">Company Address</label>
                  <input type="text" className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-midnight placeholder:text-body focus:border-theme-color focus:outline-none focus:ring-2 focus:ring-theme-color/30" placeholder="Company address" value={form.companyAddress} onChange={e => set("companyAddress", e.target.value)} />
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-midnight mb-1.5 block font-display">{t('password')} *</label>
                <input type="password" className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-midnight placeholder:text-body focus:border-theme-color focus:outline-none focus:ring-2 focus:ring-theme-color/30" placeholder={t('password')} value={form.password} onChange={e => set("password", e.target.value)} required />
              </div>
              <div>
                <label className="text-sm font-semibold text-midnight mb-1.5 block font-display">{t('confirm_password')} *</label>
                <input type="password" className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-midnight placeholder:text-body focus:border-theme-color focus:outline-none focus:ring-2 focus:ring-theme-color/30" placeholder={t('confirm_password')} value={form.confirmPassword} onChange={e => set("confirmPassword", e.target.value)} required />
              </div>
            </div>

            <div className="form-check mb-3">
              <input className="form-check-input" type="checkbox" id="terms" required />
              <label className="form-check-label text-sm text-body" htmlFor="terms">
                I agree to the <a href="#" className="text-gold">Terms of Service</a> and <a href="#" className="text-gold">Privacy Policy</a>
              </label>
            </div>

            {formError && (
              <div className="alert alert-danger mb-3" role="alert">
                {formError}
              </div>
            )}

            <button type="submit" className="theme-btn w-full justify-center text-base py-3.5 disabled:opacity-60" disabled={loading}>
              {loading ? `${t('sending') || 'Creating...'} ` : `${t('register')}`}
            </button>

            <p className="text-center text-sm text-body">{t('already_have_account')} <Link href="/login" className="font-semibold text-gold">{t('login')}</Link></p>
          </form>
        </div>
      </div>
    </div>
    </>
  );
}
