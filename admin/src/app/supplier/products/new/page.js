"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/contexts/ToastContext";
export default function NewProduct() {
  const { t } = useLanguage();
  const toast = useToast();
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [images, setImages] = useState([]);
  const [form, setForm] = useState({ nameEn: "", namePs: "", nameDr: "", descEn: "", descPs: "", descDr: "", categoryId: "", wholesaleCost: "", suggestedPrice: "", stock: "", attributes: "" });
  useEffect(() => { fetch("/api/categories").then(r => r.json()).then(d => setCategories(d.categories || d || [])).catch(() => {}); }, []);
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    for (const file of files) {
      if (images.length >= 5) break;
      const fd = new FormData(); fd.append("file", file);
      const r = await fetch("/api/upload", { method: "POST", credentials: "include", body: fd });
      if (r.ok) { const d = await r.json(); setImages(prev => [...prev, d.url || d.file?.url]); }
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nameEn || !form.namePs || !form.nameDr || !form.wholesaleCost || !form.stock) { toast.error("Fill all required fields"); return; }
    setSubmitting(true);
    const body = { ...form, wholesaleCost: parseFloat(form.wholesaleCost), suggestedPrice: form.suggestedPrice ? parseFloat(form.suggestedPrice) : null, stock: parseInt(form.stock), categoryId: form.categoryId ? parseInt(form.categoryId) : null, images };
    const r = await fetch("/api/supplier/products", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(body) });
    setSubmitting(false);
    if (r.ok) { toast.success("Product submitted for approval!"); router.push("/supplier/products"); } else { const d = await r.json(); toast.error(d.error || "Failed"); }
  };
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  return (
    <div>
      <div className="page-header"><h1 className="page-title">{t("add_product")}</h1></div>
      <form onSubmit={handleSubmit} className="max-w-4xl">
        <div className="card card-p mb-6">
          <h3 className="font-bold text-navy mb-4">Product Names (Required in all languages)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="label">Name (English) *</label><input value={form.nameEn} onChange={e => set("nameEn", e.target.value)} className="input" required /></div>
            <div><label className="label">Name (Pashto) *</label><input value={form.namePs} onChange={e => set("namePs", e.target.value)} className="input" dir="rtl" required /></div>
            <div><label className="label">Name (Dari) *</label><input value={form.nameDr} onChange={e => set("nameDr", e.target.value)} className="input" dir="rtl" required /></div>
          </div>
        </div>
        <div className="card card-p mb-6">
          <h3 className="font-bold text-navy mb-4">Descriptions (Optional)</h3>
          <div className="space-y-4">
            <div><label className="label">Description (English)</label><textarea value={form.descEn} onChange={e => set("descEn", e.target.value)} className="input" rows={3} /></div>
            <div><label className="label">Description (Pashto)</label><textarea value={form.descPs} onChange={e => set("descPs", e.target.value)} className="input" rows={3} dir="rtl" /></div>
            <div><label className="label">Description (Dari)</label><textarea value={form.descDr} onChange={e => set("descDr", e.target.value)} className="input" rows={3} dir="rtl" /></div>
          </div>
        </div>
        <div className="card card-p mb-6">
          <h3 className="font-bold text-navy mb-4">Pricing & Stock</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div><label className="label">{t("category")}</label><select value={form.categoryId} onChange={e => set("categoryId", e.target.value)} className="input"><option value="">Select...</option>{categories.map(c => <option key={c.id} value={c.id}>{c.nameEn}</option>)}</select></div>
            <div><label className="label">{t("wholesale")} (؋) *</label><input type="number" step="0.01" value={form.wholesaleCost} onChange={e => set("wholesaleCost", e.target.value)} className="input" required /></div>
            <div><label className="label">{t("suggested")} (؋)</label><input type="number" step="0.01" value={form.suggestedPrice} onChange={e => set("suggestedPrice", e.target.value)} className="input" /></div>
            <div><label className="label">{t("stock")} *</label><input type="number" value={form.stock} onChange={e => set("stock", e.target.value)} className="input" required /></div>
          </div>
        </div>
        <div className="card card-p mb-6">
          <h3 className="font-bold text-navy mb-4">Images (Max 5)</h3>
          <div className="flex gap-3 flex-wrap mb-4">
            {images.map((url, i) => <div key={i} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200"><img src={url} alt="" className="w-full h-full object-cover" /><button type="button" onClick={() => setImages(prev => prev.filter((_, j) => j !== i))} className="absolute top-1 right-1 w-5 h-5 bg-red text-white rounded-full flex items-center justify-center text-xs">×</button></div>)}
            {images.length < 5 && <label className="w-24 h-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-primary transition-colors"><svg className="w-6 h-6 text-body" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg><input type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" /></label>}
          </div>
        </div>
        <div className="flex gap-3"><button type="submit" disabled={submitting} className="btn btn-primary disabled:opacity-50">{submitting ? "Submitting..." : "Submit for Approval"}</button><button type="button" onClick={() => router.back()} className="btn btn-outline">{t("cancel")}</button></div>
      </form>
    </div>
  );
}
