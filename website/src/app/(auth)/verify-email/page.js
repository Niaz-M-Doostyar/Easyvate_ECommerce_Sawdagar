"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    if (!token) { setStatus("error"); return; }
    fetch(`/api/auth/verify-email?token=${token}`)
      .then(r => { if (r.ok) setStatus("success"); else setStatus("error"); })
      .catch(() => setStatus("error"));
  }, [token]);

  return (
    <div className="text-center py-6">
      {status === "loading" && (
        <>
          <div className="w-16 h-16 border-4 border-gray-200 border-t-gold rounded-full animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-bold text-midnight mb-2">Verifying Your Email...</h3>
          <p className="text-body text-sm">Please wait a moment</p>
        </>
      )}
      {status === "success" && (
        <>
          <div className="w-16 h-16 bg-green/10 rounded-full flex items-center justify-center mx-auto mb-4"><svg className="w-8 h-8 text-green" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
          <h3 className="text-lg font-bold text-midnight mb-2">Email Verified!</h3>
          <p className="text-body text-sm mb-6">Your email has been verified successfully. You can now sign in.</p>
          <Link href="/login" className="theme-btn inline-flex">Sign In</Link>
        </>
      )}
      {status === "error" && (
        <>
          <div className="w-16 h-16 bg-red/10 rounded-full flex items-center justify-center mx-auto mb-4"><svg className="w-8 h-8 text-red" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg></div>
          <h3 className="text-lg font-bold text-midnight mb-2">Verification Failed</h3>
          <p className="text-body text-sm mb-6">The link is invalid or has expired. Try registering again.</p>
          <Link href="/register" className="theme-btn inline-flex">Register Again</Link>
        </>
      )}
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-primary/5 flex items-center justify-center py-20 px-4">
      <div className="w-full max-w-md animate-fade-up">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-6">
            <div className="w-12 h-12 bg-gold rounded-xl flex items-center justify-center shadow-lg shadow-gold/20"><span className="text-white font-extrabold text-2xl font-display">S</span></div>
            <span className="text-2xl font-extrabold text-midnight font-display">Sawdagar</span>
          </Link>
        </div>
        <div className="bg-white rounded-2xl shadow-card p-8">
          <Suspense fallback={<div className="text-center py-8 text-body">Loading...</div>}><VerifyContent /></Suspense>
        </div>
      </div>
    </div>
  );
}
