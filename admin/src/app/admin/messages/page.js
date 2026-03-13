"use client";
import { useEffect, useState } from "react";
import { useToast } from "@/contexts/ToastContext";
import Pagination from "@/components/Pagination";

export default function AdminMessagesPage() {
  const toast = useToast();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [detail, setDetail] = useState(null);

  const fetchMessages = (p = page) => {
    setLoading(true);
    fetch(`/api/admin/contact-messages?page=${p}&limit=15`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { setMessages(d.messages || []); setTotalPages(d.pages || 1); })
      .catch(() => toast.error("Failed to load messages"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchMessages(page); }, [page]);

  const markRead = async (id) => {
    try {
      await fetch(`/api/admin/contact-messages/${id}/read`, { method: "PATCH", credentials: "include" });
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, isRead: true } : m)));
    } catch {}
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this message?")) return;
    try {
      await fetch(`/api/admin/contact-messages/${id}`, { method: "DELETE", credentials: "include" });
      toast.success("Message deleted");
      fetchMessages(page);
      if (detail?.id === id) setDetail(null);
    } catch { toast.error("Failed to delete"); }
  };

  const openDetail = (msg) => {
    setDetail(msg);
    if (!msg.isRead) markRead(msg.id);
  };

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title">Contact Messages</h1>
          <p className="text-body mt-1 text-sm">Messages submitted through the website contact form.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          {loading ? (
            <div className="p-8 text-center text-body">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="empty-state">
              <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" /></svg>
              <p className="font-semibold text-navy">No messages yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {messages.map((msg) => (
                <button key={msg.id} onClick={() => openDetail(msg)} className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex gap-3 items-start ${detail?.id === msg.id ? "bg-primary/5" : ""}`}>
                  <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${msg.isRead ? "bg-gray-300" : "bg-primary"}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm truncate ${msg.isRead ? "text-body" : "font-semibold text-navy"}`}>{msg.name}</p>
                      <span className="text-xs text-body flex-shrink-0">{new Date(msg.createdAt).toLocaleDateString()}</span>
                    </div>
                    <p className="text-xs text-body truncate">{msg.subject || "No subject"}</p>
                    <p className="text-xs text-gray-400 truncate mt-0.5">{msg.message}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
          {totalPages > 1 && <div className="p-4 border-t border-gray-100"><Pagination page={page} totalPages={totalPages} onPageChange={setPage} /></div>}
        </div>

        <div className="card card-p">
          {detail ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-navy">{detail.name}</h3>
                <button onClick={() => handleDelete(detail.id)} className="btn btn-sm btn-danger">Delete</button>
              </div>
              <div className="space-y-2 text-sm">
                <p><span className="font-semibold text-navy">Email:</span> <a href={`mailto:${detail.email}`} className="text-primary hover:underline">{detail.email}</a></p>
                {detail.phone && <p><span className="font-semibold text-navy">Phone:</span> {detail.phone}</p>}
                {detail.subject && <p><span className="font-semibold text-navy">Subject:</span> {detail.subject}</p>}
                <p><span className="font-semibold text-navy">Date:</span> {new Date(detail.createdAt).toLocaleString()}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-body whitespace-pre-wrap">{detail.message}</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-body text-sm">Select a message to view details</div>
          )}
        </div>
      </div>
    </div>
  );
}
