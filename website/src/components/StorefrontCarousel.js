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

function heroImage(image) {
  return image ? responsiveImage(image, {
    widths: [320, 560, 800, 1200],
    sizes: '(max-width: 456px) calc(92vw - 60px), (max-width: 767px) 360px, (max-width: 1199px) 40vw, 514px',
  }) : null;
}

function imageKey(image, viewport) {
  return image ? JSON.stringify([image.src, image.srcSet, image.sizes, viewport]) : '';
}

export function StorefrontHero({ slides, hero = {} }) {
  const [active, setActive] = useState(0);
  const [requested, setRequested] = useState(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [viewport, setViewport] = useState('');
  const [loadedImages, setLoadedImages] = useState({});
  const imageRef = useRef(null);
  const preloads = useRef(new Map());
  const slideId = useId();
  const safeSlides = Array.isArray(slides) ? slides.filter(Boolean) : [];
  const slidesKey = JSON.stringify(safeSlides.map(slide => [slide.id, slide.image]));
  const activeIndex = active < safeSlides.length ? active : 0;
  const nextIndex = (activeIndex + 1) % (safeSlides.length || 1);
  const paused = hovered || focused;
  const slide = safeSlides[activeIndex];
  const image = heroImage(slide?.image);
  const currentKey = imageKey(image, viewport);
  const nextImage = heroImage(safeSlides[nextIndex]?.image);
  const nextKey = imageKey(nextImage, viewport);
  const currentSettled = !image || loadedImages[currentKey] !== undefined;
  const targetIndex = requested ?? nextIndex;
  const targetImage = heroImage(safeSlides[targetIndex]?.image);
  const targetKey = imageKey(targetImage, viewport);

  useEffect(() => {
    setActive(0);
    setRequested(null);
  }, [slidesKey]);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
  }, []);

  useEffect(() => {
    let densityQuery;
    const update = () => {
      const density = window.devicePixelRatio || 1;
      setViewport(`${window.innerWidth}:${density}`);
      densityQuery?.removeEventListener?.('change', update);
      densityQuery = window.matchMedia(`(resolution: ${density}dppx)`);
      densityQuery.addEventListener?.('change', update);
    };
    update();
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('resize', update);
      densityQuery?.removeEventListener?.('change', update);
    };
  }, []);

  // A cached first image may finish before hydration attaches its load handler.
  useEffect(() => {
    if (currentKey && imageRef.current?.complete) {
      const loaded = imageRef.current.naturalWidth > 0;
      setLoadedImages(current => current[currentKey] === loaded ? current : { ...current, [currentKey]: loaded });
    }
  }, [currentKey]);

  useEffect(() => {
    if (!safeSlides.length) return undefined;
    const manual = requested !== null;
    if (!manual && (safeSlides.length < 2 || !currentSettled || paused || reducedMotion || loadedImages[targetKey] === false)) return undefined;
    if (manual && targetIndex === activeIndex) {
      setRequested(null);
      return undefined;
    }

    let cancelled = false;
    const finish = (loaded) => {
      if (cancelled) return;
      if (targetKey) setLoadedImages(current => current[targetKey] === loaded ? current : { ...current, [targetKey]: loaded });
      if (manual) {
        if (loaded) setActive(targetIndex);
        setRequested(null);
      }
    };

    if (!targetImage || loadedImages[targetKey] === true) {
      finish(true);
      return undefined;
    }
    let preload = preloads.current.get(targetKey);
    if (!preload) {
      const loader = new window.Image();
      preload = new Promise(resolve => {
        loader.onload = async () => {
          await loader.decode?.().catch(() => {});
          resolve(true);
        };
        loader.onerror = () => {
          // A transient failure can be retried by a later manual selection.
          // The false readiness entry prevents an automatic retry loop.
          preloads.current.delete(targetKey);
          resolve(false);
        };
      });
      preloads.current.set(targetKey, preload);
      loader.decoding = 'async';
      loader.fetchPriority = manual ? 'high' : 'low';
      // Set the same responsive candidates before src, avoiding a second fetch
      // of the fallback URL during preloading or when this image is displayed.
      if (targetImage.sizes) loader.sizes = targetImage.sizes;
      if (targetImage.srcSet) loader.srcset = targetImage.srcSet;
      loader.src = targetImage.src;
    }
    preload.then(finish);
    return () => { cancelled = true; };
  }, [activeIndex, currentSettled, loadedImages, paused, reducedMotion, requested, safeSlides.length, slidesKey, targetIndex, targetKey]);

  useEffect(() => {
    if (safeSlides.length < 2 || paused || reducedMotion || requested !== null || !currentSettled || (nextImage && loadedImages[nextKey] !== true)) return undefined;
    const timer = window.setTimeout(() => setActive(nextIndex), 7000);
    return () => window.clearTimeout(timer);
  }, [activeIndex, currentSettled, loadedImages, nextIndex, nextKey, paused, reducedMotion, requested, safeSlides.length, slidesKey]);

  if (safeSlides.length === 0) return null;
  const shopHref = slide.primaryButtonHref || hero.primaryButtonHref;
  const shopLabel = slide.primaryButtonLabel || hero.primaryButtonLabel;
  const selectSlide = (index) => setRequested((index + safeSlides.length) % safeSlides.length);

  return (
    <section
      className="storefront-hero"
      aria-roledescription="carousel"
      aria-label="Featured marketplace offers"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false); }}
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
          <div className="storefront-hero-visual">
            <div className="storefront-hero-image-shell">
              <img
                {...image}
                ref={imageRef}
                alt={slide.title || ''}
                loading="eager"
                fetchPriority="high"
                decoding="async"
                onLoad={() => setLoadedImages(current => current[currentKey] ? current : { ...current, [currentKey]: true })}
                onError={() => setLoadedImages(current => current[currentKey] === false ? current : { ...current, [currentKey]: false })}
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
              <button type="button" onClick={() => selectSlide((requested ?? activeIndex) - 1)} aria-label="Previous featured offer"><i className="far fa-arrow-left" aria-hidden="true" /></button>
              <button type="button" onClick={() => selectSlide((requested ?? activeIndex) + 1)} aria-label="Next featured offer"><i className="far fa-arrow-right" aria-hidden="true" /></button>
            </div>
            <div className="storefront-hero-dots" role="tablist" aria-label="Choose featured offer">
              {safeSlides.map((item, index) => (
                <button
                  type="button"
                  key={`${item.title}-${index}`}
                  className={index === activeIndex ? 'active' : ''}
                  onClick={() => selectSlide(index)}
                  aria-label={`Show offer ${index + 1}`}
                  aria-selected={index === activeIndex}
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
