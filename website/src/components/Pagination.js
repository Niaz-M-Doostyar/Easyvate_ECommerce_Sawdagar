"use client";
export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;
  const pages = [];
  for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) pages.push(i);
  return (
    <div className="pagination-area mt-50">
      <nav aria-label="Page navigation">
        <ul className="pagination">
          <li className={`page-item${page <= 1 ? ' disabled' : ''}`}>
            <a className="page-link" href="#" aria-label="Previous" onClick={(e) => { e.preventDefault(); if (page > 1) onPageChange(page - 1); }}>
              <span aria-hidden="true"><i className="far fa-arrow-left"></i></span>
            </a>
          </li>
          {pages[0] > 1 && (
            <>
              <li className="page-item">
                <a className="page-link" href="#" onClick={(e) => { e.preventDefault(); onPageChange(1); }}>1</a>
              </li>
              {pages[0] > 2 && <li className="page-item"><span className="page-link">...</span></li>}
            </>
          )}
          {pages.map(p => (
            <li key={p} className={`page-item${p === page ? ' active' : ''}`}>
              <a className="page-link" href="#" onClick={(e) => { e.preventDefault(); onPageChange(p); }}>{p}</a>
            </li>
          ))}
          {pages[pages.length - 1] < totalPages && (
            <>
              {pages[pages.length - 1] < totalPages - 1 && <li className="page-item"><span className="page-link">...</span></li>}
              <li className="page-item">
                <a className="page-link" href="#" onClick={(e) => { e.preventDefault(); onPageChange(totalPages); }}>{totalPages}</a>
              </li>
            </>
          )}
          <li className={`page-item${page >= totalPages ? ' disabled' : ''}`}>
            <a className="page-link" href="#" aria-label="Next" onClick={(e) => { e.preventDefault(); if (page < totalPages) onPageChange(page + 1); }}>
              <span aria-hidden="true"><i className="far fa-arrow-right"></i></span>
            </a>
          </li>
        </ul>
      </nav>
    </div>
  );
}
