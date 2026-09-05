'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';

function NavIcon({ name }) {
  const paths = {
    home: <><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10M9 20v-6h6v6" /></>,
    shop: <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></>,
    categories: <><path d="M4 5h6v6H4zM14 5h6v6h-6zM4 15h6v4H4zM14 15h6v4h-6z" /></>,
    search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></>,
    cart: <><path d="M5 8.5h14l-1 12H6l-1-12Z" /><path d="M9 9V6.5a3 3 0 0 1 6 0V9" /></>,
    account: <><circle cx="12" cy="8" r="3.5" /><path d="M5.5 20a6.5 6.5 0 0 1 13 0" /></>,
    close: <path d="m6 6 12 12M18 6 6 18" />,
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
  };

  return (
    <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

export default function MobileBottomNav() {
  const { user } = useAuth();
  const { cartCount } = useCart();
  const { t } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();
  const [showSearch, setShowSearch] = useState(false);
  const inputRef = useRef(null);
  const searchButtonRef = useRef(null);

  const label = (key, fallback) => {
    const translated = t(key);
    return translated && translated !== key ? translated : fallback;
  };

  useEffect(() => { setShowSearch(false); }, [pathname]);

  useEffect(() => {
    if (!showSearch) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusTimer = window.setTimeout(() => inputRef.current?.focus(), 40);
    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowSearch(false);
        searchButtonRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [showSearch]);

  const handleSearch = (event) => {
    event.preventDefault();
    const query = new FormData(event.currentTarget).get('q')?.toString().trim();
    if (!query) return;
    setShowSearch(false);
    router.push(`/search?q=${encodeURIComponent(query)}`);
  };

  const closeSearch = () => {
    setShowSearch(false);
    window.setTimeout(() => searchButtonRef.current?.focus(), 0);
  };

  const navItems = [
    { href: '/', icon: 'home', text: label('home', 'Home'), active: pathname === '/' },
    {
      href: '/search',
      icon: 'shop',
      text: label('products', 'Shop'),
      active: pathname.startsWith('/search') || pathname.startsWith('/products') || pathname.startsWith('/categories'),
    },
    { href: '/search?filters=1', icon: 'categories', text: label('categories', 'Categories'), active: pathname.startsWith('/categories') },
    { action: 'search', icon: 'search', text: label('search', 'Search') },
    { href: '/cart', icon: 'cart', text: label('cart', 'Cart'), badge: cartCount, active: pathname.startsWith('/cart') || pathname.startsWith('/checkout') },
    { href: user ? '/dashboard' : '/login', icon: 'account', text: label('profile', 'Account'), active: ['/dashboard', '/profile', '/orders', '/login', '/register'].some((route) => pathname.startsWith(route)) },
  ];

  return (
    <>
      {showSearch && (
        <div className="sd-mobile-search" role="presentation">
          <button type="button" className="sd-mobile-search__backdrop" onClick={closeSearch} aria-label="Close search" />
          <section className="sd-mobile-search__dialog" role="dialog" aria-modal="true" aria-labelledby="sd-mobile-search-title">
            <div className="sd-mobile-search__heading">
              <div>
                <span>SAWDAGAR</span>
                <h2 id="sd-mobile-search-title">{label('search', 'What are you looking for?')}</h2>
              </div>
              <button type="button" onClick={closeSearch} aria-label="Close search"><NavIcon name="close" /></button>
            </div>
            <form onSubmit={handleSearch} role="search" className="sd-mobile-search__form">
              <NavIcon name="search" />
              <label htmlFor="sd-bottom-search" className="sd-sr-only">{label('search', 'Search products')}</label>
              <input ref={inputRef} id="sd-bottom-search" type="search" name="q" placeholder={label('search_placeholder', 'Search products...')} autoComplete="off" />
              <button type="submit" aria-label={label('search', 'Search')}><NavIcon name="arrow" /></button>
            </form>
            <div className="sd-mobile-search__quick-links">
              <span>{label('categories', 'Explore')}</span>
              <Link href="/search?sort=newest">{label('new_arrivals', 'New arrivals')}</Link>
              <Link href="/search">{label('all_products', 'All products')}</Link>
            </div>
          </section>
        </div>
      )}

      <nav className="mobile-bottom-nav sd-mobile-nav" aria-label="Mobile quick navigation">
        {navItems.map((item) => {
          if (item.action === 'search') {
            return (
              <button
                key={item.action}
                ref={searchButtonRef}
                type="button"
                className={`mobile-bottom-nav-item sd-mobile-nav__item sd-mobile-nav__search${showSearch ? ' active' : ''}`}
                onClick={() => setShowSearch(true)}
                aria-label={item.text}
                aria-expanded={showSearch}
                aria-controls="sd-bottom-search"
              >
                <span className="sd-mobile-nav__icon"><NavIcon name={item.icon} /></span>
                <span>{item.text}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mobile-bottom-nav-item sd-mobile-nav__item${item.active ? ' active' : ''}`}
              aria-current={item.active ? 'page' : undefined}
              aria-label={item.text}
            >
              <span className="mobile-bottom-nav-icon sd-mobile-nav__icon">
                <NavIcon name={item.icon} />
                {item.badge > 0 && <span className="mobile-nav-badge sd-mobile-nav__badge">{item.badge > 99 ? '99+' : item.badge}</span>}
              </span>
              <span>{item.text}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
