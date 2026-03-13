"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth, authHeaders } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { CURRENCY_SYMBOL } from "@/lib/currency";

export default function SponsorshipsPage() {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const toast = useToast();
  const [packages, setPackages] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [myProducts, setMyProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedPackage, setSelectedPackage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const getName = (item) => {
    if (!item) return "";
    if (lang === "ps" && item.namePs) return item.namePs;
    if (lang === "dr" && item.nameDr) return item.nameDr;
    return item.nameEn || "";
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch packages (public-ish, from admin API via supplier endpoint)
        const pkgRes = await fetch("/api/supplier/sponsorships", { headers: authHeaders() });
        if (pkgRes.ok) {
          const data = await pkgRes.json();
          setPackages(data.packages || []);
          setMyRequests(data.requests || []);
        }

        // Fetch supplier's products
        if (user?.role === "supplier") {
          const prodRes = await fetch("/api/supplier/products", { headers: authHeaders() });
          if (prodRes.ok) {
            const data = await prodRes.json();
            setMyProducts(data.products || []);
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchData();
    else setLoading(false);
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProduct || !selectedPackage) {
      toast.error("Please select a product and package");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/supplier/sponsorships", {
        method: "POST",
        headers: authHeaders({ "Content-Type": "application/json" }),
        body: JSON.stringify({ productId: parseInt(selectedProduct), packageId: parseInt(selectedPackage) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit");
      toast.success("Sponsorship request submitted!");
      setMyRequests((prev) => [data.request, ...prev]);
      setSelectedProduct("");
      setSelectedPackage("");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const statusBadge = (status) => {
    const map = {
      pending: "badge-warning",
      approved: "badge-success",
      rejected: "badge-danger",
      expired: "badge-secondary",
    };
    return map[status] || "badge-secondary";
  };

  return (
    <main className="main">
      <div className="site-breadcrumb">
        <div className="site-breadcrumb-bg" style={{ background: "url(/assets/img/breadcrumb/01.jpg)" }}></div>
        <div className="container">
          <div className="site-breadcrumb-wrap">
            <h4 className="breadcrumb-title">{t("sponsorships") || "Sponsorships"}</h4>
            <ul className="breadcrumb-menu">
              <li><Link href="/"><i className="far fa-home"></i> {t("home") || "Home"}</Link></li>
              <li className="active">{t("sponsorships") || "Sponsorships"}</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="py-100">
        <div className="container">
          {/* Packages Section */}
          <div className="site-heading text-center mb-5">
            <span className="site-title-tagline">Boost Your Sales</span>
            <h2 className="site-title">Sponsorship Packages</h2>
            <p style={{ maxWidth: 600, margin: "10px auto 0", color: "#666" }}>
              Promote your products to thousands of customers. Choose a package that suits your needs.
            </p>
          </div>

          <div className="row mb-5">
            {packages.length === 0 && !loading && (
              <div className="col-12 text-center py-5">
                <p style={{ color: "#999" }}>No sponsorship packages available at the moment.</p>
              </div>
            )}
            {packages.map((pkg) => (
              <div className="col-md-6 col-lg-4" key={pkg.id}>
                <div className="wow fadeInUp" data-wow-delay="0.1s" style={{
                  background: "#fff",
                  borderRadius: 12,
                  padding: 30,
                  marginBottom: 30,
                  boxShadow: "0 2px 20px rgba(0,0,0,0.08)",
                  border: "2px solid #f0f0f0",
                  transition: "all 0.3s ease",
                  textAlign: "center",
                }}>
                  <h4 style={{ fontWeight: 700, marginBottom: 10 }}>{pkg.name}</h4>
                  <div style={{ fontSize: 36, fontWeight: 800, color: "var(--theme-color)", marginBottom: 10 }}>
                    {CURRENCY_SYMBOL}{pkg.price}
                  </div>
                  <p style={{ color: "#888", marginBottom: 15 }}>{pkg.durationDays} Days</p>
                  {pkg.description && <p style={{ color: "#666", fontSize: 14 }}>{pkg.description}</p>}
                </div>
              </div>
            ))}
          </div>

          {/* Supplier Section: Submit Request */}
          {user?.role === "supplier" && (
            <>
              <div className="site-heading mb-4">
                <h2 className="site-title" style={{ fontSize: 22 }}>Request Sponsorship</h2>
              </div>
              <div style={{ background: "#fff", borderRadius: 12, padding: 30, boxShadow: "0 2px 12px rgba(0,0,0,0.06)", marginBottom: 40 }}>
                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-5">
                      <div className="form-group">
                        <label className="form-label fw-bold">Select Product</label>
                        <select className="form-control" value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} required>
                          <option value="">-- Choose Product --</option>
                          {myProducts.map((p) => (
                            <option key={p.id} value={p.id}>{getName(p)}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="col-md-5">
                      <div className="form-group">
                        <label className="form-label fw-bold">Select Package</label>
                        <select className="form-control" value={selectedPackage} onChange={(e) => setSelectedPackage(e.target.value)} required>
                          <option value="">-- Choose Package --</option>
                          {packages.map((pkg) => (
                            <option key={pkg.id} value={pkg.id}>{pkg.name} - {CURRENCY_SYMBOL}{pkg.price}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="col-md-2 d-flex align-items-end">
                      <button type="submit" className="theme-btn w-100" disabled={submitting}>
                        {submitting ? "Submitting..." : "Submit"}
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* My Requests */}
              <div className="site-heading mb-4">
                <h2 className="site-title" style={{ fontSize: 22 }}>My Sponsorship Requests</h2>
              </div>
              <div className="table-responsive" style={{ background: "#fff", borderRadius: 12, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                <table className="table table-hover mb-0">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Package</th>
                      <th>Status</th>
                      <th>Start Date</th>
                      <th>End Date</th>
                      <th>Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {myRequests.length === 0 ? (
                      <tr><td colSpan={6} className="text-center py-4" style={{ color: "#999" }}>No requests yet</td></tr>
                    ) : myRequests.map((req) => (
                      <tr key={req.id}>
                        <td>{req.product?.nameEn || `Product #${req.productId}`}</td>
                        <td>{req.package?.name || "-"}</td>
                        <td><span className={`badge ${statusBadge(req.status)}`}>{req.status}</span></td>
                        <td>{req.startDate ? new Date(req.startDate).toLocaleDateString() : "-"}</td>
                        <td>{req.endDate ? new Date(req.endDate).toLocaleDateString() : "-"}</td>
                        <td>{new Date(req.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Non-supplier: info */}
          {user && user.role !== "supplier" && (
            <div className="text-center py-4">
              <p style={{ color: "#666" }}>Sponsorship requests are available for suppliers. <Link href="/register" style={{ color: "var(--theme-color)" }}>Register as a supplier</Link> to get started.</p>
            </div>
          )}

          {!user && (
            <div className="text-center py-4">
              <p style={{ color: "#666" }}>Please <Link href="/login" style={{ color: "var(--theme-color)" }}>sign in</Link> to view sponsorship options.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
