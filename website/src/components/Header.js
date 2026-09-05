'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteData } from '@/contexts/SiteDataContext';
import { formatPrice } from '@/lib/currency';

const NAV_LINKS = [
  { href: '/', key: 'home', fallback: 'Home', exact: true },
  { href: '/about', key: 'about', fallback: 'About' },
  { href: '/contact', key: 'contact', fallback: 'Contact' },
  { href: '/search', key: 'products', fallback: 'Shop' },
];

function MenuIcon({ name, className = '' }) {
  const paths = {
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></>,
    user: <><circle cx="12" cy="8" r="3.5" /><path d="M5.5 20a6.5 6.5 0 0 1 13 0" /></>,
    bag: <><path d="M5 8.5h14l-1 12H6l-1-12Z" /><path d="M9 9V6.5a3 3 0 0 1 6 0V9" /></>,
    grid: <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></>,
    chevron: <path d="m8 10 4 4 4-4" />,
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
    trash: <><path d="M5 7h14M9 7V4h6v3m2 0-.8 13H7.8L7 7" /><path d="M10 11v5m4-5v5" /></>,
    store: <><path d="M4 9h16l-1.5-5h-13L4 9Z" /><path d="M5.5 9v11h13V9M9 20v-6h6v6" /><path d="M4 9a3 3 0 0 0 5 2 3 3 0 0 0 6 0 3 3 0 0 0 5-2" /></>,
  };

  return (
    <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

export default function Header() {
  const { user, logout } = useAuth();
  const { items: cartItems, cartCount, cartTotal, removeFromCart } = useCart();
  const { t, lang } = useLanguage();
  const { categories, siteContent, getName: siteGetName } = useSiteData();
  const router = useRouter();
  const pathname = usePathname();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [isCompact, setIsCompact] = useState(false);

  const searchRef = useRef(null);
  const cartRef = useRef(null);
  const accountRef = useRef(null);
  const categoryRef = useRef(null);
  const mobileMenuButtonRef = useRef(null);
  const debounceRef = useRef(null);
  const suggestionRequestRef = useRef(null);

  const getName = useCallback((item) => siteGetName(item, lang), [siteGetName, lang]);
  const label = useCallback((key, fallback) => {
    const translated = t(key);
    return translated && translated !== key ? translated : fallback;
  }, [t]);

  const headerContent = siteContent?.header || {};
  const contactEmail = headerContent.email || 'info@sawdagar.com';
  const contactPhone = headerContent.phone || '+93 700 000 000';
  const socialLinks = headerContent.socialLinks || {};
  const customLogo = (headerContent.logo || '').trim();
  const logoUrl = customLogo || '/assets/img/logo/sawdagar.png';

  const closeMenus = useCallback(() => {
    setCartOpen(false);
    setAccountOpen(false);
    setCategoryOpen(false);
    setShowSuggestions(false);
    setActiveSuggestion(-1);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setMobileCategoriesOpen(false);
    setSearchQuery('');
    closeMenus();
  }, [pathname, closeMenus]);

  useEffect(() => {
    const onScroll = () => setIsCompact(window.scrollY > 150);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const onPointerDown = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
        setActiveSuggestion(-1);
      }
      if (cartRef.current && !cartRef.current.contains(event.target)) setCartOpen(false);
      if (accountRef.current && !accountRef.current.contains(event.target)) setAccountOpen(false);
      if (categoryRef.current && !categoryRef.current.contains(event.target)) setCategoryOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      const hadMobileMenu = mobileOpen;
      closeMenus();
      setMobileOpen(false);
      setMobileCategoriesOpen(false);
      if (hadMobileMenu) mobileMenuButtonRef.current?.focus();
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [closeMenus, mobileOpen]);

  useEffect(() => {
    if (!mobileOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [mobileOpen]);

  useEffect(() => () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    suggestionRequestRef.current?.abort();
  }, []);

  const getWhatsAppHref = (phone) => {
    let digits = (phone || '').toString().replace(/\D/g, '');
    if (!digits) return '#';
    if (digits.startsWith('00')) digits = digits.slice(2);
    if (digits.startsWith('0')) digits = `93${digits.slice(1)}`;
    if (digits.length === 9 && digits.startsWith('7')) digits = `93${digits}`;
    return `https://wa.me/${digits}`;
  };

  const fetchSuggestions = useCallback(async (query, category = '') => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setActiveSuggestion(-1);
      return;
    }

    suggestionRequestRef.current?.abort();
    const controller = new AbortController();
    suggestionRequestRef.current = controller;
    const params = new URLSearchParams({ search: query.trim(), limit: '6' });
    if (category) params.set('category', category);

    try {
      const response = await fetch(`/api/products?${params.toString()}`, {
        cache: 'no-store',
        signal: controller.signal,
      });
      if (!response.ok) throw new Error('Suggestion request failed');
      const data = await response.json();
      setSuggestions(Array.isArray(data.products) ? data.products : []);
      setActiveSuggestion(-1);
    } catch (error) {
      if (error.name !== 'AbortError') setSuggestions([]);
    }
  }, []);

  const submitSearch = (query = searchQuery, category = selectedCategory) => {
    const cleanQuery = query.trim();
    const params = new URLSearchParams();
    if (cleanQuery) params.set('q', cleanQuery);
    if (category) params.set('category', category);
    if (!params.toString()) return;
    setShowSuggestions(false);
    setMobileOpen(false);
    router.push(`/search?${params.toString()}`);
  };

  const handleSearch = (event) => {
    event.preventDefault();
    submitSearch();
  };

  const handleSearchInput = (event) => {
    const value = event.target.value;
    setSearchQuery(value);
    setActiveSuggestion(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    setShowSuggestions(true);
    debounceRef.current = setTimeout(() => fetchSuggestions(value, selectedCategory), 260);
  };

  const handleCategoryChange = (event) => {
    const value = event.target.value;
    setSelectedCategory(value);
    if (searchQuery.trim().length >= 2) fetchSuggestions(searchQuery, value);
  };

  const handleSearchKeyDown = (event) => {
    if (!showSuggestions || suggestions.length === 0) {
      if (event.key === 'Escape') setShowSuggestions(false);
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveSuggestion((current) => (current + 1) % suggestions.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveSuggestion((current) => (current <= 0 ? suggestions.length - 1 : current - 1));
    } else if (event.key === 'Enter' && activeSuggestion >= 0) {
      event.preventDefault();
      router.push(`/products/${suggestions[activeSuggestion].id}`);
      setShowSuggestions(false);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setShowSuggestions(false);
      setActiveSuggestion(-1);
    }
  };

  const isNavActive = (item) => {
    if (item.exact) return pathname === item.href;
    if (item.href === '/search') return pathname.startsWith('/search') || pathname.startsWith('/products');
    return pathname.startsWith(item.href);
  };

  const cartBadge = cartCount > 99 ? '99+' : (cartCount || 0);

  return (
    <header className={`sd-header${isCompact ? ' sd-header--compact' : ''}`}>
      <div className="sd-header__utility">
        <div className="container sd-header__utility-inner">
          <div className="sd-header__contact">
            <a href={`mailto:${contactEmail}`} className="sd-ltr"><i className="far fa-envelope" aria-hidden="true" /> {contactEmail}</a>
            <a href={getWhatsAppHref(contactPhone)} target="_blank" rel="noopener noreferrer" className="sd-ltr"><i className="fas fa-headset" aria-hidden="true" /> {contactPhone}</a>
            <Link href="/contact"><i className="far fa-question-circle" aria-hidden="true" /> {label('need_help', 'Need Help?')}</Link>
          </div>
          <div className="sd-header__utility-actions">
            <span>{label('follow_us', 'Follow Us:')}</span>
            {[
              ['facebook', 'fab fa-facebook-f'],
              ['twitter', 'fab fa-x-twitter'],
              ['instagram', 'fab fa-instagram'],
              ['linkedin', 'fab fa-linkedin-in'],
            ].map(([network, icon]) => (
              <a key={network} href={socialLinks[network] || '#'} target={socialLinks[network] && socialLinks[network] !== '#' ? '_blank' : undefined} rel={socialLinks[network] && socialLinks[network] !== '#' ? 'noopener noreferrer' : undefined} aria-label={network}>
                <i className={icon} aria-hidden="true" />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="sd-header__main">
        <div className="container sd-header__main-inner">
          <button
            ref={mobileMenuButtonRef}
            type="button"
            className="sd-header__mobile-menu-button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation menu"
            aria-controls="sd-mobile-menu"
            aria-expanded={mobileOpen}
          >
            <MenuIcon name="menu" />
          </button>

          <Link className="sd-header__logo" href="/" aria-label="Sawdagar home">
            <img
              src={logoUrl}
              alt="Sawdagar"
              className={!customLogo ? 'sd-header__logo-image sd-header__logo-image--default' : 'sd-header__logo-image'}
              fetchPriority="high"
            />
          </Link>

          <div className="sd-header__search" ref={searchRef}>
            <form onSubmit={handleSearch} role="search" className="sd-search-form">
              <label className="sd-sr-only" htmlFor="sd-desktop-search">{label('search', 'Search products')}</label>
              <select
                className="sd-search-form__category"
                value={selectedCategory}
                onChange={handleCategoryChange}
                aria-label={label('categories', 'Choose a category')}
              >
                <option value="">{label('all', 'All Category')}</option>
                {Array.isArray(categories) && categories.map((category) => (
                  <option key={category.id} value={category.slug || category.id}>{getName(category)}</option>
                ))}
              </select>
              <span className="sd-search-form__divider" aria-hidden="true" />
              <input
                id="sd-desktop-search"
                type="search"
                value={searchQuery}
                onChange={handleSearchInput}
                onKeyDown={handleSearchKeyDown}
                onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                placeholder={label('search_placeholder', 'Search here...')}
                autoComplete="off"
                role="combobox"
                aria-autocomplete="list"
                aria-controls="sd-search-suggestions"
                aria-expanded={showSuggestions && suggestions.length > 0}
                aria-activedescendant={activeSuggestion >= 0 ? `sd-suggestion-${suggestions[activeSuggestion]?.id}` : undefined}
              />
              <button type="submit" className="sd-search-form__submit" aria-label={label('search', 'Search')}>
                <MenuIcon name="search" />
              </button>
            </form>

            {showSuggestions && suggestions.length > 0 && (
              <div id="sd-search-suggestions" className="sd-search-suggestions" role="listbox" aria-label="Product suggestions">
                <p className="sd-search-suggestions__eyebrow">{label('products', 'Products')}</p>
                {suggestions.map((product, index) => {
                  const productName = getName(product) || product.nameEn || 'Product';
                  return (
                    <Link
                      id={`sd-suggestion-${product.id}`}
                      key={product.id}
                      href={`/products/${product.id}`}
                      role="option"
                      aria-selected={activeSuggestion === index}
                      className={`sd-search-suggestion${activeSuggestion === index ? ' is-active' : ''}`}
                      onMouseEnter={() => setActiveSuggestion(index)}
                      onClick={() => setShowSuggestions(false)}
                    >
                      <span className="sd-search-suggestion__image">
                        <img
                          src={product.images?.[0]?.url || '/assets/img/product/e1.png'}
                          alt=""
                          onError={(event) => { event.currentTarget.src = '/assets/img/product/e1.png'; }}
                        />
                      </span>
                      <span className="sd-search-suggestion__copy">
                        <strong>{productName}</strong>
                        <small>{getName(product.category) || product.category?.nameEn || ''}</small>
                      </span>
                      <span className="sd-search-suggestion__price">{formatPrice(product.retailPrice || 0)}</span>
                    </Link>
                  );
                })}
                <button type="button" className="sd-search-suggestions__all" onClick={() => submitSearch()}>
                  <span>{label('view_all', 'View all results')}</span>
                  <MenuIcon name="arrow" />
                </button>
              </div>
            )}
          </div>

          <div className="sd-header__tools">
            <div className="sd-header__tool-wrap sd-header__account" ref={accountRef}>
              <button
                type="button"
                className="sd-header__tool"
                onClick={() => { setAccountOpen((open) => !open); setCartOpen(false); }}
                aria-haspopup="menu"
                aria-expanded={accountOpen}
                aria-controls="sd-account-menu"
              >
                <span className="sd-header__tool-icon"><MenuIcon name="user" /></span>
                <span className="sd-header__tool-copy">
                  <small>{user ? label('welcome', 'Welcome') : label('sign_in', 'Sign in')}</small>
                  <strong>{user?.fullName?.split(' ')[0] || label('profile', 'Account')}</strong>
                </span>
                <MenuIcon name="chevron" className="sd-header__tool-chevron" />
              </button>
              <div id="sd-account-menu" className="sd-header-menu sd-header-menu--account" role="menu" hidden={!accountOpen}>
                {user ? (
                  <>
                    <div className="sd-account-menu__user">
                      <span>{getInitials(user.fullName)}</span>
                      <div><strong>{user.fullName}</strong><small className="sd-ltr">{user.email}</small></div>
                    </div>
                    <Link href="/dashboard" role="menuitem">{label('dashboard', 'Dashboard')}</Link>
                    <Link href="/profile" role="menuitem">{label('profile', 'My profile')}</Link>
                    <Link href="/orders" role="menuitem">{label('orders', 'My orders')}</Link>
                    {user.role === 'supplier' && <Link href="/supplier" role="menuitem">{label('supplier_panel', 'Supplier panel')}</Link>}
                    <button type="button" role="menuitem" onClick={() => logout()}>{label('logout', 'Log out')}</button>
                  </>
                ) : (
                  <>
                    <p className="sd-header-menu__intro">Sign in to view orders, manage your profile and check out faster.</p>
                    <Link href="/login" className="sd-header-menu__primary" role="menuitem">{label('sign_in', 'Sign in')}</Link>
                    <Link href="/register" role="menuitem">{label('register', 'Create account')}</Link>
                  </>
                )}
              </div>
            </div>

            <div className="sd-header__tool-wrap sd-header__cart" ref={cartRef}>
              <button
                type="button"
                className="sd-header__tool"
                onClick={() => { setCartOpen((open) => !open); setAccountOpen(false); }}
                aria-haspopup="dialog"
                aria-expanded={cartOpen}
                aria-controls="sd-cart-menu"
              >
                <span className="sd-header__tool-icon">
                  <MenuIcon name="bag" />
                  <span className="sd-header__badge" aria-label={`${cartCount || 0} items in cart`}>{cartBadge}</span>
                </span>
                <span className="sd-header__tool-copy">
                  <small>{label('cart', 'Your cart')}</small>
                  <strong>{formatPrice(cartTotal || 0)}</strong>
                </span>
                <MenuIcon name="chevron" className="sd-header__tool-chevron" />
              </button>

              <div id="sd-cart-menu" className="sd-header-menu sd-cart-menu" role="dialog" aria-label="Shopping cart preview" hidden={!cartOpen}>
                <div className="sd-cart-menu__header">
                  <div><strong>{label('cart', 'Your cart')}</strong><span>{cartCount || 0} {label('items', 'items')}</span></div>
                  <Link href="/cart">{label('view', 'View cart')}</Link>
                </div>
                {cartItems.length > 0 ? (
                  <ul className="sd-cart-menu__items">
                    {cartItems.slice(0, 4).map((item) => {
                      const product = item.product || item;
                      const productId = item.productId || product.id;
                      const imageUrl = product.images?.[0]?.url || item.image || '/assets/img/product/e1.png';
                      const itemName = getName(product) || product.nameEn || item.nameEn || 'Product';
                      const itemPrice = product.retailPrice || item.retailPrice || 0;
                      return (
                        <li key={item.id || productId}>
                          <Link href={`/products/${productId}`} className="sd-cart-menu__product-image">
                            <img src={imageUrl} alt="" onError={(event) => { event.currentTarget.src = '/assets/img/product/e1.png'; }} />
                          </Link>
                          <div className="sd-cart-menu__product-copy">
                            <Link href={`/products/${productId}`}>{itemName}</Link>
                            <span>{item.quantity || 1} × {formatPrice(itemPrice)}</span>
                          </div>
                          <button
                            type="button"
                            className="sd-cart-menu__remove"
                            onClick={() => removeFromCart(item.id || productId)}
                            aria-label={`${label('remove_from_cart', 'Remove')} ${itemName}`}
                          >
                            <MenuIcon name="trash" />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="sd-cart-menu__empty">
                    <span><MenuIcon name="bag" /></span>
                    <strong>{label('cart_empty', 'Your cart is empty')}</strong>
                    <p>{label('cart_empty_desc', 'Explore the shop and add something you love.')}</p>
                  </div>
                )}
                <div className="sd-cart-menu__footer">
                  <div><span>{label('total', 'Total')}</span><strong>{formatPrice(cartTotal || 0)}</strong></div>
                  <Link href={cartItems.length > 0 ? '/checkout' : '/search'} className="sd-cart-menu__checkout">
                    {cartItems.length > 0 ? label('checkout', 'Checkout') : label('start_shopping', 'Start shopping')}
                    <MenuIcon name="arrow" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="sd-header__nav">
        <div className="container sd-header__nav-inner">
          <div className="f2-all-categories" ref={categoryRef}>
            <button type="button" onClick={() => setCategoryOpen((open) => !open)} aria-expanded={categoryOpen} aria-controls="sd-category-menu">
              <MenuIcon name="grid" /><span>{label('categories', 'All Categories')}</span><MenuIcon name="chevron" />
            </button>
            <div id="sd-category-menu" className="f2-all-categories__menu" hidden={!categoryOpen}>
              {categories.slice(0, 13).map((category) => (
                <Link key={category.id} href={`/categories/${category.slug}`} onClick={() => setCategoryOpen(false)}>
                  <img src={`/assets/img/icon/${getCategoryIcon(category.slug)}`} alt="" aria-hidden="true" />
                  <span>{getName(category)}</span>
                  <small>{category._count?.products ?? ''}</small>
                </Link>
              ))}
            </div>
          </div>
          <nav className="f2-primary-nav" aria-label="Primary navigation">
            <Link href="/" className={pathname === '/' ? 'is-active' : ''}>Home</Link>
            <Link href="/about" className={pathname.startsWith('/about') ? 'is-active' : ''}>About</Link>
            <Link href="/contact" className={pathname.startsWith('/contact') ? 'is-active' : ''}>Contact</Link>
            <details className="f2-nav-dropdown">
              <summary className={pathname.startsWith('/search') || pathname.startsWith('/categories') || pathname.startsWith('/cart') || pathname.startsWith('/checkout') ? 'is-active' : ''}>Shop <MenuIcon name="chevron" /></summary>
              <div>
                <Link href="/search">All Products</Link>
                {categories.slice(0, 8).map((category) => <Link key={category.id} href={`/categories/${category.slug}`}>{getName(category)}</Link>)}
                <Link href="/cart">Shop Cart</Link>
                <Link href="/checkout">Checkout</Link>
              </div>
            </details>
            <details className="f2-nav-dropdown">
              <summary className={pathname.startsWith('/dashboard') || pathname.startsWith('/profile') || pathname.startsWith('/orders') || pathname.startsWith('/login') ? 'is-active' : ''}>Account <MenuIcon name="chevron" /></summary>
              <div>
                {user ? (
                  <>
                    <Link href="/dashboard">Dashboard</Link>
                    <Link href="/profile">My Profile</Link>
                    <Link href="/orders">My Orders</Link>
                    <button type="button" onClick={() => logout()}>Logout</button>
                  </>
                ) : (
                  <><Link href="/login">Login</Link><Link href="/register">Register</Link></>
                )}
              </div>
            </details>
          </nav>
          <Link href="/search" className="f2-recent-link"><i className="far fa-star" aria-hidden="true" /> Recently Viewed</Link>
        </div>
      </div>

      <div className={`sd-mobile-drawer${mobileOpen ? ' is-open' : ''}`} aria-hidden={!mobileOpen}>
        <button type="button" className="sd-mobile-drawer__backdrop" onClick={() => setMobileOpen(false)} aria-label="Close navigation menu" tabIndex={mobileOpen ? 0 : -1} />
        <aside id="sd-mobile-menu" className="sd-mobile-drawer__panel" aria-label="Mobile navigation">
          <div className="sd-mobile-drawer__header">
            <Link href="/" className="sd-mobile-drawer__logo" aria-label="Sawdagar home">
              <img src={logoUrl} alt="Sawdagar" className={!customLogo ? 'sd-header__logo-image--default' : ''} />
            </Link>
            <button type="button" onClick={() => setMobileOpen(false)} aria-label="Close navigation menu">
              <MenuIcon name="close" />
            </button>
          </div>

          <form className="sd-mobile-drawer__search" onSubmit={handleSearch} role="search">
            <label className="sd-sr-only" htmlFor="sd-mobile-drawer-search">{label('search', 'Search products')}</label>
            <MenuIcon name="search" />
            <input
              id="sd-mobile-drawer-search"
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={label('search_placeholder', 'Search products...')}
            />
            <button type="submit" aria-label={label('search', 'Search')}><MenuIcon name="arrow" /></button>
          </form>

          <nav className="sd-mobile-drawer__nav" aria-label="Mobile primary navigation">
            {NAV_LINKS.map((item) => (
              <Link key={item.href} href={item.href} className={isNavActive(item) ? 'is-active' : ''} aria-current={isNavActive(item) ? 'page' : undefined}>
                <span>{label(item.key, item.fallback)}</span><MenuIcon name="arrow" />
              </Link>
            ))}
            <button type="button" className="sd-mobile-drawer__categories" onClick={() => setMobileCategoriesOpen((open) => !open)} aria-expanded={mobileCategoriesOpen}>
              <span>{label('categories', 'Categories')}</span><MenuIcon name="chevron" />
            </button>
            {mobileCategoriesOpen && (
              <div className="sd-mobile-drawer__category-list">
                {categories.slice(0, 10).map((category) => (
                  <Link key={category.id} href={`/categories/${category.slug}`}>{getName(category)}</Link>
                ))}
              </div>
            )}
          </nav>

          <div className="sd-mobile-drawer__account">
            {user ? (
              <>
                <div className="sd-mobile-drawer__user"><span>{getInitials(user.fullName)}</span><div><strong>{user.fullName}</strong><small className="sd-ltr">{user.email}</small></div></div>
                <div className="sd-mobile-drawer__account-links">
                  <Link href="/dashboard">{label('dashboard', 'Dashboard')}</Link>
                  <Link href="/orders">{label('orders', 'Orders')}</Link>
                  <button type="button" onClick={() => logout()}>{label('logout', 'Log out')}</button>
                </div>
              </>
            ) : (
              <div className="sd-mobile-drawer__auth-actions">
                <Link href="/login">{label('sign_in', 'Sign in')}</Link>
                <Link href="/register">{label('register', 'Create account')}</Link>
              </div>
            )}
          </div>

        </aside>
      </div>
    </header>
  );
}

function getInitials(name) {
  return (name || 'S')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();
}

function getCategoryIcon(slug) {
  const iconMap = {
    fashion: 'fashion.svg',
    electronics: 'electronics.svg',
    grocery: 'grocery.svg',
    furniture: 'furniture.svg',
    music: 'music.svg',
    toys: 'toy.svg',
    gifts: 'gift.svg',
    babies: 'baby-mom.svg',
    beauty: 'beauty.svg',
    sports: 'sports.svg',
    garden: 'garden.svg',
    automotive: 'automotive.svg',
  };
  for (const [key, icon] of Object.entries(iconMap)) {
    if (slug?.includes(key)) return icon;
  }
  return 'new.svg';
}
