"use client";
import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import Pagination from "@/components/Pagination";
import { formatPriceDecimal } from "@/lib/currency";
export default function SupplierOrders() {
  const { t } = useLanguage();
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const fetchOrders = useCallback(async () => {
    const r = await fetch(`/api/supplier/orders?page=${page}&limit=20`, { credentials: "include" });
    if (r.ok) { const d = await r.json(); setOrders(d.orders || []); setTotalPages(d.totalPages || 1); }
  }, [page]);
  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  const statusColor = { pending: "badge-yellow", confirmed: "badge-blue", shipped: "badge-primary", delivered: "badge-green", cancelled: "badge-red" };
  return (
    <div>
      <div className="page-header"><h1 className="page-title">{t("my_orders")}</h1></div>
      <div className="card">
        <div className="table-wrap"><table className="table"><thead><tr><th>Order #</th><th>{t("customer")}</th><th>My Items</th><th>My Revenue</th><th>{t("status")}</th><th>{t("date")}</th></tr></thead><tbody>
          {orders.length === 0 && <tr><td colSpan={6} className="text-center py-12 text-body">{t("no_data")}</td></tr>}
          {orders.map(o => {
            const myItems = o.items || [];
            const myRevenue = myItems.reduce((s, i) => s + (i.wholesaleCost || 0) * (i.quantity || 0), 0);
            return (
              <tr key={o.id}>
                <td className="font-semibold text-navy">{o.orderNumber}</td>
                <td className="text-sm">{o.user?.fullName || "N/A"}</td>
                <td>{myItems.length}</td>
                <td className="font-semibold text-green">{formatPriceDecimal(myRevenue)}</td>
                <td><span className={`badge ${statusColor[o.status] || "badge-gray"}`}>{o.status}</span></td>
                <td className="text-body text-sm">{new Date(o.createdAt).toLocaleDateString()}</td>
              </tr>
            );
          })}
        </tbody></table></div>
        <div className="p-4"><Pagination page={page} totalPages={totalPages} onPageChange={setPage} /></div>
      </div>
    </div>
  );
}
