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
    <>
      <div className="site-breadcrumb">
        <div className="site-breadcrumb-bg" style={{ background: "url(/assets/img/breadcrumb/01.jpg)" }} />
        <div className="container"><div className="site-breadcrumb-wrap"><h4 className="breadcrumb-title">Dashboard</h4><ul className="breadcrumb-menu"><li><Link href="/"><i className="far fa-home"></i> Home</Link></li><li className="active">Dashboard</li></ul></div></div>
      </div>
      <div className="py-100 text-center"><div className="container"><h3>Please Sign In</h3><Link href="/login" className="theme-btn mt-3">Sign In</Link></div></div>
    </>
  );

  return (
    <>
      <div className="site-breadcrumb">
        <div className="site-breadcrumb-bg" style={{ background: "url(/assets/img/breadcrumb/01.jpg)" }} />
        <div className="container"><div className="site-breadcrumb-wrap"><h4 className="breadcrumb-title">Dashboard</h4><ul className="breadcrumb-menu"><li><Link href="/"><i className="far fa-home"></i> Home</Link></li><li className="active">Dashboard</li></ul></div></div>
      </div>

      <AccountLayout>
        <div className="user-card">
          <h4 className="user-card-title">Summary</h4>
          <div className="row">
            <div className="col-md-6 col-lg-4">
              <div className="dashboard-widget color-1">
                <div className="dashboard-widget-info">
                  <h1>{pendingCount}</h1>
                  <span>Pending Orders</span>
                </div>
                <div className="dashboard-widget-icon">
                  <i className="fal fa-list"></i>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-4">
              <div className="dashboard-widget color-2">
                <div className="dashboard-widget-info">
                  <h1>{completedCount}</h1>
                  <span>Completed Orders</span>
                </div>
                <div className="dashboard-widget-icon">
                  <i className="fal fa-layer-group"></i>
                </div>
              </div>
            </div>
            <div className="col-md-6 col-lg-4">
              <div className="dashboard-widget color-3">
                <div className="dashboard-widget-info">
                  <h1>{formatPrice(balanceAmount)}</h1>
                  <span>Order Value</span>
                </div>
                <div className="dashboard-widget-icon">
                  <i className="fal fa-wallet"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="user-card">
          <div className="user-card-header">
            <h4 className="user-card-title">Recent Orders</h4>
            <div className="user-card-header-right">
              <Link href="/orders" className="theme-btn">View All Orders</Link>
            </div>
          </div>
          {orders.length === 0 ? (
            <div className="text-center py-4">
              <p>No orders yet. <Link href="/search" className="theme-btn">Start Shopping</Link></p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-borderless text-nowrap">
                <thead>
                  <tr>
                    <th>#Order No</th>
                    <th>Date</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id}>
                      <td><span className="table-list-code">#{o.orderNumber || o.id}</span></td>
                      <td>{new Date(o.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</td>
                      <td>{formatPrice(o.totalAmount)}</td>
                      <td>
                        <span className={`badge badge-${o.status === 'pending' ? 'info' : o.status === 'confirmed' ? 'primary' : o.status === 'shipped' ? 'primary' : o.status === 'delivered' ? 'success' : o.status === 'cancelled' ? 'danger' : 'info'}`}>
                          {o.status.charAt(0).toUpperCase() + o.status.slice(1)}
                        </span>
                      </td>
                      <td>
                        <Link href={`/orders/${o.id}`} className="btn btn-sm btn-outline-secondary">
                          <i className="far fa-eye"></i>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </AccountLayout>
    </>
  );
}
