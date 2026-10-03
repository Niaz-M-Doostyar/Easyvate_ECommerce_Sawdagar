'use client';
import { useEffect, useRef } from 'react';
// Remember the submitted value so rerenders and failures never spend another attempt.
export default function useAutoOtpVerification({ challengeId, code, loading, ready = true, onVerify }) {
  const attempted = useRef('');
  const verify = useRef(onVerify);
  verify.current = onVerify;
  useEffect(() => {
    if (code.length !== 6 || !challengeId) { attempted.current = ''; return; }
    const key = `${challengeId}:${code}`;
    if (!ready || loading || attempted.current === key) return;
    attempted.current = key;
    verify.current();
  }, [challengeId, code, loading, ready]);
}
