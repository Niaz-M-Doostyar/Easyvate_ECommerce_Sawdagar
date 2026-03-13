"use client";
import { useState, useEffect, useCallback } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/contexts/ToastContext";
import { useSearchParams } from "next/navigation";
import Pagination from "@/components/Pagination";
import Modal from "@/components/Modal";
import { CSVButton } from "@/components/CSVExport";
import { adminPut } from "@/hooks/useAdminApi";

export default function AdminUsers() {
  const { t } = useLanguage();
  const toast = useToast();
  const searchParams = useSearchParams();
  const [users, setUsers] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [roleFilter, setRoleFilter] = useState(searchParams.get("role") || "all");
  const [search, setSearch] = useState("");
  const [detail, setDetail] = useState(null);
  const [editModal, setEditModal] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  const fetchUsers = useCallback(async () => {
    const q = new URLSearchParams({ page, limit: 20 });
    if (roleFilter !== "all") q.set("role", roleFilter);
    if (search) q.set("search", search);
    const r = await fetch(`/api/admin/users?${q}`, { credentials: "include" });
    if (r.ok) { const d = await r.json(); setUsers(d.users || []); setTotalPages(d.totalPages || 1); setTotal(d.total || 0); }
  }, [page, roleFilter, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const toggleUser = async (id, field, value) => {
    try {
      await adminPut(`users/${id}`, { [field]: value });
      toast.success("User updated");
      fetchUsers();
    } catch { toast.error("Update failed"); }
  };

  const changeRole = async (id, role) => {
    try {
      await adminPut(`users/${id}`, { role });
      toast.success("Role changed");
      fetchUsers();
      setDetail(null);
    } catch { toast.error("Failed to change role"); }
  };

  const openEdit = async (user) => {
    try {
      const r = await fetch(`/api/admin/users/${user.id}`, { credentials: "include" });
      const json = await r.json();
      const data = json.user || json;
      setEditForm({
        fullName: data.fullName || "",
        email: data.email || "",
        phone: data.phone || "",
        companyName: data.companyName || "",
        province: data.province || "",
        district: data.district || "",
        village: data.village || "",
        address: data.address || "",
      });
      setEditModal(data);
    } catch {
      setEditForm({ fullName: user.fullName || "", email: user.email || "", phone: user.phone || "" });
      setEditModal(user);
    }
  };

  const saveEdit = async () => {
    setSaving(true);
    try {
      await adminPut(`users/${editModal.id}/profile`, editForm);
      toast.success("Profile updated");
      setEditModal(null);
      fetchUsers();
    } catch (e) {
      toast.error(e.message || "Update failed");
    } finally { setSaving(false); }
  };

  const roleColor = { admin: "badge-red", supplier: "badge-blue", customer: "badge-green", delivery: "badge-yellow" };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{t("users")} <span className="text-base font-normal text-body ml-2">({total})</span></h1>
        <div className="flex items-center gap-3 flex-wrap">
          <CSVButton type="users" label="Export Users" />
          <div className="flex gap-2 flex-wrap">
            {["all","customer","supplier","admin","delivery"].map(r => (
              <button key={r} onClick={() => { setRoleFilter(r); setPage(1); }} className={`btn btn-sm ${roleFilter === r ? "btn-primary" : "btn-outline"}`}>{r === "all" ? t("all") : t(r)}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card card-p mb-4">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-body" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>
          <input type="text" placeholder="Search by name, email, or phone..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="input pl-10" />
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>{t("name")}</th><th>{t("email")}</th><th>{t("phone")}</th><th>Role</th>
                <th>Verified</th><th>{t("active")}</th><th>Approved</th><th>{t("date")}</th><th>{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && <tr><td colSpan={9} className="text-center py-12 text-body">{t("no_data")}</td></tr>}
              {users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-primary font-bold text-sm">{(u.fullName || "?")[0].toUpperCase()}</span>
                      </div>
                      <div>
                        <div className="font-semibold text-navy text-sm">{u.fullName}</div>
                        {u.companyName && <div className="text-xs text-body">{u.companyName}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="text-sm">{u.email}</td>
                  <td className="text-sm">{u.phone || "—"}</td>
                  <td><span className={`badge ${roleColor[u.role] || "badge-gray"}`}>{u.role}</span></td>
                  <td>{u.emailVerified ? <span className="text-green font-bold">✓</span> : <span className="text-red font-bold">✗</span>}</td>
                  <td>
                    <button onClick={() => toggleUser(u.id, "isActive", !u.isActive)} className={`badge cursor-pointer ${u.isActive ? "badge-green" : "badge-red"}`}>
                      {u.isActive ? t("active") : t("inactive")}
                    </button>
                  </td>
                  <td>
                    {u.role === "supplier"
                      ? <button onClick={() => toggleUser(u.id, "isApproved", !u.isApproved)} className={`badge cursor-pointer ${u.isApproved ? "badge-green" : "badge-yellow"}`}>{u.isApproved ? t("approved") : t("pending")}</button>
                      : "—"
                    }
                  </td>
                  <td className="text-body text-sm">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="flex gap-1">
                      <button onClick={() => setDetail(u)} className="btn btn-sm btn-outline">{t("view")}</button>
                      <button onClick={() => openEdit(u)} className="btn btn-sm btn-primary">{t("edit")}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4"><Pagination page={page} totalPages={totalPages} onPageChange={setPage} /></div>
      </div>

      {/* Detail Modal */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail?.fullName || "User Details"} size="md">
        {detail && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-bold text-2xl">{(detail.fullName || "?")[0].toUpperCase()}</span>
              </div>
              <div>
                <h4 className="text-lg font-bold text-navy">{detail.fullName}</h4>
                <p className="text-body text-sm">{detail.email}</p>
                <span className={`badge ${roleColor[detail.role] || "badge-gray"} mt-1`}>{detail.role}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-body">{t("phone")}:</span> <strong>{detail.phone || "—"}</strong></div>
              <div><span className="text-body">Company:</span> <strong>{detail.companyName || "—"}</strong></div>
              <div><span className="text-body">Verified:</span> <strong className={detail.emailVerified ? "text-green" : "text-red"}>{detail.emailVerified ? "Yes" : "No"}</strong></div>
              <div><span className="text-body">{t("active")}:</span> <strong className={detail.isActive ? "text-green" : "text-red"}>{detail.isActive ? "Yes" : "No"}</strong></div>
              <div><span className="text-body">Province:</span> <strong>{detail.province || "—"}</strong></div>
              <div><span className="text-body">District:</span> <strong>{detail.district || "—"}</strong></div>
              <div className="col-span-2"><span className="text-body">Joined:</span> <strong>{new Date(detail.createdAt).toLocaleDateString()}</strong></div>
            </div>
            <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
              <span className="text-sm font-semibold text-navy mr-2">Change Role:</span>
              {["customer", "supplier", "delivery", "admin"].map(r => (
                <button key={r} onClick={() => changeRole(detail.id, r)} disabled={detail.role === r}
                  className={`btn btn-sm ${detail.role === r ? "btn-primary" : "btn-outline"}`}>{r}</button>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => { toggleUser(detail.id, "isActive", !detail.isActive); setDetail(null); }}
                className={`btn btn-sm ${detail.isActive ? "btn-danger" : "btn-success"}`}>
                {detail.isActive ? "Deactivate" : "Activate"}
              </button>
              <button onClick={() => { setDetail(null); openEdit(detail); }} className="btn btn-sm btn-primary">{t("edit")} Profile</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editModal} onClose={() => setEditModal(null)} title={`Edit: ${editModal?.fullName || ""}`} size="lg">
        {editModal && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Full Name</label>
                <input className="input" value={editForm.fullName} onChange={e => setEditForm(p => ({ ...p, fullName: e.target.value }))} />
              </div>
              <div>
                <label className="label">{t("email")}</label>
                <input className="input" value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div>
                <label className="label">{t("phone")}</label>
                <input className="input" value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div>
                <label className="label">Company Name</label>
                <input className="input" value={editForm.companyName} onChange={e => setEditForm(p => ({ ...p, companyName: e.target.value }))} />
              </div>
              <div>
                <label className="label">Province</label>
                <input className="input" value={editForm.province} onChange={e => setEditForm(p => ({ ...p, province: e.target.value }))} />
              </div>
              <div>
                <label className="label">District</label>
                <input className="input" value={editForm.district} onChange={e => setEditForm(p => ({ ...p, district: e.target.value }))} />
              </div>
              <div>
                <label className="label">Village</label>
                <input className="input" value={editForm.village} onChange={e => setEditForm(p => ({ ...p, village: e.target.value }))} />
              </div>
              <div>
                <label className="label">{t("address")}</label>
                <input className="input" value={editForm.address} onChange={e => setEditForm(p => ({ ...p, address: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setEditModal(null)} className="btn btn-outline">{t("cancel")}</button>
              <button onClick={saveEdit} disabled={saving} className="btn btn-primary">{saving ? t("loading") : t("save")}</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
