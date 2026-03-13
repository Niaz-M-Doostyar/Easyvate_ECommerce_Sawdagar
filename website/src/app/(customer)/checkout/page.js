"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth, authHeaders } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/contexts/ToastContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatPrice } from "@/lib/currency";

export default function CheckoutPage() {
  const { user } = useAuth();
  const { items, cartTotal, clearCart } = useCart();
  const toast = useToast();
  const { t } = useLanguage();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: user?.fullName || "", phone: user?.phone || "",
    province: "", district: "", village: "", landmark: "", notes: ""
  });
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  if (!user) {
    return (
      <>
        <div className="site-breadcrumb" style={{ background: "url(/assets/img/breadcrumb/01.jpg)" }}>
          <div className="site-breadcrumb-bg" />
          <div className="container">
            <div className="site-breadcrumb-wrap">
              <h4 className="breadcrumb-title">{t('checkout') || 'Checkout'}</h4>
              <ul className="breadcrumb-menu">
                <li><Link href="/"><i className="far fa-home"></i> {t('home') || 'Home'}</Link></li>
                <li className="active">{t('checkout') || 'Checkout'}</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="py-100 text-center">
          <div className="container">
            <h3>{t('please_sign_in') || 'Please Sign In'}</h3>
            <p className="mt-2 mb-4">{t('sign_in_checkout') || 'You need to sign in to proceed with checkout'}</p>
            <Link href="/login" className="theme-btn">{t('sign_in') || 'Sign In'} <i className="fas fa-arrow-right"></i></Link>
          </div>
        </div>
      </>
    );
  }

  if (items.length === 0) {
    return (
      <>
        <div className="site-breadcrumb" style={{ background: "url(/assets/img/breadcrumb/01.jpg)" }}>
          <div className="site-breadcrumb-bg" />
          <div className="container">
            <div className="site-breadcrumb-wrap">
              <h4 className="breadcrumb-title">{t('checkout') || 'Checkout'}</h4>
              <ul className="breadcrumb-menu">
                <li><Link href="/"><i className="far fa-home"></i> {t('home') || 'Home'}</Link></li>
                <li className="active">{t('checkout') || 'Checkout'}</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="py-100 text-center">
          <div className="container">
            <h3>{t('cart_empty') || 'Cart is Empty'}</h3>
            <Link href="/search" className="theme-btn mt-3">{t('browse_products') || 'Browse Products'} <i className="fas fa-arrow-right"></i></Link>
          </div>
        </div>
      </>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.province || !form.district || !form.phone) { toast.error(t('fill_required') || "Fill all required fields"); return; }
    setLoading(true);
    try {
      const r = await fetch("/api/orders", { method: "POST", headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ ...form, paymentMethod: "cod", items: items.map(i => ({ productId: i.productId, quantity: i.quantity })) })
      });
      const d = await r.json();
      if (r.ok) {
        clearCart();
        toast.success(t('order_placed') || "Order placed successfully!");
        router.push(`/orders/${d.order?.id || d.id || ""}`);
      } else toast.error(d.error || t('order_failed') || "Order failed");
    } catch { toast.error(t('something_wrong') || "Something went wrong"); }
    setLoading(false);
  };

  return (
    <>
      {/* Breadcrumb */}
      <div className="site-breadcrumb" style={{ background: "url(/assets/img/breadcrumb/01.jpg)" }}>
        <div className="site-breadcrumb-bg" />
        <div className="container">
          <div className="site-breadcrumb-wrap">
            <h4 className="breadcrumb-title">{t('checkout') || 'Checkout'}</h4>
            <ul className="breadcrumb-menu">
              <li><Link href="/"><i className="far fa-home"></i> {t('home') || 'Home'}</Link></li>
              <li><Link href="/cart">{t('cart') || 'Cart'}</Link></li>
              <li className="active">{t('checkout') || 'Checkout'}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Checkout Area */}
      <div className="checkout-area py-100">
        <div className="container">
          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-lg-8">
                {/* Delivery Address */}
                <div className="checkout-billing">
                  <h4 className="checkout-billing-title">{t('delivery_address') || 'Delivery Address'}</h4>
                  <div className="row">
                    <div className="col-lg-6">
                      <div className="form-group">
                        <label>{t('full_name') || 'Full Name'} *</label>
                        <input type="text" className="form-control" value={form.fullName} onChange={e => set("fullName", e.target.value)} required />
                      </div>
                    </div>
                    <div className="col-lg-6">
                      <div className="form-group">
                        <label>{t('phone') || 'Phone'} (07XXXXXXXX) *</label>
                        <input type="tel" className="form-control" value={form.phone} onChange={e => set("phone", e.target.value)} placeholder="07XXXXXXXX" required />
                      </div>
                    </div>
                    <div className="col-lg-6">
                      <div className="form-group">
                        <label>{t('province') || 'Province'} *</label>
                        <input type="text" className="form-control" value={form.province} onChange={e => set("province", e.target.value)} placeholder={t('province_placeholder') || "e.g., Kabul"} required />
                      </div>
                    </div>
                    <div className="col-lg-6">
                      <div className="form-group">
                        <label>{t('district') || 'District'} *</label>
                        <input type="text" className="form-control" value={form.district} onChange={e => set("district", e.target.value)} placeholder={t('district_placeholder') || "e.g., District 5"} required />
                      </div>
                    </div>
                    <div className="col-lg-6">
                      <div className="form-group">
                        <label>{t('village') || 'Village / Street'}</label>
                        <input type="text" className="form-control" value={form.village} onChange={e => set("village", e.target.value)} placeholder={t('village_placeholder') || "Village or street name"} />
                      </div>
                    </div>
                    <div className="col-lg-6">
                      <div className="form-group">
                        <label>{t('landmark') || 'Landmark'}</label>
                        <input type="text" className="form-control" value={form.landmark} onChange={e => set("landmark", e.target.value)} placeholder={t('landmark_placeholder') || "Near mosque, school, etc."} />
                      </div>
                    </div>
                    <div className="col-lg-12">
                      <div className="form-group">
                        <label>{t('order_notes') || 'Order Notes'} ({t('optional') || 'Optional'})</label>
                        <textarea className="form-control" value={form.notes} onChange={e => set("notes", e.target.value)} rows={3} placeholder={t('order_notes_placeholder') || "Special instructions for delivery"} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="checkout-payment mt-4">
                  <h4 className="checkout-billing-title">{t('payment_method') || 'Payment Method'}</h4>
                  <div className="checkout-payment-option">
                    <div className="form-check">
                      <input className="form-check-input" type="radio" name="payment" id="cod" defaultChecked />
                      <label className="form-check-label" htmlFor="cod">
                        <strong>{t('cod') || 'Cash on Delivery (COD)'}</strong>
                        <p className="mb-0 mt-1" style={{ fontSize: '14px', color: '#666' }}>{t('cod_desc') || 'Pay when you receive your order'}</p>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="col-lg-4">
                <div className="shop-cart-summary">
                  <h5>{t('order_summary') || 'Order Summary'}</h5>
                  <div className="checkout-order-items" style={{ maxHeight: '240px', overflowY: 'auto' }}>
                    {items.map(item => {
                      const p = item.product || {};
                      return (
                        <div key={item.id || item.productId} className="d-flex align-items-center gap-2 py-2 border-bottom">
                          <div style={{ width: '48px', height: '48px', flexShrink: 0, borderRadius: '8px', overflow: 'hidden', background: '#f5f5f5' }}>
                            {p.images?.[0]?.url && <img src={p.images[0].url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p className="mb-0" style={{ fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.nameEn || `Product #${item.productId}`}</p>
                            <p className="mb-0" style={{ fontSize: '12px', color: '#999' }}>{t('qty') || 'Qty'}: {item.quantity}</p>
                          </div>
                          <span style={{ fontSize: '13px', fontWeight: 700 }}>{formatPrice((p.retailPrice || 0) * item.quantity)}</span>
                        </div>
                      );
                    })}
                  </div>
                  <ul className="mt-3">
                    <li><strong>{t('subtotal') || 'Subtotal'}:</strong> <span>{formatPrice(cartTotal)}</span></li>
                    <li><strong>{t('shipping') || 'Delivery'}:</strong> <span>{t('free') || 'Free'}</span></li>
                    <li className="shop-cart-total"><strong>{t('total') || 'Total'}:</strong> <span>{formatPrice(cartTotal)}</span></li>
                  </ul>
                  <div className="text-end mt-40">
                    <button type="submit" disabled={loading} className="theme-btn" style={{ width: '100%', justifyContent: 'center' }}>
                      {loading ? (t('placing_order') || 'Placing Order...') : (t('place_order') || 'Place Order (COD)')} <i className="fas fa-arrow-right"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
