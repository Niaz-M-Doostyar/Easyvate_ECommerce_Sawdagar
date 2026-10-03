import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
export default function useOtpCountdown(deadline) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    setNow(Date.now());
    if (!deadline) return;
    const update = () => setNow(Date.now());
    const timer = setInterval(update, 250);
    const listener = AppState.addEventListener('change', update);
    return () => { clearInterval(timer); listener.remove(); };
  }, [deadline]);
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}
