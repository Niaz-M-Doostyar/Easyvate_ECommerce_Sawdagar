export default function Loading() {
  return (
    <main className="sv-route-loading" aria-label="Loading page" aria-live="polite">
      <div className="container">
        <div className="sv-loading-hero" />
        <div className="sv-loading-heading" />
        <div className="sv-loading-grid">
          {Array.from({ length: 8 }, (_, index) => (
            <div className="sv-loading-card" key={index}>
              <div className="sv-loading-image" />
              <div className="sv-loading-line sv-loading-line-short" />
              <div className="sv-loading-line" />
            </div>
          ))}
        </div>
        <span className="visually-hidden">Loading Sawdagar</span>
      </div>
    </main>
  );
}
