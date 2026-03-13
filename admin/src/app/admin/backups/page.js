"use client";
import { useState, useEffect, useCallback, useRef } from "react";

export default function BackupsPage() {
  const [backups, setBackups] = useState([]);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(null);
  const [uploadRestoring, setUploadRestoring] = useState(false);
  const fileInputRef = useRef(null);

  const fetchBackups = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/backups", { credentials: "include" });
      if (r.ok) { const d = await r.json(); setBackups(d.backups || []); }
    } catch {}
  }, []);

  useEffect(() => { fetchBackups(); }, [fetchBackups]);

  const createBackup = async () => {
    setCreating(true);
    try {
      const r = await fetch("/api/admin/backup", { method: "POST", credentials: "include" });
      if (r.ok) {
        const disposition = r.headers.get("content-disposition");
        let filename = `backup_${Date.now()}.sql`;
        if (disposition) {
          const match = disposition.match(/filename="?(.+?)"?$/);
          if (match) filename = match[1];
        }
        const blob = await r.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        fetchBackups();
      } else {
        const d = await r.json().catch(() => ({}));
        alert(d.error || "Backup failed");
      }
    } catch { alert("Backup failed"); }
    setCreating(false);
  };

  const downloadBackup = async (filename) => {
    try {
      const r = await fetch(`/api/admin/backups/${encodeURIComponent(filename)}`, { credentials: "include" });
      if (r.ok) {
        const blob = await r.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else { alert("Download failed"); }
    } catch { alert("Download failed"); }
  };

  const restoreBackup = async (filename) => {
    if (!confirm(`Are you sure you want to restore from ${filename}? This will overwrite the current database!`)) return;
    setRestoring(filename);
    try {
      const r = await fetch("/api/admin/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ filename }),
      });
      const d = await r.json();
      if (r.ok) alert(d.message || "Restored successfully");
      else alert(d.error || "Restore failed");
    } catch { alert("Restore failed"); }
    setRestoring(null);
  };

  const handleFileRestore = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.sql') && !file.name.endsWith('.json')) {
      alert("Please select a .sql or .json backup file");
      return;
    }
    if (!confirm(`Are you sure you want to restore from uploaded file "${file.name}"? This will overwrite the current database!`)) {
      e.target.value = '';
      return;
    }
    setUploadRestoring(true);
    try {
      const formData = new FormData();
      formData.append("backup", file);
      const r = await fetch("/api/admin/restore-upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const d = await r.json();
      if (r.ok) { alert(d.message || "Restored successfully"); fetchBackups(); }
      else alert(d.error || "Restore failed");
    } catch { alert("Restore failed"); }
    setUploadRestoring(false);
    e.target.value = '';
  };

  const deleteBackup = async (filename) => {
    if (!confirm(`Delete ${filename}?`)) return;
    try {
      const r = await fetch(`/api/admin/backups/${encodeURIComponent(filename)}`, { method: "DELETE", credentials: "include" });
      if (r.ok) fetchBackups();
    } catch {}
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Database Backups</h1>
        <div className="flex gap-3">
          <button onClick={() => fileInputRef.current?.click()} disabled={uploadRestoring}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 disabled:opacity-50">
            {uploadRestoring ? "Restoring..." : "Restore from File"}
          </button>
          <input type="file" ref={fileInputRef} accept=".sql,.json" onChange={handleFileRestore} className="hidden" />
          <button onClick={createBackup} disabled={creating}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50">
            {creating ? "Creating & Downloading..." : "Create & Download Backup"}
          </button>
        </div>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 text-sm text-yellow-800">
        <strong>Note:</strong> A backup file will be generated and downloaded automatically. If the server has <code>mysqldump</code> installed the file will be an SQL dump; otherwise a JSON export will be created. You can restore from any previously downloaded backup file using "Restore from File".
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Filename</th>
              <th className="px-4 py-3 text-left font-semibold">Size</th>
              <th className="px-4 py-3 text-left font-semibold">Created</th>
              <th className="px-4 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {backups.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No backups found. Create one to get started.</td></tr>
            ) : backups.map(b => (
              <tr key={b.name} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{b.name}</td>
                <td className="px-4 py-3 text-gray-500">{formatSize(b.size)}</td>
                <td className="px-4 py-3 text-gray-500">{new Date(b.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => downloadBackup(b.name)}
                      className="px-3 py-1 bg-blue-50 text-blue-700 rounded text-xs font-semibold hover:bg-blue-100">
                      Download
                    </button>
                    <button onClick={() => restoreBackup(b.name)} disabled={restoring === b.name}
                      className="px-3 py-1 bg-green-50 text-green-700 rounded text-xs font-semibold hover:bg-green-100 disabled:opacity-50">
                      {restoring === b.name ? "Restoring..." : "Restore"}
                    </button>
                    <button onClick={() => deleteBackup(b.name)}
                      className="px-3 py-1 bg-red-50 text-red-700 rounded text-xs font-semibold hover:bg-red-100">
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
