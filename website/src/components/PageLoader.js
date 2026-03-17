"use client";
import { useEffect, useState } from 'react';

export default function PageLoader() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Hide immediately if page already loaded
    if (document.readyState === 'complete') {
      setLoading(false);
      return;
    }
    const handleLoad = () => setLoading(false);
    window.addEventListener('load', handleLoad);
    // Safety timeout — never block longer than 200ms
    const timer = setTimeout(() => setLoading(false), 200);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('load', handleLoad);
    };
  }, []);

  if (!loading) return null;
  return (
    <div className="preloader" aria-hidden="true">
      <div className="loader-ripple">
        <div></div>
        <div></div>
      </div>
    </div>
  );
}
