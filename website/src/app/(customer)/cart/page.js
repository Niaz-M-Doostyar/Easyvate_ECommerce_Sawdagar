"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/contexts/ToastContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatPrice } from "@/lib/currency";

export default function CartPage() {
  const { items, cartCount, cartTotal, updateQuantity, removeFromCart, clearCart } = useCart();
  const toast = useToast();
  const { t } = useLanguage();
  const [products, setProducts] = useState({});

  useEffect(() => {
    const ids = items.map(i => i.productId).filter(Boolean);
    if (ids.length === 0) return;
    ids.forEach(pid => {
      if (!products[pid]) {
        fetch(`/api/products/${pid}`).then(r => r.json()).then(d => {
          setProducts(prev => ({ ...prev, [pid]: d.product || d }));
        }).catch(() => {});
      }
    });
  }, [items]);

  const getProduct = (item) => item.product || products[item.productId] || {};

  if (items.length === 0) {
    return (
      <>
        <div className="site-breadcrumb" style={{ background: "url(/assets/img/breadcrumb/01.jpg)" }}>
          <div className="site-breadcrumb-bg" />
          <div className="container">
            <div className="site-breadcrumb-wrap">
              <h4 className="breadcrumb-title">{t('cart') || 'Shop Cart'}</h4>
              <ul className="breadcrumb-menu">
                <li><Link href="/"><i className="far fa-home"></i> {t('home') || 'Home'}</Link></li>
                <li className="active">{t('cart') || 'Shop Cart'}</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="shop-cart py-100">
          <div className="container text-center">
            <i className="far fa-shopping-cart" style={{ fontSize: '64px', color: '#ddd', marginBottom: '20px', display: 'block' }}></i>
            <h3>{t('cart_empty') || 'Your Cart is Empty'}</h3>
            <p className="mt-2 mb-4">{t('cart_empty_desc') || "Looks like you haven't added anything to your cart yet"}</p>
            <Link href="/search" className="theme-btn">{t('start_shopping') || 'Start Shopping'} <i className="fas fa-arrow-right"></i></Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Breadcrumb */}
      <div className="site-breadcrumb" style={{ background: "url(/assets/img/breadcrumb/01.jpg)" }}>
        <div className="site-breadcrumb-bg" />
        <div className="container">
          <div className="site-breadcrumb-wrap">
            <h4 className="breadcrumb-title">{t('cart') || 'Shop Cart'}</h4>
            <ul className="breadcrumb-menu">
              <li><Link href="/"><i className="far fa-home"></i> {t('home') || 'Home'}</Link></li>
              <li className="active">{t('cart') || 'Shop Cart'}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Shop Cart */}
      <div className="shop-cart py-100">
        <div className="container">
          <div className="shop-cart-wrap">
            <div className="row">
              <div className="col-lg-8">
                <div className="cart-table">
                  <div className="table-responsive">
                    <table className="table">
                      <thead>
                        <tr>
                          <th>{t('image') || 'Image'}</th>
                          <th>{t('product_name') || 'Product Name'}</th>
                          <th>{t('price') || 'Price'}</th>
                          <th>{t('quantity') || 'Quantity'}</th>
                          <th>{t('subtotal') || 'Sub Total'}</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map(item => {
                          const p = getProduct(item);
                          const price = p.retailPrice || item.retailPrice || 0;
                          const img = p.images?.[0]?.url || item.image || "";
                          const imgSrc = img ? (img.startsWith('http') ? img : img.startsWith('/') ? img : `/${img}`) : '';
                          return (
                            <tr key={item.id || item.productId}>
                              <td>
                                <div className="shop-cart-img">
                                  <Link href={`/products/${item.productId || p.id}`}>
                                    {imgSrc ? <img src={imgSrc} alt={p.nameEn || ""} /> : <img src="/assets/img/product/placeholder.png" alt="" />}
                                  </Link>
                                </div>
                              </td>
                              <td>
                                <div className="shop-cart-content">
                                  <h5 className="shop-cart-name">
                                    <Link href={`/products/${item.productId || p.id}`}>{p.nameEn || `Product #${item.productId}`}</Link>
                                  </h5>
                                  {p.category?.nameEn && (
                                    <div className="shop-cart-info">
                                      <p><span>{t('category') || 'Category'}:</span> {p.category.nameEn}</p>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td>
                                <div className="shop-cart-price">
                                  <span>{formatPrice(price)}</span>
                                </div>
                              </td>
                              <td>
                                <div className="shop-cart-qty">
                                  <button className="minus-btn" onClick={() => updateQuantity(item.id || item.productId, Math.max(1, item.quantity - 1))}>
                                    <i className="fal fa-minus"></i>
                                  </button>
                                  <input className="quantity" type="text" value={item.quantity} readOnly />
                                  <button className="plus-btn" onClick={() => updateQuantity(item.id || item.productId, item.quantity + 1)}>
                                    <i className="fal fa-plus"></i>
                                  </button>
                                </div>
                              </td>
                              <td>
                                <div className="shop-cart-subtotal">
                                  <span>{formatPrice(price * item.quantity)}</span>
                                </div>
                              </td>
                              <td>
                                <button onClick={() => removeFromCart(item.id || item.productId)} className="shop-cart-remove">
                                  <i className="far fa-times"></i>
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="shop-cart-footer">
                  <div className="row">
                    <div className="col-md-5 col-lg-6">
                      <div className="shop-cart-btn text-md-end">
                        <button onClick={() => clearCart()} className="theme-btn theme-btn2 me-2">
                          <i className="far fa-trash-alt"></i> {t('clear_cart') || 'Clear Cart'}
                        </button>
                        <Link href="/search" className="theme-btn">
                          <i className="fas fa-arrow-left"></i> {t('continue_shopping') || 'Continue Shopping'}
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-lg-4">
                <div className="shop-cart-summary">
                  <h5>{t('cart_summary') || 'Cart Summary'}</h5>
                  <ul>
                    <li><strong>{t('subtotal') || 'Sub Total'}:</strong> <span>{formatPrice(cartTotal)}</span></li>
                    <li><strong>{t('shipping') || 'Shipping'}:</strong> <span>{t('free') || 'Free'}</span></li>
                    <li><strong>{t('payment') || 'Payment'}:</strong> <span>COD</span></li>
                    <li className="shop-cart-total"><strong>{t('total') || 'Total'}:</strong> <span>{formatPrice(cartTotal)}</span></li>
                  </ul>
                  <div className="text-end mt-40">
                    <Link href="/checkout" className="theme-btn">
                      {t('checkout') || 'Checkout Now'} <i className="fas fa-arrow-right"></i>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
