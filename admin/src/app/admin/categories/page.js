"use client";
import { useEffect, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/contexts/ToastContext";
import ImageUploader from "@/components/ImageUploader";
import { CATEGORY_ICONS, getCategoryIcon } from "@/data/categoryIcons";

const EMPTY_FORM = { slug: "", nameEn: "", namePs: "", nameDr: "", parentId: "", image: "", iconKey: "", visualMode: "icon" };

export default function AdminCategoriesPage() {
  const { t } = useLanguage();
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | { mode: 'create' | 'edit', data }
  const [form, setForm] = useState(EMPTY_FORM);
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
    setForm(EMPTY_FORM);
    setModal({ mode: "create" });
  };

  const openEdit = (cat) => {
    setForm({
      slug: cat.slug,
      nameEn: cat.nameEn,
      namePs: cat.namePs,
      nameDr: cat.nameDr,
      parentId: cat.parentId || "",
      image: cat.image || "",
      iconKey: cat.iconKey || "",
      visualMode: cat.image ? "image" : "icon",
    });
    setModal({ mode: "edit", id: cat.id });
  };

  const handleSave = async () => {
    if (!form.slug || !form.nameEn) { toast.error("Slug and English name are required"); return; }
    if (form.visualMode === "icon" && !form.iconKey) { toast.error("Choose a 3D category icon"); return; }
    if (form.visualMode === "image" && !form.image) { toast.error("Upload a category image"); return; }
    setSaving(true);
    try {
      const url = modal.mode === "create" ? "/api/categories" : `/api/categories/${modal.id}`;
      const method = modal.mode === "create" ? "POST" : "PUT";
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({
          slug: form.slug,
          nameEn: form.nameEn,
          namePs: form.namePs,
          nameDr: form.nameDr,
          parentId: form.parentId || null,
          image: form.visualMode === "image" ? form.image : null,
          iconKey: form.visualMode === "icon" ? form.iconKey : null,
        }),
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
                <th>Visual</th>
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
                <tr><td colSpan={9} className="text-center py-8 text-body">No categories found</td></tr>
              ) : categories.map((cat) => (
                <tr key={cat.id}>
                  <td className="font-semibold text-navy">{cat.id}</td>
                  <td>
                    {cat.image ? (
                      <img src={cat.image} alt="" className="h-11 w-11 rounded-xl border border-gray-200 object-cover" />
                    ) : cat.iconKey ? (
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-blue-100 bg-blue-50/60 p-1" title={getCategoryIcon(cat.iconKey)?.label || cat.iconKey}>
                        <img src={getCategoryIcon(cat.iconKey)?.asset || "/category-icons/general.png"} alt="" className="h-full w-full object-contain" />
                      </div>
                    ) : (
                      <span className="text-body">—</span>
                    )}
                  </td>
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
          <div className="modal-content" style={{ maxWidth: 720 }} onClick={(e) => e.stopPropagation()}>
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

              <div>
                <label className="label">Category Visual *</label>
                <div className="mb-3 grid grid-cols-2 gap-2 rounded-xl bg-gray-100 p-1">
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, visualMode: "icon", image: "" }))}
                    className={`min-h-10 rounded-lg px-4 text-sm font-semibold transition ${form.visualMode === "icon" ? "bg-white text-primary shadow-sm" : "text-body hover:text-navy"}`}
                  >
                    Choose 3D Icon
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, visualMode: "image", iconKey: "" }))}
                    className={`min-h-10 rounded-lg px-4 text-sm font-semibold transition ${form.visualMode === "image" ? "bg-white text-primary shadow-sm" : "text-body hover:text-navy"}`}
                  >
                    Upload Image
                  </button>
                </div>

                {form.visualMode === "icon" ? (
                  <div>
                    <p className="mb-3 text-xs text-body">Select the realistic 3D visual that best represents this category.</p>
                    <div className="grid max-h-64 grid-cols-3 gap-2 overflow-y-auto pr-1 sm:grid-cols-4">
                      {CATEGORY_ICONS.map((icon) => {
                        const selected = form.iconKey === icon.key;
                        return (
                          <button
                            key={icon.key}
                            type="button"
                            onClick={() => setForm((prev) => ({ ...prev, iconKey: icon.key }))}
                            className={`flex min-h-28 flex-col items-center justify-center gap-2 rounded-xl border-2 p-2 text-center transition ${selected ? "border-primary bg-blue-50 shadow-sm" : "border-gray-200 bg-white hover:border-blue-300"}`}
                            aria-pressed={selected}
                          >
                            <span className="flex h-16 w-16 items-center justify-center rounded-xl bg-blue-50/70 p-1">
                              <img src={icon.asset} alt="" className="h-full w-full object-contain" />
                            </span>
                            <span className={`text-xs font-semibold leading-4 ${selected ? "text-primary" : "text-navy"}`}>{icon.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <ImageUploader
                    images={form.image ? [form.image] : []}
                    onChange={(images) => setForm((prev) => ({ ...prev, image: images[0] || "" }))}
                    max={1}
                    label="Category Image *"
                    helperText="Use a square image for the best result in the mobile app."
                  />
                )}
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
