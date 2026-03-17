"use client";
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/contexts/ToastContext";
import { useLanguage } from "@/contexts/LanguageContext";
import Pagination from "@/components/Pagination";
import Modal from "@/components/Modal";
import { adminPost, adminPut, adminDelete } from "@/hooks/useAdminApi";

export default function AdminBlog() {
  const { t } = useLanguage();
  const toast = useToast();
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(null); // null | 'create' | 'edit'
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    titleEn: "", titlePs: "", titleDr: "",
    excerptEn: "", excerptPs: "", excerptDr: "",
    contentEn: "", contentPs: "", contentDr: "",
    image: "", category: "", tags: "", isPublished: true,
  });

  const fetchPosts = useCallback(() => {
    const params = new URLSearchParams({ page, limit: 15 });
    if (search) params.set("search", search);
    fetch(`/api/admin/blog?${params}`, { credentials: "include" })
      .then(r => r.json())
      .then(d => {
        setPosts(d.posts || []);
        setTotalPages(d.totalPages || 1);
        setTotal(d.total || 0);
      })
      .catch(() => toast.error("Failed to load blog posts"));
  }, [page, search, toast]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const resetForm = () => setForm({
    titleEn: "", titlePs: "", titleDr: "",
    excerptEn: "", excerptPs: "", excerptDr: "",
    contentEn: "", contentPs: "", contentDr: "",
    image: "", category: "", tags: "", isPublished: true,
  });

  const openCreate = () => { resetForm(); setModal("create"); };

  const openEdit = (post) => {
    setForm({
      id: post.id,
      titleEn: post.titleEn || "", titlePs: post.titlePs || "", titleDr: post.titleDr || "",
      excerptEn: post.excerptEn || "", excerptPs: post.excerptPs || "", excerptDr: post.excerptDr || "",
      contentEn: post.contentEn || "", contentPs: post.contentPs || "", contentDr: post.contentDr || "",
      image: post.image || "", category: post.category || "", tags: post.tags || "", isPublished: post.isPublished,
    });
    setModal("edit");
  };

  const handleSave = async () => {
    if (!form.titleEn) { toast.error("English title is required"); return; }
    setSaving(true);
    try {
      if (modal === "create") {
        await adminPost("blog", form);
        toast.success("Blog post created");
      } else {
        await adminPut(`blog/${form.id}`, form);
        toast.success("Blog post updated");
      }
      setModal(null);
      fetchPosts();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (post) => {
    if (!confirm(`Delete "${post.titleEn}"?`)) return;
    try {
      await adminDelete(`blog/${post.id}`);
      toast.success("Deleted");
      fetchPosts();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Blog Posts ({total})</h1>
        <button className="btn btn-primary" onClick={openCreate}>
          <i className="fas fa-plus"></i> New Post
        </button>
      </div>

      <div className="card card-p" style={{ marginBottom: 16 }}>
        <div style={{ position: "relative" }}>
          <i className="fas fa-search" style={{ position: "absolute", left: 12, top: 11, color: "#aaa" }}></i>
          <input className="input" style={{ paddingLeft: 36 }} placeholder="Search posts..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Views</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: 40, color: "#999" }}>No blog posts found</td></tr>
              ) : posts.map(post => (
                <tr key={post.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      {post.image && <img src={post.image} alt="" style={{ width: 40, height: 40, borderRadius: 6, objectFit: "cover" }} />}
                      <span style={{ fontWeight: 500 }}>{post.titleEn}</span>
                    </div>
                  </td>
                  <td>{post.category || "-"}</td>
                  <td>{post.viewCount || 0}</td>
                  <td>
                    <span className={`badge ${post.isPublished ? "badge-green" : "badge-yellow"}`}>
                      {post.isPublished ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td>{new Date(post.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button className="btn btn-sm btn-outline" onClick={() => openEdit(post)} title="Edit"><i className="fas fa-edit"></i></button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(post)} title="Delete"><i className="fas fa-trash"></i></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      {/* Create/Edit Modal */}
      <Modal open={modal === "create" || modal === "edit"} onClose={() => setModal(null)} title={modal === "create" ? "New Blog Post" : "Edit Blog Post"} size="lg">
        <div style={{ display: "grid", gap: 14 }}>
          <div>
            <label className="label">Title (English) *</label>
            <input className="input" value={form.titleEn} onChange={e => setForm(f => ({ ...f, titleEn: e.target.value }))} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label className="label">Title (Pashto)</label>
              <input className="input" value={form.titlePs} onChange={e => setForm(f => ({ ...f, titlePs: e.target.value }))} />
            </div>
            <div>
              <label className="label">Title (Dari)</label>
              <input className="input" value={form.titleDr} onChange={e => setForm(f => ({ ...f, titleDr: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Excerpt (English)</label>
            <textarea className="input" rows={2} value={form.excerptEn} onChange={e => setForm(f => ({ ...f, excerptEn: e.target.value }))} />
          </div>
          <div>
            <label className="label">Content (English)</label>
            <textarea className="input" rows={6} value={form.contentEn} onChange={e => setForm(f => ({ ...f, contentEn: e.target.value }))} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <label className="label">Content (Pashto)</label>
              <textarea className="input" rows={4} value={form.contentPs} onChange={e => setForm(f => ({ ...f, contentPs: e.target.value }))} />
            </div>
            <div>
              <label className="label">Content (Dari)</label>
              <textarea className="input" rows={4} value={form.contentDr} onChange={e => setForm(f => ({ ...f, contentDr: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14 }}>
            <div>
              <label className="label">Image URL</label>
              <input className="input" value={form.image} onChange={e => setForm(f => ({ ...f, image: e.target.value }))} placeholder="https://..." />
            </div>
            <div>
              <label className="label">Category</label>
              <input className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="e.g. News, Tips" />
            </div>
            <div>
              <label className="label">Tags (comma-separated)</label>
              <input className="input" value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="e.g. fashion, deals" />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="checkbox" id="isPublished" checked={form.isPublished} onChange={e => setForm(f => ({ ...f, isPublished: e.target.checked }))} />
            <label htmlFor="isPublished">Published</label>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button className="btn btn-outline" onClick={() => setModal(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : modal === "create" ? "Create" : "Save Changes"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
