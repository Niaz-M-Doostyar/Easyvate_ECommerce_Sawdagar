"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth, authHeaders } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatPrice } from "@/lib/currency";
import Pagination from "@/components/Pagination";
import AccountLayout from "@/components/AccountLayout";

export default function OrdersPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const fetchOrders = useCallback(async () => {
    const q = new URLSearchParams({ page, limit: 10 });
    if (statusFilter !== "all") q.set("status", statusFilter);
    const r = await fetch(`/api/orders?${q}`, { headers: authHeaders() });
    if (r.ok) { const d = await r.json(); setOrders(d.orders || []); setTotalPages(d.totalPages || 1); }
  }, [page, statusFilter]);
  useEffect(() => { if (user) fetchOrders(); }, [fetchOrders, user]);
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(fetchOrders, 15000);
    return () => clearInterval(interval);
  }, [fetchOrders, user]);

  if (!user) return (
    <section className="f2-account-gate">
      <div className="f2-account-gate__icon" aria-hidden="true"><i className="far fa-receipt" /></div>
      <span>{t('my_orders') || 'My orders'}</span>
      <h1>{t('please_sign_in') || 'Please sign in'}</h1>
      <p>Sign in to review your orders and delivery status.</p>
      <Link href="/login" className="f2-account-button">{t('sign_in') || 'Sign in'}</Link>
    </section>
  );

  return (
    <AccountLayout
      title={t('my_orders') || 'My orders'}
      description="Review purchases and follow each order from confirmation to delivery."
    >
      <section className="f2-account-card">
        <div className="f2-account-card__heading f2-account-card__heading--split">
          <div>
            <span>Order history</span>
            <h2>{t('my_orders') || 'My orders'}</h2>
          </div>
          <span className="f2-account-card__meta">Page {page} of {totalPages}</span>
        </div>

        <div className="f2-account-filters" aria-label="Filter orders by status">
          {["all", "pending", "confirmed", "shipped", "delivered", "cancelled"].map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={statusFilter === s ? 'is-active' : ''}
              aria-pressed={statusFilter === s}
            >
              {s === "all" ? (t('all') || "All") : (t(s) || s.charAt(0).toUpperCase() + s.slice(1))}
            </button>
          ))}
        </div>

        {orders.length === 0 ? (
          <div className="f2-account-empty">
            <span className="f2-account-empty__icon" aria-hidden="true"><i className="far fa-box-open" /></span>
            <h3>{t('no_orders') || 'No orders found'}</h3>
            <p>Orders matching this status will appear here.</p>
          </div>
        ) : (
          <div className="f2-account-table-wrap">
            <table className="f2-account-table">
              <thead>
                <tr>
                  <th>{t('order_number') || 'Order #'}</th>
                  <th>{t('date') || 'Date'}</th>
                  <th>{t('items') || 'Items'}</th>
                  <th>{t('total') || 'Total'}</th>
                  <th>{t('status') || 'Status'}</th>
                  <th>{t('action') || 'Action'}</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td><strong>#{o.orderNumber || o.id}</strong></td>
                    <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                    <td>{o.items?.length || 0} {t('items') || 'items'}</td>
                    <td><strong>{formatPrice(o.totalAmount)}</strong></td>
                    <td><span className={`f2-account-status f2-account-status--${o.status}`}>{t(o.status) || o.status}</span></td>
                    <td><Link href={`/orders/${o.id}`} className="f2-account-link">{t('view_details') || 'View details'} <i className="far fa-arrow-right" /></Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="f2-account-pagination"><Pagination page={page} totalPages={totalPages} onPageChange={setPage} /></div>
      </section>
    </AccountLayout>
  );
}
