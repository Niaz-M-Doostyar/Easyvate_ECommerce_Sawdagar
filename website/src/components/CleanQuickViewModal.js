'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatPrice } from '@/lib/currency';

const FALLBACK_IMAGE = '/assets/img/product/e1.png';

function normalizeImage(image) {
  const url = typeof image === 'string' ? image : image?.url;
  if (!url) return FALLBACK_IMAGE;
  if (url.startsWith('http') || url.startsWith('/')) return url;
  return `/${url}`;
}

function translated(t, key, fallback) {
  const value = t?.(key);
  return value && value !== key ? value : fallback;
}

export default function CleanQuickViewModal({ product, onClose }) {
  const dialogRef = useRef(null);
  const titleId = useId();
  const { addToCart } = useCart();
  const { t, lang } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [zoom, setZoom] = useState(1);
  const pinchRef = useRef(null);

  const images = useMemo(() => {
    const productImages = product?.images || [];
    return productImages.length ? productImages.map(normalizeImage) : [FALLBACK_IMAGE];
  }, [product?.images]);

  useEffect(() => setMounted(true), []);
  useEffect(() => { setImageError(false); setZoom(1); }, [active, product?.id]);

  useEffect(() => {
    if (!mounted || !product) return undefined;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.requestAnimationFrame(() => dialogRef.current?.focus());

    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'ArrowRight') setActive((index) => (index + 1) % images.length);
      if (event.key === 'ArrowLeft') setActive((index) => (index - 1 + images.length) % images.length);
      if (event.key !== 'Tab' || !dialogRef.current) return;

      const focusable = [...dialogRef.current.querySelectorAll('a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])')];
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus?.();
    };
  }, [images.length, mounted, onClose, product]);

  if (!mounted || !product) return null;

  const name = lang === 'ps'
    ? product.namePs || product.nameEn
    : lang === 'dr'
      ? product.nameDr || product.nameEn
      : product.nameEn || product.name;
  const description = lang === 'ps'
    ? product.descPs || product.descEn
    : lang === 'dr'
      ? product.descDr || product.descEn
      : product.descEn || product.description;
  const price = Number(product.retailPrice || product.suggestedPrice || 0);
  const compareAt = Number(product.suggestedPrice || product.wholesaleCost || 0);
  const oldPrice = compareAt > price ? compareAt : null;
  const inStock = Number(product.stock) > 0;
  const rating = Math.max(0, Math.min(5, Number(product.averageRating || product.rating || 0)));
  const addLabel = translated(t, 'add_to_cart', 'Add to cart');
  const detailsLabel = translated(t, 'view_details', 'View full details');
  const stockLabel = translated(t, 'in_stock', 'In stock');
  const outOfStockLabel = translated(t, 'out_of_stock', 'Out of stock');

  const handleAdd = async () => {
    if (!inStock || adding) return;
    setAdding(true);
    try {
      await addToCart(product.id, qty);
      onClose();
    } finally {
      setAdding(false);
    }
  };

  return createPortal(
    <div className="sd-quick-view" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div className="sd-quick-dialog" ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <button type="button" className="sd-quick-close" onPointerDown={(event) => { event.preventDefault(); onClose(); }} onClick={onClose} aria-label="Close quick view">
          <i className="far fa-times" aria-hidden="true" />
        </button>

        <div className="sd-quick-gallery">
          <div
            className="sd-quick-main-image"
            onTouchStart={(event) => {
              if (event.touches.length !== 2) return;
              pinchRef.current = {
                distance: Math.hypot(event.touches[0].clientX - event.touches[1].clientX, event.touches[0].clientY - event.touches[1].clientY),
                zoom,
              };
            }}
            onTouchMove={(event) => {
              if (event.touches.length !== 2 || !pinchRef.current) return;
              event.preventDefault();
              const distance = Math.hypot(event.touches[0].clientX - event.touches[1].clientX, event.touches[0].clientY - event.touches[1].clientY);
              setZoom(Math.min(4, Math.max(1, pinchRef.current.zoom * distance / pinchRef.current.distance)));
            }}
            onTouchEnd={() => { pinchRef.current = null; }}
          >
            <img src={imageError ? FALLBACK_IMAGE : images[active]} alt={name || 'Product'} onError={() => setImageError(true)} style={{ transform: `scale(${zoom})` }} />
          </div>
          {images.length > 1 && (
            <div className="sd-quick-thumbnails" aria-label="Choose product image">
              {images.map((src, index) => (
                <button type="button" key={`${src}-${index}`} className={index === active ? 'active' : ''} onClick={() => setActive(index)} aria-label={`Show image ${index + 1}`} aria-pressed={index === active}>
                  <img src={src} alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="sd-quick-details">
          {product.category && <span className="sd-quick-category">{product.category.nameEn || product.category.name}</span>}
          <h2 id={titleId}>{name || 'Product'}</h2>
          <div className="sd-quick-rating">
            <span aria-label={rating > 0 ? `${rating.toFixed(1)} out of 5 stars` : 'Not yet rated'}>
              {[1, 2, 3, 4, 5].map((star) => <i key={star} className={`${rating > 0 && star <= Math.round(rating) ? 'fas' : 'far'} fa-star`} aria-hidden="true" />)}
            </span>
            <small>{rating > 0 ? rating.toFixed(1) : 'Not yet rated'}</small>
          </div>
          <div className="sd-quick-price"><span>{formatPrice(price)}</span>{oldPrice && <del>{formatPrice(oldPrice)}</del>}</div>
          {description && <p className="sd-quick-description">{description}</p>}
          <div className={`sd-quick-stock ${inStock ? 'in-stock' : 'out-of-stock'}`}>
            <i className={`fas fa-${inStock ? 'check-circle' : 'times-circle'}`} aria-hidden="true" />
            {inStock ? `${stockLabel} · ${product.stock} available` : outOfStockLabel}
          </div>

          {inStock && (
            <div className="sd-quick-buy-row">
              <div className="sd-quantity-control" aria-label="Quantity">
                <button type="button" onClick={() => setQty((value) => Math.max(1, value - 1))} aria-label="Decrease quantity"><i className="fal fa-minus" aria-hidden="true" /></button>
                <input type="text" value={qty} readOnly aria-label="Selected quantity" />
                <button type="button" onClick={() => setQty((value) => Math.min(Number(product.stock), value + 1))} aria-label="Increase quantity"><i className="fal fa-plus" aria-hidden="true" /></button>
              </div>
              <button type="button" className="sd-quick-add" onClick={handleAdd} disabled={adding}>
                <i className={adding ? 'fas fa-spinner fa-spin' : 'far fa-shopping-bag'} aria-hidden="true" />
                {adding ? 'Adding…' : addLabel}
              </button>
            </div>
          )}

          <Link href={`/products/${product.id}`} onClick={onClose} className="sd-quick-details-link">
            {detailsLabel} <i className="far fa-arrow-right" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>,
    document.body,
  );
}
