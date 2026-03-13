"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth, authHeaders } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import AccountLayout from "@/components/AccountLayout";

export default function ProfilePage() {
  const { user, fetchUser } = useAuth();
  const toast = useToast();
  const [form, setForm] = useState({ fullName: "", phone: "", province: "", district: "" });
  const [passForm, setPassForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("info");
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  useEffect(() => {
    if (user) setForm({ fullName: user.fullName || "", phone: user.phone || "", province: user.province || "", district: user.district || "" });
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await fetch("/api/auth/profile", { method: "PUT", headers: authHeaders({ "Content-Type": "application/json" }), body: JSON.stringify(form) });
      if (r.ok) { toast.success("Profile updated!"); fetchUser(); } else toast.error("Update failed");
    } catch { toast.error("Something went wrong"); }
    setSaving(false);
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirmPassword) { toast.error("Passwords don't match"); return; }
    setSaving(true);
    try {
      const r = await fetch("/api/auth/change-password", { method: "PUT", headers: authHeaders({ "Content-Type": "application/json" }), body: JSON.stringify({ currentPassword: passForm.currentPassword, newPassword: passForm.newPassword }) });
      if (r.ok) { toast.success("Password changed!"); setPassForm({ currentPassword: "", newPassword: "", confirmPassword: "" }); } else toast.error("Update failed");
    } catch { toast.error("Something went wrong"); }
    setSaving(false);
  };

  if (!user) return (
    <>
      <div className="site-breadcrumb">
        <div className="site-breadcrumb-bg" style={{ background: "url(/assets/img/breadcrumb/01.jpg)" }} />
        <div className="container"><div className="site-breadcrumb-wrap"><h4 className="breadcrumb-title">My Profile</h4><ul className="breadcrumb-menu"><li><Link href="/"><i className="far fa-home"></i> Home</Link></li><li className="active">My Profile</li></ul></div></div>
      </div>
      <div className="py-100 text-center"><div className="container"><h3>Please Sign In</h3><Link href="/login" className="theme-btn mt-3">Sign In</Link></div></div>
    </>
  );

  return (
    <>
      <div className="site-breadcrumb">
        <div className="site-breadcrumb-bg" style={{ background: "url(/assets/img/breadcrumb/01.jpg)" }} />
        <div className="container"><div className="site-breadcrumb-wrap"><h4 className="breadcrumb-title">My Profile</h4><ul className="breadcrumb-menu"><li><Link href="/"><i className="far fa-home"></i> Home</Link></li><li className="active">My Profile</li></ul></div></div>
      </div>

      <AccountLayout>
        <div className="user-card">
          <h4 className="user-card-title">My Profile</h4>
          <ul className="nav nav-tabs" role="tablist">
            <li className="nav-item" role="presentation">
              <button className={`nav-link${tab === 'info' ? ' active' : ''}`} onClick={() => setTab('info')} role="tab" aria-selected={tab === 'info'}>Personal Info</button>
            </li>
            <li className="nav-item" role="presentation">
              <button className={`nav-link${tab === 'password' ? ' active' : ''}`} onClick={() => setTab('password')} role="tab" aria-selected={tab === 'password'}>Change Password</button>
            </li>
          </ul>
          <div className="tab-content pt-4">
            {tab === 'info' && (
              <form onSubmit={handleSave}>
                <div className="row">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">Full Name</label>
                      <input type="text" className="form-control" value={form.fullName} onChange={e => set("fullName", e.target.value)} />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">Phone</label>
                      <input type="tel" className="form-control" value={form.phone} onChange={e => set("phone", e.target.value)} />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">Province</label>
                      <input type="text" className="form-control" value={form.province} onChange={e => set("province", e.target.value)} />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">District</label>
                      <input type="text" className="form-control" value={form.district} onChange={e => set("district", e.target.value)} />
                    </div>
                  </div>
                  <div className="col-md-12">
                    <div className="form-group">
                      <label className="form-label">Email</label>
                      <input type="email" className="form-control" value={user.email} disabled />
                    </div>
                  </div>
                </div>
                <button type="submit" disabled={saving} className="theme-btn mt-2">{saving ? "Saving..." : "Save Changes"} <i className="far fa-save"></i></button>
              </form>
            )}
            {tab === 'password' && (
              <form onSubmit={handlePassword}>
                <div className="row">
                  <div className="col-md-12">
                    <div className="form-group">
                      <label className="form-label">Current Password</label>
                      <input type="password" className="form-control" value={passForm.currentPassword} onChange={e => setPassForm({...passForm, currentPassword: e.target.value})} required />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">New Password</label>
                      <input type="password" className="form-control" value={passForm.newPassword} onChange={e => setPassForm({...passForm, newPassword: e.target.value})} required />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label className="form-label">Confirm New Password</label>
                      <input type="password" className="form-control" value={passForm.confirmPassword} onChange={e => setPassForm({...passForm, confirmPassword: e.target.value})} required />
                    </div>
                  </div>
                </div>
                <button type="submit" disabled={saving} className="theme-btn mt-2">{saving ? "Changing..." : "Change Password"} <i className="far fa-lock"></i></button>
              </form>
            )}
          </div>
        </div>
      </AccountLayout>
    </>
  );
}
