'use client';

import { useEffect, useRef } from 'react';

export function useScrollReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { el.classList.add('visible'); observer.unobserve(el); }
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

export function useScrollRevealAll(selector = '.wow') {
  useEffect(() => {
    const els = document.querySelectorAll(selector);
    if (!els.length) return;
    const observers = [];
    els.forEach((el) => {
      const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) { el.classList.add('visible'); observer.unobserve(el); }
      }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
      observer.observe(el);
      observers.push(observer);
    });
    return () => observers.forEach(o => o.disconnect());
  }, []);
}

export default function ScrollReveal({ children, className = '', delay = '' }) {
  const ref = useScrollReveal();
  return <div ref={ref} className={`wow ${className} ${delay}`}>{children}</div>;
}
