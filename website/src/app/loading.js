export default function Loading() {
  return (
    <div className="preloader" style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.85)' }}>
      <div className="loader-ripple"><div></div><div></div></div>
    </div>
  );
}
