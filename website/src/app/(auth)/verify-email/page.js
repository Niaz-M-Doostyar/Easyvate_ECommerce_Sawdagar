"use client";
import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [status, setStatus] = useState("loading");
  const [successMessage, setSuccessMessage] = useState("Your email has been verified successfully. You can now sign in.");
  const [error, setError] = useState("");
  const [resendEmail, setResendEmail] = useState("");
  const [resendStatus, setResendStatus] = useState("");
  const [resendError, setResendError] = useState("");
  const verifiedRef = useRef(false);

  useEffect(() => {
    verifiedRef.current = false;

    if (!token) {
      setError("Missing verification token. Please use the link from your email.");
      setStatus("error");
      return;
    }

    // If we've already verified this token locally, treat as success to avoid
    // React Strict Mode double-effects or reloading after success.
    try {
      const hasVerified = window.localStorage.getItem(`sawdagar_verified_${token}`);
      if (hasVerified) {
        const storedMessage = window.localStorage.getItem(`sawdagar_verified_${token}_message`);
        if (storedMessage) setSuccessMessage(storedMessage);
        setStatus("success");
        return;
      }
    } catch {
      // ignore storage errors
    }

    fetch(`/api/auth/verify-email?token=${token}`)
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));

        if (r.ok) {
          verifiedRef.current = true;
          try {
            window.localStorage.setItem(`sawdagar_verified_${token}`, "1");
            if (data.message) {
              window.localStorage.setItem(`sawdagar_verified_${token}_message`, data.message);
            }
          } catch {
            // ignore
          }
          setSuccessMessage(data.message || "Your email has been verified successfully. You can now sign in.");
          setStatus("success");
          return;
        }

        if (verifiedRef.current) return;

        setError(data.error || "The link is invalid or has expired. Try registering again.");
        setStatus("error");
      })
      .catch(() => {
        if (verifiedRef.current) return;
        setError("Unable to verify your email. Please check your connection and try again.");
        setStatus("error");
      });
  }, [token]);

  return (
    <div className="f2-auth-state" aria-live="polite">
      {status === "loading" && (
        <>
          <span className="f2-content-spinner f2-content-spinner--large" aria-hidden="true" />
          <h2>Verifying Your Email...</h2>
          <p>Please wait a moment</p>
        </>
      )}
      {status === "success" && (
        <>
          <div className="f2-auth-state__icon f2-auth-state__icon--success"><svg fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
          <h2>Email Verified!</h2>
          <p>{successMessage}</p>
          <Link href="/login" className="f2-content-button">Sign In</Link>
        </>
      )}
      {status === "error" && (
        <>
          <div className="f2-auth-state__icon f2-auth-state__icon--error"><svg fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg></div>
          <h2>Verification Failed</h2>
          <p>{error || "The link is invalid or has expired. Try registering again."}</p>

          <div className="f2-auth-state__actions">
            <Link href="/login" className="f2-content-button f2-content-button--wide">Go to Login</Link>

            <div className="f2-resend-card">
              <p>Enter your email to receive a new verification link.</p>
              <div className="f2-resend-card__form">
                <label className="f2-sr-only" htmlFor="resend-email">Email address</label>
                <input
                  id="resend-email"
                  value={resendEmail}
                  onChange={(e) => setResendEmail(e.target.value)}
                  placeholder="you@example.com"
                  type="email"
                  autoComplete="email"
                />
                <button
                  type="button"
                  onClick={async () => {
                    setResendStatus("");
                    setResendError("");
                    try {
                      const r = await fetch('/api/auth/resend-verification', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: resendEmail }),
                      });
                      const data = await r.json();
                      if (r.ok) {
                        setResendStatus(data.message || 'Verification email sent');
                      } else {
                        setResendError(data.error || 'Failed to send verification email');
                      }
                    } catch {
                      setResendError('Failed to send verification email');
                    }
                  }}
                  className="f2-content-button f2-content-button--compact"
                >
                  Resend
                </button>
              </div>
              {resendStatus && <p className="f2-content-feedback f2-content-feedback--success" role="status">{resendStatus}</p>}
              {resendError && <p className="f2-content-feedback f2-content-feedback--error" role="alert">{resendError}</p>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="f2-content-page f2-auth-page">
      <div className="f2-auth-shell">
        <div className="f2-auth-panel animate-fade-up">
          <header className="f2-auth-heading f2-auth-heading--compact">
            <Link href="/" className="f2-auth-brand" aria-label="Sawdagar home">
              <span className="f2-auth-brand__mark" aria-hidden="true">S</span>
              <span className="f2-auth-brand__name">Sawdagar</span>
            </Link>
            <span className="f2-content-eyebrow">Email verification</span>
          </header>
          <div className="f2-auth-card">
          <Suspense fallback={<div className="f2-content-loading" role="status"><span className="f2-content-spinner" aria-hidden="true" />Loading...</div>}><VerifyContent /></Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}
