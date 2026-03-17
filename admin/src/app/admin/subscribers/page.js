"use client";
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/contexts/ToastContext";
import Pagination from "@/components/Pagination";
import { adminDelete } from "@/hooks/useAdminApi";

export default function AdminSubscribers() {
  const toast = useToast();
  const [subs, setSubs] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchSubs = useCallback(() => {
    fetch(`/api/admin/subscribers?page=${page}&limit=20`, { credentials: "include" })
      .then(r => r.json())
      .then(d => {
        setSubs(d.subscribers || []);
        setTotalPages(d.totalPages || 1);
        setTotal(d.total || 0);
      })
      .catch(() => toast.error("Failed to load subscribers"));
  }, [page, toast]);

  useEffect(() => { fetchSubs(); }, [fetchSubs]);

  const handleDelete = async (sub) => {
    if (!confirm(`Remove subscriber ${sub.email}?`)) return;
    try {
      await adminDelete(`subscribers/${sub.id}`);
      toast.success("Subscriber removed");
      fetchSubs();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Subscribers ({total})</h1>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Coupon Code</th>
                <th>Coupon Used</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {subs.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: "center", padding: 40, color: "#999" }}>No subscribers yet</td></tr>
              ) : subs.map(sub => (
                <tr key={sub.id}>
                  <td style={{ fontWeight: 500 }}>{sub.email}</td>
                  <td><code>{sub.couponCode || "-"}</code></td>
                  <td>{sub.couponUsed ? <span className="badge badge-green">Yes</span> : <span className="badge badge-yellow">No</span>}</td>
                  <td>{sub.isActive ? <span className="badge badge-green">Active</span> : <span className="badge badge-red">Inactive</span>}</td>
                  <td>{new Date(sub.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDelete(sub)} title="Remove"><i className="fas fa-trash"></i></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </div>
  );
}
