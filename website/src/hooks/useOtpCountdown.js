'use client';
import { useEffect, useState } from 'react';
export default function useOtpCountdown(deadline) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    setNow(Date.now());
    if (!deadline) return;
    const update = () => setNow(Date.now());
    const timer = setInterval(update, 250);
    document.addEventListener('visibilitychange', update);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', update); };
  }, [deadline]);
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}
