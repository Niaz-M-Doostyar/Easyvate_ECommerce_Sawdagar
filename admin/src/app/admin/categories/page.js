"use client";
import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/contexts/ToastContext";

export default function AdminCategoriesPage() {
  const { t } = useLanguage();
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | { mode: 'create' | 'edit', data }
  const [form, setForm] = useState({ slug: "", nameEn: "", namePs: "", nameDr: "", parentId: "" });
  const [saving, setSaving] = useState(false);

  const fetchCategories = () => {
    fetch("/api/categories", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setCategories(d.categories || []))
      .catch(() => toast.error("Failed to load categories"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCategories(); }, []);

  const openCreate = () => {
    setForm({ slug: "", nameEn: "", namePs: "", nameDr: "", parentId: "" });
    setModal({ mode: "create" });
  };

  const openEdit = (cat) => {
    setForm({ slug: cat.slug, nameEn: cat.nameEn, namePs: cat.namePs, nameDr: cat.nameDr, parentId: cat.parentId || "" });
    setModal({ mode: "edit", id: cat.id });
  };

  const handleSave = async () => {
    if (!form.slug || !form.nameEn) { toast.error("Slug and English name are required"); return; }
    setSaving(true);
    try {
      const url = modal.mode === "create" ? "/api/categories" : `/api/categories/${modal.id}`;
      const method = modal.mode === "create" ? "POST" : "PUT";
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ ...form, parentId: form.parentId || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast.success(modal.mode === "create" ? "Category created" : "Category updated");
      setModal(null);
      fetchCategories();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this category? Products will become uncategorized.")) return;
    try {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error("Failed");
      toast.success("Category deleted");
      fetchCategories();
    } catch { toast.error("Failed to delete category"); }
  };

  const generateSlug = (name) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  if (loading) return <div className="card p-8 text-center text-body">Loading categories...</div>;

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Categories</h1>
          <p className="text-body mt-1 text-sm">Manage product categories for your store.</p>
        </div>
        <button onClick={openCreate} className="btn btn-primary">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
          Add Category
        </button>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Slug</th>
                <th>Name (EN)</th>
                <th>Name (PS)</th>
                <th>Name (DR)</th>
                <th>Parent</th>
                <th>Products</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-body">No categories found</td></tr>
              ) : categories.map((cat) => (
                <tr key={cat.id}>
                  <td className="font-semibold text-navy">{cat.id}</td>
                  <td><span className="badge badge-blue">{cat.slug}</span></td>
                  <td className="font-semibold text-navy">{cat.nameEn}</td>
                  <td>{cat.namePs}</td>
                  <td>{cat.nameDr}</td>
                  <td>{cat.parentId ? categories.find(c => c.id === cat.parentId)?.nameEn || cat.parentId : "—"}</td>
                  <td><span className="badge badge-gray">{cat._count?.products ?? 0}</span></td>
                  <td>
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(cat)} className="btn btn-sm btn-outline">Edit</button>
                      <button onClick={() => handleDelete(cat.id)} className="btn btn-sm btn-danger">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-navy mb-4">{modal.mode === "create" ? "Add Category" : "Edit Category"}</h2>
            <div className="space-y-4">
              <div>
                <label className="label">English Name *</label>
                <input className="input" value={form.nameEn} onChange={(e) => {
                  const nameEn = e.target.value;
                  setForm(prev => ({ ...prev, nameEn, slug: modal.mode === "create" ? generateSlug(nameEn) : prev.slug }));
                }} placeholder="e.g. Electronics" />
              </div>
              <div>
                <label className="label">Slug *</label>
                <input className="input" value={form.slug} onChange={(e) => setForm(prev => ({ ...prev, slug: e.target.value }))} placeholder="e.g. electronics" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Pashto Name</label>
                  <input className="input" value={form.namePs} onChange={(e) => setForm(prev => ({ ...prev, namePs: e.target.value }))} />
                </div>
                <div>
                  <label className="label">Dari Name</label>
                  <input className="input" value={form.nameDr} onChange={(e) => setForm(prev => ({ ...prev, nameDr: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="label">Parent Category</label>
                <select className="input" value={form.parentId} onChange={(e) => setForm(prev => ({ ...prev, parentId: e.target.value }))}>
                  <option value="">None (Root)</option>
                  {categories.filter(c => modal.mode !== "edit" || c.id !== modal.id).map(c => (
                    <option key={c.id} value={c.id}>{c.nameEn}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={handleSave} disabled={saving} className="btn btn-primary flex-1">
                {saving ? "Saving..." : modal.mode === "create" ? "Create" : "Update"}
              </button>
              <button onClick={() => setModal(null)} className="btn btn-outline">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
