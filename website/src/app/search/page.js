"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Pagination from "@/components/Pagination";
import ProductCard from "@/components/ProductCard";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSiteData } from "@/contexts/SiteDataContext";
import { CURRENCY_SYMBOL } from "@/lib/currency";

const MAX_PRICE = 100000;

function CatalogSkeleton() {
  return (
    <div className="swd-product-grid" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, index) => (
        <div className="swd-product-skeleton" key={index}>
          <span className="swd-skeleton swd-product-skeleton__image" />
          <span className="swd-skeleton swd-product-skeleton__line" />
          <span className="swd-skeleton swd-product-skeleton__line swd-product-skeleton__line--short" />
        </div>
      ))}
    </div>
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t, lang } = useLanguage();
  const { categories, getName: siteGetName } = useSiteData();
  const q = searchParams.get("q") || "";
  const cat = searchParams.get("category") || "";
  const sort = searchParams.get("sort") || "";
  const supplierId = searchParams.get("supplierId") || "";
  const currentPage = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
  const urlInStock = searchParams.get("inStock") === "true";

  const [products, setProducts] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [view, setView] = useState("grid");
  const [priceRange, setPriceRange] = useState([0, MAX_PRICE]);
  const [inStock, setInStock] = useState(urlInStock);
  const [ratingFilter, setRatingFilter] = useState(0);
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  useEffect(() => {
    setInStock(urlInStock);
  }, [urlInStock]);

  useEffect(() => {
    if (searchParams.get("filters") === "1") setShowMobileFilter(true);
  }, [searchParams]);

  useEffect(() => {
    if (!showMobileFilter) return undefined;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setShowMobileFilter(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [showMobileFilter]);

  const getName = useCallback((item) => siteGetName(item, lang), [lang, siteGetName]);

  const activeCategory = useMemo(
    () => categories.find((category) => cat === (category.slug || String(category.id))),
    [cat, categories]
  );

  const fetchProducts = useCallback(async (signal) => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams({ page: String(currentPage), limit: "12" });
    if (q) params.set("search", q);
    if (cat) params.set("category", cat);
    if (sort) params.set("sort", sort);
    if (supplierId) params.set("supplierId", supplierId);
    if (priceRange[0] > 0) params.set("minPrice", String(priceRange[0]));
    if (priceRange[1] < MAX_PRICE) params.set("maxPrice", String(priceRange[1]));
    if (inStock) params.set("inStock", "true");

    try {
      const response = await fetch(`/api/products?${params.toString()}`, {
        cache: "no-store",
        signal,
      });
      if (!response.ok) throw new Error("Unable to load products");
      const data = await response.json();
      setProducts(data.products || []);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch (requestError) {
      if (requestError.name === "AbortError") return;
      setProducts([]);
      setError(requestError.message || "Unable to load products");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [cat, currentPage, inStock, priceRange, q, sort, supplierId]);

  useEffect(() => {
    const controller = new AbortController();
    fetchProducts(controller.signal);
    return () => controller.abort();
  }, [fetchProducts]);

  const updateParam = (key, value) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value !== "" && value !== null && value !== undefined) params.set(key, String(value));
    else params.delete(key);
    if (key !== "page") params.delete("page");
    const queryString = params.toString();
    router.push(`/search${queryString ? `?${queryString}` : ""}`);
  };

  const filteredProducts = ratingFilter > 0
    ? products.filter((product) => Number(product.averageRating || product.rating || 0) >= ratingFilter)
    : products;

  const hasActiveFilters = Boolean(
    cat || priceRange[0] > 0 || priceRange[1] < MAX_PRICE || inStock || ratingFilter > 0
  );

  const clearFilters = () => {
    setPriceRange([0, MAX_PRICE]);
    setInStock(false);
    setRatingFilter(0);
    setShowMobileFilter(false);
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    router.push(`/search${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const renderSidebar = (instance) => {
    const stockId = `in-stock-${instance}`;
    return (
      <div className="swd-filter-panel">
        <div className="swd-filter-panel__heading">
          <div>
            <span className="swd-eyebrow">{t?.("refine_results") || "Refine results"}</span>
            <h2>{t?.("filters") || "Filters"}</h2>
          </div>
          {instance === "mobile" && (
            <button
              type="button"
              className="swd-icon-button"
              onClick={() => setShowMobileFilter(false)}
              aria-label={t?.("close_filters") || "Close filters"}
            >
              <i className="far fa-times" aria-hidden="true" />
            </button>
          )}
        </div>

        <section className="swd-filter-section" aria-labelledby={`search-filter-${instance}`}>
          <h3 id={`search-filter-${instance}`}>{t?.("search") || "Search"}</h3>
          <form
            className="swd-filter-search"
            onSubmit={(event) => {
              event.preventDefault();
              updateParam("q", event.currentTarget.elements.q.value.trim());
              setShowMobileFilter(false);
            }}
          >
            <input
              key={q}
              type="search"
              name="q"
              placeholder={t?.("search_products") || "Search products"}
              defaultValue={q}
              aria-label={t?.("search_products") || "Search products"}
            />
            <button type="submit" aria-label={t?.("search") || "Search"}>
              <i className="far fa-search" aria-hidden="true" />
            </button>
          </form>
        </section>

        <section className="swd-filter-section" aria-labelledby={`category-filter-${instance}`}>
          <h3 id={`category-filter-${instance}`}>{t?.("categories") || "Categories"}</h3>
          <ul className="swd-category-filter">
            <li>
              <button
                type="button"
                className={!cat ? "is-active" : ""}
                onClick={() => updateParam("category", "")}
                aria-pressed={!cat}
              >
                <span>{t?.("all_categories") || "All categories"}</span>
                <i className="far fa-arrow-right" aria-hidden="true" />
              </button>
            </li>
            {categories.map((category) => {
              const value = category.slug || String(category.id);
              const selected = cat === value;
              return (
                <li key={category.id}>
                  <button
                    type="button"
                    className={selected ? "is-active" : ""}
                    onClick={() => updateParam("category", value)}
                    aria-pressed={selected}
                  >
                    <span>{getName(category)}</span>
                    <small>{category._count?.products || 0}</small>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="swd-filter-section" aria-labelledby={`price-filter-${instance}`}>
          <div className="swd-filter-section__title-row">
            <h3 id={`price-filter-${instance}`}>{t?.("price_range") || "Price range"}</h3>
            <span>{CURRENCY_SYMBOL}</span>
          </div>
          <input
            className="swd-price-range"
            type="range"
            min="0"
            max={MAX_PRICE}
            step="500"
            value={priceRange[1]}
            onChange={(event) => {
              const maximum = Math.max(priceRange[0], Number(event.target.value));
              setPriceRange([priceRange[0], maximum]);
            }}
            aria-label={t?.("maximum_price") || "Maximum price"}
          />
          <div className="swd-price-inputs">
            <label>
              <span>{t?.("minimum") || "Minimum"}</span>
              <input
                type="number"
                min="0"
                max={priceRange[1]}
                value={priceRange[0]}
                onChange={(event) => {
                  const minimum = Math.min(priceRange[1], Math.max(0, Number(event.target.value)));
                  setPriceRange([minimum, priceRange[1]]);
                }}
              />
            </label>
            <span aria-hidden="true">—</span>
            <label>
              <span>{t?.("maximum") || "Maximum"}</span>
              <input
                type="number"
                min={priceRange[0]}
                max={MAX_PRICE}
                value={priceRange[1]}
                onChange={(event) => {
                  const maximum = Math.min(MAX_PRICE, Math.max(priceRange[0], Number(event.target.value)));
                  setPriceRange([priceRange[0], maximum]);
                }}
              />
            </label>
          </div>
        </section>

        <section className="swd-filter-section" aria-labelledby={`availability-filter-${instance}`}>
          <h3 id={`availability-filter-${instance}`}>{t?.("availability") || "Availability"}</h3>
          <label className="swd-switch" htmlFor={stockId}>
            <span>
              <strong>{t?.("in_stock_only") || "In-stock products"}</strong>
              <small>{t?.("ready_to_order") || "Ready to order now"}</small>
            </span>
            <input
              id={stockId}
              type="checkbox"
              checked={inStock}
              onChange={() => {
                const nextValue = !inStock;
                setInStock(nextValue);
                updateParam("inStock", nextValue ? "true" : "");
              }}
            />
            <i aria-hidden="true" />
          </label>
        </section>

        <section className="swd-filter-section" aria-labelledby={`rating-filter-${instance}`}>
          <h3 id={`rating-filter-${instance}`}>{t?.("ratings") || "Customer rating"}</h3>
          <div className="swd-rating-filter">
            {[5, 4, 3, 2, 1].map((rating) => (
              <button
                type="button"
                key={rating}
                className={ratingFilter === rating ? "is-active" : ""}
                onClick={() => setRatingFilter(ratingFilter === rating ? 0 : rating)}
                aria-pressed={ratingFilter === rating}
                aria-label={`${rating} ${t?.("stars_and_up") || "stars and up"}`}
              >
                <span aria-hidden="true">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <i key={star} className={star <= rating ? "fas fa-star" : "far fa-star"} />
                  ))}
                </span>
                <small>{rating === 5 ? "5" : `${rating}+`}</small>
              </button>
            ))}
          </div>
        </section>

        {hasActiveFilters && (
          <button type="button" className="swd-clear-button" onClick={clearFilters}>
            <i className="far fa-times" aria-hidden="true" />
            {t?.("clear_filters") || "Clear all filters"}
          </button>
        )}

        <div className="swd-filter-note">
          <i className="far fa-shield-check" aria-hidden="true" />
          <div>
            <strong>{t?.("shop_confidently") || "Shop confidently"}</strong>
            <span>{t?.("cod_delivery_note") || "Cash on delivery across Afghanistan"}</span>
          </div>
        </div>
      </div>
    );
  };

  const pageTitle = q
    ? `${t?.("search_results_for") || "Search results for"} “${q}”`
    : activeCategory
      ? getName(activeCategory)
      : (t?.("all_products") || "All products");

  return (
    <main className="swd-commerce swd-catalog">
      <header className="swd-page-head">
        <div className="container">
          <nav className="swd-breadcrumbs" aria-label="Breadcrumb">
            <Link href="/">{t?.("home") || "Home"}</Link>
            <i className="far fa-angle-right" aria-hidden="true" />
            <span aria-current="page">{t?.("shop") || "Shop"}</span>
          </nav>
          <div className="swd-page-head__content">
            <div>
              <span className="swd-eyebrow">{t?.("curated_marketplace") || "Sawdagar marketplace"}</span>
              <h1>{pageTitle}</h1>
              <p>{t?.("catalog_intro") || "Discover useful products from trusted sellers across Afghanistan."}</p>
            </div>
            <div className="swd-page-head__stat" aria-label={`${total} results`}>
              <strong>{total}</strong>
              <span>{t?.("products") || "products"}</span>
            </div>
          </div>
          {categories.length > 0 && (
            <div className="swd-category-chips" aria-label={t?.("popular_categories") || "Popular categories"}>
              <button type="button" className={!cat ? "is-active" : ""} onClick={() => updateParam("category", "")}>
                {t?.("all") || "All"}
              </button>
              {categories.slice(0, 7).map((category) => {
                const value = category.slug || String(category.id);
                return (
                  <button
                    type="button"
                    key={category.id}
                    className={cat === value ? "is-active" : ""}
                    onClick={() => updateParam("category", value)}
                  >
                    {getName(category)}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </header>

      <section className="swd-catalog__body" aria-labelledby="catalog-results-heading">
        <div className="container">
          <div className="swd-catalog-layout">
            <aside className="swd-catalog-sidebar" aria-label={t?.("product_filters") || "Product filters"}>
              {renderSidebar("desktop")}
            </aside>

            <div className="swd-catalog-results">
              <div className="swd-catalog-toolbar">
                <div className="swd-toolbar-summary">
                  <button
                    type="button"
                    className="swd-mobile-filter-button"
                    onClick={() => setShowMobileFilter(true)}
                    aria-expanded={showMobileFilter}
                    aria-controls="mobile-filter-drawer"
                  >
                    <i className="far fa-sliders-h" aria-hidden="true" />
                    {t?.("filters") || "Filters"}
                    {hasActiveFilters && <span aria-label={t?.("filters_active") || "Filters active"} />}
                  </button>
                  <div>
                    <h2 id="catalog-results-heading">{t?.("explore_products") || "Explore products"}</h2>
                    <p role="status" aria-live="polite">
                      {t?.("showing") || "Showing"} {filteredProducts.length} {t?.("of") || "of"} {total} {t?.("results") || "results"}
                    </p>
                  </div>
                </div>

                <div className="swd-toolbar-actions">
                  <label className="swd-sort-select">
                    <span>{t?.("sort_by") || "Sort by"}</span>
                    <select value={sort} onChange={(event) => updateParam("sort", event.target.value)}>
                      <option value="">{t?.("default_sorting") || "Recommended"}</option>
                      <option value="price_asc">{t?.("price_low_high") || "Price: low to high"}</option>
                      <option value="price_desc">{t?.("price_high_low") || "Price: high to low"}</option>
                      <option value="newest">{t?.("newest_first") || "Newest first"}</option>
                      <option value="name_asc">{t?.("name_az") || "Name: A–Z"}</option>
                    </select>
                  </label>
                  <div className="swd-view-toggle" aria-label={t?.("product_view") || "Product view"}>
                    <button
                      type="button"
                      className={view === "grid" ? "is-active" : ""}
                      onClick={() => setView("grid")}
                      aria-label={t?.("grid_view") || "Grid view"}
                      aria-pressed={view === "grid"}
                    >
                      <i className="far fa-grid-2" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className={view === "list" ? "is-active" : ""}
                      onClick={() => setView("list")}
                      aria-label={t?.("list_view") || "List view"}
                      aria-pressed={view === "list"}
                    >
                      <i className="far fa-list-ul" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>

              {loading ? (
                <CatalogSkeleton />
              ) : error ? (
                <div className="swd-state-card" role="alert">
                  <span className="swd-state-card__icon"><i className="far fa-wifi-slash" aria-hidden="true" /></span>
                  <h2>{t?.("products_unavailable") || "We couldn’t load the products"}</h2>
                  <p>{t?.("try_again_moment") || "Please check your connection and try again."}</p>
                  <button type="button" className="swd-primary-button" onClick={() => fetchProducts()}>
                    <i className="far fa-redo" aria-hidden="true" />
                    {t?.("try_again") || "Try again"}
                  </button>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="swd-state-card">
                  <span className="swd-state-card__icon"><i className="far fa-search" aria-hidden="true" /></span>
                  <h2>{t?.("no_products_found") || "No products found"}</h2>
                  <p>{t?.("try_adjusting_filters") || "Try another search or remove one of your filters."}</p>
                  {hasActiveFilters && (
                    <button type="button" className="swd-primary-button" onClick={clearFilters}>
                      {t?.("clear_filters") || "Clear all filters"}
                    </button>
                  )}
                </div>
              ) : (
                <div className={`swd-product-grid ${view === "list" ? "is-list" : ""}`}>
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} layout={view} />
                  ))}
                </div>
              )}

              {!loading && !error && (
                <Pagination
                  page={currentPage}
                  totalPages={totalPages}
                  onPageChange={(nextPage) => updateParam("page", nextPage)}
                />
              )}
            </div>
          </div>
        </div>
      </section>

      {showMobileFilter && (
        <div className="swd-filter-drawer-layer" role="presentation">
          <button
            type="button"
            className="swd-filter-backdrop"
            onClick={() => setShowMobileFilter(false)}
            aria-label={t?.("close_filters") || "Close filters"}
          />
          <aside
            id="mobile-filter-drawer"
            className="swd-filter-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={t?.("product_filters") || "Product filters"}
          >
            {renderSidebar("mobile")}
          </aside>
        </div>
      )}
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <main className="swd-commerce swd-catalog swd-catalog--loading">
        <div className="container"><CatalogSkeleton /></div>
      </main>
    }>
      <SearchContent />
    </Suspense>
  );
}
