"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth, authHeaders } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatPrice } from "@/lib/currency";
import Pagination from "@/components/Pagination";

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

  const statusBadge = { pending: "badge bg-warning", confirmed: "badge bg-info", shipped: "badge bg-primary", delivered: "badge bg-success", cancelled: "badge bg-danger" };

  if (!user) return (
    <>
      <div className="site-breadcrumb" style={{ background: "url(/assets/img/breadcrumb/01.jpg)" }}>
        <div className="site-breadcrumb-bg" />
        <div className="container"><div className="site-breadcrumb-wrap"><h4 className="breadcrumb-title">{t('my_orders') || 'My Orders'}</h4><ul className="breadcrumb-menu"><li><Link href="/"><i className="far fa-home"></i> {t('home') || 'Home'}</Link></li><li className="active">{t('my_orders') || 'My Orders'}</li></ul></div></div>
      </div>
      <div className="py-100 text-center"><div className="container"><h3>{t('please_sign_in') || 'Please Sign In'}</h3><Link href="/login" className="theme-btn mt-3">{t('sign_in') || 'Sign In'}</Link></div></div>
    </>
  );

  return (
    <>
      {/* Breadcrumb */}
      <div className="site-breadcrumb" style={{ background: "url(/assets/img/breadcrumb/01.jpg)" }}>
        <div className="site-breadcrumb-bg" />
        <div className="container">
          <div className="site-breadcrumb-wrap">
            <h4 className="breadcrumb-title">{t('my_orders') || 'My Orders'}</h4>
            <ul className="breadcrumb-menu">
              <li><Link href="/"><i className="far fa-home"></i> {t('home') || 'Home'}</Link></li>
              <li className="active">{t('my_orders') || 'My Orders'}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Orders */}
      <div className="py-100">
        <div className="container">
          {/* Status Filter */}
          <div className="mb-4 d-flex gap-2 flex-wrap">
            {["all", "pending", "confirmed", "shipped", "delivered", "cancelled"].map(s => (
              <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
                className={`theme-btn ${statusFilter === s ? '' : 'theme-btn2'}`}
                style={{ padding: '8px 16px', fontSize: '13px' }}>
                {s === "all" ? (t('all') || "All") : (t(s) || s.charAt(0).toUpperCase() + s.slice(1))}
              </button>
            ))}
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-5">
              <i className="far fa-box-open" style={{ fontSize: '48px', color: '#ddd', display: 'block', marginBottom: '15px' }}></i>
              <p>{t('no_orders') || 'No orders found'}</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-bordered">
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
                  {orders.map(o => (
                    <tr key={o.id}>
                      <td><strong>#{o.orderNumber || o.id}</strong></td>
                      <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                      <td>{o.items?.length || 0} {t('items') || 'items'}</td>
                      <td><strong>{formatPrice(o.totalAmount)}</strong></td>
                      <td><span className={statusBadge[o.status] || "badge bg-secondary"} style={{ textTransform: 'capitalize' }}>{t(o.status) || o.status}</span></td>
                      <td><Link href={`/orders/${o.id}`} className="theme-btn" style={{ padding: '6px 14px', fontSize: '12px' }}>{t('view_details') || 'View Details'}</Link></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-4"><Pagination page={page} totalPages={totalPages} onPageChange={setPage} /></div>
        </div>
      </div>
    </>
  );
}
