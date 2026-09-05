'use client';

import { Children, useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { responsiveImage } from '@/lib/image';

export function StorefrontCarousel({ children, className = '', label = 'Items' }) {
  const trackRef = useRef(null);
  const trackId = useId();
  const items = Children.toArray(children);

  const move = (direction) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.firstElementChild;
    const styles = window.getComputedStyle(track);
    const gap = Number.parseFloat(styles.columnGap || styles.gap || '0');
    const distance = card ? card.getBoundingClientRect().width + gap : track.clientWidth * 0.82;
    const rtlMultiplier = styles.direction === 'rtl' ? -1 : 1;
    track.scrollBy({ left: direction * distance * rtlMultiplier, behavior: 'smooth' });
  };

  if (items.length === 0) return null;

  return (
    <div className={`storefront-carousel ${className}`.trim()} role="region" aria-label={label}>
      <div
        className="storefront-carousel-track"
        id={trackId}
        ref={trackRef}
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft') move(-1);
          if (event.key === 'ArrowRight') move(1);
        }}
      >
        {items}
      </div>
      {items.length > 1 && (
        <div className="storefront-carousel-controls">
          <button type="button" onClick={() => move(-1)} aria-label={`Previous ${label}`} aria-controls={trackId}>
            <i className="far fa-arrow-left" aria-hidden="true" />
          </button>
          <button type="button" onClick={() => move(1)} aria-label={`Next ${label}`} aria-controls={trackId}>
            <i className="far fa-arrow-right" aria-hidden="true" />
          </button>
        </div>
      )}
    </div>
  );
}

export function StorefrontHero({ slides, hero = {} }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const slideId = useId();
  const safeSlides = Array.isArray(slides) ? slides.filter(Boolean) : [];

  useEffect(() => {
    if (active >= safeSlides.length) setActive(0);
  }, [active, safeSlides.length]);

  useEffect(() => {
    if (safeSlides.length < 2 || paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const timer = window.setInterval(() => setActive((current) => (current + 1) % safeSlides.length), 7000);
    return () => window.clearInterval(timer);
  }, [paused, safeSlides.length]);

  if (safeSlides.length === 0) return null;
  const slide = safeSlides[active] || safeSlides[0];
  const shopHref = slide.primaryButtonHref || hero.primaryButtonHref;
  const shopLabel = slide.primaryButtonLabel || hero.primaryButtonLabel;
  const selectSlide = (index) => setActive((index + safeSlides.length) % safeSlides.length);

  return (
    <section
      className="storefront-hero"
      aria-roledescription="carousel"
      aria-label="Featured marketplace offers"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false); }}
    >
      <div className="storefront-hero-shape storefront-hero-shape-one" aria-hidden="true" />
      <div className="storefront-hero-shape storefront-hero-shape-two" aria-hidden="true" />
      <div className="container storefront-hero-inner" id={slideId} aria-live={paused ? 'polite' : 'off'}>
        <div className="storefront-hero-copy" key={`copy-${active}`}>
          {slide.subtitle && <span className="storefront-hero-eyebrow">{slide.subtitle}</span>}
          {slide.title && <h1>{slide.title}</h1>}
          {(slide.description || hero.description) && <p>{slide.description || hero.description}</p>}
          {((shopLabel && shopHref) || (hero.secondaryButtonLabel && hero.secondaryButtonHref)) && (
            <div className="storefront-hero-actions">
              {shopLabel && shopHref && (
                <Link href={shopHref} className="sd-button sd-button-dark">
                  {shopLabel} <i className="far fa-arrow-right" aria-hidden="true" />
                </Link>
              )}
              {hero.secondaryButtonLabel && hero.secondaryButtonHref && (
                <Link href={hero.secondaryButtonHref} className="sd-button sd-button-ghost">
                  {hero.secondaryButtonLabel}
                </Link>
              )}
            </div>
          )}
        </div>

        {slide.image && (
          <div className="storefront-hero-visual" key={`visual-${active}`}>
            <div className="storefront-hero-image-shell">
              <img
                src={responsiveImage(slide.image, { widths: [480, 720, 960], quality: 78 }).src}
                srcSet={responsiveImage(slide.image, { widths: [480, 720, 960], quality: 78 }).srcSet}
                sizes="(max-width: 991px) 88vw, 580px"
                alt={slide.title || ''}
                fetchPriority="high"
              />
            </div>
            {slide.priceValue && (
              <div className="storefront-hero-price">
                {slide.priceLabel && <small>{slide.priceLabel}</small>}
                <strong>{slide.priceValue}</strong>
              </div>
            )}
          </div>
        )}

        {safeSlides.length > 1 && (
          <div className="storefront-hero-navigation">
            <div className="storefront-hero-arrows">
              <button type="button" onClick={() => selectSlide(active - 1)} aria-label="Previous featured offer"><i className="far fa-arrow-left" aria-hidden="true" /></button>
              <button type="button" onClick={() => selectSlide(active + 1)} aria-label="Next featured offer"><i className="far fa-arrow-right" aria-hidden="true" /></button>
            </div>
            <div className="storefront-hero-dots" role="tablist" aria-label="Choose featured offer">
              {safeSlides.map((item, index) => (
                <button
                  type="button"
                  key={`${item.title}-${index}`}
                  className={index === active ? 'active' : ''}
                  onClick={() => selectSlide(index)}
                  aria-label={`Show offer ${index + 1}`}
                  aria-selected={index === active}
                  aria-controls={slideId}
                  role="tab"
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function calculateCountdown(target) {
  const targetTime = new Date(String(target).replaceAll('/', '-')).getTime();
  const remaining = Number.isFinite(targetTime) ? Math.max(0, targetTime - Date.now()) : 0;
  return {
    days: Math.floor(remaining / 86400000),
    hours: Math.floor((remaining / 3600000) % 24),
    mins: Math.floor((remaining / 60000) % 60),
    secs: Math.floor((remaining / 1000) % 60),
  };
}

export function DealCountdown({ target }) {
  const [time, setTime] = useState({ days: '--', hours: '--', mins: '--', secs: '--' });

  useEffect(() => {
    const update = () => setTime(calculateCountdown(target));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [target]);

  if (!target) return null;

  return (
    <div className="storefront-countdown" aria-label="Time remaining for this deal">
      {Object.entries(time).map(([label, value]) => (
        <div key={label}><strong>{String(value).padStart(2, '0')}</strong><span>{label}</span></div>
      ))}
    </div>
  );
}
