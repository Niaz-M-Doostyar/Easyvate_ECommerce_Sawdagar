"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth, authHeaders } from "@/contexts/AuthContext";
import { formatPrice } from "@/lib/currency";
import AccountLayout from "@/components/AccountLayout";

export default function DashboardPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const fetchOrders = () => {
    fetch("/api/orders?limit=7", { headers: authHeaders() }).then(r => r.json()).then(d => setOrders(d.orders || [])).catch(() => {});
  };
  useEffect(() => { fetchOrders(); }, []);
  useEffect(() => {
    const interval = setInterval(fetchOrders, 20000);
    return () => clearInterval(interval);
  }, []);

  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const completedCount = orders.filter(o => ['delivered','shipped','confirmed'].includes(o.status)).length;
  const balanceAmount = orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

  if (!user) return (
    <section className="f2-account-gate">
      <div className="f2-account-gate__icon" aria-hidden="true"><i className="far fa-user" /></div>
      <span>Customer account</span>
      <h1>Please sign in</h1>
      <p>Sign in to see your orders and account summary.</p>
      <Link href="/login" className="f2-account-button">Sign in</Link>
    </section>
  );

  return (
    <AccountLayout
      title="Dashboard"
      description="A quick look at your recent orders and account activity."
    >
      <section className="f2-account-card">
        <div className="f2-account-card__heading">
          <div>
            <span>At a glance</span>
            <h2>Account summary</h2>
          </div>
        </div>

        <div className="f2-account-metrics">
          <article className="f2-account-metric">
            <span className="f2-account-metric__icon"><i className="far fa-clock" /></span>
            <div>
              <strong>{pendingCount}</strong>
              <span>Pending orders</span>
            </div>
          </article>
          <article className="f2-account-metric">
            <span className="f2-account-metric__icon"><i className="far fa-check" /></span>
            <div>
              <strong>{completedCount}</strong>
              <span>Completed orders</span>
            </div>
          </article>
          <article className="f2-account-metric">
            <span className="f2-account-metric__icon"><i className="far fa-wallet" /></span>
            <div>
              <strong>{formatPrice(balanceAmount)}</strong>
              <span>Total order value</span>
            </div>
          </article>
        </div>
      </section>

      <section className="f2-account-card">
        <div className="f2-account-card__heading f2-account-card__heading--split">
          <div>
            <span>Latest activity</span>
            <h2>Recent orders</h2>
          </div>
          <Link href="/orders" className="f2-account-button f2-account-button--secondary">View all orders</Link>
        </div>

        {orders.length === 0 ? (
          <div className="f2-account-empty">
            <span className="f2-account-empty__icon" aria-hidden="true"><i className="far fa-box-open" /></span>
            <h3>No orders yet</h3>
            <p>Your recent orders will appear here after you make a purchase.</p>
            <Link href="/search" className="f2-account-button">Start shopping</Link>
          </div>
        ) : (
          <div className="f2-account-table-wrap">
            <table className="f2-account-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Date</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th><span className="visually-hidden">Action</span></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td><strong>#{o.orderNumber || o.id}</strong></td>
                    <td>{new Date(o.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                    <td><strong>{formatPrice(o.totalAmount)}</strong></td>
                    <td><span className={`f2-account-status f2-account-status--${o.status}`}>{o.status.charAt(0).toUpperCase() + o.status.slice(1)}</span></td>
                    <td>
                      <Link href={`/orders/${o.id}`} className="f2-account-icon-button" aria-label={`View order ${o.orderNumber || o.id}`}>
                        <i className="far fa-arrow-right" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </AccountLayout>
  );
}
