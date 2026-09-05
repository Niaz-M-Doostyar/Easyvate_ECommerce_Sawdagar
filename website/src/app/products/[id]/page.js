"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { useCart } from "@/contexts/CartContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/contexts/ToastContext";
import { formatPrice } from "@/lib/currency";
import { safeJsonParse } from "@/lib/utils";

const FALLBACK_IMAGE = "/assets/img/product/placeholder.png";

function ProductDetailSkeleton() {
  return (
    <main className="swd-commerce swd-product-page" aria-busy="true" aria-label="Loading product">
      <div className="container">
        <div className="swd-product-skeleton-layout">
          <span className="swd-skeleton swd-product-detail-skeleton__media" />
          <div className="swd-product-detail-skeleton__copy">
            <span className="swd-skeleton swd-product-skeleton__line swd-product-skeleton__line--short" />
            <span className="swd-skeleton swd-product-detail-skeleton__title" />
            <span className="swd-skeleton swd-product-skeleton__line" />
            <span className="swd-skeleton swd-product-skeleton__line" />
            <span className="swd-skeleton swd-product-detail-skeleton__button" />
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ProductDetailPage({ params }) {
  const { id } = params;
  const { addToCart } = useCart();
  const toast = useToast();
  const { t, lang } = useLanguage();
  const [product, setProduct] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedImage, setSelectedImage] = useState(0);
  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState("description");
  const [adding, setAdding] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const pinchRef = useRef(null);

  const getName = (item) => {
    if (!item) return "";
    if (lang === "ps" && item.namePs) return item.namePs;
    if (lang === "dr" && item.nameDr) return item.nameDr;
    return item.nameEn || "";
  };

  const getDescription = (item) => {
    if (!item) return "";
    if (lang === "ps" && item.descPs) return item.descPs;
    if (lang === "dr" && item.descDr) return item.descDr;
    return item.descEn || "";
  };

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    setSelectedImage(0);
    setQty(1);

    fetch(`/api/products/${id}`, { cache: "no-store", signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Product not found");
        return response.json();
      })
      .then((data) => {
        const nextProduct = data.product || data;
        setProduct(nextProduct);
        setRelated(
          (data.relatedProducts || []).filter((item) => String(item.id) !== String(id))
        );
      })
      .catch((requestError) => {
        if (requestError.name !== "AbortError") setError(requestError.message || "Product not found");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [id]);

  useEffect(() => {
    if (!viewerOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event) => { if (event.key === "Escape") setViewerOpen(false); };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [viewerOpen]);

  const handleAddToCart = async () => {
    if (adding) return;
    setAdding(true);
    try {
      await addToCart(parseInt(id, 10), qty);
    } catch {
      toast.error(t("error") || "Failed to add to cart");
    } finally {
      setAdding(false);
    }
  };

  const handleShare = async () => {
    const shareData = { title: productName, text: productName, url: window.location.href };
    try {
      if (navigator.share) await navigator.share(shareData);
      else window.open(`https://wa.me/?text=${encodeURIComponent(`${productName} ${window.location.href}`)}`, "_blank", "noopener,noreferrer");
    } catch (shareError) {
      if (shareError?.name !== "AbortError") toast.error(t("error") || "Unable to share product");
    }
  };

  const touchDistance = (touches) => Math.hypot(
    touches[0].clientX - touches[1].clientX,
    touches[0].clientY - touches[1].clientY,
  );

  const handleViewerTouchStart = (event) => {
    if (event.touches.length === 2) pinchRef.current = { distance: touchDistance(event.touches), zoom };
  };

  const handleViewerTouchMove = (event) => {
    if (event.touches.length !== 2 || !pinchRef.current) return;
    event.preventDefault();
    setZoom(Math.min(4, Math.max(1, pinchRef.current.zoom * touchDistance(event.touches) / pinchRef.current.distance)));
  };

  const attributes = useMemo(() => {
    if (!product?.attributes) return [];
    const parsed = safeJsonParse(product.attributes, null);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === "object") {
      return Object.entries(parsed).map(([key, value]) => ({ key, value }));
    }
    return [];
  }, [product]);

  if (loading) return <ProductDetailSkeleton />;

  if (error || !product) {
    return (
      <main className="swd-commerce swd-product-page">
        <div className="container">
          <nav className="swd-breadcrumbs swd-product-breadcrumbs" aria-label="Breadcrumb">
            <Link href="/">{t("home") || "Home"}</Link>
            <i className="far fa-angle-right" aria-hidden="true" />
            <span aria-current="page">{t("product_details") || "Product details"}</span>
          </nav>
          <div className="swd-state-card swd-state-card--page" role="alert">
            <span className="swd-state-card__icon"><i className="far fa-box-open" aria-hidden="true" /></span>
            <h1>{t("product_not_found") || "Product not found"}</h1>
            <p>{t("product_not_found_desc") || "This product may have been removed or is no longer available."}</p>
            <Link href="/search" className="swd-primary-button">
              {t("browse_products") || "Browse products"}
              <i className="far fa-arrow-right" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const images = product.images?.length
    ? product.images.map((image) => {
        const source = image?.url || image;
        if (!source) return FALLBACK_IMAGE;
        if (source.startsWith("http") || source.startsWith("/")) return source;
        return `/${source}`;
      })
    : [FALLBACK_IMAGE];
  const stock = Number(product.stock) || 0;
  const inStock = stock > 0;
  const productName = getName(product) || `Product #${product.id}`;
  const productDescription = getDescription(product);
  const categoryName = getName(product.category);
  const rating = Number(product.averageRating || product.rating || 0);
  const reviewCount = Number(product.reviewCount || product._count?.reviews || 0);
  const createdAt = product.createdAt ? new Date(product.createdAt).getTime() : 0;
  const isNewProduct = Number.isFinite(createdAt) && createdAt > 0 && Date.now() - createdAt < 7 * 86400000;
  const oldPrice = Number(product.suggestedPrice) > Number(product.retailPrice)
    ? Number(product.suggestedPrice)
    : null;
  const discount = oldPrice
    ? Math.round((1 - Number(product.retailPrice) / oldPrice) * 100)
    : 0;

  const selectPreviousImage = () => {
    setSelectedImage((current) => (current === 0 ? images.length - 1 : current - 1));
  };

  const selectNextImage = () => {
    setSelectedImage((current) => (current === images.length - 1 ? 0 : current + 1));
  };

  const detailRows = [
    [t("category") || "Category", categoryName || "—"],
    [t("stock") || "Stock", inStock ? `${stock} ${t("available") || "available"}` : (t("out_of_stock") || "Out of stock")],
    ["SKU", `SWD-${product.id}`],
    ...(product.supplier?.companyName ? [[t("seller") || "Seller", product.supplier.companyName]] : []),
    ...attributes.map((attribute) => [attribute.key || attribute.name, attribute.value]),
  ];

  return (
    <main className="swd-commerce swd-product-page">
      <div className="container">
        <nav className="swd-breadcrumbs swd-product-breadcrumbs" aria-label="Breadcrumb">
          <Link href="/">{t("home") || "Home"}</Link>
          <i className="far fa-angle-right" aria-hidden="true" />
          <Link href="/search">{t("shop") || "Shop"}</Link>
          {product.category && (
            <>
              <i className="far fa-angle-right" aria-hidden="true" />
              <Link href={`/search?category=${product.category.slug || product.categoryId}`}>{categoryName}</Link>
            </>
          )}
          <i className="far fa-angle-right" aria-hidden="true" />
          <span aria-current="page">{productName}</span>
        </nav>

        <section className="swd-product-hero" aria-labelledby="product-title">
          <div className="swd-product-gallery">
            {images.length > 1 && (
              <div className="swd-product-thumbnails" aria-label={t("product_images") || "Product images"}>
                {images.map((image, index) => (
                  <button
                    type="button"
                    key={`${image}-${index}`}
                    className={selectedImage === index ? "is-active" : ""}
                    onClick={() => setSelectedImage(index)}
                    aria-label={`${t("view_image") || "View image"} ${index + 1}`}
                    aria-pressed={selectedImage === index}
                  >
                    <img
                      src={image}
                      alt=""
                      loading={index > 3 ? "lazy" : undefined}
                      onError={(event) => { event.currentTarget.src = FALLBACK_IMAGE; }}
                    />
                  </button>
                ))}
              </div>
            )}

            <div className="swd-product-main-image">
              <button type="button" className="swd-product-image-open" onClick={() => { setZoom(1); setViewerOpen(true); }} aria-label={t("view_image") || "Open and zoom product image"}>
              <img
                key={selectedImage}
                src={images[selectedImage] || FALLBACK_IMAGE}
                alt={selectedImage === 0 ? productName : `${productName} ${selectedImage + 1}`}
                fetchPriority="high"
                onError={(event) => { event.currentTarget.src = FALLBACK_IMAGE; }}
              />
              </button>

              <div className="swd-product-badges">
                {product.isSponsored && <span className="is-sponsored">{t("sponsored") || "Sponsored"}</span>}
                {discount > 0 && <span className="is-sale">-{discount}%</span>}
                {!inStock && <span className="is-sold-out">{t("out_of_stock") || "Out of stock"}</span>}
              </div>

              {images.length > 1 && (
                <div className="swd-gallery-navigation">
                  <button type="button" onClick={selectPreviousImage} aria-label={t("previous_image") || "Previous image"}>
                    <i className="far fa-arrow-left" aria-hidden="true" />
                  </button>
                  <span>{selectedImage + 1} / {images.length}</span>
                  <button type="button" onClick={selectNextImage} aria-label={t("next_image") || "Next image"}>
                    <i className="far fa-arrow-right" aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="swd-product-info">
            {product.category && (
              <Link href={`/search?category=${product.category.slug || product.categoryId}`} className="swd-product-category">
                {categoryName}
              </Link>
            )}
            <h1 id="product-title">{productName}</h1>

            {(rating > 0 || isNewProduct) && (
              <div className="swd-product-rating-row">
                {rating > 0 && (
                  <>
                    <span className="swd-stars" aria-label={`${rating} ${t("out_of_five") || "out of 5"}`}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <i key={star} className={`${star <= Math.round(rating) ? "fas" : "far"} fa-star`} aria-hidden="true" />
                      ))}
                    </span>
                    <span>{rating.toFixed(1)}{reviewCount > 0 ? ` (${reviewCount})` : ''}</span>
                  </>
                )}
                {rating > 0 && isNewProduct && <span className="swd-dot" aria-hidden="true" />}
                {isNewProduct && <span>{t("new_product") || "New product"}</span>}
              </div>
            )}

            <div className="swd-product-price">
              <strong>{formatPrice(product.retailPrice)}</strong>
              {oldPrice && <del>{formatPrice(oldPrice)}</del>}
              {discount > 0 && <span>{t("save") || "Save"} {discount}%</span>}
            </div>

            {productDescription && <p className="swd-product-intro">{productDescription}</p>}

            <div className={`swd-stock-status ${inStock ? "is-available" : "is-unavailable"}`} role="status">
              <i className={`far fa-${inStock ? "check-circle" : "times-circle"}`} aria-hidden="true" />
              <div>
                <strong>{inStock ? (t("in_stock") || "In stock") : (t("out_of_stock") || "Out of stock")}</strong>
                <span>
                  {inStock
                    ? `${stock} ${t("available_to_order") || "available to order"}`
                    : (t("check_back_later") || "Please check back again soon")}
                </span>
              </div>
            </div>

            {inStock && (
              <div className="swd-purchase-box">
                <div className="swd-quantity-control" aria-label={t("quantity") || "Quantity"}>
                  <button
                    type="button"
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    disabled={qty <= 1}
                    aria-label={t("decrease_quantity") || "Decrease quantity"}
                  >
                    <i className="far fa-minus" aria-hidden="true" />
                  </button>
                  <output aria-live="polite">{qty}</output>
                  <button
                    type="button"
                    onClick={() => setQty(Math.min(stock, qty + 1))}
                    disabled={qty >= stock}
                    aria-label={t("increase_quantity") || "Increase quantity"}
                  >
                    <i className="far fa-plus" aria-hidden="true" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={adding}
                  className="swd-add-cart-button"
                  aria-busy={adding}
                >
                  <i className={`far fa-${adding ? "spinner fa-spin" : "shopping-bag"}`} aria-hidden="true" />
                  {adding ? (t("adding") || "Adding…") : (t("add_to_cart") || "Add to cart")}
                </button>
              </div>
            )}

            <div className="swd-product-assurances">
              <div>
                <i className="far fa-truck" aria-hidden="true" />
                <span><strong>{t("delivery") || "Delivery"}</strong>{t("delivery_across_afghanistan") || "Across Afghanistan"}</span>
              </div>
              <div>
                <i className="far fa-hand-holding-usd" aria-hidden="true" />
                <span><strong>{t("cod") || "Cash on delivery"}</strong>{t("pay_on_arrival") || "Pay when it arrives"}</span>
              </div>
              <div>
                <i className="far fa-undo" aria-hidden="true" />
                <span><strong>{t("returns_refunds") || "Returns & refunds"}</strong>{t("contact_return_support") || "Contact support for help"}</span>
              </div>
              <div>
                <i className="far fa-headset" aria-hidden="true" />
                <span><strong>{t("support") || "Customer support"}</strong>{t("here_to_help") || "Here when you need us"}</span>
              </div>
            </div>

            <div className="swd-product-meta">
              <span><strong>SKU:</strong> SWD-{product.id}</span>
              {product.supplier && <span><strong>{t("seller") || "Seller"}:</strong> <Link href={`/search?supplierId=${product.supplier.id}`}>{product.supplier.companyName || product.supplier.fullName}</Link></span>}
              {product.supplier?.province && <span><strong>{t("location") || "Location"}:</strong> {product.supplier.province}</span>}
            </div>
            <div className="swd-product-secondary-actions">
              {product.supplier && <Link className="swd-secondary-button" href={`/search?supplierId=${product.supplier.id}`}><i className="far fa-store" /> View supplier products</Link>}
              <button type="button" className="swd-secondary-button" onClick={handleShare}><i className="far fa-share-alt" /> {t("share") || "Share product"}</button>
            </div>
          </div>
        </section>

        {viewerOpen && (
          <div className="swd-image-viewer" role="dialog" aria-modal="true" aria-label={t("product_image") || "Product image viewer"}>
            <button type="button" className="swd-image-viewer__backdrop" onClick={() => setViewerOpen(false)} aria-label="Close image viewer" />
            <div className="swd-image-viewer__stage" onTouchStart={handleViewerTouchStart} onTouchMove={handleViewerTouchMove} onTouchEnd={() => { pinchRef.current = null; }}>
              <img src={images[selectedImage]} alt={productName} style={{ transform: `scale(${zoom})` }} draggable="false" />
            </div>
            <button type="button" className="swd-image-viewer__close" onPointerDown={(event) => { event.preventDefault(); setViewerOpen(false); }} onClick={() => setViewerOpen(false)} aria-label="Close image viewer"><i className="far fa-times" /></button>
            <div className="swd-image-viewer__controls">
              <button type="button" onClick={() => setZoom(value => Math.max(1, value - .5))} aria-label="Zoom out">−</button>
              <span>{Math.round(zoom * 100)}%</span>
              <button type="button" onClick={() => setZoom(value => Math.min(4, value + .5))} aria-label="Zoom in">+</button>
            </div>
          </div>
        )}

        <section className="swd-product-details" aria-label={t("product_information") || "Product information"}>
          <div className="swd-product-tabs" role="tablist" aria-label={t("product_information") || "Product information"}>
            {["description", "details", "reviews"].map((tab) => (
              <button
                type="button"
                key={tab}
                id={`tab-${tab}`}
                role="tab"
                aria-selected={activeTab === tab}
                aria-controls={`panel-${tab}`}
                tabIndex={activeTab === tab ? 0 : -1}
                className={activeTab === tab ? "is-active" : ""}
                onClick={() => setActiveTab(tab)}
              >
                {t(tab) || tab}
              </button>
            ))}
          </div>

          <div className="swd-product-tab-panel">
            <div
              id="panel-description"
              role="tabpanel"
              aria-labelledby="tab-description"
              hidden={activeTab !== "description"}
            >
              <span className="swd-eyebrow">{t("about_this_product") || "About this product"}</span>
              <h2>{t("description") || "Description"}</h2>
              <p>{productDescription || (t("no_description") || "No detailed description is available for this product yet.")}</p>
            </div>

            <div
              id="panel-details"
              role="tabpanel"
              aria-labelledby="tab-details"
              hidden={activeTab !== "details"}
            >
              <span className="swd-eyebrow">{t("at_a_glance") || "At a glance"}</span>
              <h2>{t("product_details") || "Product details"}</h2>
              <dl className="swd-detail-list">
                {detailRows.map(([key, value], index) => (
                  <div key={`${key}-${index}`}>
                    <dt>{key}</dt>
                    <dd>{typeof value === "object" ? JSON.stringify(value) : String(value ?? "—")}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div
              id="panel-reviews"
              role="tabpanel"
              aria-labelledby="tab-reviews"
              hidden={activeTab !== "reviews"}
            >
              <div className="swd-reviews-empty">
                <span className="swd-state-card__icon"><i className="far fa-comment-alt-lines" aria-hidden="true" /></span>
                <div>
                  <h2>{t("no_reviews") || "No reviews yet"}</h2>
                  <p>{t("be_first_review") || "Be the first customer to share an experience with this product."}</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {related.length > 0 && (
          <section className="swd-related-products" aria-labelledby="related-products-title">
            <div className="swd-section-heading">
              <div>
                <span className="swd-eyebrow">{t("you_may_also_like") || "You may also like"}</span>
                <h2 id="related-products-title">{t("related_products") || "Related products"}</h2>
              </div>
              <Link href="/search">
                {t("view_more") || "View all"}
                <i className="far fa-arrow-right" aria-hidden="true" />
              </Link>
            </div>
            <div className="swd-product-grid swd-product-grid--related">
              {related.slice(0, 4).map((item) => <ProductCard key={item.id} product={item} />)}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
