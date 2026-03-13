"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { CURRENCY_SYMBOL } from "@/lib/currency";
export default function SupplierDashboard() {
  const { t } = useLanguage();
  const [stats, setStats] = useState({});
  const [products, setProducts] = useState([]);
  useEffect(() => {
    fetch("/api/supplier/products?limit=5", { credentials: "include" }).then(r => r.json()).then(d => { setProducts(d.products || []); setStats({ total: d.total || 0, pending: (d.products || []).filter(p => p.status === "pending").length, approved: (d.products || []).filter(p => p.status === "approved").length }); }).catch(() => {});
  }, []);
  const statusColor = { pending: "badge-yellow", approved: "badge-green", rejected: "badge-red" };
  return (
    <div>
      <div className="page-header"><h1 className="page-title">{t("dashboard")}</h1><Link href="/supplier/products/new" className="btn btn-primary"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>{t("add_product")}</Link></div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[{ label: "Total Products", value: stats.total || 0, color: "bg-primary/10 text-primary" }, { label: t("pending"), value: stats.pending || 0, color: "bg-yellow/10 text-yellow" }, { label: t("approved"), value: stats.approved || 0, color: "bg-green/10 text-green" }].map((c, i) => (
          <div key={i} className="card stat-card"><div className={`stat-icon ${c.color}`}><svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg></div><div><div className="stat-value">{c.value}</div><div className="stat-label">{c.label}</div></div></div>
        ))}
      </div>
      <div className="card">
        <div className="flex items-center justify-between p-4 border-b border-gray-100"><h3 className="font-semibold text-navy">Recent Products</h3><Link href="/supplier/products" className="text-primary text-sm font-semibold">View All</Link></div>
        <div className="table-wrap"><table className="table"><thead><tr><th>Image</th><th>{t("name")}</th><th>{t("wholesale")}</th><th>{t("retail")}</th><th>{t("stock")}</th><th>{t("status")}</th></tr></thead><tbody>
          {products.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-body">No products yet. <Link href="/supplier/products/new" className="text-primary font-semibold">Add your first product</Link></td></tr>}
          {products.map(p => <tr key={p.id}><td><div className="w-10 h-10 rounded bg-gray-100 overflow-hidden">{p.images?.[0] && <img src={p.images[0].url} alt="" className="w-full h-full object-cover" />}</div></td><td className="font-semibold text-navy text-sm">{p.nameEn}</td><td>{CURRENCY_SYMBOL}{p.wholesaleCost}</td><td>{p.retailPrice ? `${CURRENCY_SYMBOL}${p.retailPrice}` : "—"}</td><td>{p.stock}</td><td><span className={`badge ${statusColor[p.status] || "badge-gray"}`}>{p.status}</span></td></tr>)}
        </tbody></table></div>
      </div>
    </div>
  );
}
