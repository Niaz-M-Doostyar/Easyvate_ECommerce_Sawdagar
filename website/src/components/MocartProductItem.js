'use client';

import Link from 'next/link';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatPrice } from '@/lib/currency';
import { optimizedImageUrl, responsiveImage } from '@/lib/image';

export default function MocartProductItem({ product, showBadge = true }) {
  const { addToCart } = useCart();
  const { lang } = useLanguage();

  if (!product) return null;

  const name = lang === 'ps' ? (product.namePs || product.nameEn) :
               lang === 'dr' ? (product.nameDr || product.nameEn) : product.nameEn;

  const imgData = responsiveImage(product.images?.[0]?.url || '/assets/img/product/e1.png', { widths: [280, 420, 560], quality: 75, sizes: '(max-width: 576px) 45vw, (max-width: 992px) 30vw, 220px' });
  const price = product.retailPrice || product.suggestedPrice || 0;
  const oldPrice = product.wholesaleCost && product.wholesaleCost > price ? product.wholesaleCost : null;
  const isNew = product.createdAt && (Date.now() - new Date(product.createdAt).getTime()) < 7 * 86400000;
  const isOutOfStock = product.stock <= 0;
  const discount = oldPrice ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;

  let badge = null;
  if (showBadge) {
    if (isOutOfStock) badge = <span className="type oos">Out Of Stock</span>;
    else if (discount > 0) badge = <span className="type discount">{discount}% Off</span>;
    else if (isNew) badge = <span className="type new">New</span>;
    else if (product.isSponsored) badge = <span className="type hot">Hot</span>;
  }

  return (
    <div className="product-item">
      <div className="product-img">
        {badge}
        <Link href={`/products/${product.id}`}>
          <img src={imgUrl} alt={name} loading="lazy" decoding="async" />
        </Link>
        <div className="product-action-wrap">
          <div className="product-action">
            <Link href={`/products/${product.id}`} data-tooltip="tooltip" title="Quick View">
              <i className="far fa-eye"></i>
            </Link>
            <a href="#" data-tooltip="tooltip" title="Add To Wishlist" onClick={e => e.preventDefault()}>
              <i className="far fa-heart"></i>
            </a>
          </div>
        </div>
      </div>
      <div className="product-content">
        <h3 className="product-title">
          <Link href={`/products/${product.id}`}>{name}</Link>
        </h3>
        <div className="product-rate">
          <i className="fas fa-star"></i>
          <i className="fas fa-star"></i>
          <i className="fas fa-star"></i>
          <i className="fas fa-star"></i>
          <i className="far fa-star"></i>
        </div>
        <div className="product-bottom">
          <div className="product-price">
            {oldPrice && <del>{formatPrice(oldPrice)}</del>}
            <span>{formatPrice(price)}</span>
          </div>
          <button
            type="button"
            className="product-cart-btn"
            data-tooltip="tooltip"
            title="Add To Cart"
            onClick={() => !isOutOfStock && addToCart(product.id)}
            disabled={isOutOfStock}
          >
            <i className="far fa-shopping-bag"></i>
          </button>
        </div>
      </div>
    </div>
  );
}

export function MocartProductListItem({ product }) {
  const { addToCart } = useCart();
  const { lang } = useLanguage();

  if (!product) return null;

  const name = lang === 'ps' ? (product.namePs || product.nameEn) :
               lang === 'dr' ? (product.nameDr || product.nameEn) : product.nameEn;

  const imgUrl = optimizedImageUrl(product.images?.[0]?.url || '/assets/img/product/e1.png', { width: 280, quality: 75 });
  const price = product.retailPrice || product.suggestedPrice || 0;
  const oldPrice = product.wholesaleCost && product.wholesaleCost > price ? product.wholesaleCost : null;

  return (
    <div className="product-list-item">
      <div className="product-list-img">
        <Link href={`/products/${product.id}`}>
          <img src={imgUrl} alt={name} loading="lazy" decoding="async" />
        </Link>
      </div>
      <div className="product-list-content">
        <h4><Link href={`/products/${product.id}`}>{name}</Link></h4>
        <div className="product-list-rate">
          <i className="fas fa-star"></i>
          <i className="fas fa-star"></i>
          <i className="fas fa-star"></i>
          <i className="fas fa-star"></i>
          <i className="far fa-star"></i>
        </div>
        <div className="product-list-price">
          {oldPrice && <del>{formatPrice(oldPrice)}</del>}
          <span>{formatPrice(price)}</span>
        </div>
      </div>
      <button
        className="product-list-btn"
        data-tooltip="tooltip"
        title="Add To Cart"
        onClick={() => addToCart(product.id)}
      >
        <i className="far fa-shopping-bag"></i>
      </button>
    </div>
  );
}
