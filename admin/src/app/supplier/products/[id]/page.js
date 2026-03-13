"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/contexts/ToastContext";
export default function EditProduct({ params }) {
  const { id } = use(params);
  const { t } = useLanguage();
  const toast = useToast();
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ nameEn: "", namePs: "", nameDr: "", descEn: "", descPs: "", descDr: "", categoryId: "", wholesaleCost: "", suggestedPrice: "", stock: "" });
  useEffect(() => {
    Promise.all([
      fetch(`/api/supplier/products/${id}`, { credentials: "include" }).then(r => r.json()),
      fetch("/api/categories").then(r => r.json()),
    ]).then(([pData, cData]) => {
      const p = pData.product || pData;
      setForm({ nameEn: p.nameEn || "", namePs: p.namePs || "", nameDr: p.nameDr || "", descEn: p.descEn || "", descPs: p.descPs || "", descDr: p.descDr || "", categoryId: p.categoryId || "", wholesaleCost: p.wholesaleCost || "", suggestedPrice: p.suggestedPrice || "", stock: p.stock || "" });
      setCategories(cData.categories || cData || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const body = { ...form, wholesaleCost: parseFloat(form.wholesaleCost), suggestedPrice: form.suggestedPrice ? parseFloat(form.suggestedPrice) : null, stock: parseInt(form.stock), categoryId: form.categoryId ? parseInt(form.categoryId) : null };
    const r = await fetch(`/api/supplier/products/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify(body) });
    setSubmitting(false);
    if (r.ok) { toast.success("Product updated!"); router.push("/supplier/products"); } else toast.error("Update failed");
  };
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));
  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-3 border-gray-200 border-t-primary rounded-full animate-spin" /></div>;
  return (
    <div>
      <div className="page-header"><h1 className="page-title">{t("edit")} Product</h1></div>
      <form onSubmit={handleSubmit} className="max-w-4xl">
        <div className="card card-p mb-6">
          <h3 className="font-bold text-navy mb-4">Product Names</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="label">Name (English) *</label><input value={form.nameEn} onChange={e => set("nameEn", e.target.value)} className="input" required /></div>
            <div><label className="label">Name (Pashto) *</label><input value={form.namePs} onChange={e => set("namePs", e.target.value)} className="input" dir="rtl" required /></div>
            <div><label className="label">Name (Dari) *</label><input value={form.nameDr} onChange={e => set("nameDr", e.target.value)} className="input" dir="rtl" required /></div>
          </div>
        </div>
        <div className="card card-p mb-6">
          <h3 className="font-bold text-navy mb-4">Descriptions</h3>
          <div className="space-y-4">
            <div><label className="label">English</label><textarea value={form.descEn} onChange={e => set("descEn", e.target.value)} className="input" rows={3} /></div>
            <div><label className="label">Pashto</label><textarea value={form.descPs} onChange={e => set("descPs", e.target.value)} className="input" rows={3} dir="rtl" /></div>
            <div><label className="label">Dari</label><textarea value={form.descDr} onChange={e => set("descDr", e.target.value)} className="input" rows={3} dir="rtl" /></div>
          </div>
        </div>
        <div className="card card-p mb-6">
          <h3 className="font-bold text-navy mb-4">Pricing & Stock</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div><label className="label">{t("category")}</label><select value={form.categoryId} onChange={e => set("categoryId", e.target.value)} className="input"><option value="">Select...</option>{categories.map(c => <option key={c.id} value={c.id}>{c.nameEn}</option>)}</select></div>
            <div><label className="label">{t("wholesale")} (؋)</label><input type="number" step="0.01" value={form.wholesaleCost} onChange={e => set("wholesaleCost", e.target.value)} className="input" required /></div>
            <div><label className="label">{t("suggested")} (؋)</label><input type="number" step="0.01" value={form.suggestedPrice} onChange={e => set("suggestedPrice", e.target.value)} className="input" /></div>
            <div><label className="label">{t("stock")}</label><input type="number" value={form.stock} onChange={e => set("stock", e.target.value)} className="input" required /></div>
          </div>
        </div>
        <div className="flex gap-3"><button type="submit" disabled={submitting} className="btn btn-primary disabled:opacity-50">{submitting ? "Saving..." : t("save")}</button><button type="button" onClick={() => router.back()} className="btn btn-outline">{t("cancel")}</button></div>
      </form>
    </div>
  );
}
