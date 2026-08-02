'use client';

import { Children, useEffect, useRef, useState } from 'react';
import Link from 'next/link';

export function StorefrontCarousel({ children, className = '', label = 'Items' }) {
  const trackRef = useRef(null);
  const items = Children.toArray(children);

  const move = (direction) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.firstElementChild;
    const distance = card ? card.getBoundingClientRect().width + 20 : track.clientWidth * 0.8;
    track.scrollBy({ left: direction * distance, behavior: 'smooth' });
  };

  if (items.length === 0) return null;

  return (
    <div className={`storefront-carousel ${className}`.trim()} aria-label={label}>
      <div className="storefront-carousel-track" ref={trackRef}>
        {items}
      </div>
      {items.length > 1 && (
        <div className="storefront-carousel-controls" aria-hidden="false">
          <button type="button" onClick={() => move(-1)} aria-label={`Previous ${label}`}>
            <i className="far fa-arrow-left" />
          </button>
          <button type="button" onClick={() => move(1)} aria-label={`Next ${label}`}>
            <i className="far fa-arrow-right" />
          </button>
        </div>
      )}
    </div>
  );
}

export function StorefrontHero({ slides, hero, currencySymbol }) {
  const [active, setActive] = useState(0);
  const safeSlides = Array.isArray(slides) ? slides : [];

  useEffect(() => {
    if (safeSlides.length < 2) return undefined;
    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % safeSlides.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [safeSlides.length]);

  if (safeSlides.length === 0) return null;
  const slide = safeSlides[active] || safeSlides[0];

  return (
    <section className="storefront-hero" aria-roledescription="carousel" aria-label="Featured offers">
      <div className="storefront-hero-glow storefront-hero-glow-one" />
      <div className="storefront-hero-glow storefront-hero-glow-two" />
      <div className="container storefront-hero-inner">
        <div className="storefront-hero-copy" key={`copy-${active}`}>
          <span className="storefront-hero-eyebrow">{slide.subtitle || `From ${currencySymbol}999`}</span>
          <h1>{slide.title}</h1>
          <p>{slide.description || hero.description || 'Discover carefully selected products from trusted sellers across Afghanistan.'}</p>
          <div className="storefront-hero-actions">
            <Link href={hero.primaryButtonHref || '/search'} className="theme-btn">
              {hero.primaryButtonLabel || 'Shop Now'} <i className="fas fa-arrow-right" />
            </Link>
            <Link href={hero.secondaryButtonHref || '/search'} className="storefront-secondary-btn">
              {hero.secondaryButtonLabel || 'Browse Categories'}
            </Link>
          </div>
          <div className="storefront-trust-row">
            <span><i className="fas fa-shield-check" /> Trusted sellers</span>
            <span><i className="fas fa-truck" /> Delivery across Afghanistan</span>
          </div>
        </div>
        <div className="storefront-hero-visual" key={`visual-${active}`}>
          <div className="storefront-hero-image-shell">
            <img src={slide.image} alt={slide.title || 'Featured product'} fetchPriority="high" />
          </div>
          <div className="storefront-hero-price">
            <small>{slide.priceLabel || 'Starting at'}</small>
            <strong>{slide.priceValue}</strong>
          </div>
        </div>
        {safeSlides.length > 1 && (
          <div className="storefront-hero-dots" role="tablist" aria-label="Choose featured offer">
            {safeSlides.map((item, index) => (
              <button
                type="button"
                key={`${item.title}-${index}`}
                className={index === active ? 'active' : ''}
                onClick={() => setActive(index)}
                aria-label={`Show offer ${index + 1}`}
                aria-selected={index === active}
                role="tab"
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function DealCountdown({ target = '2027-12-30T00:00:00' }) {
  const calculate = () => {
    const remaining = Math.max(0, new Date(target).getTime() - Date.now());
    return {
      days: Math.floor(remaining / 86400000),
      hours: Math.floor((remaining / 3600000) % 24),
      mins: Math.floor((remaining / 60000) % 60),
      secs: Math.floor((remaining / 1000) % 60),
    };
  };
  const [time, setTime] = useState(calculate);

  useEffect(() => {
    const timer = window.setInterval(() => setTime(calculate()), 1000);
    return () => window.clearInterval(timer);
  }, [target]);

  return (
    <div className="storefront-countdown" aria-label="Deal countdown">
      {Object.entries(time).map(([label, value]) => (
        <div key={label}><strong>{String(value).padStart(2, '0')}</strong><span>{label}</span></div>
      ))}
    </div>
  );
}
