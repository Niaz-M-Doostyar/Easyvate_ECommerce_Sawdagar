"use client";
import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/contexts/ToastContext";
import { CURRENCY_SYMBOL } from "@/lib/currency";
export default function SupplierSponsorships() {
  const { t } = useLanguage();
  const toast = useToast();
  const [requests, setRequests] = useState([]);
  const [packages, setPackages] = useState([]);
  const [products, setProducts] = useState([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ productId: "", packageId: "" });
  const fetchData = useCallback(async () => {
    const [rR, pR, prR] = await Promise.all([
      fetch("/api/supplier/sponsorships", { credentials: "include" }),
      fetch("/api/admin/sponsorships/packages", { credentials: "include" }),
      fetch("/api/supplier/products?limit=100", { credentials: "include" }),
    ]);
    if (rR.ok) setRequests(await rR.json().then(d => d.requests || d || []));
    if (pR.ok) setPackages(await pR.json().then(d => d.packages || d || []));
    if (prR.ok) setProducts(await prR.json().then(d => (d.products || []).filter(p => p.status === "approved")));
  }, []);
  useEffect(() => { fetchData(); }, [fetchData]);
  const submitRequest = async () => {
    if (!form.productId || !form.packageId) { toast.error("Select product and package"); return; }
    const r = await fetch("/api/supplier/sponsorships", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(form) });
    if (r.ok) { toast.success("Request submitted!"); setModal(false); fetchData(); } else toast.error("Failed");
  };
  const statusColor = { pending: "badge-yellow", approved: "badge-green", rejected: "badge-red", expired: "badge-gray" };
  return (
    <div>
      <div className="page-header"><h1 className="page-title">{t("sponsorships")}</h1><button onClick={() => setModal(true)} className="btn btn-primary">Request Sponsorship</button></div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {packages.filter(p => p.isActive).map(pkg => (
          <div key={pkg.id} className="card card-p">
            <h3 className="font-bold text-navy mb-1">{pkg.name}</h3>
            <p className="text-body text-sm mb-3">{pkg.description || "Boost your product visibility"}</p>
            <div className="flex justify-between items-center"><span className="text-xl font-bold text-primary">{CURRENCY_SYMBOL}{pkg.price}</span><span className="text-body text-sm">{pkg.durationDays} days</span></div>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="p-4 border-b border-gray-100"><h3 className="font-semibold text-navy">My Requests</h3></div>
        <div className="table-wrap"><table className="table"><thead><tr><th>Product</th><th>Package</th><th>{t("status")}</th><th>Period</th></tr></thead><tbody>
          {requests.length === 0 && <tr><td colSpan={4} className="text-center py-8 text-body">{t("no_data")}</td></tr>}
          {requests.map(r => (
            <tr key={r.id}>
              <td className="font-semibold text-navy text-sm">{r.product?.nameEn || `#${r.productId}`}</td>
              <td className="text-sm">{r.package?.name || "N/A"}</td>
              <td><span className={`badge ${statusColor[r.status] || "badge-gray"}`}>{r.status}</span></td>
              <td className="text-sm text-body">{r.startDate ? `${new Date(r.startDate).toLocaleDateString()} → ${new Date(r.endDate).toLocaleDateString()}` : "—"}</td>
            </tr>
          ))}
        </tbody></table></div>
      </div>
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-navy mb-4">Request Sponsorship</h3>
            <div className="space-y-4">
              <div><label className="label">Product (approved only)</label><select value={form.productId} onChange={e => setForm({...form, productId: e.target.value})} className="input"><option value="">Select product...</option>{products.map(p => <option key={p.id} value={p.id}>{p.nameEn}</option>)}</select></div>
              <div><label className="label">Package</label><select value={form.packageId} onChange={e => setForm({...form, packageId: e.target.value})} className="input"><option value="">Select package...</option>{packages.filter(p => p.isActive).map(p => <option key={p.id} value={p.id}>{p.name} - {CURRENCY_SYMBOL}{p.price} ({p.durationDays}d)</option>)}</select></div>
              <div className="flex gap-2 justify-end"><button onClick={() => setModal(false)} className="btn btn-outline">{t("cancel")}</button><button onClick={submitRequest} className="btn btn-primary">Submit</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
