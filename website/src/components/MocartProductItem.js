'use client';

import Link from 'next/link';
import { memo, useEffect, useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatPrice } from '@/lib/currency';
import { responsiveImage } from '@/lib/image';
import QuickViewModal from './CleanQuickViewModal';

const FALLBACK_IMG = '/assets/img/product/e1.png';

function normalizeImg(src) {
  if (!src) return FALLBACK_IMG;
  if (typeof src !== 'string') src = src.url;
  if (!src) return FALLBACK_IMG;
  if (src.startsWith('http') || src.startsWith('/')) return src;
  return `/${src}`;
}

function localizedValue(item, field, lang) {
  if (!item) return '';
  if (lang === 'ps') return item[`${field}Ps`] || item[`${field}En`] || item[field] || '';
  if (lang === 'dr') return item[`${field}Dr`] || item[`${field}En`] || item[field] || '';
  return item[`${field}En`] || item[field] || '';
}

function productPrice(product) {
  const price = Number(product?.retailPrice || product?.suggestedPrice || 0);
  const compareAt = Number(product?.suggestedPrice || product?.wholesaleCost || 0);
  return { price, oldPrice: compareAt > price ? compareAt : null };
}

function translated(t, key, fallback) {
  const value = t?.(key);
  return value && value !== key ? value : fallback;
}

const MocartProductItem = memo(function MocartProductItem({ product, showBadge = true }) {
  const { addToCart } = useCart();
  const { lang, t } = useLanguage();
  const [isNew, setIsNew] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!product?.createdAt) {
      setIsNew(false);
      return;
    }
    const createdAt = new Date(product.createdAt).getTime();
    setIsNew(Number.isFinite(createdAt) && Date.now() - createdAt < 7 * 86400000);
  }, [product?.createdAt]);

  useEffect(() => setImgError(false), [product?.id]);

  if (!product) return null;

  const name = localizedValue(product, 'name', lang) || 'Product';
  const categoryName = localizedValue(product.category, 'name', lang);
  const rawImg = normalizeImg(product.images?.[0]);
  const { src: optSrc, srcSet: optSrcSet, sizes: optSizes } = responsiveImage(rawImg);
  const imgSrc = imgError ? FALLBACK_IMG : optSrc;
  const { price, oldPrice } = productPrice(product);
  const isOutOfStock = Number(product.stock) <= 0;
  const discount = oldPrice ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;
  const rating = Number(product.averageRating || product.rating || 0);
  const reviewCount = Number(product.reviewCount || product._count?.reviews || 0);
  const addLabel = translated(t, 'add_to_cart', 'Add to cart');
  const quickViewLabel = translated(t, 'quick_view', 'Quick view');

  let badge = null;
  if (showBadge) {
    if (isOutOfStock) badge = <span className="sd-product-badge sd-badge-oos">Out of stock</span>;
    else if (discount > 0) badge = <span className="sd-product-badge sd-badge-sale">-{discount}%</span>;
    else if (isNew) badge = <span className="sd-product-badge sd-badge-new">New</span>;
    else if (product.isSponsored) badge = <span className="sd-product-badge sd-badge-sponsored">Featured</span>;
  }

  const handleAdd = async () => {
    if (isOutOfStock || adding) return;
    setAdding(true);
    try {
      await addToCart(product.id);
    } finally {
      setAdding(false);
    }
  };

  return (
    <article className="product-item sd-product-card">
      <div className="product-img sd-product-media">
        {badge}
        <Link href={`/products/${product.id}`} className="sd-product-image-link" aria-label={`View ${name}`}>
          <img src={imgSrc} srcSet={imgError ? undefined : optSrcSet} sizes={imgError ? undefined : optSizes} alt={name} loading="lazy" decoding="async" onError={() => setImgError(true)} />
        </Link>
        <div className="sd-product-actions">
          <button type="button" onClick={() => setShowModal(true)} aria-label={`${quickViewLabel}: ${name}`} title={quickViewLabel}>
            <i className="far fa-eye" aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="product-content sd-product-content">
        <div className="sd-product-meta">
          {categoryName ? (
            product.category?.slug
              ? <Link href={`/categories/${product.category.slug}`}>{categoryName}</Link>
              : <span>{categoryName}</span>
          ) : <span aria-hidden="true">&nbsp;</span>}
          {rating > 0 ? (
            <span className="sd-product-rating" aria-label={`${rating.toFixed(1)} out of 5 stars`}>
              <i className="fas fa-star" aria-hidden="true" /> {rating.toFixed(1)}{reviewCount > 0 && <small> ({reviewCount})</small>}
            </span>
          ) : isNew ? <span className="sd-product-rating sd-rating-new">New</span> : <span aria-hidden="true" />}
        </div>
        <h3 className="product-title sd-product-title"><Link href={`/products/${product.id}`}>{name}</Link></h3>
        <div className="product-bottom sd-product-bottom">
          <div className="product-price sd-product-price">
            <span>{formatPrice(price)}</span>
            {oldPrice && <del>{formatPrice(oldPrice)}</del>}
          </div>
          <button
            type="button"
            className="product-cart-btn sd-product-cart"
            onClick={handleAdd}
            disabled={isOutOfStock || adding}
            aria-label={`${isOutOfStock ? 'Out of stock' : addLabel}: ${name}`}
          >
            <i className={adding ? 'fas fa-spinner fa-spin' : 'far fa-shopping-bag'} aria-hidden="true" />
            <span>{isOutOfStock ? 'Unavailable' : addLabel}</span>
          </button>
        </div>
      </div>
      {showModal && <QuickViewModal product={product} onClose={() => setShowModal(false)} />}
    </article>
  );
});

export default MocartProductItem;

export const MocartProductListItem = memo(function MocartProductListItem({ product }) {
  const { addToCart } = useCart();
  const { lang, t } = useLanguage();
  const [showModal, setShowModal] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => setImgError(false), [product?.id]);

  if (!product) return null;

  const name = localizedValue(product, 'name', lang) || 'Product';
  const { price, oldPrice } = productPrice(product);
  const inStock = Number(product.stock) > 0;
  const rating = Number(product.averageRating || product.rating || 0);
  const addLabel = translated(t, 'add_to_cart', 'Add to cart');

  const handleAdd = async () => {
    if (!inStock || adding) return;
    setAdding(true);
    try {
      await addToCart(product.id);
    } finally {
      setAdding(false);
    }
  };

  return (
    <article className="product-list-item sd-product-list-item">
      <Link href={`/products/${product.id}`} className="sd-product-list-image">
        <img src={imgError ? FALLBACK_IMG : normalizeImg(product.images?.[0])} alt={name} loading="lazy" decoding="async" onError={() => setImgError(true)} />
      </Link>
      <div className="sd-product-list-content">
        <h3><Link href={`/products/${product.id}`}>{name}</Link></h3>
        {rating > 0 && <div className="sd-product-list-rating"><i className="fas fa-star" aria-hidden="true" /> {rating.toFixed(1)}</div>}
        <div className="sd-product-list-price"><span>{formatPrice(price)}</span>{oldPrice && <del>{formatPrice(oldPrice)}</del>}</div>
      </div>
      <div className="sd-product-list-actions">
        <button type="button" onClick={() => setShowModal(true)} aria-label={`Quick view: ${name}`} title="Quick view"><i className="far fa-eye" aria-hidden="true" /></button>
        <button type="button" onClick={handleAdd} disabled={!inStock || adding} aria-label={`${inStock ? addLabel : 'Out of stock'}: ${name}`} title={inStock ? addLabel : 'Out of stock'}><i className={adding ? 'fas fa-spinner fa-spin' : 'far fa-shopping-bag'} aria-hidden="true" /></button>
      </div>
      {showModal && <QuickViewModal product={product} onClose={() => setShowModal(false)} />}
    </article>
  );
});
