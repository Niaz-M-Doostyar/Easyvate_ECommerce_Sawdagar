"use client";
import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/contexts/ToastContext";
import { useLanguage } from "@/contexts/LanguageContext";
import Pagination from "@/components/Pagination";
import Modal from "@/components/Modal";
import MultilingualTabs from "@/components/MultilingualTabs";
import ImageUploader from "@/components/ImageUploader";
import { CSVButton } from "@/components/CSVExport";
import { CURRENCY_SYMBOL } from "@/lib/currency";
import { adminPut, adminDelete } from "@/hooks/useAdminApi";

export default function AdminProducts() {
  const { t } = useLanguage();
  const toast = useToast();
  const searchParams = useSearchParams();
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "all");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null); // { type: 'approve' | 'reject' | 'edit' | 'detail', product }
  const [retailPrice, setRetailPrice] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [langTab, setLangTab] = useState("en");
  const [editForm, setEditForm] = useState({});
  const [editImages, setEditImages] = useState([]);
  const [saving, setSaving] = useState(false);

  const fetchProducts = useCallback(async () => {
    const q = new URLSearchParams({ page, limit: 20 });
    if (statusFilter !== "all") q.set("status", statusFilter);
    if (search) q.set("search", search);
    const r = await fetch(`/api/admin/products?${q}`, { credentials: "include" });
    if (r.ok) { const d = await r.json(); setProducts(d.products || []); setTotalPages(d.totalPages || 1); setTotal(d.total || 0); }
  }, [page, statusFilter, search]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleApprove = async (id) => {
    if (!retailPrice) { toast.error("Enter retail price"); return; }
    const r = await fetch(`/api/admin/products/${id}/approve`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ retailPrice: parseFloat(retailPrice) }) });
    if (r.ok) { toast.success("Product approved"); setModal(null); fetchProducts(); } else toast.error("Failed to approve");
  };

  const handleReject = async (id) => {
    const r = await fetch(`/api/admin/products/${id}/reject`, { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ reason: rejectReason }) });
    if (r.ok) { toast.success("Product rejected"); setModal(null); fetchProducts(); } else toast.error("Failed to reject");
  };

  const openEdit = async (product) => {
    try {
      const r = await fetch(`/api/admin/products/${product.id}`, { credentials: "include" });
      const json = await r.json();
      const data = json.product || json;
      setEditForm({
        nameEn: data.nameEn || "", namePs: data.namePs || "", nameDr: data.nameDr || "",
        descEn: data.descEn || "", descPs: data.descPs || "", descDr: data.descDr || "",
        wholesaleCost: data.wholesaleCost || "", suggestedPrice: data.suggestedPrice || "", retailPrice: data.retailPrice || "",
        stock: data.stock ?? 0, weight: data.weight || "", dimensions: data.dimensions || "", material: data.material || "",
        status: data.status || "pending",
      });
      setEditImages((data.images || []).map(img => img.url));
      setLangTab("en");
      setModal({ type: "edit", product: data });
    } catch {
      toast.error("Failed to load product");
    }
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      await adminPut(`products/${modal.product.id}`, {
        ...editForm,
        wholesaleCost: parseFloat(editForm.wholesaleCost) || 0,
        suggestedPrice: parseFloat(editForm.suggestedPrice) || null,
        retailPrice: parseFloat(editForm.retailPrice) || null,
        stock: parseInt(editForm.stock) || 0,
        images: editImages,
      });
      toast.success("Product updated");
      setModal(null);
      fetchProducts();
    } catch (e) { toast.error(e.message || "Update failed"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (product) => {
    if (!confirm(`Delete "${product.nameEn}"? This action is reversible (soft delete).`)) return;
    try {
      await adminDelete(`products/${product.id}`);
      toast.success("Product deleted");
      fetchProducts();
    } catch { toast.error("Delete failed"); }
  };

  const statusColor = { pending: "badge-yellow", approved: "badge-green", rejected: "badge-red" };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{t("products")} <span className="text-base font-normal text-body ml-2">({total})</span></h1>
        <div className="flex items-center gap-3 flex-wrap">
          <CSVButton type="products" label="Export" />
          <div className="flex gap-2">
            {["all", "pending", "approved", "rejected"].map(s => (
              <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }} className={`btn btn-sm ${statusFilter === s ? "btn-primary" : "btn-outline"}`}>{s === "all" ? t("all") : t(s)}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="card card-p mb-4">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-body" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
          <input type="text" placeholder="Search products..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="input pl-10" />
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Image</th><th>{t("name")}</th><th>{t("supplier")}</th><th>{t("wholesale")}</th><th>Suggested</th><th>{t("retail")}</th><th>{t("stock")}</th><th>{t("status")}</th><th>{t("actions")}</th></tr></thead>
            <tbody>
              {products.length === 0 && <tr><td colSpan={9} className="text-center py-12 text-body">{t("no_data")}</td></tr>}
              {products.map(p => (
                <tr key={p.id}>
                  <td><div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden">{p.images?.[0] && <img src={p.images[0].url} alt="" className="w-full h-full object-cover" />}</div></td>
                  <td>
                    <div className="font-semibold text-navy text-sm max-w-[200px] truncate">{p.nameEn}</div>
                    <div className="text-xs text-body">{p.category?.nameEn || ""}</div>
                    {p.isSponsored && <span className="badge badge-yellow text-[10px] mt-0.5">★ Sponsored</span>}
                  </td>
                  <td className="text-sm">{p.supplier?.companyName || p.supplier?.fullName || "N/A"}</td>
                  <td className="font-semibold">{CURRENCY_SYMBOL}{p.wholesaleCost}</td>
                  <td className="text-body">{CURRENCY_SYMBOL}{p.suggestedPrice || "—"}</td>
                  <td className="font-semibold text-green">{p.retailPrice ? `${CURRENCY_SYMBOL}${p.retailPrice}` : "—"}</td>
                  <td>
                    <span className={`font-semibold ${p.stock <= 0 ? "text-red" : p.stock < 10 ? "text-yellow" : "text-navy"}`}>{p.stock}</span>
                  </td>
                  <td><span className={`badge ${statusColor[p.status] || "badge-gray"}`}>{p.status}</span></td>
                  <td>
                    <div className="flex gap-1 flex-wrap">
                      {p.status === "pending" && <>
                        <button onClick={() => { setModal({ type: "approve", product: p }); setRetailPrice(p.suggestedPrice || Math.round(p.wholesaleCost * 1.3) || ""); }} className="btn btn-sm btn-success">{t("approve")}</button>
                        <button onClick={() => { setModal({ type: "reject", product: p }); setRejectReason(""); }} className="btn btn-sm btn-danger">{t("reject")}</button>
                      </>}
                      <button onClick={() => openEdit(p)} className="btn btn-sm btn-outline">{t("edit")}</button>
                      <button onClick={() => handleDelete(p)} className="btn btn-sm btn-danger" title="Delete">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4"><Pagination page={page} totalPages={totalPages} onPageChange={setPage} /></div>
      </div>

      {/* Approve Modal */}
      <Modal open={modal?.type === "approve"} onClose={() => setModal(null)} title={`Approve: ${modal?.product?.nameEn || ""}`}>
        {modal?.type === "approve" && (
          <div className="space-y-4">
            <div className="flex gap-4 text-sm">
              <p className="text-body">Wholesale: <strong className="text-navy">{CURRENCY_SYMBOL}{modal.product.wholesaleCost}</strong></p>
              <p className="text-body">Suggested: <strong className="text-navy">{CURRENCY_SYMBOL}{modal.product.suggestedPrice || "N/A"}</strong></p>
            </div>
            <div>
              <label className="label">Final Retail Price ({CURRENCY_SYMBOL})</label>
              <input type="number" step="0.01" value={retailPrice} onChange={e => setRetailPrice(e.target.value)} className="input" />
            </div>
            {retailPrice && modal.product.wholesaleCost && (
              <div className="flex items-center gap-3">
                <p className="text-sm text-green font-semibold">Profit: {CURRENCY_SYMBOL}{(parseFloat(retailPrice) - modal.product.wholesaleCost).toFixed(2)}</p>
                <p className="text-sm text-body">Margin: {((1 - modal.product.wholesaleCost / parseFloat(retailPrice)) * 100).toFixed(1)}%</p>
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <button onClick={() => setModal(null)} className="btn btn-outline">{t("cancel")}</button>
              <button onClick={() => handleApprove(modal.product.id)} className="btn btn-success">{t("approve")}</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal open={modal?.type === "reject"} onClose={() => setModal(null)} title={`Reject: ${modal?.product?.nameEn || ""}`}>
        {modal?.type === "reject" && (
          <div className="space-y-4">
            <div>
              <label className="label">Reason for Rejection</label>
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} className="input" rows={3} placeholder="Enter reason..." />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setModal(null)} className="btn btn-outline">{t("cancel")}</button>
              <button onClick={() => handleReject(modal.product.id)} className="btn btn-danger">{t("reject")}</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal open={modal?.type === "edit"} onClose={() => setModal(null)} title={`Edit Product`} size="xl">
        {modal?.type === "edit" && (
          <div className="space-y-6">
            {/* Images */}
            <ImageUploader images={editImages} onChange={setEditImages} max={8} label="Product Images" />

            {/* Multilingual Fields */}
            <MultilingualTabs activeTab={langTab} onTabChange={setLangTab}>
              <div className="space-y-4">
                <div>
                  <label className="label">{t("name")} ({langTab.toUpperCase()})</label>
                  <input className="input" value={editForm[`name${langTab === "en" ? "En" : langTab === "ps" ? "Ps" : "Dr"}`] || ""}
                    onChange={e => setEditForm(p => ({ ...p, [`name${langTab === "en" ? "En" : langTab === "ps" ? "Ps" : "Dr"}`]: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Description ({langTab.toUpperCase()})</label>
                  <textarea className="input" rows={4} value={editForm[`desc${langTab === "en" ? "En" : langTab === "ps" ? "Ps" : "Dr"}`] || ""}
                    onChange={e => setEditForm(p => ({ ...p, [`desc${langTab === "en" ? "En" : langTab === "ps" ? "Ps" : "Dr"}`]: e.target.value }))} />
                </div>
              </div>
            </MultilingualTabs>

            {/* Pricing & Stock */}
            <div>
              <h4 className="font-semibold text-navy mb-3">Pricing & Stock</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="label">{t("wholesale")} ({CURRENCY_SYMBOL})</label>
                  <input type="number" step="0.01" className="input" value={editForm.wholesaleCost}
                    onChange={e => setEditForm(p => ({ ...p, wholesaleCost: e.target.value }))} />
                </div>
                <div>
                  <label className="label">{t("suggested")} ({CURRENCY_SYMBOL})</label>
                  <input type="number" step="0.01" className="input" value={editForm.suggestedPrice}
                    onChange={e => setEditForm(p => ({ ...p, suggestedPrice: e.target.value }))} />
                </div>
                <div>
                  <label className="label">{t("retail")} ({CURRENCY_SYMBOL})</label>
                  <input type="number" step="0.01" className="input" value={editForm.retailPrice}
                    onChange={e => setEditForm(p => ({ ...p, retailPrice: e.target.value }))} />
                </div>
                <div>
                  <label className="label">{t("stock")}</label>
                  <input type="number" className="input" value={editForm.stock}
                    onChange={e => setEditForm(p => ({ ...p, stock: e.target.value }))} />
                </div>
              </div>
            </div>

            {/* Attributes */}
            <div>
              <h4 className="font-semibold text-navy mb-3">Attributes</h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <label className="label">Weight</label>
                  <input className="input" value={editForm.weight} onChange={e => setEditForm(p => ({ ...p, weight: e.target.value }))} placeholder="e.g. 500g" />
                </div>
                <div>
                  <label className="label">Dimensions</label>
                  <input className="input" value={editForm.dimensions} onChange={e => setEditForm(p => ({ ...p, dimensions: e.target.value }))} placeholder="e.g. 10x20x5 cm" />
                </div>
                <div>
                  <label className="label">Material</label>
                  <input className="input" value={editForm.material} onChange={e => setEditForm(p => ({ ...p, material: e.target.value }))} placeholder="e.g. Cotton" />
                </div>
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="label">{t("status")}</label>
              <select className="input" value={editForm.status} onChange={e => setEditForm(p => ({ ...p, status: e.target.value }))}>
                <option value="pending">{t("pending")}</option>
                <option value="approved">{t("approved")}</option>
                <option value="rejected">{t("rejected")}</option>
              </select>
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
              <button onClick={() => setModal(null)} className="btn btn-outline">{t("cancel")}</button>
              <button onClick={saveEdit} disabled={saving} className="btn btn-primary">{saving ? t("loading") : t("save")} Changes</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
