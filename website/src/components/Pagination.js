"use client";

export default function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;

  const visiblePages = [];
  const firstVisible = Math.max(1, page - 2);
  const lastVisible = Math.min(totalPages, page + 2);

  for (let current = firstVisible; current <= lastVisible; current += 1) {
    visiblePages.push(current);
  }

  const goToPage = (nextPage) => {
    if (nextPage < 1 || nextPage > totalPages || nextPage === page) return;
    onPageChange(nextPage);
  };

  return (
    <nav className="swd-pagination" aria-label="Product results pagination">
      <button
        type="button"
        className="swd-pagination__arrow"
        onClick={() => goToPage(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
      >
        <i className="far fa-arrow-left" aria-hidden="true" />
      </button>

      <div className="swd-pagination__pages">
        {firstVisible > 1 && (
          <>
            <button type="button" onClick={() => goToPage(1)} aria-label="Go to page 1">
              1
            </button>
            {firstVisible > 2 && <span className="swd-pagination__ellipsis" aria-hidden="true">...</span>}
          </>
        )}

        {visiblePages.map((current) => (
          <button
            type="button"
            key={current}
            className={current === page ? "is-current" : ""}
            onClick={() => goToPage(current)}
            aria-label={`Go to page ${current}`}
            aria-current={current === page ? "page" : undefined}
          >
            {current}
          </button>
        ))}

        {lastVisible < totalPages && (
          <>
            {lastVisible < totalPages - 1 && <span className="swd-pagination__ellipsis" aria-hidden="true">...</span>}
            <button
              type="button"
              onClick={() => goToPage(totalPages)}
              aria-label={`Go to page ${totalPages}`}
            >
              {totalPages}
            </button>
          </>
        )}
      </div>

      <button
        type="button"
        className="swd-pagination__arrow"
        onClick={() => goToPage(page + 1)}
        disabled={page >= totalPages}
        aria-label="Next page"
      >
        <i className="far fa-arrow-right" aria-hidden="true" />
      </button>
    </nav>
  );
}
