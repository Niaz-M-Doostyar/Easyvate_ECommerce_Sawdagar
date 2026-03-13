"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth, authHeaders } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import Pagination from "@/components/Pagination";

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

  // Auto-refresh every 30 seconds
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

  if (!user) return <div className="py-20 text-center container-main"><h2 className="text-2xl font-bold text-midnight mb-4">Please Sign In</h2><Link href="/login" className="theme-btn inline-flex">Sign In</Link></div>;
  if (user.role !== 'delivery') return <div className="py-20 text-center container-main"><h2 className="text-2xl font-bold text-midnight mb-4">Access Denied</h2><p className="text-body mb-4">This portal is for delivery personnel only.</p><Link href="/dashboard" className="theme-btn inline-flex">Go to Dashboard</Link></div>;

  const statusColor = { pending: "bg-yellow-50 text-yellow-700 border-yellow-200", confirmed: "bg-blue-50 text-blue-700 border-blue-200", shipped: "bg-cyan-50 text-cyan-700 border-cyan-200", delivered: "bg-green-50 text-green-700 border-green-200", cancelled: "bg-red-50 text-red-700 border-red-200" };

  return (
    <div className="py-6 md:py-8">
      <div className="container-main max-w-5xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-navy to-navy-dark rounded-2xl p-6 sm:p-8 mb-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold font-display mb-2">Delivery Dashboard</h1>
              <p className="text-white/60 text-sm">Manage your assigned deliveries</p>
            </div>
            <div className="flex gap-3">
              <button onClick={sendLocation} className="theme-btn theme-btn-sm bg-green border-green hover:shadow-green/30">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>
                Share Location
              </button>
              <Link href="/profile" className="theme-btn2 theme-btn-sm border-white/30 text-white hover:bg-white/10">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" /></svg>
                Profile
              </Link>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {["all", "confirmed", "shipped", "delivered"].map(s => (
            <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }} className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${statusFilter === s ? "bg-gold text-white shadow-md shadow-gold/20" : "bg-white text-body hover:bg-gray-50 border border-gray-200"}`}>{s === "all" ? "All Orders" : s.charAt(0).toUpperCase() + s.slice(1)}</button>
          ))}
        </div>

        {/* Orders */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-card p-12 text-center">
            <svg className="w-16 h-16 mx-auto text-gray-200 mb-4" fill="none" stroke="currentColor" strokeWidth={1} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25" /></svg>
            <p className="text-body font-medium">No deliveries assigned</p>
            <p className="text-sm text-gray-400 mt-1">New orders will appear here when assigned to you</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map(o => (
              <div key={o.id} className="bg-white rounded-2xl shadow-card overflow-hidden hover:shadow-card-hover transition-shadow">
                <div className="p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <p className="font-bold text-midnight text-lg">#{o.orderNumber || o.id}</p>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${statusColor[o.status] || "bg-gray-100 text-body border-gray-200"}`}>{o.status}</span>
                      </div>
                      <p className="text-xs text-body">{new Date(o.createdAt).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</p>
                    </div>
                    <p className="text-xl font-bold text-midnight">${o.totalAmount}</p>
                  </div>

                  {/* Customer Info */}
                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Customer</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                      <div><span className="text-body">Name:</span> <strong className="text-midnight">{o.user?.fullName || 'N/A'}</strong></div>
                      <div><span className="text-body">Phone:</span> <strong className="text-midnight">{o.user?.phone || 'N/A'}</strong></div>
                      <div className="sm:col-span-2"><span className="text-body">Address:</span> <strong className="text-midnight">{[o.province || o.user?.province, o.district || o.user?.district, o.village || o.user?.village, o.landmark || o.user?.landmark].filter(Boolean).join(', ') || 'N/A'}</strong></div>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="mb-4">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Items ({o.items?.length || 0})</h4>
                    <div className="space-y-2">
                      {(o.items || []).slice(0, 3).map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-sm">
                          <span className="text-midnight">{item.product?.nameEn || 'Product'} × {item.quantity}</span>
                          <span className="text-body font-medium">${(item.retailPrice * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                      {(o.items?.length || 0) > 3 && <p className="text-xs text-gray-400">+{o.items.length - 3} more items</p>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
                    {o.status === 'confirmed' && (
                      <button onClick={() => updateStatus(o.id, 'shipped')} disabled={updating === o.id} className="theme-btn theme-btn-sm disabled:opacity-50">
                        {updating === o.id ? 'Updating...' : '📦 Mark as Shipped'}
                      </button>
                    )}
                    {o.status === 'shipped' && (
                      <button onClick={() => updateStatus(o.id, 'delivered')} disabled={updating === o.id} className="theme-btn theme-btn-sm bg-green border-green disabled:opacity-50">
                        {updating === o.id ? 'Updating...' : '✅ Mark as Delivered'}
                      </button>
                    )}
                    {o.status === 'delivered' && (
                      <span className="text-sm text-green font-semibold flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Delivered Successfully
                      </span>
                    )}
                    <a href={`tel:${o.user?.phone}`} className="theme-btn2 theme-btn-sm ml-auto">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" /></svg>
                      Call Customer
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-6"><Pagination page={page} totalPages={totalPages} onPageChange={setPage} /></div>
      </div>
    </div>
  );
}
