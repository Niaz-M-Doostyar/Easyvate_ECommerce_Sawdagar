"use client";

export default function GlobalError({ reset }) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-gray-50 via-white to-primary/5 min-h-screen font-body">
        <div className="min-h-screen flex items-center justify-center px-4 py-16">
          <div className="max-w-lg w-full bg-white rounded-3xl shadow-card p-8 text-center">
            <div className="w-20 h-20 rounded-3xl bg-gold/10 text-gold flex items-center justify-center mx-auto mb-5">
              <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9.303 3.376c.866 1.5-.217 3.374-1.948 3.374H4.645c-1.73 0-2.813-1.874-1.948-3.374L10.051 3.378c.866-1.5 3.032-1.5 3.898 0l7.354 12.748zM12 16.5h.008v.008H12V16.5z" /></svg>
            </div>
            <h1 className="text-3xl font-bold text-midnight font-display mb-3">Application Error</h1>
            <p className="text-body mb-6">A critical error occurred while loading Sawdagar. Please retry the page.</p>
            <button onClick={reset} className="theme-btn">Retry</button>
          </div>
        </div>
      </body>
    </html>
  );
}
