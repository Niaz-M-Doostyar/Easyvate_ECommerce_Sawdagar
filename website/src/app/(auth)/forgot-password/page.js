"use client";
import useAutoOtpVerification from '@/hooks/useAutoOtpVerification';
import useOtpCountdown from '@/hooks/useOtpCountdown';
import { useState } from "react";
import Link from "next/link";
import { useToast } from "@/contexts/ToastContext";

import { OtpMethodPicker, OtpVerification } from '@/components/OtpControls';

export default function ForgotPasswordPage() {
  const toast = useToast();
  const [identifier, setIdentifier] = useState("");
  const [channel, setChannel] = useState('sms');
  const [challengeId, setChallengeId] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [sent, setSent] = useState(false);
  const [sentChannel, setSentChannel] = useState('sms');
  const [expiresAt, setExpiresAt] = useState(0);
  const [retryAt, setRetryAt] = useState(0);
  const retrySeconds = useOtpCountdown(retryAt);
  const isPhone = !identifier.includes('@');
  async function request(path, body) {
    const response = await fetch(`/api/auth/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data.error || 'Request failed');
      error.status = response.status;
      error.data = data;
      throw error;
    }
    return data;
  }
  async function sendCode() {
    if (Date.now() < retryAt) throw new Error(`Try again in ${Math.ceil((retryAt - Date.now()) / 1000)} seconds.`);
    try {
      const data = await request('customer-otp', { phone: identifier, channel, purpose: 'password-reset' });
      setChallengeId(data.challengeId); setCode(''); setSentChannel(data.channel || channel); setExpiresAt(Date.now() + (data.expiresIn || 300) * 1000); setRetryAt(Date.now() + data.retryAfter * 1000); toast.success(data.message);
    } catch (error) {
      const retryAfter = Number(error.data?.retryAfter);
      if (Number.isFinite(retryAfter) && retryAfter > 0) setRetryAt(Date.now() + retryAfter * 1000);
      throw error;
    }
  }
  const handleSubmit = async e => {
    e.preventDefault(); if (loading) return; setVerificationError(''); setLoading(true);
    try {
      if (isPhone) {
        if (!challengeId) await sendCode();
        else { const data = await request('reset-phone-password', { challengeId, code, password, confirmPassword }); toast.success(data.message); setSent(true); }
      } else { await request('forgot-password', { email: identifier.trim() }); setSent(true); }
    } catch (err) { setVerificationError(err.message); toast.error(err.message); }
    finally { setLoading(false); }
  };
  const resend = async () => {
    if (loading) return;
    setLoading(true); setVerificationError('');
    try { await sendCode(); } catch (err) { setVerificationError(err.message); toast.error(err.message); }
    finally { setLoading(false); }
  };
  useAutoOtpVerification({ challengeId, code, loading, ready: !sent && password.length >= 6 && password.length <= 72 && password === confirmPassword, onVerify: () => handleSubmit({preventDefault() {}}) });
  return <div className="f2-content-page f2-auth-page"><div className="f2-auth-shell"><div className="f2-auth-panel animate-fade-up">
    <header className="f2-auth-heading"><Link href="/" className="f2-auth-brand"><span className="f2-auth-brand__name">Sawdagar</span></Link><span className="f2-content-eyebrow">Account recovery</span><h1>Forgot Password</h1><p>Use your Afghan phone number for OTP recovery, or your email for a reset link.</p></header>
    <div className="f2-auth-card">{sent ? <div className="f2-auth-state f2-auth-state--success" role="status"><h2>{isPhone ? 'Password updated' : 'Check your email'}</h2><p>{isPhone ? 'Sign in with your phone number and new password.' : 'If this email is registered, a reset link has been sent.'}</p><Link href="/login" className="f2-content-button">Back to Login</Link></div> :
      <form onSubmit={handleSubmit} className="f2-content-form" aria-busy={loading}>
        <div className="f2-content-field" style={{display:challengeId ? 'none' : undefined}}><label htmlFor="recovery-identifier">Afghanistan phone or email</label><input id="recovery-identifier" type="text" value={identifier} onChange={e => setIdentifier(e.target.value)} autoComplete="username" placeholder="0700123456 or email" disabled={loading || !!challengeId} required /></div>
        {challengeId && <>
          <div className="f2-content-field"><label htmlFor="recovery-password">New password</label><input id="recovery-password" type="password" autoComplete="new-password" minLength={6} maxLength={72} value={password} onChange={e => setPassword(e.target.value)} required /></div>
          <div className="f2-content-field"><label htmlFor="recovery-confirm">Confirm password</label><input id="recovery-confirm" type="password" autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required /></div>
          <OtpVerification code={code} onChange={setCode} phone={identifier} sentChannel={sentChannel} channel={channel} retryAt={retryAt} expiresAt={expiresAt} onResend={resend} onEdit={() => { setChallengeId(''); setCode(''); }} loading={loading} />
        </>}
        {isPhone && <OtpMethodPicker value={channel} onChange={setChannel} disabled={loading} verifying={!!challengeId} />}
        {verificationError && <div className="f2-content-alert f2-content-alert--error" role="alert">{verificationError}</div>}
        {challengeId ? <div aria-live="polite"><p>{loading ? 'Checking your code…' : password !== confirmPassword || password.length < 6 ? 'Choose and confirm your new password, then enter the code.' : 'Your code will be checked automatically. Edit it to retry.'}</p></div> : <button type="submit" disabled={loading || (isPhone && retrySeconds > 0)} className="f2-content-button f2-content-button--wide">{loading ? 'Please wait...' : isPhone ? (retrySeconds > 0 ? `Try again in ${retrySeconds}s` : 'Send verification code') : 'Send reset link'}</button>}
        <p className="f2-auth-alternative">Remember your password? <Link href="/login">Sign In</Link></p>
      </form>}
    </div></div></div></div>;
}
