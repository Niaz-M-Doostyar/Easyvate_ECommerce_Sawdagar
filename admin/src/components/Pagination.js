"use client";
export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;
  const pages = [];
  for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) pages.push(i);
  return (
    <div className="flex items-center justify-center gap-1 mt-6">
      <button onClick={() => onPageChange(page - 1)} disabled={page <= 1} className="btn btn-sm btn-outline disabled:opacity-40">Prev</button>
      {pages[0] > 1 && <><button onClick={() => onPageChange(1)} className="btn btn-sm btn-outline">1</button>{pages[0] > 2 && <span className="px-2 text-body">...</span>}</>}
      {pages.map(p => <button key={p} onClick={() => onPageChange(p)} className={`btn btn-sm ${p === page ? "btn-primary" : "btn-outline"}`}>{p}</button>)}
      {pages[pages.length-1] < totalPages && <>{pages[pages.length-1] < totalPages-1 && <span className="px-2 text-body">...</span>}<button onClick={() => onPageChange(totalPages)} className="btn btn-sm btn-outline">{totalPages}</button></>}
      <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages} className="btn btn-sm btn-outline disabled:opacity-40">Next</button>
    </div>
  );
}
