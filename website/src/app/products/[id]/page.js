"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/contexts/ToastContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatPrice } from "@/lib/currency";
import { safeJsonParse } from "@/lib/utils";
import ProductCard from "@/components/ProductCard";

export default function ProductDetailPage({ params }) {
  const { id } = params;
  const { addToCart } = useCart();
  const toast = useToast();
  const { t, lang } = useLanguage();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [adding, setAdding] = useState(false);

  const getName = (p) => {
    if (!p) return "";
    if (lang === "ps" && p.namePs) return p.namePs;
    if (lang === "dr" && p.nameDr) return p.nameDr;
    return p.nameEn || "";
  };
  const getDesc = (p) => {
    if (!p) return "";
    if (lang === "ps" && p.descPs) return p.descPs;
    if (lang === "dr" && p.descDr) return p.descDr;
    return p.descEn || "";
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    setSelectedImage(0);
    setQty(1);
    fetch(`/api/products/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Product not found");
        return r.json();
      })
      .then((d) => {
        const prod = d.product || d;
        setProduct(prod);
        setRelated((d.relatedProducts || []).filter((p) => p.id !== parseInt(id)));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = async () => {
    setAdding(true);
    try {
      await addToCart(parseInt(id), qty);
    } catch {
      toast.error(t('error') || "Failed to add to cart");
    } finally {
      setAdding(false);
    }
  };

  if (loading) return (
    <>
      <div className="site-breadcrumb">
        <div className="site-breadcrumb-bg" style={{ background: "url(/assets/img/breadcrumb/01.jpg)" }} /><div className="container"><div className="site-breadcrumb-wrap"><h4 className="breadcrumb-title">{t('product_details') || 'Product Details'}</h4></div></div>
      </div>
      <div className="py-100 text-center"><div className="container"><div className="spinner-border text-primary" role="status"><span className="visually-hidden">Loading...</span></div></div></div>
    </>
  );

  if (error || !product) return (
    <>
      <div className="site-breadcrumb">
        <div className="site-breadcrumb-bg" style={{ background: "url(/assets/img/breadcrumb/01.jpg)" }} /><div className="container"><div className="site-breadcrumb-wrap"><h4 className="breadcrumb-title">{t('product_details') || 'Product Details'}</h4></div></div>
      </div>
      <div className="py-100 text-center"><div className="container">
        <i className="far fa-box-open" style={{ fontSize: '64px', color: '#ddd', display: 'block', marginBottom: '20px' }}></i>
        <h3>{t('product_not_found') || 'Product Not Found'}</h3>
        <p className="mt-2 mb-4">{t('product_not_found_desc') || "The product you're looking for doesn't exist or has been removed."}</p>
        <Link href="/search" className="theme-btn">{t('browse_products') || 'Browse Products'} <i className="fas fa-arrow-right"></i></Link>
      </div></div>
    </>
  );

  const fallbackImg = '/assets/img/product/placeholder.png';
  const images = product.images?.length > 0
    ? product.images.map((i) => (i.url?.startsWith("http") ? i.url : i.url?.startsWith("/") ? i.url : `/${i.url}`))
    : [fallbackImg];
  const inStock = product.stock > 0;
  const productName = getName(product);
  const productDesc = getDesc(product);
  const catName = getName(product.category);

  let attributes = [];
  try {
    if (product.attributes) {
      const parsed = safeJsonParse(product.attributes, null);
      if (Array.isArray(parsed)) attributes = parsed;
      else if (parsed && typeof parsed === "object") attributes = Object.entries(parsed).map(([k, v]) => ({ key: k, value: v }));
    }
  } catch {}


  return (
    <>
      {/* Breadcrumb */}
      <div className="site-breadcrumb">
        <div className="site-breadcrumb-bg" style={{ background: "url(/assets/img/breadcrumb/01.jpg)" }} />
        <div className="container">
          <div className="site-breadcrumb-wrap">
            <h4 className="breadcrumb-title">{productName}</h4>
            <ul className="breadcrumb-menu">
              <li><Link href="/"><i className="far fa-home"></i> {t('home') || 'Home'}</Link></li>
              {product.category && <li><Link href={`/search?category=${product.category.slug || product.categoryId}`}>{catName}</Link></li>}
              <li className="active">{productName}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Product Detail */}
      <div className="shop-single py-100">
        <div className="container">
          <div className="row">
            {/* Gallery */}
            <div className="col-lg-6">
              <div className="shop-single-gallery">
                <div className="shop-single-main-img mb-3">
                  <img src={images[selectedImage]} alt={productName} onError={(e) => { e.target.src = fallbackImg; }} />
                  {product.isSponsored && <span className="badge bg-warning position-absolute" style={{ top: '15px', left: '15px' }}>{t('sponsored') || 'Sponsored'}</span>}
                  {!inStock && <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ background: 'rgba(0,0,0,0.4)' }}><span className="badge bg-danger fs-6 px-3 py-2">{t('out_of_stock') || 'Out of Stock'}</span></div>}
                </div>
                {images.length > 1 && (
                  <div className="shop-single-nav">
                    {images.map((img, i) => (
                      <button key={i} onClick={() => setSelectedImage(i)}
                        className={`shop-single-nav-item${i === selectedImage ? ' active' : ''}`}>
                        <img src={img} alt="" onError={(e) => { e.target.src = fallbackImg; }} />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Info */}
            <div className="col-lg-6">
              <div className="shop-single-info">
                {product.category && <Link href={`/search?category=${product.category.slug || product.categoryId}`} className="shop-single-category">{catName}</Link>}
                <h4 className="shop-single-title">{productName}</h4>
                <div className="shop-single-rating">
                  {[1,2,3,4,5].map(i => <i key={i} className={`${i <= (product.rating || 4) ? 'fas' : 'far'} fa-star`}></i>)}
                  <span className="rating-count">(0 {t('reviews') || 'reviews'})</span>
                </div>
                <div className="shop-single-price">
                  <span>{formatPrice(product.retailPrice)}</span>
                  {product.suggestedPrice && product.retailPrice < product.suggestedPrice && (
                    <del>{formatPrice(product.suggestedPrice)}</del>
                  )}
                </div>

                {productDesc && <p className="shop-single-desc mt-3 mb-4">{productDesc}</p>}

                {/* Stock Status */}
                <div className="shop-single-stock mb-3">
                  <span className={`d-inline-flex align-items-center gap-2 fw-semibold ${inStock ? 'text-success' : 'text-danger'}`}>
                    <i className={`fas fa-${inStock ? 'check-circle' : 'times-circle'}`}></i>
                    {inStock ? `${t('in_stock') || 'In Stock'} (${product.stock} ${t('available') || 'available'})` : (t('out_of_stock') || 'Out of Stock')}
                  </span>
                </div>

                {/* Qty + Add to Cart */}
                {inStock && (
                  <div className="shop-single-cs">
                    <div className="d-flex align-items-center gap-3 mb-4">
                      <div className="shop-cart-qty">
                        <button className="minus-btn" onClick={() => setQty(Math.max(1, qty - 1))}><i className="fal fa-minus"></i></button>
                        <input className="quantity" type="text" value={qty} readOnly />
                        <button className="plus-btn" onClick={() => setQty(Math.min(product.stock, qty + 1))}><i className="fal fa-plus"></i></button>
                      </div>
                    </div>
                    <div className="shop-single-action">
                      <button onClick={handleAddToCart} disabled={adding} className="theme-btn">
                        {adding ? <><i className="fas fa-spinner fa-spin"></i> {t('adding') || 'Adding...'}</> : <><i className="far fa-shopping-bag"></i> {t('add_to_cart') || 'Add to Cart'}</>}
                      </button>
                    </div>
                  </div>
                )}

                {/* Info List */}
                <div className="shop-single-sortinfo mt-4">
                  <ul>
                    <li><i className="far fa-truck"></i> <span>{t('free_delivery') || 'Free Delivery Across Afghanistan'}</span></li>
                    <li><i className="far fa-shield-check"></i> <span>{t('cod_payment') || 'Cash on Delivery (COD)'}</span></li>
                    <li><i className="far fa-undo"></i> <span>{t('easy_returns') || '7-day Return Policy'}</span></li>
                    <li><i className="far fa-phone"></i> <span>{t('support_247') || '24/7 Support'}</span></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="product-details-tab mt-5">
            <ul className="nav nav-tabs" role="tablist">
              {["description", "details", "reviews"].map(tab => {
                const btnId = `tab-${tab}-btn`;
                const panelId = `tab-${tab}-panel`;
                return (
                  <li className="nav-item" key={tab} role="presentation">
                    <button id={btnId} role="tab" aria-controls={panelId} aria-selected={activeTab === tab} className={`nav-link ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)} style={{ textTransform: 'capitalize' }}>
                      {t(tab) || tab}
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="tab-content">
              <div id="tab-description-panel" role="tabpanel" aria-labelledby="tab-description-btn" hidden={activeTab !== 'description'} className="product-tab-description">
                {productDesc || (t('no_description') || "No detailed description available for this product.")}
              </div>

              <div id="tab-details-panel" role="tabpanel" aria-labelledby="tab-details-btn" hidden={activeTab !== 'details'}>
                <div className="table-responsive">
                  <table className="table table-bordered">
                    <tbody>
                      {[
                        [t('category') || "Category", catName || "N/A"],
                        [t('stock') || "Stock", product.stock],
                        ["SKU", `SWD-${product.id}`],
                        ...(product.supplier?.companyName ? [[t('seller') || "Seller", product.supplier.companyName]] : []),
                        ...attributes.map((a) => [a.key, a.value]),
                      ].map(([k, v], i) => (
                        <tr key={i}>
                          <td className="fw-semibold" style={{ width: '200px' }}>{k}</td>
                          <td>{v}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div id="tab-reviews-panel" role="tabpanel" aria-labelledby="tab-reviews-btn" hidden={activeTab !== 'reviews'}>
                <div className="text-center py-4">
                  <i className="far fa-comments fa-3x d-block mb-3 text-muted"></i>
                  <p className="fw-semibold">{t('no_reviews') || 'No reviews yet'}</p>
                  <p className="text-muted small">{t('be_first_review') || 'Be the first to review this product!'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Related Products */}
          {related.length > 0 && (
            <div className="mt-5">
              <div className="site-heading-inline mb-4">
                <h2 className="site-title">{t('related_products') || 'Related Products'}</h2>
                <Link href="/search">{t('view_more') || 'View More'} <i className="fas fa-angle-double-right"></i></Link>
              </div>
              <div className="row">
                {related.slice(0, 4).map(p => (
                  <div key={p.id} className="col-md-6 col-lg-3">
                    <ProductCard product={p} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
