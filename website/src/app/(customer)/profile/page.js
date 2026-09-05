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
    <section className="f2-account-gate">
      <div className="f2-account-gate__icon" aria-hidden="true"><i className="far fa-user" /></div>
      <span>Customer account</span>
      <h1>Please sign in</h1>
      <p>Sign in to update your profile and password.</p>
      <Link href="/login" className="f2-account-button">Sign in</Link>
    </section>
  );

  return (
    <AccountLayout
      title="My profile"
      description="Keep your contact and delivery information up to date."
    >
      <section className="f2-account-card">
        <div className="f2-account-card__heading">
          <div>
            <span>Account settings</span>
            <h2>Profile details</h2>
          </div>
        </div>

        <div className="f2-account-tabs" role="tablist" aria-label="Profile settings">
          <button type="button" className={tab === 'info' ? 'is-active' : ''} onClick={() => setTab('info')} role="tab" aria-selected={tab === 'info'}>Personal information</button>
          <button type="button" className={tab === 'password' ? 'is-active' : ''} onClick={() => setTab('password')} role="tab" aria-selected={tab === 'password'}>Change password</button>
        </div>

        {tab === 'info' && (
          <form className="f2-account-form" onSubmit={handleSave}>
            <div className="f2-account-form__grid">
              <label className="f2-account-field">
                <span>Full name</span>
                <input type="text" value={form.fullName} onChange={e => set("fullName", e.target.value)} />
              </label>
              <label className="f2-account-field">
                <span>Phone</span>
                <input type="tel" value={form.phone} onChange={e => set("phone", e.target.value)} />
              </label>
              <label className="f2-account-field">
                <span>Province</span>
                <input type="text" value={form.province} onChange={e => set("province", e.target.value)} />
              </label>
              <label className="f2-account-field">
                <span>District</span>
                <input type="text" value={form.district} onChange={e => set("district", e.target.value)} />
              </label>
              <label className="f2-account-field f2-account-field--wide">
                <span>Email address</span>
                <input type="email" value={user.email} disabled />
                <small>Your account email cannot be changed here.</small>
              </label>
            </div>
            <div className="f2-account-form__actions">
              <button type="submit" disabled={saving} className="f2-account-button">{saving ? "Saving…" : "Save changes"} <i className="far fa-save" /></button>
            </div>
          </form>
        )}

        {tab === 'password' && (
          <form className="f2-account-form" onSubmit={handlePassword}>
            <div className="f2-account-form__grid">
              <label className="f2-account-field f2-account-field--wide">
                <span>Current password</span>
                <input type="password" value={passForm.currentPassword} onChange={e => setPassForm({...passForm, currentPassword: e.target.value})} required />
              </label>
              <label className="f2-account-field">
                <span>New password</span>
                <input type="password" value={passForm.newPassword} onChange={e => setPassForm({...passForm, newPassword: e.target.value})} required />
              </label>
              <label className="f2-account-field">
                <span>Confirm new password</span>
                <input type="password" value={passForm.confirmPassword} onChange={e => setPassForm({...passForm, confirmPassword: e.target.value})} required />
              </label>
            </div>
            <div className="f2-account-form__actions">
              <button type="submit" disabled={saving} className="f2-account-button">{saving ? "Changing…" : "Change password"} <i className="far fa-lock" /></button>
            </div>
          </form>
        )}
      </section>
    </AccountLayout>
  );
}
