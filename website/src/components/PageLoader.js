"use client";
import { useEffect, useState } from 'react';

export default function PageLoader() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    const handleLoad = () => setTimeout(() => setLoading(false), 300);
    window.addEventListener('load', handleLoad);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('load', handleLoad);
    };
  }, []);

  if (!loading) return null;
  return (
    <div className="preloader">
      <div className="loader-ripple">
        <div></div>
        <div></div>
      </div>
    </div>
  );
}
