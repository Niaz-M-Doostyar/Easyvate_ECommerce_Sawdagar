"use client";
import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/contexts/ToastContext";
import { CURRENCY_SYMBOL } from "@/lib/currency";
export default function AdminSponsorships() {
  const { t } = useLanguage();
  const toast = useToast();
  const [tab, setTab] = useState("requests");
  const [packages, setPackages] = useState([]);
  const [requests, setRequests] = useState([]);
  const [pkgModal, setPkgModal] = useState(null);
  const [form, setForm] = useState({ name: "", durationDays: 7, price: "", description: "" });
  const fetchData = useCallback(async () => {
    const [pR, rR] = await Promise.all([
      fetch("/api/admin/sponsorships/packages", { credentials: "include" }),
      fetch("/api/admin/sponsorships/requests", { credentials: "include" }),
    ]);
    if (pR.ok) setPackages(await pR.json().then(d => d.packages || d));
    if (rR.ok) setRequests(await rR.json().then(d => d.requests || d));
  }, []);
  useEffect(() => { fetchData(); }, [fetchData]);
  const savePackage = async () => {
    const method = pkgModal === "new" ? "POST" : "PUT";
    const url = pkgModal === "new" ? "/api/admin/sponsorships/packages" : `/api/admin/sponsorships/packages/${form.id}`;
    const r = await fetch(url, { method, headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(form) });
    if (r.ok) { toast.success("Package saved"); setPkgModal(null); fetchData(); } else toast.error("Failed");
  };
  const handleRequest = async (id, status) => {
    const body = { status };
    if (status === "approved") body.startDate = new Date().toISOString();
    const r = await fetch(`/api/admin/sponsorships/requests/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(body) });
    if (r.ok) { toast.success(`Request ${status}`); fetchData(); } else toast.error("Failed");
  };
  const statusColor = { pending: "badge-yellow", approved: "badge-green", rejected: "badge-red", expired: "badge-gray" };
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{t("sponsorships")}</h1>
        <div className="flex gap-2">
          <button onClick={() => setTab("requests")} className={`btn btn-sm ${tab === "requests" ? "btn-primary" : "btn-outline"}`}>Requests</button>
          <button onClick={() => setTab("packages")} className={`btn btn-sm ${tab === "packages" ? "btn-primary" : "btn-outline"}`}>Packages</button>
        </div>
      </div>
      {tab === "requests" ? (
        <div className="card">
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>Product</th><th>{t("supplier")}</th><th>Package</th><th>{t("status")}</th><th>Dates</th><th>{t("actions")}</th></tr></thead>
              <tbody>
                {requests.length === 0 && <tr><td colSpan={6} className="text-center py-12 text-body">{t("no_data")}</td></tr>}
                {requests.map(r => (
                  <tr key={r.id}>
                    <td className="font-semibold text-navy text-sm">{r.product?.nameEn || `#${r.productId}`}</td>
                    <td className="text-sm">{r.supplier?.companyName || r.supplier?.fullName || "N/A"}</td>
                    <td className="text-sm">{r.package?.name || "N/A"} ({r.package?.durationDays}d - {CURRENCY_SYMBOL}{r.package?.price})</td>
                    <td><span className={`badge ${statusColor[r.status] || "badge-gray"}`}>{r.status}</span></td>
                    <td className="text-sm text-body">{r.startDate ? new Date(r.startDate).toLocaleDateString() : "—"} → {r.endDate ? new Date(r.endDate).toLocaleDateString() : "—"}</td>
                    <td>{r.status === "pending" && <div className="flex gap-1"><button onClick={() => handleRequest(r.id, "approved")} className="btn btn-sm btn-success">{t("approve")}</button><button onClick={() => handleRequest(r.id, "rejected")} className="btn btn-sm btn-danger">{t("reject")}</button></div>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex justify-end mb-4"><button onClick={() => { setForm({ name: "", durationDays: 7, price: "", description: "" }); setPkgModal("new"); }} className="btn btn-primary">{t("add")} Package</button></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {packages.map(pkg => (
              <div key={pkg.id} className="card card-p">
                <div className="flex justify-between items-start mb-3"><h3 className="font-bold text-navy">{pkg.name}</h3><span className={`badge ${pkg.isActive ? "badge-green" : "badge-gray"}`}>{pkg.isActive ? "Active" : "Inactive"}</span></div>
                <p className="text-body text-sm mb-3">{pkg.description || "No description"}</p>
                <div className="flex justify-between items-center"><div><span className="text-2xl font-bold text-navy">{CURRENCY_SYMBOL}{pkg.price}</span><span className="text-body text-sm ml-1">/ {pkg.durationDays} days</span></div>
                <button onClick={() => { setForm(pkg); setPkgModal("edit"); }} className="btn btn-sm btn-outline">{t("edit")}</button></div>
              </div>
            ))}
          </div>
          {pkgModal && (
            <div className="modal-overlay" onClick={() => setPkgModal(null)}>
              <div className="modal-content" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-navy mb-4">{pkgModal === "new" ? "New" : "Edit"} Package</h3>
                <div className="space-y-4">
                  <div><label className="label">Name</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="input" /></div>
                  <div className="grid grid-cols-2 gap-4"><div><label className="label">Duration (days)</label><input type="number" value={form.durationDays} onChange={e => setForm({...form, durationDays: parseInt(e.target.value)})} className="input" /></div><div><label className="label">Price ({CURRENCY_SYMBOL})</label><input type="number" step="0.01" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="input" /></div></div>
                  <div><label className="label">Description</label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="input" rows={3} /></div>
                  <div className="flex gap-2 justify-end"><button onClick={() => setPkgModal(null)} className="btn btn-outline">{t("cancel")}</button><button onClick={savePackage} className="btn btn-primary">{t("save")}</button></div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
