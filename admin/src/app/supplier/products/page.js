"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/contexts/ToastContext";
import Pagination from "@/components/Pagination";
export default function SupplierProducts() {
  const { t } = useLanguage();
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const fetchProducts = useCallback(async () => {
    const r = await fetch(`/api/supplier/products?page=${page}&limit=20`, { credentials: "include" });
    if (r.ok) { const d = await r.json(); setProducts(d.products || []); setTotalPages(d.totalPages || 1); }
  }, [page]);
  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  const deleteProduct = async (id) => {
    if (!confirm("Delete this product?")) return;
    const r = await fetch(`/api/supplier/products/${id}`, { method: "DELETE", credentials: "include" });
    if (r.ok) { toast.success("Product deleted"); fetchProducts(); } else toast.error("Failed");
  };
  const statusColor = { pending: "badge-yellow", approved: "badge-green", rejected: "badge-red" };
  return (
    <div>
      <div className="page-header"><h1 className="page-title">{t("my_products")}</h1><Link href="/supplier/products/new" className="btn btn-primary"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>{t("add_product")}</Link></div>
      <div className="card">
        <div className="table-wrap"><table className="table"><thead><tr><th>Image</th><th>{t("name")}</th><th>{t("category")}</th><th>{t("wholesale")}</th><th>Suggested</th><th>{t("retail")}</th><th>{t("stock")}</th><th>{t("status")}</th><th>{t("actions")}</th></tr></thead><tbody>
          {products.length === 0 && <tr><td colSpan={9} className="text-center py-12 text-body">{t("no_data")}</td></tr>}
          {products.map(p => <tr key={p.id}>
            <td><div className="w-10 h-10 rounded bg-gray-100 overflow-hidden">{p.images?.[0] && <img src={p.images[0].url} alt="" className="w-full h-full object-cover" />}</div></td>
            <td className="font-semibold text-navy text-sm max-w-[180px] truncate">{p.nameEn}</td>
            <td className="text-sm text-body">{p.category?.nameEn || "—"}</td>
            <td className="font-semibold">${p.wholesaleCost}</td>
            <td className="text-body">{p.suggestedPrice ? `$${p.suggestedPrice}` : "—"}</td>
            <td className="font-semibold text-green">{p.retailPrice ? `$${p.retailPrice}` : "—"}</td>
            <td>{p.stock}</td>
            <td><span className={`badge ${statusColor[p.status] || "badge-gray"}`}>{p.status}</span></td>
            <td><div className="flex gap-1"><Link href={`/supplier/products/${p.id}`} className="btn btn-sm btn-outline">{t("edit")}</Link><button onClick={() => deleteProduct(p.id)} className="btn btn-sm btn-danger">{t("delete")}</button></div></td>
          </tr>)}
        </tbody></table></div>
        <div className="p-4"><Pagination page={page} totalPages={totalPages} onPageChange={setPage} /></div>
      </div>
    </div>
  );
}
