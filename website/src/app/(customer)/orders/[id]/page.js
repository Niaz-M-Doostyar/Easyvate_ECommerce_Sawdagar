"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { authHeaders } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatPrice } from "@/lib/currency";
import AccountLayout from "@/components/AccountLayout";

export default function OrderDetailPage({ params }) {
  const { id } = params;
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
    <section className="f2-account-state" aria-live="polite">
      <span className="f2-account-loader" aria-hidden="true" />
      <h1>{t('order_details') || 'Order details'}</h1>
      <p>Loading your order…</p>
    </section>
  );

  if (!order || order.error) return (
    <section className="f2-account-gate">
      <div className="f2-account-gate__icon" aria-hidden="true"><i className="far fa-box-open" /></div>
      <span>{t('order_details') || 'Order details'}</span>
      <h1>{t('order_not_found') || 'Order not found'}</h1>
      <p>We could not find this order in your account.</p>
      <Link href="/orders" className="f2-account-button">{t('view_orders') || 'View orders'}</Link>
    </section>
  );

  const currentStep = steps.indexOf(order.status);

  return (
    <AccountLayout
      title={`${t('order_details') || 'Order details'} #${order.orderNumber || id}`}
      description="Track delivery progress and review the products in this order."
      eyebrow={t('my_orders') || 'My orders'}
    >
      <section className="f2-account-card">
        <div className="f2-account-card__heading f2-account-card__heading--split">
          <div>
            <span>Order progress</span>
            <h2>#{order.orderNumber || id}</h2>
          </div>
          <span className={`f2-account-status f2-account-status--${order.status}`}>{order.status}</span>
        </div>

        {order.status !== "cancelled" && (
          <div className="f2-order-track">
            <div className="f2-order-track__line" aria-hidden="true">
              <span style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }} />
            </div>
            <div className="f2-order-track__steps">
              {steps.map((step, i) => (
                <div key={step} className={`f2-order-track__step ${i <= currentStep ? 'is-active' : ''}`}>
                  <span className="f2-order-track__dot">
                    {i < currentStep ? <i className="fas fa-check" /> : <span>{i + 1}</span>}
                  </span>
                  <strong>{stepLabels[step]}</strong>
                </div>
              ))}
            </div>
          </div>
        )}

        {order.status === "cancelled" && (
          <div className="f2-account-notice f2-account-notice--danger">
            <i className="far fa-times-circle" />
            <strong>{t('order_cancelled') || 'This order has been cancelled'}</strong>
          </div>
        )}
      </section>

      <div className="f2-order-detail-grid">
        <section className="f2-account-card">
          <div className="f2-account-card__heading">
            <div>
              <span>Purchase</span>
              <h2>{t('order_items') || 'Order items'}</h2>
            </div>
          </div>
          <div className="f2-account-table-wrap">
            <table className="f2-account-table f2-order-items-table">
              <thead>
                <tr>
                  <th>{t('product') || 'Product'}</th>
                  <th>{t('quantity') || 'Qty'}</th>
                  <th>{t('price') || 'Price'}</th>
                  <th>{t('subtotal') || 'Subtotal'}</th>
                </tr>
              </thead>
              <tbody>
                {(order.items || []).map((item, i) => {
                  const price = item.retailPrice || item.product?.retailPrice || 0;
                  const image = item.product?.images?.[0]?.url || "/assets/img/product/placeholder.png";
                  return (
                    <tr key={i}>
                      <td>
                        <div className="f2-order-product">
                          <img src={image} alt="" />
                          <strong>{item.product?.nameEn || `Product #${item.productId}`}</strong>
                        </div>
                      </td>
                      <td>{item.quantity}</td>
                      <td>{formatPrice(price)}</td>
                      <td><strong>{formatPrice(price * item.quantity)}</strong></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <aside className="f2-order-sidebar">
          <section className="f2-account-card f2-order-summary">
            <div className="f2-account-card__heading">
              <div>
                <span>Payment</span>
                <h2>{t('order_summary') || 'Order summary'}</h2>
              </div>
            </div>
            <dl className="f2-order-summary__list">
              <div><dt>{t('order_number') || 'Order #'}</dt><dd>#{order.orderNumber || id}</dd></div>
              <div><dt>{t('date') || 'Date'}</dt><dd>{new Date(order.createdAt).toLocaleDateString()}</dd></div>
              <div><dt>{t('subtotal') || 'Subtotal'}</dt><dd>{formatPrice(order.totalAmount)}</dd></div>
              <div><dt>{t('shipping') || 'Delivery'}</dt><dd>{t('free') || 'Free'}</dd></div>
              <div><dt>{t('payment') || 'Payment'}</dt><dd>COD</dd></div>
              <div className="f2-order-summary__total"><dt>{t('total') || 'Total'}</dt><dd>{formatPrice(order.totalAmount)}</dd></div>
            </dl>
          </section>

          <section className="f2-account-card f2-order-address">
            <div className="f2-account-card__heading">
              <div>
                <span>Shipping</span>
                <h2>{t('delivery_address') || 'Delivery address'}</h2>
              </div>
            </div>
            <strong>{order.user?.fullName || order.fullName}</strong>
            <p>{[order.province, order.district, order.village].filter(Boolean).join(", ") || "N/A"}</p>
            {order.landmark && <p><i className="far fa-map-marker-alt" /> {order.landmark}</p>}
            <p dir="ltr"><i className="far fa-phone" /> {order.phone || order.user?.phone}</p>
          </section>
        </aside>
      </div>

      <Link href="/orders" className="f2-account-back-link"><i className="far fa-arrow-left" /> {t('view_orders') || 'Back to all orders'}</Link>
    </AccountLayout>
  );
}
