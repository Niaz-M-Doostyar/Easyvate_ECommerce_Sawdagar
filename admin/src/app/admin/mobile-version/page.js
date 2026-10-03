"use client";
import { useEffect, useState } from "react";
import { useToast } from "@/contexts/ToastContext";
import { adminPut } from "@/hooks/useAdminApi";

export default function MobileVersionPage() {
  const toast = useToast();
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  useEffect(() => { fetch('/api/mobile-version').then(r => r.json()).then(setSettings).catch(() => {}); }, []);
  const save = async (event) => {
    event.preventDefault(); setSaving(true);
    try { const updated = await adminPut('mobile-version', { ios: Number(settings.ios), android: Number(settings.android) }); setSettings(updated); toast.success('Minimum app builds saved'); }
    catch (error) { toast.error(error.message || 'Unable to save versions'); }
    finally { setSaving(false); }
  };
  if (!settings) return <p>Loading app settings…</p>;
  return <div className="card p-6 max-w-xl"><h1 className="page-title">Required mobile update</h1><p className="text-body my-4">Set a minimum only after the corresponding build is live in its store. Older app builds must update before continuing.</p><form onSubmit={save} className="space-y-4"><label className="block">Minimum iOS build<input className="input mt-2" type="number" min="4" value={settings.ios} onChange={e => setSettings({ ...settings, ios: e.target.value })} /></label><label className="block">Minimum Android build<input className="input mt-2" type="number" min="14" value={settings.android} onChange={e => setSettings({ ...settings, android: e.target.value })} /></label><button className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : 'Save minimum builds'}</button></form></div>;
}
