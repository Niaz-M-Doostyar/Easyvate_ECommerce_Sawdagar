"use client";
export default function GlobalError({ error, reset }) {
  return (
    <html>
      <body style={{ fontFamily: "system-ui, sans-serif", display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", margin: 0, background: "#f9fafb" }}>
        <div style={{ textAlign: "center", maxWidth: 400, padding: 24 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: "#1e293b" }}>Something went wrong</h2>
          <p style={{ color: "#64748b", fontSize: 14, marginBottom: 24 }}>{error?.message || "An unexpected error occurred."}</p>
          <button onClick={() => reset()} style={{ background: "#6366f1", color: "white", border: "none", padding: "10px 24px", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
