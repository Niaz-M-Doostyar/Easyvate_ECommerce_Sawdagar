'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { useToast } from '@/contexts/ToastContext';
import QuickViewModal from './CleanQuickViewModal';
import { formatPrice } from '@/lib/currency';
import { optimizedImageUrl, responsiveImage, FALLBACK_PRODUCT_IMAGE } from '@/lib/image';

export default function ProductCard({ product, layout = 'grid' }) {
  const { t, lang } = useLanguage();
  const { addToCart } = useCart();
  const toast = useToast();
  const [activeImg, setActiveImg] = useState(0);
  const [adding, setAdding] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [visible, setVisible] = useState(false);
  const hoverRef = useRef(null);

  useEffect(() => { setVisible(true); }, []);

  const getName = () => lang === 'ps' ? (product.namePs || product.nameEn) : lang === 'dr' ? (product.nameDr || product.nameEn) : product.nameEn;
  const price = product.retailPrice || product.suggestedPrice || 0;
  const oldPrice = product.suggestedPrice && product.suggestedPrice > price ? product.suggestedPrice : null;
  const discount = oldPrice ? Math.round((1 - price / oldPrice) * 100) : 0;
  const images = (product.images || []).map(img => {
    const url = img.url || img;
    return url.startsWith('http') ? url : url.startsWith('/') ? url : `/${url}`;
  });
  const fallbackImg = FALLBACK_PRODUCT_IMAGE;
  if (images.length === 0) images.push(fallbackImg);
  const activeImgResp = responsiveImage(images[activeImg], { widths: [320, 560, 760], quality: 75, sizes: '(max-width: 576px) 90vw, (max-width: 992px) 45vw, 280px' });
  const listImgResp = responsiveImage(images[0], { widths: [280, 420, 560], quality: 75, sizes: '(max-width: 576px) 40vw, 200px' });
  const rating = product.rating || 4;
  const inStock = product.stock > 0;

  const handleAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (adding) return;
    setAdding(true);
    await addToCart(product.id, 1);
    setTimeout(() => setAdding(false), 600);
  };

  const nextImg = (e) => { e.preventDefault(); e.stopPropagation(); setActiveImg(i => (i + 1) % images.length); };
  const prevImg = (e) => { e.preventDefault(); e.stopPropagation(); setActiveImg(i => (i - 1 + images.length) % images.length); };

  // On mouse move over image area, switch images based on horizontal position
  const handleMouseMove = (e) => {
    if (images.length <= 1) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const segment = Math.floor((x / rect.width) * images.length);
    setActiveImg(Math.min(segment, images.length - 1));
  };

  const badge = product.isNew ? { text: 'New', cls: 'new' } : !inStock ? { text: 'Out Of Stock', cls: 'oos' } : discount > 0 ? { text: `${discount}% Off`, cls: 'discount' } : product.isSponsored ? { text: 'Hot', cls: 'hot' } : null;

  if (layout === 'list') {
    return (
      <div className={`product-item flex flex-row ${visible ? 'animate-fade-up' : 'opacity-0'}`}>
        <div className="product-img w-48 flex-shrink-0">
          {badge && <span className={`type ${badge.cls}`}>{badge.text}</span>}
          <Link href={`/products/${product.id}`}><img src={listImgResp.src} srcSet={listImgResp.srcSet} sizes={listImgResp.sizes} alt={getName()} loading="lazy" decoding="async" onError={(e) => { e.target.src=fallbackImg; }} /></Link>
        </div>
        <div className="product-content flex-1 flex flex-col justify-center">
          <h3 className="product-title"><Link href={`/products/${product.id}`}>{getName()}</Link></h3>
          <div className="product-rate">{[1,2,3,4,5].map(i => <span key={i} className={i <= rating ? 'star-filled' : 'star-empty'}>★</span>)}</div>
          <div className="product-bottom mt-2">
            <div className="product-price">{oldPrice && <del>{formatPrice(oldPrice)}</del>}<span>{formatPrice(price)}</span></div>
            {inStock && <button onClick={handleAdd} className="product-cart-btn" title="Add To Cart">
              <i className="far fa-shopping-bag"></i>
            </button>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`product-item ${visible ? 'animate-fade-up' : 'opacity-0'}`}>
      <div className="product-img product-hover-gallery" ref={hoverRef} onMouseMove={handleMouseMove} onMouseLeave={() => setActiveImg(0)}>
        {badge && <span className={`type ${badge.cls}`}>{badge.text}</span>}
        <Link href={`/products/${product.id}`}>
          <img src={activeImgResp.src} srcSet={activeImgResp.srcSet} sizes={activeImgResp.sizes} alt={getName()} loading="lazy" decoding="async" onError={(e) => { e.target.src=fallbackImg; }} style={{ transition: 'opacity 0.3s ease' }} />
        </Link>
        {/* Navigation arrows (shown on hover) */}
        {images.length > 1 && (
          <>
            <button onClick={prevImg} className="product-hover-nav prev" aria-label="Previous image">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
            </button>
            <button onClick={nextImg} className="product-hover-nav next" aria-label="Next image">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
            </button>
            {/* Dots */}
            <div className="product-hover-dots">
              {images.map((_, i) => <span key={i} className={`product-hover-dot ${i === activeImg ? 'active' : ''}`} />)}
            </div>
          </>
        )}

      </div>
      <div className="product-content">
        <h3 className="product-title"><Link href={`/products/${product.id}`}>{getName()}</Link></h3>
        <div className="product-rate">{[1,2,3,4,5].map(i => <span key={i} className={i <= rating ? 'star-filled' : 'star-empty'}>★</span>)}</div>
        <div className="product-bottom">
          <div className="product-price">{oldPrice && <del>{formatPrice(oldPrice)}</del>}<span>{formatPrice(price)}</span></div>
          {inStock && <button onClick={handleAdd} className="product-cart-btn" title="Add To Cart">
            <i className="far fa-shopping-bag"></i>
          </button>}
        </div>
      </div>
      {showModal && <QuickViewModal product={product} onClose={() => setShowModal(false)} />}
    </div>
  );
}
