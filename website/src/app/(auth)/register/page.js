"use client";
import { nationalPhone, internationalPhone } from '@/lib/afghanPhone.cjs';
import useAutoOtpVerification from '@/hooks/useAutoOtpVerification';
import useOtpCountdown from '@/hooks/useOtpCountdown';
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/contexts/ToastContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSiteData } from "@/contexts/SiteDataContext";
import { AFGHANISTAN_PROVINCES } from "@/data/afghanistanProvinces";

import { OtpMethodPicker, OtpVerification } from '@/components/OtpControls';

export default function RegisterPage() {
  const toast = useToast();
  const router = useRouter();
  const { t } = useLanguage();
  const { siteContent } = useSiteData();
  const logoUrl = (siteContent?.header?.logo || "").trim() || "/assets/img/logo/sawdagar.png";
  const [role, setRole] = useState("customer");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({ firstName: "", lastName: "", fullName: "", email: "", phone: "", password: "", confirmPassword: "", companyName: "", companyAddress: "", province: "" });
  const [challengeId, setChallengeId] = useState("");
  const [code, setCode] = useState("");
  const [channel, setChannel] = useState("sms");
  const [sentChannel, setSentChannel] = useState("sms");
  const [expiresAt, setExpiresAt] = useState(0);
  const [retryAt, setRetryAt] = useState(0);
  const retrySeconds = useOtpCountdown(retryAt);
  const customerRequest = async (path, body) => {
    const response = await fetch(`/api/auth/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.error || 'Request failed');
      error.status = response.status;
      error.data = data;
      throw error;
    }
    return data;
  };
  const requestCode = async () => {
    if (Date.now() < retryAt) throw new Error(`Try again in ${Math.ceil((retryAt - Date.now()) / 1000)} seconds.`);
    try {
      const data = await customerRequest('customer-otp', { ...form, role, channel });
      setChallengeId(data.challengeId);
      setCode(""); setSentChannel(channel); setExpiresAt(Date.now() + (data.expiresIn || 300) * 1000);
      setRetryAt(Date.now() + data.retryAfter * 1000);
      toast.success(data.message);
    } catch (error) {
      const retryAfter = Number(error.data?.retryAfter);
      if (Number.isFinite(retryAfter) && retryAfter > 0) setRetryAt(Date.now() + retryAfter * 1000);
      throw error;
    }
  };
  const resendCode = async () => {
    if (loading) return;
    setLoading(true); setFormError('');
    try { await requestCode(); } catch (err) { setFormError(err.message); }
    finally { setLoading(false); }
  };
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
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
    try {
      if (!challengeId) await requestCode();
      else {
        const data = await customerRequest('verify-customer-otp', { challengeId, code });
        toast.success(data.message); router.push('/login');
      }
    } catch (err) { setFormError(err.message); toast.error(err.message); }
    finally { setLoading(false); }
  };

  useAutoOtpVerification({ challengeId, code, loading, onVerify: () => handleSubmit({ preventDefault() {} }) });

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
            <p>{challengeId ? 'Enter the code to finish creating your account.' : 'A few details, then a quick phone verification.'}</p>
          </header>

          <div className="f2-auth-card">
          <div className="f2-role-picker" aria-label="Account type" style={{ display: challengeId ? 'none' : undefined }}>
            <button
              type="button"
              className={`f2-role-option${role === 'customer' ? ' active' : ''}`}
              onClick={() => { setRole('customer'); setChallengeId(''); setCode(''); }} disabled={loading}
              aria-pressed={role === 'customer'}
            >
              <i className="far fa-user"></i> {t('register_as_customer') || 'Customer'}
            </button>
            <button
              type="button"
              className={`f2-role-option${role === 'supplier' ? ' active' : ''}`}
              onClick={() => { setRole('supplier'); setChallengeId(''); setCode(''); }} disabled={loading}
              aria-pressed={role === 'supplier'}
            >
              <i className="far fa-store"></i> {t('register_as_supplier') || 'Supplier'}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="f2-content-form" aria-busy={loading}>
            <fieldset disabled={loading || !!challengeId} style={{ border: 0, padding: 0, margin: 0, display: challengeId ? 'none' : undefined }}>
            {role === 'customer' ? <div className="f2-content-form-grid">
              <div className="f2-content-field"><label htmlFor="first-name"><i className="far fa-user" aria-hidden="true" /> First name *</label><input id="first-name" autoComplete="given-name" value={form.firstName} onChange={e => set('firstName', e.target.value)} maxLength={80} required /></div>
              <div className="f2-content-field"><label htmlFor="last-name"><i className="far fa-user" aria-hidden="true" /> Last name *</label><input id="last-name" autoComplete="family-name" value={form.lastName} onChange={e => set('lastName', e.target.value)} maxLength={80} required /></div>
            </div> : <div className="f2-content-field">
              <label htmlFor="register-name">{t('full_name') || 'Full name'} *</label>
              <input id="register-name" type="text" placeholder={t('full_name') || 'Full name'} value={form.fullName} onChange={e => set("fullName", e.target.value)} autoComplete="name" required />
            </div>}

            <div className="f2-content-form-grid">
              {role === 'supplier' && <div className="f2-content-field">
                <label htmlFor="register-email">{t('email') || 'Email'} (optional)</label>
                <input id="register-email" type="email" placeholder={t('email') || 'Email'} value={form.email} onChange={e => set("email", e.target.value)} autoComplete="email" />
              </div>}
              <div className="f2-content-field">
                <label htmlFor="register-phone">{role === 'customer' ? 'Afghanistan phone (+93)' : (t('phone') || 'Phone')} *</label>
                <div style={{display:"flex",alignItems:"center",gap:10,border:"1px solid #d5dfeb",borderRadius:12,paddingLeft:14}}><span style={{whiteSpace:"nowrap",fontWeight:600}} aria-label="Afghanistan country code">🇦🇫 +93</span><input id="register-phone" type="tel" inputMode="tel" placeholder="7XX XXX XXX" value={nationalPhone(form.phone)} onChange={e => set("phone", internationalPhone(e.target.value))} autoComplete="tel-national" pattern="7[0-9]{8}" maxLength={16} style={{border:0,minWidth:0}} aria-describedby="phone-help" required /></div><small id="phone-help">Enter 9 digits starting with 7. Pasting 07… or +93… works too.</small>
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
                <input id="register-password" type="password" minLength={6} maxLength={72} placeholder={t('password') || 'Password'} value={form.password} onChange={e => set("password", e.target.value)} autoComplete="new-password" required />
              </div>
              <div className="f2-content-field">
                <label htmlFor="register-confirm">{t('confirm_password') || 'Confirm password'} *</label>
                <input id="register-confirm" type="password" maxLength={72} placeholder={t('confirm_password') || 'Confirm password'} value={form.confirmPassword} onChange={e => set("confirmPassword", e.target.value)} autoComplete="new-password" required />
              </div>
            </div>

            </fieldset>
              {challengeId && <OtpVerification code={code} onChange={setCode} phone={form.phone} sentChannel={sentChannel} channel={channel} retryAt={retryAt} expiresAt={expiresAt} onResend={resendCode} onEdit={() => { setChallengeId(''); setCode(''); setFormError(''); }} loading={loading} />}
              <OtpMethodPicker value={channel} onChange={setChannel} disabled={loading} verifying={!!challengeId} />
            <div className="f2-content-check" style={{ display: challengeId ? 'none' : undefined }}>
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

            {challengeId ? <p role="status" aria-live="polite" style={{textAlign:"center"}}>{loading ? 'Checking your code…' : formError ? 'Edit the code to try again.' : 'Your code will be checked automatically.'}</p> : <button type="submit" className="f2-content-button f2-content-button--wide" disabled={loading || retrySeconds > 0}>
              {loading ? 'Please wait...' : retrySeconds > 0 ? `Try again in ${retrySeconds}s` : 'Send verification code'}
            </button>}

            <p className="f2-auth-alternative">{t('already_have_account') || 'Already have an account?'} <Link href="/login">{t('login') || 'Sign In'}</Link></p>
          </form>
          </div>
        </div>
      </div>
    </div>
  );
}
