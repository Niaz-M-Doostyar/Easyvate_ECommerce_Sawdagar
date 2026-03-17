"use client";
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/contexts/ToastContext";
import Pagination from "@/components/Pagination";
import Modal from "@/components/Modal";
import { adminPost, adminPut, adminDelete } from "@/hooks/useAdminApi";
import { CURRENCY_SYMBOL } from "@/lib/currency";

export default function AdminCoupons() {
  const toast = useToast();
  const [coupons, setCoupons] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [modal, setModal] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    code: "", discount: 10, isPercent: true, minOrder: 0, maxUses: 0, isActive: true, expiresAt: "",
  });

  const fetchCoupons = useCallback(() => {
    fetch(`/api/admin/coupons?page=${page}&limit=20`, { credentials: "include" })
      .then(r => r.json())
      .then(d => {
        setCoupons(d.coupons || []);
        setTotalPages(d.totalPages || 1);
        setTotal(d.total || 0);
      })
      .catch(() => toast.error("Failed to load coupons"));
  }, [page, toast]);

  useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

  const resetForm = () => setForm({ code: "", discount: 10, isPercent: true, minOrder: 0, maxUses: 0, isActive: true, expiresAt: "" });

  const openCreate = () => { resetForm(); setModal("create"); };

  const openEdit = (c) => {
    setForm({
      id: c.id, code: c.code, discount: c.discount, isPercent: c.isPercent,
      minOrder: c.minOrder || 0, maxUses: c.maxUses || 0, isActive: c.isActive,
      expiresAt: c.expiresAt ? new Date(c.expiresAt).toISOString().split("T")[0] : "",
    });
    setModal("edit");
  };

  const handleSave = async () => {
    if (!form.code) { toast.error("Code is required"); return; }
    setSaving(true);
    try {
      const body = { ...form, expiresAt: form.expiresAt || null };
      if (modal === "create") {
        await adminPost("coupons", body);
        toast.success("Coupon created");
      } else {
        await adminPut(`coupons/${form.id}`, body);
        toast.success("Coupon updated");
      }
      setModal(null);
      fetchCoupons();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (c) => {
    if (!confirm(`Delete coupon "${c.code}"?`)) return;
    try {
      await adminDelete(`coupons/${c.id}`);
      toast.success("Deleted");
      fetchCoupons();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Coupons ({total})</h1>
        <button className="btn btn-primary" onClick={openCreate}>
          <i className="fas fa-plus"></i> New Coupon
        </button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Discount</th>
                <th>Min Order</th>
                <th>Usage</th>
                <th>Status</th>
                <th>Expires</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {coupons.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: "center", padding: 40, color: "#999" }}>No coupons found</td></tr>
              ) : coupons.map(c => (
                <tr key={c.id}>
                  <td><code style={{ fontWeight: 600 }}>{c.code}</code></td>
                  <td>{c.isPercent ? `${c.discount}%` : `${CURRENCY_SYMBOL}${c.discount}`}</td>
                  <td>{c.minOrder ? `${CURRENCY_SYMBOL}${c.minOrder}` : "-"}</td>
                  <td>{c.usedCount}{c.maxUses ? ` / ${c.maxUses}` : ""}</td>
                  <td>
                    <span className={`badge ${c.isActive ? "badge-green" : "badge-red"}`}>
                      {c.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : "Never"}</td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="btn btn-sm btn-outline" onClick={() => openEdit(c)} title="Edit"><i className="fas fa-edit"></i></button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(c)} title="Delete"><i className="fas fa-trash"></i></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      <Modal open={modal === "create" || modal === "edit"} onClose={() => setModal(null)} title={modal === "create" ? "New Coupon" : "Edit Coupon"}>
        <div style={{ display: "grid", gap: 14 }}>
          <div>
            <label className="label">Code *</label>
            <input className="input" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="e.g. WELCOME10" />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label className="label">Discount</label>
              <input className="input" type="number" value={form.discount} onChange={e => setForm(f => ({ ...f, discount: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.isPercent ? "percent" : "fixed"} onChange={e => setForm(f => ({ ...f, isPercent: e.target.value === "percent" }))}>
                <option value="percent">Percentage (%)</option>
                <option value="fixed">Fixed Amount ({CURRENCY_SYMBOL})</option>
              </select>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label className="label">Min Order ({CURRENCY_SYMBOL})</label>
              <input className="input" type="number" value={form.minOrder} onChange={e => setForm(f => ({ ...f, minOrder: parseFloat(e.target.value) || 0 }))} />
            </div>
            <div>
              <label className="label">Max Uses (0 = unlimited)</label>
              <input className="input" type="number" value={form.maxUses} onChange={e => setForm(f => ({ ...f, maxUses: parseInt(e.target.value) || 0 }))} />
            </div>
          </div>
          <div>
            <label className="label">Expires At</label>
            <input className="input" type="date" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" id="couponActive" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
            <label htmlFor="couponActive">Active</label>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : modal === "create" ? "Create" : "Save Changes"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
