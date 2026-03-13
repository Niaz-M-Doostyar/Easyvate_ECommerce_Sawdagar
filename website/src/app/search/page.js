"use client";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import Pagination from "@/components/Pagination";
import { useLanguage } from "@/contexts/LanguageContext";
import { CURRENCY_SYMBOL } from "@/lib/currency";

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t, lang } = useLanguage();
  const q = searchParams.get("q") || "";
  const cat = searchParams.get("category") || "";
  const sort = searchParams.get("sort") || "";
  const currentPage = parseInt(searchParams.get("page") || "1");

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("grid");
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [inStock, setInStock] = useState(false);
  const [ratingFilter, setRatingFilter] = useState(0);
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  const getName = (item) => {
    if (!item) return '';
    if (lang === 'ps' && item.namePs) return item.namePs;
    if (lang === 'dr' && item.nameDr) return item.nameDr;
    return item.nameEn || '';
  };

  useEffect(() => { fetch("/api/categories").then(r => r.json()).then(d => setCategories(d.categories || d || [])).catch(() => {}); }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: currentPage, limit: 12 });
    if (q) params.set("search", q);
    if (cat) params.set("category", cat);
    if (sort) params.set("sort", sort);
    if (priceRange[0] > 0) params.set("minPrice", priceRange[0]);
    if (priceRange[1] < 100000) params.set("maxPrice", priceRange[1]);
    if (inStock) params.set("inStock", "true");
    try {
      const r = await fetch(`/api/products?${params}`);
      const d = await r.json();
      setProducts(d.products || []);
      setTotalPages(d.totalPages || 1);
      setTotal(d.total || 0);
    } catch { setProducts([]); }
    setLoading(false);
  }, [q, cat, sort, currentPage, priceRange, inStock]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const updateParam = (key, value) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value); else params.delete(key);
    if (key !== "page") params.delete("page");
    router.push(`/search?${params.toString()}`);
  };

  const filteredProducts = ratingFilter > 0
    ? products.filter(p => (p.rating || 4) >= ratingFilter)
    : products;

  const hasActiveFilters = cat || priceRange[0] > 0 || priceRange[1] < 100000 || inStock || ratingFilter > 0;

  const sidebarContent = (
    <div className="shop-sidebar">
      {/* Search Widget */}
      <div className="shop-widget">
        <div className="shop-search-form">
          <h4 className="shop-widget-title">{t?.('search') || 'Search'}</h4>
          <form onSubmit={(e) => { e.preventDefault(); const val = e.target.elements.q.value; updateParam('q', val); }} action="#">
            <div className="form-group">
              <input type="text" name="q" className="form-control" placeholder={t?.('search_products') || 'Search...'} defaultValue={q} />
              <button type="submit"><i className="far fa-search"></i></button>
            </div>
          </form>
        </div>
      </div>

      {/* Category Widget */}
      <div className="shop-widget">
        <h4 className="shop-widget-title">{t?.('categories') || 'Categories'}</h4>
        <ul className="shop-category-list">
          <li className={!cat ? 'active' : ''}>
            <a href="#" onClick={(e) => { e.preventDefault(); updateParam("category", ""); }}>
              {t?.('all_categories') || 'All Categories'}
            </a>
          </li>
          {categories.map(c => (
            <li key={c.id} className={cat === (c.slug || String(c.id)) ? 'active' : ''}>
              <a href="#" onClick={(e) => { e.preventDefault(); updateParam("category", c.slug || c.id); }}>
                {getName(c)}<span>({c._count?.products || 0})</span>
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* Price Range Widget */}
      <div className="shop-widget">
        <h4 className="shop-widget-title">{t?.('price_range') || 'Price Range'}</h4>
        <div className="price-range-box">
          <div className="mb-3">
            <input type="range" min={0} max={100000} step={500} value={priceRange[1]}
              onChange={e => setPriceRange([priceRange[0], +e.target.value])}
              className="form-range" style={{ width: '100%' }} />
          </div>
          <div className="d-flex gap-2 align-items-center">
            <div className="form-group mb-0" style={{ flex: 1 }}>
              <input type="number" value={priceRange[0]}
                onChange={e => setPriceRange([+e.target.value, priceRange[1]])}
                className="form-control" placeholder={`${CURRENCY_SYMBOL} Min`} />
            </div>
            <span>—</span>
            <div className="form-group mb-0" style={{ flex: 1 }}>
              <input type="number" value={priceRange[1]}
                onChange={e => setPriceRange([priceRange[0], +e.target.value])}
                className="form-control" placeholder={`${CURRENCY_SYMBOL} Max`} />
            </div>
          </div>
        </div>
      </div>

      {/* Sales / Stock Widget */}
      <div className="shop-widget">
        <h4 className="shop-widget-title">{t?.('availability') || 'Availability'}</h4>
        <ul className="shop-checkbox-list">
          <li>
            <div className="form-check">
              <input className="form-check-input" type="checkbox" id="inStockCheck"
                checked={inStock} onChange={() => setInStock(!inStock)} />
              <label className="form-check-label" htmlFor="inStockCheck">
                {t?.('in_stock_only') || 'In Stock'}
              </label>
            </div>
          </li>
        </ul>
      </div>

      {/* Ratings Widget */}
      <div className="shop-widget">
        <h4 className="shop-widget-title">{t?.('ratings') || 'Ratings'}</h4>
        <ul className="shop-checkbox-list rating">
          {[5, 4, 3, 2, 1].map(r => (
            <li key={r}>
              <div className="form-check">
                <input className="form-check-input" type="checkbox" id={`rate${r}`}
                  checked={ratingFilter === r}
                  onChange={() => setRatingFilter(ratingFilter === r ? 0 : r)} />
                <label className="form-check-label" htmlFor={`rate${r}`}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <i key={i} className={i <= r ? 'fas fa-star' : 'fal fa-star'}></i>
                  ))}
                </label>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <div className="shop-widget">
          <button onClick={() => { updateParam("category", ""); setPriceRange([0, 100000]); setInStock(false); setRatingFilter(0); }}
            className="theme-btn" style={{ width: '100%' }}>
            <i className="far fa-times me-1"></i> {t?.('clear_filters') || 'Clear All Filters'}
          </button>
        </div>
      )}

      {/* Sidebar Banner */}
      <div className="shop-widget-banner mt-30 mb-50">
        <div className="banner-img" style={{ backgroundImage: 'url(/assets/img/banner/shop-banner.jpg)' }}></div>
        <div className="banner-content">
          <h6>Get <span>35% Off</span></h6>
          <h4>New Collection</h4>
          <Link href="/search" className="theme-btn">Shop Now</Link>
        </div>
      </div>
    </div>
  );

  return (
    <main className="main">
      <div className="site-breadcrumb">
        <div className="site-breadcrumb-bg" style={{ background: 'url(/assets/img/breadcrumb/01.jpg)' }}></div>
        <div className="container">
          <div className="site-breadcrumb-wrap">
            <h4 className="breadcrumb-title">{q ? `${t?.('search') || 'Search'}: "${q}"` : (t?.('all_products') || 'All Products')}</h4>
            <ul className="breadcrumb-menu">
              <li><Link href="/"><i className="far fa-home"></i> {t?.('home') || 'Home'}</Link></li>
              <li className="active">{t?.('shop') || 'Shop'}</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="shop-area bg-2 py-100">
        <div className="container">
          {/* Mobile filter toggle */}
          <div className="d-lg-none mb-3">
            <button className="theme-btn w-100" onClick={() => setShowMobileFilter(!showMobileFilter)}>
              <i className="far fa-sliders-h me-2"></i> {showMobileFilter ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>

          <div className="row">
            {/* Sidebar - Desktop */}
            <div className="col-lg-3 d-none d-lg-block">
              {sidebarContent}
            </div>

            {/* Sidebar - Mobile (collapsible) */}
            {showMobileFilter && (
              <div className="col-12 d-lg-none mb-4">
                {sidebarContent}
              </div>
            )}

            {/* Products */}
            <div className="col-lg-9">
              <div className="col-md-12">
                <div className="shop-sort">
                  <div className="shop-sort-box">
                    <div className="shop-sorty-label">{t?.('sort_by') || 'Sort By'}:</div>
                    <select className="form-select" value={sort} onChange={e => updateParam("sort", e.target.value)}>
                      <option value="">{t?.('default_sorting') || 'Default Sorting'}</option>
                      <option value="price_asc">{t?.('price_low_high') || 'Price: Low to High'}</option>
                      <option value="price_desc">{t?.('price_high_low') || 'Price: High to Low'}</option>
                      <option value="newest">{t?.('newest_first') || 'Newest First'}</option>
                      <option value="name_asc">{t?.('name_az') || 'Name: A-Z'}</option>
                    </select>
                    <div className="shop-sort-show">{t?.('showing') || 'Showing'} {filteredProducts.length} of {total} {t?.('results') || 'Results'}</div>
                  </div>
                  <div className="shop-sort-gl">
                    <button onClick={() => setView("grid")} className={`shop-sort-grid ${view === 'grid' ? 'active' : ''}`}><i className="far fa-grid-round-2"></i></button>
                    <button onClick={() => setView("list")} className={`shop-sort-list ${view === 'list' ? 'active' : ''}`}><i className="far fa-list-ul"></i></button>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-5">
                  <i className="far fa-search" style={{ fontSize: '48px', color: '#ddd', marginBottom: '15px', display: 'block' }}></i>
                  <h4>{t?.('no_products_found') || 'No Products Found'}</h4>
                  <p>{t?.('try_adjusting_filters') || 'Try adjusting your search or filters'}</p>
                </div>
              ) : (
                <div className={`shop-item-wrap ${view === 'grid' ? 'item-4' : ''}`}>
                  <div className="row g-4">
                    {filteredProducts.map((p) => (
                      <div key={p.id} className={view === 'grid' ? 'col-md-6 col-lg-4' : 'col-12'}>
                        <ProductCard product={p} layout={view} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Pagination page={currentPage} totalPages={totalPages} onPageChange={p => updateParam("page", p)} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="text-center py-100">
        <div className="spinner-border" role="status"><span className="visually-hidden">Loading...</span></div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
