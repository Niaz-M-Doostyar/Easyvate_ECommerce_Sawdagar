"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth, authHeaders } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { formatPrice } from "@/lib/currency";
import Pagination from "@/components/Pagination";
import AccountLayout from "@/components/AccountLayout";

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
    const q = new URLSearchParams({ all: "true" });
    if (statusFilter !== "all") q.set("status", statusFilter);
    try {
      const r = await fetch(`/api/supplier/products?${q}`, { headers: authHeaders() });
      if (r.ok) { const d = await r.json(); setProducts(d.products || []); setProdTotalPages(d.totalPages || 1); }
    } catch {}
  }, [statusFilter]);

  const fetchOrders = useCallback(async () => {
    try {
      const r = await fetch(`/api/supplier/orders?page=${ordPage}&limit=10`, { headers: authHeaders() });
      if (r.ok) { const d = await r.json(); setOrders(d.orders || []); setOrdTotalPages(d.totalPages || 1); }
    } catch {}
  }, [ordPage]);

  useEffect(() => { if (user?.role === "supplier") fetchProducts(); }, [fetchProducts, user]);
  useEffect(() => { if (user?.role === "supplier" && tab === "orders") fetchOrders(); }, [fetchOrders, user, tab]);

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

  if (!user) return (
    <section className="f2-account-gate">
      <div className="f2-account-gate__icon" aria-hidden="true"><i className="far fa-store" /></div>
      <span>Supplier account</span>
      <h1>Please sign in</h1>
      <p>Sign in with your supplier account to continue.</p>
      <Link href="/login" className="f2-account-button">Sign in</Link>
    </section>
  );

  if (user.role !== "supplier") return (
    <section className="f2-account-gate">
      <div className="f2-account-gate__icon" aria-hidden="true"><i className="far fa-lock" /></div>
      <span>Supplier account</span>
      <h1>Access denied</h1>
      <p>This portal is for approved suppliers only.</p>
      <Link href="/dashboard" className="f2-account-button">Go to dashboard</Link>
    </section>
  );

  return (
    <AccountLayout
      title="Supplier dashboard"
      description="Manage your products and track orders containing your inventory."
      eyebrow="Supplier portal"
    >
      <section className="f2-role-banner">
        <div className="f2-role-banner__icon" aria-hidden="true"><i className="far fa-store" /></div>
        <div className="f2-role-banner__copy">
          <span>Supplier workspace</span>
          <h2>Welcome, {user.fullName || user.companyName || 'supplier'}</h2>
          <p>Your product approvals and customer orders are kept together here.</p>
        </div>
        <div className="f2-role-banner__stat">
          <strong>{products.length}</strong>
          <span>Products on this page</span>
        </div>
        <Link href="/profile" className="f2-account-button f2-account-button--secondary"><i className="far fa-user" /> Profile</Link>
      </section>

      <div className="f2-account-tabs f2-account-tabs--boxed" role="tablist" aria-label="Supplier portal sections">
        <button type="button" onClick={() => setTab("products")} className={tab === "products" ? "is-active" : ""} role="tab" aria-selected={tab === "products"}><i className="far fa-box" /> My products</button>
        <button type="button" onClick={() => setTab("orders")} className={tab === "orders" ? "is-active" : ""} role="tab" aria-selected={tab === "orders"}><i className="far fa-shopping-bag" /> Orders</button>
      </div>

      {tab === "products" && (
        <section className="f2-account-card">
          <div className="f2-account-card__heading f2-account-card__heading--split">
            <div>
              <span>Inventory</span>
              <h2>My products</h2>
            </div>
            <span className="f2-account-card__meta">Page {prodPage} of {prodTotalPages}</span>
          </div>

          <div className="f2-account-filters" aria-label="Filter products by approval status">
            {["all", "pending", "approved", "rejected"].map((s) => (
              <button type="button" key={s} onClick={() => { setStatusFilter(s); setProdPage(1); }} className={statusFilter === s ? "is-active" : ""} aria-pressed={statusFilter === s}>{s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}</button>
            ))}
          </div>

          {products.length === 0 ? (
            <div className="f2-account-empty">
              <span className="f2-account-empty__icon" aria-hidden="true"><i className="far fa-box-open" /></span>
              <h3>No products yet</h3>
              <p>Products you add through the supplier workflow will appear here.</p>
            </div>
          ) : (
            <div className="f2-supplier-products">
              {products.map((p) => (
                <article key={p.id} className="f2-supplier-product">
                  <div className="f2-supplier-product__media">
                    <img src={p.images?.[0]?.url ? `${imgBase}${p.images[0].url}` : "/placeholder.png"} alt={p.nameEn} onError={e => { e.currentTarget.src = "/placeholder.png"; }} />
                  </div>
                  <div className="f2-supplier-product__body">
                    <div className="f2-supplier-product__title">
                      <div>
                        <span>{p.category?.nameEn || "Uncategorized"}</span>
                        <h3>{p.nameEn}</h3>
                      </div>
                      <span className={`f2-account-status f2-account-status--${p.status}`}>{p.status}</span>
                    </div>
                    <div className="f2-supplier-product__facts">
                      <div><span>Stock</span><strong>{p.stock}</strong></div>
                      <div><span>Wholesale</span><strong>{formatPrice(p.wholesaleCost)}</strong></div>
                      <div><span>Retail</span><strong>{p.retailPrice ? formatPrice(p.retailPrice) : '—'}</strong></div>
                    </div>
                    <button type="button" onClick={() => deleteProduct(p.id)} className="f2-account-danger-link"><i className="far fa-trash-alt" /> Delete product</button>
                  </div>
                </article>
              ))}
            </div>
          )}
          <div className="f2-account-pagination"><Pagination page={prodPage} totalPages={prodTotalPages} onPageChange={setProdPage} /></div>
        </section>
      )}

      {tab === "orders" && (
        <section className="f2-account-card">
          <div className="f2-account-card__heading f2-account-card__heading--split">
            <div>
              <span>Sales</span>
              <h2>Orders with your products</h2>
            </div>
            <span className="f2-account-card__meta">Page {ordPage} of {ordTotalPages}</span>
          </div>

          {orders.length === 0 ? (
            <div className="f2-account-empty">
              <span className="f2-account-empty__icon" aria-hidden="true"><i className="far fa-shopping-bag" /></span>
              <h3>No supplier orders yet</h3>
              <p>Orders containing your products will appear here.</p>
            </div>
          ) : (
            <div className="f2-role-orders">
              {orders.map((o) => (
                <article key={o.id} className="f2-role-order">
                  <header>
                    <div><span>Order</span><h3>#{o.orderNumber || o.id}</h3></div>
                    <span className={`f2-account-status f2-account-status--${o.status}`}>{o.status}</span>
                    <time>{new Date(o.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</time>
                  </header>
                  <div className="f2-role-order__customer"><span>Customer</span><strong>{o.user?.fullName || "N/A"}</strong></div>
                  <div className="f2-role-order__items">
                    <span>Your items</span>
                    {(o.items || []).map((item, i) => (
                      <div key={i}>
                        <span className="flex items-center gap-2">
                          {item.product?.images?.[0]?.url && <img src={item.product.images[0].url} alt="" className="w-10 h-10 rounded object-cover" />}
                          {item.product?.nameEn || "Product"} × {item.quantity}
                        </span>
                        <strong>{formatPrice(item.retailPrice * item.quantity)}</strong>
                      </div>
                    ))}
                  </div>
                  <footer><span>Total for your items</span><strong>{formatPrice((o.items || []).reduce((sum, item) => sum + item.retailPrice * item.quantity, 0))}</strong></footer>
                </article>
              ))}
            </div>
          )}
          <div className="f2-account-pagination"><Pagination page={ordPage} totalPages={ordTotalPages} onPageChange={setOrdPage} /></div>
        </section>
      )}
    </AccountLayout>
  );
}
