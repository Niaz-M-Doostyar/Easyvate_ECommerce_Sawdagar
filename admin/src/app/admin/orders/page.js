"use client";
import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/contexts/ToastContext";
import Pagination from "@/components/Pagination";
import Modal from "@/components/Modal";
import { CSVButton } from "@/components/CSVExport";
import { useDeliveryPersons, adminPut } from "@/hooks/useAdminApi";
import { formatPrice, formatPriceDecimal, CURRENCY_SYMBOL } from "@/lib/currency";

export default function AdminOrders() {
  const { t } = useLanguage();
  const toast = useToast();
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");
  const [detail, setDetail] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [deliveryModal, setDeliveryModal] = useState(null);
  const [selectedDelivery, setSelectedDelivery] = useState("");
  const { data: deliveryPersons } = useDeliveryPersons();

  const fetchOrders = useCallback(async () => {
    const q = new URLSearchParams({ page, limit: 20 });
    if (statusFilter !== "all") q.set("status", statusFilter);
    const r = await fetch(`/api/admin/orders?${q}`, { credentials: "include" });
    if (r.ok) { const d = await r.json(); setOrders(d.orders || []); setTotalPages(d.totalPages || 1); setTotal(d.total || 0); }
  }, [page, statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const updateStatus = async (id, status) => {
    try {
      await adminPut(`orders/${id}`, { status });
      toast.success(`Order ${status}`);
      fetchOrders();
      setDetail(null);
      setDetailData(null);
    } catch { toast.error("Update failed"); }
  };

  const assignDelivery = async () => {
    if (!selectedDelivery) { toast.error("Select a delivery person"); return; }
    try {
      await adminPut(`orders/${deliveryModal.id}`, { deliveryPersonId: parseInt(selectedDelivery) });
      toast.success("Delivery person assigned");
      setDeliveryModal(null);
      fetchOrders();
    } catch { toast.error("Assignment failed"); }
  };

  const openDetail = async (order) => {
    setDetail(order);
    try {
      const r = await fetch(`/api/admin/orders/${order.id}`, { credentials: "include" });
      if (r.ok) { const json = await r.json(); setDetailData(json.order || json); }
      else setDetailData(null);
    } catch { setDetailData(null); }
  };

  const statusColor = { pending: "badge-yellow", confirmed: "badge-blue", shipped: "badge-primary", delivered: "badge-green", cancelled: "badge-red" };
  const nextStatus = { pending: "confirmed", confirmed: "shipped", shipped: "delivered" };
  const persons = deliveryPersons || [];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{t("orders")} <span className="text-base font-normal text-body ml-2">({total})</span></h1>
        <div className="flex items-center gap-3 flex-wrap">
          <CSVButton type="orders" label="Export Orders" />
          <div className="flex gap-2 flex-wrap">
            {["all","pending","confirmed","shipped","delivered","cancelled"].map(s => (
              <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }} className={`btn btn-sm ${statusFilter === s ? "btn-primary" : "btn-outline"}`}>{s === "all" ? t("all") : t(s)}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Order #</th><th>{t("customer")}</th><th>Items</th><th>{t("amount")}</th><th>Payment</th><th>Delivery</th><th>{t("status")}</th><th>{t("date")}</th><th>{t("actions")}</th></tr></thead>
            <tbody>
              {orders.length === 0 && <tr><td colSpan={9} className="text-center py-12 text-body">{t("no_data")}</td></tr>}
              {orders.map(o => (
                <tr key={o.id}>
                  <td className="font-semibold text-navy">{o.orderNumber}</td>
                  <td>
                    <div className="text-sm font-medium text-navy">{o.user?.fullName || "N/A"}</div>
                    <div className="text-xs text-body">{o.user?.phone || ""}</div>
                  </td>
                  <td><span className="badge badge-gray">{o.items?.length || 0}</span></td>
                  <td className="font-semibold">{CURRENCY_SYMBOL}{o.totalAmount}</td>
                  <td><span className={`badge ${o.paymentStatus === "paid" ? "badge-green" : "badge-yellow"}`}>{o.paymentStatus}</span></td>
                  <td>
                    {o.deliveryPerson ? (
                      <span className="text-sm text-navy">{o.deliveryPerson.fullName}</span>
                    ) : (
                      <button onClick={() => { setDeliveryModal(o); setSelectedDelivery(""); }} className="text-xs text-primary underline font-semibold">Assign</button>
                    )}
                  </td>
                  <td><span className={`badge ${statusColor[o.status] || "badge-gray"}`}>{o.status}</span></td>
                  <td className="text-body text-sm">{new Date(o.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => openDetail(o)} className="btn btn-sm btn-outline">{t("view")}</button>
                      {nextStatus[o.status] && <button onClick={() => updateStatus(o.id, nextStatus[o.status])} className="btn btn-sm btn-primary">{nextStatus[o.status]}</button>}
                      {o.status !== "cancelled" && o.status !== "delivered" && (
                        <button onClick={() => updateStatus(o.id, "cancelled")} className="btn btn-sm btn-danger text-xs">Cancel</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4"><Pagination page={page} totalPages={totalPages} onPageChange={setPage} /></div>
      </div>

      {/* Order Detail Modal */}
      <Modal open={!!detail} onClose={() => { setDetail(null); setDetailData(null); }} title={`Order ${detail?.orderNumber || ""}`} size="lg">
        {detail && (
          <div className="space-y-4">
            {/* Customer Info */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-body">{t("customer")}:</span> <strong className="text-navy">{detail.user?.fullName}</strong></div>
              <div><span className="text-body">{t("phone")}:</span> <strong>{detail.user?.phone || detail.phone || "N/A"}</strong></div>
              <div><span className="text-body">{t("address")}:</span> <strong>{[detail.province, detail.district, detail.village].filter(Boolean).join(", ") || "N/A"}</strong></div>
              <div><span className="text-body">{t("status")}:</span> <span className={`badge ${statusColor[detail.status]}`}>{detail.status}</span></div>
              <div><span className="text-body">Payment:</span> <span className={`badge ${detail.paymentStatus === "paid" ? "badge-green" : "badge-yellow"}`}>{detail.paymentStatus} (COD)</span></div>
              <div><span className="text-body">Delivery:</span> <strong>{detail.deliveryPerson?.fullName || "Not assigned"}</strong></div>
            </div>

            <hr className="border-gray-100" />

            {/* Order Items */}
            <div>
              <h4 className="font-semibold text-navy mb-2">Items</h4>
              <table className="table text-sm">
                <thead>
                  <tr><th>Product</th><th>Qty</th><th>Retail</th><th>Wholesale</th><th>Subtotal</th><th>Profit</th></tr>
                </thead>
                <tbody>
                  {(detailData?.items || detail.items || []).map((item, i) => {
                    const wholesale = item.wholesaleCost || item.product?.wholesaleCost || 0;
                    const retail = item.retailPrice || 0;
                    const profit = (retail - wholesale) * item.quantity;
                    return (
                      <tr key={i}>
                        <td className="text-navy font-medium">{item.product?.nameEn || `Product #${item.productId}`}</td>
                        <td>{item.quantity}</td>
                        <td>{formatPriceDecimal(retail)}</td>
                        <td className="text-body">{formatPriceDecimal(wholesale)}</td>
                        <td className="font-semibold">{formatPriceDecimal(retail * item.quantity)}</td>
                        <td className={`font-semibold ${profit >= 0 ? "text-green" : "text-red"}`}>{formatPriceDecimal(profit)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-between items-center pt-3 border-t border-gray-100">
              <div className="text-sm">
                {detailData?.totalWholesale != null && (
                  <span className="mr-4 text-body">Wholesale: <strong className="text-navy">{formatPriceDecimal(detailData.totalWholesale)}</strong></span>
                )}
                {detailData?.totalProfit != null && (
                  <span className="text-green font-semibold">Profit: {formatPriceDecimal(detailData.totalProfit)}</span>
                )}
              </div>
              <div className="text-lg font-bold text-navy">{t("total")}: {CURRENCY_SYMBOL}{detail.totalAmount}</div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-3 border-t border-gray-100">
              {nextStatus[detail.status] && (
                <button onClick={() => updateStatus(detail.id, nextStatus[detail.status])} className="btn btn-primary">
                  Mark as {nextStatus[detail.status]}
                </button>
              )}
              {!detail.deliveryPerson && detail.status !== "cancelled" && detail.status !== "delivered" && (
                <button onClick={() => { setDetail(null); setDeliveryModal(detail); setSelectedDelivery(""); }} className="btn btn-outline">
                  Assign Delivery
                </button>
              )}
              {detail.status !== "cancelled" && detail.status !== "delivered" && (
                <button onClick={() => updateStatus(detail.id, "cancelled")} className="btn btn-danger">Cancel Order</button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Delivery Assignment Modal */}
      <Modal open={!!deliveryModal} onClose={() => setDeliveryModal(null)} title="Assign Delivery Person" size="sm">
        {deliveryModal && (
          <div className="space-y-4">
            <p className="text-sm text-body">Order: <strong className="text-navy">{deliveryModal.orderNumber}</strong></p>
            <div>
              <label className="label">Delivery Person</label>
              <select className="input" value={selectedDelivery} onChange={e => setSelectedDelivery(e.target.value)}>
                <option value="">Select...</option>
                {persons.map(p => (
                  <option key={p.id} value={p.id}>{p.fullName} — {p.phone || "No phone"}</option>
                ))}
              </select>
              {persons.length === 0 && <p className="text-xs text-red mt-1">No delivery persons found. Add users with &quot;delivery&quot; role first.</p>}
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setDeliveryModal(null)} className="btn btn-outline">{t("cancel")}</button>
              <button onClick={assignDelivery} className="btn btn-primary">Assign</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
