"use client";

import Link from "next/link";

export default function Error({ reset }) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 bg-gradient-to-br from-gray-50 via-white to-primary/5">
      <div className="max-w-lg w-full bg-white rounded-3xl shadow-card p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red/10 text-red flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9.303 3.376c.866 1.5-.217 3.374-1.948 3.374H4.645c-1.73 0-2.813-1.874-1.948-3.374L10.051 3.378c.866-1.5 3.032-1.5 3.898 0l7.354 12.748zM12 16.5h.008v.008H12V16.5z" /></svg>
        </div>
        <h2 className="text-2xl font-bold text-midnight font-display mb-3">Something went wrong</h2>
        <p className="text-body mb-6">The page hit an unexpected error. You can retry or return to the homepage.</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button onClick={reset} className="theme-btn">Try Again</button>
          <Link href="/" className="theme-btn theme-btn2">Go Home</Link>
        </div>
      </div>
    </div>
  );
}
