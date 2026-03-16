'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteData } from '@/contexts/SiteDataContext';
import { formatPrice } from '@/lib/currency';

export default function Header() {
  const { user, logout } = useAuth();
  const { items: cartItems, cartCount, cartTotal, removeFromCart } = useCart();
  const { t, lang, switchLanguage } = useLanguage();
  const { categories, siteContent, getName: siteGetName } = useSiteData();
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const searchRef = useRef(null);
  const categoryRef = useRef(null);
  const debounceRef = useRef(null);

  const getName = useCallback((item) => siteGetName(item, lang), [siteGetName, lang]);

  useEffect(() => {
    // Close mobile menu + category dropdown on route change
    if (typeof window !== 'undefined' && window.jQuery) {
      try {
        const offcanvas = window.bootstrap?.Offcanvas?.getInstance(document.getElementById('offcanvasNavbar'));
        if (offcanvas) offcanvas.hide();
      } catch(e) {}
    }
    setCategoryOpen(false);
  }, [pathname]);

  // Close category dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target)) {
        setCategoryOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const hideOffcanvas = () => {
    if (typeof window === 'undefined') return;
    try {
      const el = document.getElementById('offcanvasNavbar');
      if (!el) return;
      const inst = window.bootstrap?.Offcanvas?.getInstance(el) || new window.bootstrap.Offcanvas(el);
      inst.hide();
    } catch (e) {}
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const form = e.target;
    const query = form.querySelector('input[type="text"]')?.value;
    if (query?.trim()) {
      setShowSuggestions(false);
      router.push('/search?q=' + encodeURIComponent(query.trim()));
    }
  };

  // Auto-suggestion logic
  const fetchSuggestions = useCallback(async (query) => {
    if (!query || query.length < 2) { setSuggestions([]); return; }
    try {
      const r = await fetch(`/api/products?search=${encodeURIComponent(query)}&limit=6`);
      if (r.ok) {
        const d = await r.json();
        setSuggestions(d.products || []);
      }
    } catch { setSuggestions([]); }
  }, []);

  const handleSearchInput = (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(val), 300);
    setShowSuggestions(true);
  };

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setShowSuggestions(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close suggestions on route change
  useEffect(() => { setShowSuggestions(false); setSearchQuery(''); }, [pathname]);

  const headerContent = siteContent?.header || {};
  const contactEmail = headerContent.email || 'info@sawdagar.af';
  const contactPhone = headerContent.phone || '+93 700 000 000';
  const logoUrl = (headerContent.logo || '').trim() || '/assets/img/logo/logo.png';
  const logoStyle = { maxHeight: 65, maxWidth: 240, width: 'auto', height: 'auto', objectFit: 'contain' };

  return (
    <header className="header">
      {/* Header Top */}
      <div className="header-top">
        <div className="container">
          <div className="header-top-wrapper">
            <div className="row">
              <div className="col-12 col-md-6 col-lg-6 col-xl-5">
                <div className="header-top-left">
                  <ul className="header-top-list">
                    <li>
                      <a href={`mailto:${contactEmail}`}>
                        <i className="far fa-envelopes"></i> {contactEmail}
                      </a>
                    </li>
                    <li>
                      <a href={`tel:${contactPhone}`}>
                        <i className="far fa-headset"></i> {contactPhone}
                      </a>
                    </li>
                    <li className="help">
                      <Link href="/contact">
                        <i className="far fa-comment-question"></i> Need Help?
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="col-12 col-md-6 col-lg-6 col-xl-7">
                <div className="header-top-right">
                  <ul className="header-top-list">
                    
                    <li>
                      <div className="dropdown">
                        <button type="button" className="lang-switcher-btn dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
                          <i className="far fa-globe-americas"></i> {lang === 'en' ? 'EN' : lang === 'ps' ? 'PS' : 'DR'}
                        </button>
                        <div className="dropdown-menu">
                          <button className="dropdown-item" onClick={() => switchLanguage('en')}>🇺🇸 English</button>
                          <button className="dropdown-item" onClick={() => switchLanguage('ps')}>🇦🇫 پښتو (Pashto)</button>
                          <button className="dropdown-item" onClick={() => switchLanguage('dr')}>🇦🇫 دری (Dari)</button>
                        </div>
                      </div>
                    </li>
                    <li className="social">
                      <div className="header-top-social">
                        <span>Follow Us: </span>
                        <a href="#"><i className="fab fa-facebook"></i></a>
                        <a href="#"><i className="fab fa-x-twitter"></i></a>
                        <a href="#"><i className="fab fa-instagram"></i></a>
                        <a href="#"><i className="fab fa-linkedin"></i></a>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Header Middle */}
      <div className="header-middle">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-5 col-lg-3 col-xl-3">
              <div className="header-middle-logo">
                <Link className="navbar-brand" href="/">
                  <img src={logoUrl} alt="Sawdagar" style={logoStyle} />
                </Link>
              </div>
            </div>
            <div className="d-none d-lg-block col-lg-6 col-xl-5">
              <div className="header-middle-search" ref={searchRef} style={{ position: 'relative' }}>
                <form onSubmit={handleSearch}>
                  <div className="search-content">
                    <select className="select" defaultValue="">
                      <option value="">All Category</option>
                      {Array.isArray(categories) && categories.map(cat => (
                        <option key={cat.id} value={cat.slug}>{getName(cat)}</option>
                      ))}
                    </select>
                    <input type="text" className="form-control" placeholder="Search Here..."
                      value={searchQuery} onChange={handleSearchInput}
                      onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }} />
                    <button type="submit" className="search-btn"><i className="far fa-search"></i></button>
                  </div>
                </form>
                {showSuggestions && suggestions.length > 0 && (
                  <div className="search-suggestions" style={{
                    position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.12)', borderRadius: '0 0 8px 8px',
                    zIndex: 9999, maxHeight: 400, overflowY: 'auto', border: '1px solid #eee', borderTop: 'none'
                  }}>
                    {suggestions.map(p => (
                      <Link key={p.id} href={`/products/${p.id}`} onClick={() => setShowSuggestions(false)}
                        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 15px',
                          borderBottom: '1px solid #f5f5f5', textDecoration: 'none', color: '#333',
                          transition: 'background 0.15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = '#f8f9fa'}
                        onMouseLeave={e => e.currentTarget.style.background = '#fff'}>
                        <img src={p.images?.[0]?.url || '/assets/img/product/e1.png'} alt={getName(p) || p.nameEn}
                          style={{ width: 45, height: 45, objectFit: 'contain', borderRadius: 6, background: '#f8f8f8', flexShrink: 0 }}
                          onError={e => { e.target.src = '/assets/img/product/e1.png'; }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontWeight: 600, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {getName(p) || p.nameEn}
                          </p>
                          <p style={{ margin: 0, fontSize: 12, color: '#999' }}>{p.category?.nameEn || ''}</p>
                        </div>
                        <strong style={{ color: 'var(--theme-color)', fontSize: 13, whiteSpace: 'nowrap' }}>{formatPrice(p.retailPrice)}</strong>
                      </Link>
                    ))}
                    <Link href={`/search?q=${encodeURIComponent(searchQuery)}`} onClick={() => setShowSuggestions(false)}
                      style={{ display: 'block', textAlign: 'center', padding: '10px', color: 'var(--theme-color)',
                        fontWeight: 600, fontSize: 13, textDecoration: 'none', borderTop: '1px solid #eee' }}>
                      View all results for &quot;{searchQuery}&quot;
                    </Link>
                  </div>
                )}
              </div>
            </div>
            <div className="col-7 col-lg-3 col-xl-4">
              <div className="header-middle-right">
                <ul className="header-middle-list">
                  <li>
                    {user ? (
                      <Link href="/dashboard" className="list-item">
                        <div className="list-item-icon">
                          <i className="far fa-user-circle"></i>
                        </div>
                        <div className="list-item-info">
                          <h6>{user.fullName?.split(' ')[0]}</h6>
                          <h5>Account</h5>
                        </div>
                      </Link>
                    ) : (
                      <Link href="/login" className="list-item">
                        <div className="list-item-icon">
                          <i className="far fa-user-circle"></i>
                        </div>
                        <div className="list-item-info">
                          <h6>Sign In</h6>
                          <h5>Account</h5>
                        </div>
                      </Link>
                    )}
                  </li>
                  <li className="dropdown-cart">
                    <Link href="/cart" className="shop-cart list-item">
                      <div className="list-item-icon">
                        <i className="far fa-shopping-bag"></i>
                        <span>{cartCount || 0}</span>
                      </div>
                      <div className="list-item-info">
                        <h6>{formatPrice(cartTotal || 0)}</h6>
                        <h5>My Cart</h5>
                      </div>
                    </Link>
                    <div className="dropdown-cart-menu">
                      <div className="dropdown-cart-header">
                        <span>{cartCount || 0} Items</span>
                        <Link href="/cart">View Cart</Link>
                      </div>
                      <ul className="dropdown-cart-list">
                        {cartItems.slice(0, 4).map((item) => {
                          const p = item.product || item;
                          const imgUrl = p.images?.[0]?.url || item.image || '/assets/img/product/e1.png';
                          const itemName = getName(p) || p.nameEn || 'Product';
                          const itemPrice = p.retailPrice || item.retailPrice || 0;
                          return (
                            <li key={item.id || item.productId}>
                              <div className="dropdown-cart-item">
                                <div className="cart-img">
                                  <Link href={`/products/${item.productId || p.id}`}><img src={imgUrl} alt={itemName} /></Link>
                                </div>
                                <div className="cart-info">
                                  <h4><Link href={`/products/${item.productId || p.id}`}>{itemName}</Link></h4>
                                  <p className="cart-qty">{item.quantity}x - <span className="cart-amount">{formatPrice(itemPrice)}</span></p>
                                </div>
                                <button className="cart-remove" title="Remove" onClick={(e) => { e.preventDefault(); removeFromCart(item.id || item.productId); }}>
                                  <i className="far fa-times-circle"></i>
                                </button>
                              </div>
                            </li>
                          );
                        })}
                        {cartItems.length === 0 && (
                          <li><div className="dropdown-cart-item" style={{justifyContent:'center',padding:'15px 0'}}><p style={{margin:0,color:'#999'}}>Your cart is empty</p></div></li>
                        )}
                      </ul>
                      <div className="dropdown-cart-bottom">
                        <div className="dropdown-cart-total">
                          <span>Total</span>
                          <span className="total-amount">{formatPrice(cartTotal || 0)}</span>
                        </div>
                        <Link href="/checkout" className="theme-btn">Checkout</Link>
                      </div>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navbar */}
      <div className="main-navigation">
        <nav className="navbar light navbar-expand-lg">
          <div className="container position-relative">
            <Link className="navbar-brand" href="/">
              <img src={logoUrl} className="logo-scrolled" alt="Sawdagar" style={logoStyle} />
            </Link>
            <div className="category-all" ref={categoryRef}>
              <button className="category-btn" type="button" onClick={() => setCategoryOpen(open => !open)}>
                <i className="fas fa-list-ul"></i><span>All Categories</span>
              </button>
              <ul className={categoryOpen ? 'main-category show' : 'main-category'}>
                {categories.slice(0, 12).map(cat => (
                  <li key={cat.id}>
                    <Link href={`/categories/${cat.slug}`} onClick={() => setCategoryOpen(false)}>
                      <img src={`/assets/img/icon/${getCategoryIcon(cat.slug)}`} alt="" />
                      <span>{getName(cat)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mobile-menu-right">
              <div className="mobile-menu-btn">
                <Link href="/cart" className="nav-right-link">
                  <i className="far fa-shopping-bag"></i><span>{cartCount || 0}</span>
                </Link>
              </div>
              <button className="navbar-toggler" type="button" data-bs-toggle="offcanvas"
                data-bs-target="#offcanvasNavbar" aria-controls="offcanvasNavbar"
                aria-label="Toggle navigation">
                <span></span>
                <span></span>
                <span></span>
              </button>
            </div>
            <div className="offcanvas offcanvas-start" tabIndex="-1" id="offcanvasNavbar"
              aria-labelledby="offcanvasNavbarLabel">
              <div className="offcanvas-header">
                <Link href="/" className="offcanvas-brand" id="offcanvasNavbarLabel">
                  <img src={logoUrl} alt="Sawdagar" style={logoStyle} />
                </Link>
                <button type="button" className="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
              </div>
              <div className="offcanvas-body">
                <ul className="navbar-nav justify-content-end flex-grow-1">
                  <li className="nav-item">
                    <Link className={`nav-link${pathname === '/' ? ' active' : ''}`} href="/" onClick={hideOffcanvas}>Home</Link>
                  </li>
                  <li className="nav-item">
                    <Link className={`nav-link${pathname === '/about' ? ' active' : ''}`} href="/about" onClick={hideOffcanvas}>About</Link>
                  </li>
                  <li className="nav-item">
                    <Link className={`nav-link${pathname === '/contact' ? ' active' : ''}`} href="/contact" onClick={hideOffcanvas}>Contact</Link>
                  </li>
                  <li className="nav-item dropdown">
                    <a className={`nav-link dropdown-toggle${pathname.startsWith('/search') || pathname.startsWith('/categories') || pathname.startsWith('/cart') || pathname.startsWith('/checkout') ? ' active' : ''}`} href="#" data-bs-toggle="dropdown" aria-expanded="false">Shop</a>
                    <ul className="dropdown-menu fade-down">
                      <li><Link className="dropdown-item" href="/search" onClick={hideOffcanvas}>All Products</Link></li>
                      {categories.slice(0, 8).map(cat => (
                        <li key={cat.id}>
                          <Link className="dropdown-item" href={`/categories/${cat.slug}`} onClick={hideOffcanvas}>{getName(cat)}</Link>
                        </li>
                      ))}
                      <li><Link className="dropdown-item" href="/cart" onClick={hideOffcanvas}>Shop Cart</Link></li>
                      <li><Link className="dropdown-item" href="/checkout" onClick={hideOffcanvas}>Checkout</Link></li>
                    </ul>
                  </li>
                  <li className="nav-item dropdown">
                    <a className={`nav-link dropdown-toggle${pathname.startsWith('/dashboard') || pathname.startsWith('/profile') || pathname.startsWith('/orders') || pathname.startsWith('/login') ? ' active' : ''}`} href="#" data-bs-toggle="dropdown" aria-expanded="false">Account</a>
                    <ul className="dropdown-menu fade-down">
                      {user ? (
                        <>
                          <li><Link className="dropdown-item" href="/dashboard" onClick={hideOffcanvas}>Dashboard</Link></li>
                          <li><Link className="dropdown-item" href="/profile" onClick={hideOffcanvas}>My Profile</Link></li>
                          <li><Link className="dropdown-item" href="/orders" onClick={hideOffcanvas}>My Orders</Link></li>
                          <li><button className="dropdown-item" onClick={() => { hideOffcanvas(); logout(); }}>Logout</button></li>
                        </>
                      ) : (
                        <>
                          <li><Link className="dropdown-item" href="/login" onClick={hideOffcanvas}>Login</Link></li>
                          <li><Link className="dropdown-item" href="/register" onClick={hideOffcanvas}>Register</Link></li>
                        </>
                      )}
                    </ul>
                  </li>
                </ul>
                <div className="nav-right">
                  <Link className="nav-right-link" href="/search">
                    <i className="fal fa-star"></i> Recently Viewed
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
}

function getCategoryIcon(slug) {
  const iconMap = {
    'fashion': 'fashion.svg',
    'electronics': 'electronics.svg',
    'grocery': 'grocery.svg',
    'furniture': 'furniture.svg',
    'music': 'music.svg',
    'toys': 'toy.svg',
    'gifts': 'gift.svg',
    'babies': 'baby-mom.svg',
    'beauty': 'beauty.svg',
    'sports': 'sports.svg',
    'garden': 'garden.svg',
    'automotive': 'automotive.svg',
  };
  for (const [key, icon] of Object.entries(iconMap)) {
    if (slug && slug.includes(key)) return icon;
  }
  return 'new.svg';
}
