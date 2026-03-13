"use client";

export function exportCSV(url) {
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function CSVButton({ type, period, label = "Export CSV" }) {
  const handleExport = () => {
    const params = new URLSearchParams();
    if (type) params.set("type", type);
    if (period) params.set("period", period);
    exportCSV(`/api/admin/reports/csv?${params}`);
  };

  return (
    <button onClick={handleExport} className="btn btn-sm btn-outline gap-1.5">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
      </svg>
      {label}
    </button>
  );
}
