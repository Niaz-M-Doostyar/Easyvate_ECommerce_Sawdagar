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
    <div className="f2-content-page f2-sponsorship-page">
      <div className="site-breadcrumb f2-content-crumb">
        <div className="site-breadcrumb-bg" style={{ background: "url(/assets/img/breadcrumb/01.jpg)" }}></div>
        <div className="container">
          <div className="site-breadcrumb-wrap">
            <h1 className="breadcrumb-title">{t("sponsorships") || "Sponsorships"}</h1>
            <ul className="breadcrumb-menu">
              <li><Link href="/"><i className="far fa-home"></i> {t("home") || "Home"}</Link></li>
              <li className="active">{t("sponsorships") || "Sponsorships"}</li>
            </ul>
          </div>
        </div>
      </div>

      <section className="f2-content-section f2-sponsorship-main">
        <div className="container">
          {/* Packages Section */}
          <div className="site-heading f2-content-heading f2-content-heading--center f2-sponsorship-heading">
            <span className="site-title-tagline f2-content-eyebrow">Boost Your Sales</span>
            <h2 className="site-title">Sponsorship Packages</h2>
            <p>
              Promote your products to thousands of customers. Choose a package that suits your needs.
            </p>
          </div>

          {loading && (
            <div className="f2-content-state" role="status">
              <span className="f2-content-spinner f2-content-spinner--large" aria-hidden="true" />
              <span>Loading sponsorship packages...</span>
            </div>
          )}

          <div className="row f2-sponsorship-packages">
            {packages.length === 0 && !loading && (
              <div className="col-12">
                <div className="f2-content-state f2-content-state--empty">
                  <span className="f2-content-state__icon"><i className="far fa-megaphone" aria-hidden="true" /></span>
                  <h2>No packages available</h2>
                  <p>No sponsorship packages available at the moment.</p>
                </div>
              </div>
            )}
            {packages.map((pkg) => (
              <div className="col-md-6 col-lg-4" key={pkg.id}>
                <article className="f2-sponsorship-package wow fadeInUp" data-wow-delay="0.1s">
                  <span className="f2-sponsorship-package__icon"><i className="far fa-bullhorn" aria-hidden="true" /></span>
                  <h3>{pkg.name}</h3>
                  <div className="f2-sponsorship-package__price">
                    {CURRENCY_SYMBOL}{pkg.price}
                  </div>
                  <p className="f2-sponsorship-package__duration">{pkg.durationDays} Days</p>
                  {pkg.description && <p>{pkg.description}</p>}
                </article>
              </div>
            ))}
          </div>

          {/* Supplier Section: Submit Request */}
          {user?.role === "supplier" && (
            <>
              <div className="site-heading f2-content-heading f2-sponsorship-subheading">
                <span className="f2-content-eyebrow">Promote a product</span>
                <h2 className="site-title">Request Sponsorship</h2>
              </div>
              <div className="f2-sponsorship-request-card">
                <form onSubmit={handleSubmit} className="f2-content-form" aria-busy={submitting}>
                  <div className="row f2-sponsorship-request-card__grid">
                    <div className="col-md-5">
                      <div className="form-group f2-content-field">
                        <label htmlFor="sponsorship-product">Select Product</label>
                        <select id="sponsorship-product" value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} required>
                          <option value="">-- Choose Product --</option>
                          {myProducts.map((p) => (
                            <option key={p.id} value={p.id}>{getName(p)}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="col-md-5">
                      <div className="form-group f2-content-field">
                        <label htmlFor="sponsorship-package">Select Package</label>
                        <select id="sponsorship-package" value={selectedPackage} onChange={(e) => setSelectedPackage(e.target.value)} required>
                          <option value="">-- Choose Package --</option>
                          {packages.map((pkg) => (
                            <option key={pkg.id} value={pkg.id}>{pkg.name} - {CURRENCY_SYMBOL}{pkg.price}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="col-md-2 d-flex align-items-end">
                      <button type="submit" className="f2-content-button f2-content-button--wide" disabled={submitting}>
                        {submitting ? "Submitting..." : "Submit"}
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* My Requests */}
              <div className="site-heading f2-content-heading f2-sponsorship-subheading">
                <span className="f2-content-eyebrow">Request history</span>
                <h2 className="site-title">My Sponsorship Requests</h2>
              </div>
              <div className="table-responsive f2-content-table-card">
                <table className="table table-hover">
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
                      <tr><td colSpan={6} className="f2-content-table-empty">No requests yet</td></tr>
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
            <div className="f2-content-notice">
              <i className="far fa-info-circle" aria-hidden="true" />
              <p>Sponsorship requests are available for suppliers. <Link href="/register">Register as a supplier</Link> to get started.</p>
            </div>
          )}

          {!user && (
            <div className="f2-content-notice">
              <i className="far fa-lock" aria-hidden="true" />
              <p>Please <Link href="/login">sign in</Link> to view sponsorship options.</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
