'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';

export default function MobileBottomNav() {
  const { user } = useAuth();
  const { cartCount } = useCart();
  const pathname = usePathname();
  const router = useRouter();
  const [showSearch, setShowSearch] = useState(false);

  const handleSearch = (e) => {
    e.preventDefault();
    const q = e.target.elements.q.value.trim();
    if (q) {
      setShowSearch(false);
      router.push('/search?q=' + encodeURIComponent(q));
    }
  };

  const navItems = [
    { href: '/', icon: 'far fa-home', label: 'Home' },
    { href: '/search', icon: 'far fa-grid-2', label: 'Shop' },
    { action: 'search', icon: 'far fa-search', label: 'Search' },
    { href: '/cart', icon: 'far fa-shopping-bag', label: 'Cart', badge: cartCount },
    { href: user ? '/dashboard' : '/login', icon: 'far fa-user', label: 'Account' },
  ];

  return (
    <>
      {/* Search Popup */}
      {showSearch && (
        <div className="mobile-search-overlay" onClick={() => setShowSearch(false)}>
          <div className="mobile-search-popup" onClick={(e) => e.stopPropagation()}>
            <form onSubmit={handleSearch}>
              <div className="mobile-search-input-wrap">
                <input type="text" name="q" className="form-control" placeholder="Search products..." autoFocus />
                <button type="submit" className="mobile-search-btn"><i className="far fa-search"></i></button>
              </div>
            </form>
            <button className="mobile-search-close" onClick={() => setShowSearch(false)}>
              <i className="far fa-times"></i>
            </button>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <nav className="mobile-bottom-nav">
        {navItems.map((item, i) => {
          if (item.action === 'search') {
            return (
              <button key={i} className="mobile-bottom-nav-item" onClick={() => setShowSearch(true)}>
                <i className={item.icon}></i>
                <span>{item.label}</span>
              </button>
            );
          }
          const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
          return (
            <Link key={i} href={item.href} className={`mobile-bottom-nav-item${isActive ? ' active' : ''}`}>
              <div className="mobile-bottom-nav-icon">
                <i className={item.icon}></i>
                {item.badge > 0 && <span className="mobile-nav-badge">{item.badge}</span>}
              </div>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
