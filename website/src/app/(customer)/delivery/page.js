"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth, authHeaders } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { formatPrice } from "@/lib/currency";
import Pagination from "@/components/Pagination";
import AccountLayout from "@/components/AccountLayout";

export default function DeliveryPortalPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [updating, setUpdating] = useState(null);

  const fetchOrders = useCallback(async () => {
    const q = new URLSearchParams({ page, limit: 10 });
    if (statusFilter !== "all") q.set("status", statusFilter);
    try {
      const r = await fetch(`/api/delivery/orders?${q}`, { headers: authHeaders() });
      if (r.ok) { const d = await r.json(); setOrders(d.orders || []); setTotalPages(d.totalPages || 1); }
    } catch {}
  }, [page, statusFilter]);

  useEffect(() => { if (user?.role === 'delivery') fetchOrders(); }, [fetchOrders, user]);

  useEffect(() => {
    if (user?.role !== 'delivery') return;
    const interval = setInterval(fetchOrders, 30000);
    return () => clearInterval(interval);
  }, [fetchOrders, user]);

  const updateStatus = async (orderId, status) => {
    setUpdating(orderId);
    try {
      const r = await fetch(`/api/delivery/orders/${orderId}`, {
        method: "PUT", headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ status })
      });
      if (r.ok) { toast.success(`Order marked as ${status}`); fetchOrders(); }
      else { const d = await r.json(); toast.error(d.error || "Update failed"); }
    } catch { toast.error("Something went wrong"); }
    setUpdating(null);
  };

  const sendLocation = async () => {
    if (!navigator.geolocation) { toast.error("Geolocation not supported"); return; }
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        const r = await fetch("/api/delivery/location", {
          method: "POST", headers: authHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ latitude: pos.coords.latitude, longitude: pos.coords.longitude })
        });
        if (r.ok) toast.success("Location updated");
        else toast.error("Failed to update location");
      } catch { toast.error("Failed to send location"); }
    }, () => toast.error("Location access denied"));
  };

  if (!user) return (
    <section className="f2-account-gate">
      <div className="f2-account-gate__icon" aria-hidden="true"><i className="far fa-truck" /></div>
      <span>Delivery account</span>
      <h1>Please sign in</h1>
      <p>Sign in with your delivery account to continue.</p>
      <Link href="/login" className="f2-account-button">Sign in</Link>
    </section>
  );

  if (user.role !== 'delivery') return (
    <section className="f2-account-gate">
      <div className="f2-account-gate__icon" aria-hidden="true"><i className="far fa-lock" /></div>
      <span>Delivery account</span>
      <h1>Access denied</h1>
      <p>This portal is for delivery personnel only.</p>
      <Link href="/dashboard" className="f2-account-button">Go to dashboard</Link>
    </section>
  );

  return (
    <AccountLayout
      title="Delivery dashboard"
      description="Manage assigned deliveries and keep their progress up to date."
      eyebrow="Delivery portal"
    >
      <section className="f2-role-banner">
        <div className="f2-role-banner__icon" aria-hidden="true"><i className="far fa-truck" /></div>
        <div className="f2-role-banner__copy">
          <span>Delivery workspace</span>
          <h2>Assigned deliveries</h2>
          <p>Share your location and update each order as it moves to the customer.</p>
        </div>
        <div className="f2-role-banner__actions">
          <button type="button" onClick={sendLocation} className="f2-account-button"><i className="far fa-location-arrow" /> Share location</button>
          <Link href="/profile" className="f2-account-button f2-account-button--secondary"><i className="far fa-user" /> Profile</Link>
        </div>
      </section>

      <section className="f2-account-card">
        <div className="f2-account-card__heading f2-account-card__heading--split">
          <div>
            <span>Delivery queue</span>
            <h2>My assigned orders</h2>
          </div>
          <span className="f2-account-card__meta">Page {page} of {totalPages}</span>
        </div>

        <div className="f2-account-filters" aria-label="Filter deliveries by status">
          {["all", "confirmed", "shipped", "delivered"].map((s) => (
            <button type="button" key={s} onClick={() => { setStatusFilter(s); setPage(1); }} className={statusFilter === s ? "is-active" : ""} aria-pressed={statusFilter === s}>{s === "all" ? "All orders" : s.charAt(0).toUpperCase() + s.slice(1)}</button>
          ))}
        </div>

        {orders.length === 0 ? (
          <div className="f2-account-empty">
            <span className="f2-account-empty__icon" aria-hidden="true"><i className="far fa-truck" /></span>
            <h3>No deliveries assigned</h3>
            <p>New orders will appear here when they are assigned to you.</p>
          </div>
        ) : (
          <div className="f2-delivery-orders">
            {orders.map((o) => (
              <article key={o.id} className="f2-delivery-order">
                <header className="f2-delivery-order__header">
                  <div>
                    <span>Order</span>
                    <h3>#{o.orderNumber || o.id}</h3>
                    <time>{new Date(o.createdAt).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</time>
                  </div>
                  <span className={`f2-account-status f2-account-status--${o.status}`}>{o.status}</span>
                  <strong>{formatPrice(o.totalAmount)}</strong>
                </header>

                <div className="f2-delivery-order__customer">
                  <span>Customer details</span>
                  <dl>
                    <div><dt>Name</dt><dd>{o.user?.fullName || 'N/A'}</dd></div>
                    <div><dt>Phone</dt><dd dir="ltr">{o.user?.phone || 'N/A'}</dd></div>
                    <div className="f2-delivery-order__address"><dt>Address</dt><dd>{[o.province || o.user?.province, o.district || o.user?.district, o.village || o.user?.village, o.landmark || o.user?.landmark].filter(Boolean).join(', ') || 'N/A'}</dd></div>
                  </dl>
                </div>

                <div className="f2-delivery-order__items">
                  <span>Items ({o.items?.length || 0})</span>
                  {(o.items || []).slice(0, 3).map((item, i) => (
                    <div key={i}><span>{item.product?.nameEn || 'Product'} × {item.quantity}</span><strong>{formatPrice(item.retailPrice * item.quantity)}</strong></div>
                  ))}
                  {(o.items?.length || 0) > 3 && <small>+{o.items.length - 3} more items</small>}
                </div>

                <footer className="f2-delivery-order__actions">
                  {o.status === 'confirmed' && (
                    <button type="button" onClick={() => updateStatus(o.id, 'shipped')} disabled={updating === o.id} className="f2-account-button">
                      {updating === o.id ? 'Updating…' : <><i className="far fa-box" /> Mark as shipped</>}
                    </button>
                  )}
                  {o.status === 'shipped' && (
                    <button type="button" onClick={() => updateStatus(o.id, 'delivered')} disabled={updating === o.id} className="f2-account-button">
                      {updating === o.id ? 'Updating…' : <><i className="far fa-check" /> Mark as delivered</>}
                    </button>
                  )}
                  {o.status === 'delivered' && <span className="f2-delivery-order__complete"><i className="far fa-check-circle" /> Delivered successfully</span>}
                  <a href={`tel:${o.user?.phone}`} className="f2-account-button f2-account-button--secondary"><i className="far fa-phone" /> Call customer</a>
                </footer>
              </article>
            ))}
          </div>
        )}

        <div className="f2-account-pagination"><Pagination page={page} totalPages={totalPages} onPageChange={setPage} /></div>
      </section>
    </AccountLayout>
  );
}
