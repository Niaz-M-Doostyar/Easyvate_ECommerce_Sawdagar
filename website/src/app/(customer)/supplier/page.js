"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth, authHeaders } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import Pagination from "@/components/Pagination";

const imgBase = process.env.NEXT_PUBLIC_API_URL || "";

export default function SupplierPortalPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState("products");
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [prodPage, setProdPage] = useState(1);
  const [prodTotalPages, setProdTotalPages] = useState(1);
  const [ordPage, setOrdPage] = useState(1);
  const [ordTotalPages, setOrdTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchProducts = useCallback(async () => {
    const q = new URLSearchParams({ page: prodPage, limit: 10 });
    if (statusFilter !== "all") q.set("status", statusFilter);
    try {
      const r = await fetch(`/api/supplier/products?${q}`, { headers: authHeaders() });
      if (r.ok) { const d = await r.json(); setProducts(d.products || []); setProdTotalPages(d.totalPages || 1); }
    } catch {}
  }, [prodPage, statusFilter]);

  const fetchOrders = useCallback(async () => {
    try {
      const r = await fetch(`/api/supplier/orders?page=${ordPage}&limit=10`, { headers: authHeaders() });
      if (r.ok) { const d = await r.json(); setOrders(d.orders || []); setOrdTotalPages(d.totalPages || 1); }
    } catch {}
  }, [ordPage]);

  useEffect(() => { if (user?.role === "supplier") fetchProducts(); }, [fetchProducts, user]);
  useEffect(() => { if (user?.role === "supplier" && tab === "orders") fetchOrders(); }, [fetchOrders, user, tab]);

  // Auto-refresh
  useEffect(() => {
    if (user?.role !== "supplier") return;
    const i = setInterval(() => { if (tab === "products") fetchProducts(); else fetchOrders(); }, 30000);
    return () => clearInterval(i);
  }, [fetchProducts, fetchOrders, tab, user]);

  const deleteProduct = async (id) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const r = await fetch(`/api/supplier/products/${id}`, { method: "DELETE", headers: authHeaders() });
      if (r.ok) { toast.success("Product deleted"); fetchProducts(); }
      else toast.error("Failed to delete product");
    } catch { toast.error("Something went wrong"); }
  };

  if (!user) return <div className="py-20 text-center container-main"><h2 className="text-2xl font-bold text-midnight mb-4">Please Sign In</h2><Link href="/login" className="theme-btn inline-flex">Sign In</Link></div>;
  if (user.role !== "supplier") return <div className="py-20 text-center container-main"><h2 className="text-2xl font-bold text-midnight mb-4">Access Denied</h2><p className="text-body mb-4">This portal is for suppliers only.</p><Link href="/dashboard" className="theme-btn inline-flex">Go to Dashboard</Link></div>;

  const statusBadge = { pending: "bg-yellow-50 text-yellow-700 border-yellow-200", approved: "bg-green-50 text-green-700 border-green-200", rejected: "bg-red-50 text-red-700 border-red-200" };
  const orderBadge = { pending: "bg-yellow-50 text-yellow-700 border-yellow-200", confirmed: "bg-blue-50 text-blue-700 border-blue-200", shipped: "bg-cyan-50 text-cyan-700 border-cyan-200", delivered: "bg-green-50 text-green-700 border-green-200", cancelled: "bg-red-50 text-red-700 border-red-200" };

  return (
    <div className="py-6 md:py-8">
      <div className="container-main max-w-6xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-navy to-navy-dark rounded-2xl p-6 sm:p-8 mb-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold font-display mb-2">Supplier Dashboard</h1>
              <p className="text-white/60 text-sm">Manage your products and track orders</p>
            </div>
            <div className="flex gap-2">
              <div className="text-center bg-white/10 backdrop-blur rounded-xl px-4 py-2">
                <p className="text-2xl font-bold">{products.length}</p>
                <p className="text-xs text-white/50">Products</p>
              </div>
              <Link href="/profile" className="theme-btn2 theme-btn-sm border-white/30 text-white hover:bg-white/10 self-start">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" /></svg>
                Profile
              </Link>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1">
          {[{ key: "products", label: "My Products", icon: "📦" }, { key: "orders", label: "Orders", icon: "🛒" }].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`flex-1 py-3 rounded-lg font-semibold text-sm transition-all ${tab === t.key ? "bg-white text-midnight shadow-sm" : "text-body hover:text-midnight"}`}>{t.icon} {t.label}</button>
          ))}
        </div>

        {/* Products Tab */}
        {tab === "products" && (
          <>
            <div className="flex flex-wrap items-center gap-2 mb-6">
              {["all", "pending", "approved", "rejected"].map(s => (
                <button key={s} onClick={() => { setStatusFilter(s); setProdPage(1); }} className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${statusFilter === s ? "bg-gold text-white shadow-md shadow-gold/20" : "bg-white text-body hover:bg-gray-50 border border-gray-200"}`}>{s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}</button>
              ))}
            </div>

            {products.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-card p-12 text-center">
                <p className="text-4xl mb-3">📦</p>
                <p className="text-body font-medium">No products yet</p>
                <p className="text-sm text-gray-400 mt-1">Products you add via the admin panel will appear here</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {products.map(p => (
                  <div key={p.id} className="bg-white rounded-2xl shadow-card overflow-hidden hover:shadow-card-hover transition-shadow">
                    <div className="flex flex-col sm:flex-row">
                      <div className="sm:w-32 sm:h-32 h-48 bg-gray-100 flex-shrink-0">
                        <img src={p.images?.[0]?.url ? `${imgBase}${p.images[0].url}` : "/placeholder.png"} alt={p.nameEn} className="w-full h-full object-cover" onError={e => { e.target.src = "/placeholder.png"; }} />
                      </div>
                      <div className="flex-1 p-4 sm:p-5">
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-midnight">{p.nameEn}</h3>
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${statusBadge[p.status] || "bg-gray-100 text-body border-gray-200"}`}>{p.status}</span>
                            </div>
                            <p className="text-xs text-body">{p.category?.nameEn || "Uncategorized"} · Stock: {p.stock}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-midnight">${p.wholesaleCost}</p>
                            <p className="text-xs text-body">wholesale</p>
                            {p.retailPrice && <p className="text-sm text-green font-semibold">${p.retailPrice} retail</p>}
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button onClick={() => deleteProduct(p.id)} className="text-xs text-red-500 hover:text-red-700 font-medium transition-colors">Delete</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-6"><Pagination page={prodPage} totalPages={prodTotalPages} onPageChange={setProdPage} /></div>
          </>
        )}

        {/* Orders Tab */}
        {tab === "orders" && (
          <>
            {orders.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-card p-12 text-center">
                <p className="text-4xl mb-3">🛒</p>
                <p className="text-body font-medium">No orders with your products yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map(o => (
                  <div key={o.id} className="bg-white rounded-2xl shadow-card overflow-hidden p-5 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <p className="font-bold text-midnight text-lg">#{o.orderNumber || o.id}</p>
                        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${orderBadge[o.status] || "bg-gray-100 text-body border-gray-200"}`}>{o.status}</span>
                      </div>
                      <div className="text-sm text-body">{new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 mb-3">
                      <p className="text-xs text-gray-400 font-bold uppercase mb-2">Customer</p>
                      <p className="text-sm text-midnight font-medium">{o.user?.fullName || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-bold uppercase mb-2">Your Items</p>
                      {(o.items || []).map((item, i) => (
                        <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-gray-50 last:border-0">
                          <span className="text-midnight">{item.product?.nameEn || "Product"} × {item.quantity}</span>
                          <span className="text-body font-medium">${(item.retailPrice * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                      <span className="text-sm text-body">Total (your items)</span>
                      <span className="font-bold text-midnight">${(o.items || []).reduce((s, i) => s + i.retailPrice * i.quantity, 0).toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-6"><Pagination page={ordPage} totalPages={ordTotalPages} onPageChange={setOrdPage} /></div>
          </>
        )}
      </div>
    </div>
  );
}
