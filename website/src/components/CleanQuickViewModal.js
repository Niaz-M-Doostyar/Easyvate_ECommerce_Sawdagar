"use client";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/contexts/ToastContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatPrice } from "@/lib/currency";

export default function CleanQuickViewModal({ product, onClose }) {
  if (!product || typeof document === "undefined") return null;

  const overlayRef = useRef(null);
  const dialogRef = useRef(null);
  const { addToCart } = useCart();
  const toast = useToast();
  const { t, lang } = useLanguage();

  const [active, setActive] = useState(0);
  const [qty, setQty] = useState(1);

  const images = (product.images || []).map((i) => {
    const url = i.url || i;
    return url.startsWith("http")
      ? url
      : url.startsWith("/")
      ? url
      : `/${url}`;
  });
  if (images.length === 0) images.push("/assets/img/product/placeholder.png");

  const name =
    lang === "ps"
      ? product.namePs || product.nameEn
      : lang === "dr"
      ? product.nameDr || product.nameEn
      : product.nameEn;
  const desc =
    lang === "ps"
      ? product.descPs || product.descEn
      : lang === "dr"
      ? product.descDr || product.descEn
      : product.descEn;
  const price = product.retailPrice || product.suggestedPrice || 0;
  const oldPrice = product.suggestedPrice && product.suggestedPrice > price ? product.suggestedPrice : null;
  const inStock = product.stock > 0;

  const stop = (e) => e.stopPropagation();

  const handleAdd = async () => {
    const res = await addToCart(product.id, qty);
    if (res?.success) {
      toast.success(t?.("added_to_cart") || "Added to cart!");
      onClose();
    } else {
      toast.error(res?.error || t?.("error") || "Failed");
    }
  };

  useEffect(() => {
    const prev = document.activeElement;
    dialogRef.current?.focus();
    document.body.style.overflow = 'hidden';
    const onKey = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setActive((i) => (i + 1) % images.length);
      if (e.key === "ArrowLeft") setActive((i) => (i - 1 + images.length) % images.length);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = '';
      prev?.focus();
    };
  }, [onClose, images.length]);

  const modalContent = (
    <div
      ref={overlayRef}
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 99999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
    >
      <div
        ref={dialogRef}
        tabIndex={-1}
        onClick={stop}
        style={{ width: '100%', maxWidth: '900px', background: '#fff', borderRadius: '12px', overflow: 'hidden', display: 'grid', gridTemplateColumns: '1fr 1fr', maxHeight: '90vh' }}
      >
        {/* Image Side */}
        <div style={{ background: '#f8f9fa', padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, borderRadius: '8px', overflow: 'hidden', border: '1px solid #e9ecef' }}>
            <img
              src={images[active]}
              alt={name}
              style={{ width: '100%', height: '100%', objectFit: 'contain', maxHeight: '400px' }}
            />
          </div>
          {images.length > 1 && (
            <div style={{ marginTop: '10px', display: 'flex', gap: '8px', overflowX: 'auto' }}>
              {images.map((src, i) => (
                <button
                  key={i}
                  onClick={() => setActive(i)}
                  style={{ width: '60px', height: '60px', borderRadius: '6px', overflow: 'hidden', border: i === active ? '2px solid var(--theme-color)' : '2px solid #e9ecef', cursor: 'pointer', padding: 0, flexShrink: 0 }}
                >
                  <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info Side */}
        <div style={{ padding: '25px', display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
            <h4 className="shop-single-title" style={{ margin: 0, fontSize: '20px' }}>{name}</h4>
            <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#999', padding: '0 0 0 10px' }}>
              <i className="far fa-times"></i>
            </button>
          </div>

          <div className="shop-single-rating mb-2">
            {[1,2,3,4,5].map(i => <i key={i} className={`${i <= (product.rating || 4) ? 'fas' : 'far'} fa-star`}></i>)}
          </div>

          <div className="shop-single-price mb-3">
            <span>{formatPrice(price)}</span>
            {oldPrice && <del>{formatPrice(oldPrice)}</del>}
          </div>

          {desc && <p style={{ color: '#666', fontSize: '14px', lineHeight: '1.7', marginBottom: '15px', display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{desc}</p>}

          <div style={{ marginBottom: '15px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: inStock ? '#28a745' : '#dc3545' }}>
              <i className={`fas fa-${inStock ? 'check-circle' : 'times-circle'}`}></i>
              {inStock ? `${t?.('in_stock') || 'In Stock'} (${product.stock})` : (t?.('out_of_stock') || 'Out of Stock')}
            </span>
          </div>

          {inStock && (
            <div style={{ marginTop: 'auto' }}>
              <div className="d-flex align-items-center gap-3 mb-3">
                <div className="shop-cart-qty">
                  <button className="minus-btn" onClick={() => setQty((q) => Math.max(1, q - 1))}><i className="fal fa-minus"></i></button>
                  <input className="quantity" type="text" value={qty} readOnly />
                  <button className="plus-btn" onClick={() => setQty((q) => Math.min(product.stock, q + 1))}><i className="fal fa-plus"></i></button>
                </div>
              </div>
              <button onClick={handleAdd} className="theme-btn" style={{ width: '100%' }}>
                <i className="far fa-shopping-bag me-2"></i>
                {t?.('add_to_cart') || 'Add to Cart'}
              </button>
            </div>
          )}

          <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
            <Link href={`/products/${product.id}`} onClick={onClose} className="theme-btn2" style={{ width: '100%', textAlign: 'center' }}>
              {t?.('view_details') || 'View Full Details'} <i className="fas fa-arrow-right"></i>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}