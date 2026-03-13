"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { useLanguage } from "@/contexts/LanguageContext";

export default function RegisterPage() {
  const { register } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const { t } = useLanguage();
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
      {/* Breadcrumb */}
      <div className="site-breadcrumb">
        <div className="site-breadcrumb-bg" style={{ background: 'url(/assets/img/breadcrumb/01.jpg)' }}></div>
        <div className="container">
          <div className="site-breadcrumb-wrap">
            <h4 className="breadcrumb-title">{t('register')}</h4>
            <ul className="breadcrumb-menu">
              <li><Link href="/"><i className="far fa-home"></i> {t('home')}</Link></li>
              <li className="active">{t('register')}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Register Area */}
      <div className="login-area py-100">
        <div className="container">
          <div className="col-md-8 col-lg-6 mx-auto">
            <div className="login-form">
              <div className="login-header">
                <img src="/assets/img/logo/logo.png" alt="Sawdagar" />
                <p>Create your Sawdagar account</p>
              </div>

              {/* Role Tabs */}
              <div className="d-flex gap-2 mb-4">
                <button
                  type="button"
                  className={`theme-btn ${role === 'customer' ? '' : 'theme-btn2'} flex-fill`}
                  onClick={() => setRole('customer')}
                >
                  <i className="far fa-user"></i> {t('register_as_customer') || 'Customer'}
                </button>
                <button
                  type="button"
                  className={`theme-btn ${role === 'supplier' ? '' : 'theme-btn2'} flex-fill`}
                  onClick={() => setRole('supplier')}
                >
                  <i className="far fa-store"></i> {t('register_as_supplier') || 'Supplier'}
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>{t('full_name')} *</label>
                  <input type="text" className="form-control" placeholder={t('full_name')} value={form.fullName} onChange={e => set("fullName", e.target.value)} required />
                </div>
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label>{t('email')} *</label>
                      <input type="email" className="form-control" placeholder={t('email')} value={form.email} onChange={e => set("email", e.target.value)} required />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label>{t('phone')} *</label>
                      <input type="tel" className="form-control" placeholder="07XXXXXXXX" value={form.phone} onChange={e => set("phone", e.target.value)} required />
                    </div>
                  </div>
                </div>
                {role === "supplier" && (
                  <div className="row">
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>{t('company_name')} *</label>
                        <input type="text" className="form-control" placeholder={t('company_name')} value={form.companyName} onChange={e => set("companyName", e.target.value)} required />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="form-group">
                        <label>Company Address</label>
                        <input type="text" className="form-control" placeholder="Company address" value={form.companyAddress} onChange={e => set("companyAddress", e.target.value)} />
                      </div>
                    </div>
                  </div>
                )}
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label>{t('password')} *</label>
                      <input type="password" className="form-control" placeholder={t('password')} value={form.password} onChange={e => set("password", e.target.value)} required />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label>{t('confirm_password')} *</label>
                      <input type="password" className="form-control" placeholder={t('confirm_password')} value={form.confirmPassword} onChange={e => set("confirmPassword", e.target.value)} required />
                    </div>
                  </div>
                </div>
                <div className="form-check mb-4">
                  <input className="form-check-input" type="checkbox" id="terms" required />
                  <label className="form-check-label" htmlFor="terms">
                    I agree to the <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>
                  </label>
                </div>
                {formError && (
                  <div className="alert alert-danger mb-3" role="alert">
                    {formError}
                  </div>
                )}
                <div className="d-flex align-items-center">
                  <button type="submit" className="theme-btn" disabled={loading}>
                    {loading ? (
                      <><i className="fas fa-spinner fa-spin"></i> Creating Account...</>
                    ) : (
                      <><i className="far fa-user-plus"></i> {t('register')}</>
                    )}
                  </button>
                </div>
              </form>
              <div className="login-footer">
                <p>{t('already_have_account')} <Link href="/login">{t('login')}</Link></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
