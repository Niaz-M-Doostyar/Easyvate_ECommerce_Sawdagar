"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth, authHeaders } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatPrice } from "@/lib/currency";

export default function OrderDetailPage({ params }) {
  const { id } = params;
  const { user } = useAuth();
  const { t } = useLanguage();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = () => {
    fetch(`/api/orders/${id}`, { headers: authHeaders() }).then(r => r.json()).then(d => { setOrder(d.order || d); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(() => { fetchOrder(); }, [id]);
  useEffect(() => {
    const interval = setInterval(fetchOrder, 15000);
    return () => clearInterval(interval);
  }, [id]);

  const steps = ["pending", "confirmed", "shipped", "delivered"];
  const stepLabels = {
    pending: t('pending') || 'Pending',
    confirmed: t('confirmed') || 'Confirmed',
    shipped: t('shipped') || 'Shipped',
    delivered: t('delivered') || 'Delivered'
  };

  if (loading) return (
    <>
      <div className="site-breadcrumb" style={{ background: "url(/assets/img/breadcrumb/01.jpg)" }}>
        <div className="site-breadcrumb-bg" /><div className="container"><div className="site-breadcrumb-wrap"><h4 className="breadcrumb-title">{t('order_details') || 'Order Details'}</h4></div></div>
      </div>
      <div className="py-100 text-center"><div className="container"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div></div></div>
    </>
  );

  if (!order) return (
    <>
      <div className="site-breadcrumb" style={{ background: "url(/assets/img/breadcrumb/01.jpg)" }}>
        <div className="site-breadcrumb-bg" /><div className="container"><div className="site-breadcrumb-wrap"><h4 className="breadcrumb-title">{t('order_details') || 'Order Details'}</h4></div></div>
      </div>
      <div className="py-100 text-center"><div className="container"><h3>{t('order_not_found') || 'Order Not Found'}</h3><Link href="/orders" className="theme-btn mt-3">{t('view_orders') || 'View Orders'}</Link></div></div>
    </>
  );

  const currentStep = steps.indexOf(order.status);

  return (
    <>
      {/* Breadcrumb */}
      <div className="site-breadcrumb" style={{ background: "url(/assets/img/breadcrumb/01.jpg)" }}>
        <div className="site-breadcrumb-bg" />
        <div className="container">
          <div className="site-breadcrumb-wrap">
            <h4 className="breadcrumb-title">{t('order_details') || 'Order Details'}</h4>
            <ul className="breadcrumb-menu">
              <li><Link href="/"><i className="far fa-home"></i> {t('home') || 'Home'}</Link></li>
              <li><Link href="/orders">{t('my_orders') || 'My Orders'}</Link></li>
              <li className="active">#{order.orderNumber || id}</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="py-100">
        <div className="container">
          {/* Order Tracking */}
          {order.status !== "cancelled" && (
            <div className="order-track mb-5">
              <div className="order-track-step-wrap">
                {steps.map((step, i) => (
                  <div key={step} className={`order-track-step ${i <= currentStep ? 'active' : ''}`}>
                    <div className="order-track-icon">
                      {i < currentStep ? (
                        <i className="fas fa-check"></i>
                      ) : i === currentStep ? (
                        <i className="fas fa-spinner fa-pulse"></i>
                      ) : (
                        <span>{i + 1}</span>
                      )}
                    </div>
                    <div className="order-track-text">
                      <p style={{ textTransform: 'capitalize', fontWeight: i <= currentStep ? 700 : 400, color: i <= currentStep ? 'var(--theme-color)' : '#999' }}>
                        {stepLabels[step]}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              {/* Progress bar */}
              <div style={{ position: 'relative', height: '4px', background: '#e9ecef', borderRadius: '4px', margin: '0 80px' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', background: 'var(--theme-color)', borderRadius: '4px', width: `${(currentStep / (steps.length - 1)) * 100}%`, transition: 'width 0.5s ease' }} />
              </div>
            </div>
          )}

          {order.status === "cancelled" && (
            <div className="alert alert-danger text-center mb-4">
              <i className="far fa-times-circle me-2"></i>
              <strong>{t('order_cancelled') || 'This order has been cancelled'}</strong>
            </div>
          )}

          <div className="row">
            <div className="col-lg-8">
              {/* Items Table */}
              <div className="cart-table mb-4">
                <h5 className="mb-3">{t('order_items') || 'Order Items'}</h5>
                <div className="table-responsive">
                  <table className="table table-bordered">
                    <thead>
                      <tr>
                        <th>{t('image') || 'Image'}</th>
                        <th>{t('product') || 'Product'}</th>
                        <th>{t('quantity') || 'Qty'}</th>
                        <th>{t('price') || 'Price'}</th>
                        <th>{t('subtotal') || 'Subtotal'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(order.items || []).map((item, i) => {
                        const price = item.retailPrice || item.product?.retailPrice || 0;
                        return (
                          <tr key={i}>
                            <td>
                              <div className="shop-cart-img">
                                {item.product?.images?.[0]?.url ? <img src={item.product.images[0].url} alt="" /> : <img src="/assets/img/product/placeholder.png" alt="" />}
                              </div>
                            </td>
                            <td>{item.product?.nameEn || `Product #${item.productId}`}</td>
                            <td>{item.quantity}</td>
                            <td>{formatPrice(price)}</td>
                            <td><strong>{formatPrice(price * item.quantity)}</strong></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              {/* Order Summary */}
              <div className="shop-cart-summary mb-4">
                <h5>{t('order_summary') || 'Order Summary'}</h5>
                <ul>
                  <li><strong>{t('order_number') || 'Order #'}:</strong> <span>#{order.orderNumber || id}</span></li>
                  <li><strong>{t('date') || 'Date'}:</strong> <span>{new Date(order.createdAt).toLocaleDateString()}</span></li>
                  <li><strong>{t('subtotal') || 'Subtotal'}:</strong> <span>{formatPrice(order.totalAmount)}</span></li>
                  <li><strong>{t('shipping') || 'Delivery'}:</strong> <span>{t('free') || 'Free'}</span></li>
                  <li><strong>{t('payment') || 'Payment'}:</strong> <span>COD</span></li>
                  <li className="shop-cart-total"><strong>{t('total') || 'Total'}:</strong> <span>{formatPrice(order.totalAmount)}</span></li>
                </ul>
              </div>

              {/* Delivery Address */}
              <div className="shop-cart-summary">
                <h5>{t('delivery_address') || 'Delivery Address'}</h5>
                <div style={{ fontSize: '14px', lineHeight: '1.8' }}>
                  <p className="mb-1"><strong>{order.user?.fullName || order.fullName}</strong></p>
                  <p className="mb-1">{[order.province, order.district, order.village].filter(Boolean).join(", ") || "N/A"}</p>
                  {order.landmark && <p className="mb-1"><i className="far fa-map-marker-alt me-1"></i> {order.landmark}</p>}
                  <p className="mb-0"><i className="far fa-phone me-1"></i> {order.phone || order.user?.phone}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
