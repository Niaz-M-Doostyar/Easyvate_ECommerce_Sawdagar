'use client';

import '@/app/sawdagar-account-pages.css';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

function AccountIcon({ name }) {
  const paths = {
    dashboard: <><rect x="4" y="4" width="6" height="6" rx="1" /><rect x="14" y="4" width="6" height="6" rx="1" /><rect x="4" y="14" width="6" height="6" rx="1" /><rect x="14" y="14" width="6" height="6" rx="1" /></>,
    user: <><circle cx="12" cy="8" r="3.5" /><path d="M5.5 20a6.5 6.5 0 0 1 13 0" /></>,
    orders: <><path d="M5 4h14v16H5z" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
    cart: <><path d="M5 8.5h14l-1 12H6l-1-12Z" /><path d="M9 9V6.5a3 3 0 0 1 6 0V9" /></>,
    store: <><path d="M4 9h16l-1.5-5h-13L4 9Z" /><path d="M5.5 9v11h13V9M9 20v-6h6v6" /></>,
    truck: <><path d="M3 6h11v11H3zM14 10h4l3 3v4h-7z" /><circle cx="7" cy="19" r="2" /><circle cx="18" cy="19" r="2" /></>,
    shop: <><circle cx="8" cy="19" r="1.5" /><circle cx="18" cy="19" r="1.5" /><path d="M3 4h2l2.2 10.5h10.6L20 8H6" /></>,
    logout: <><path d="M10 5H5v14h5M13 8l4 4-4 4M8 12h9" /></>,
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
  };

  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

export default function AccountLayout({
  children,
  title = 'My account',
  description = 'Manage your account information, orders, and shopping activity.',
  eyebrow = 'Sawdagar account',
}) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const [loggingOut, setLoggingOut] = useState(false);

  const label = (key, fallback) => {
    const translated = t(key);
    return translated && translated !== key ? translated : fallback;
  };

  const menuItems = useMemo(() => {
    const items = [
      { href: '/dashboard', icon: 'dashboard', text: label('dashboard', 'Dashboard') },
      { href: '/profile', icon: 'user', text: label('profile', 'My profile') },
      { href: '/orders', icon: 'orders', text: label('orders', 'My orders') },
      { href: '/cart', icon: 'cart', text: label('cart', 'Shopping cart') },
    ];
    if (user?.role === 'supplier') items.splice(3, 0, { href: '/supplier', icon: 'store', text: label('supplier_panel', 'Supplier panel') });
    if (user?.role === 'delivery') items.splice(3, 0, { href: '/delivery', icon: 'truck', text: 'Delivery panel' });
    items.push({ href: '/search', icon: 'shop', text: label('continue_shopping', 'Continue shopping') });
    return items;
  // `t` changes when the active language changes, so rebuilding the labels is intentional.
  }, [t, user?.role]);

  const isActive = (href) => href === '/dashboard' ? pathname === href : pathname.startsWith(href);
  const initials = (user?.fullName || 'S')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    await logout();
  };

  return (
    <>
      <header className="f2-account-hero">
        <div className="container f2-account-hero__inner">
          <div>
            <span className="f2-account-hero__eyebrow">{eyebrow}</span>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
          <nav className="f2-account-crumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            <span aria-hidden="true">/</span>
            <span aria-current="page">{title}</span>
          </nav>
        </div>
      </header>

      <section className="f2-account" aria-label="Customer account">
        <div className="container">
          <div className="f2-account__layout">
            <aside className="f2-account__sidebar">
              <div className="f2-account__profile">
                <span className="f2-account__avatar" aria-hidden="true">{initials}</span>
                <div className="f2-account__identity">
                <span>{label('welcome', 'Welcome back')}</span>
                <h2>{user?.fullName || label('profile', 'Your account')}</h2>
                  <p dir="ltr">{user?.email || ''}</p>
                </div>
              </div>

              <nav className="f2-account__nav" aria-label="Account navigation">
                {menuItems.map((item) => (
                  <Link
                    href={item.href}
                    key={item.href}
                    className={isActive(item.href) ? 'is-active' : ''}
                    aria-current={isActive(item.href) ? 'page' : undefined}
                  >
                    <span className="f2-account__nav-icon"><AccountIcon name={item.icon} /></span>
                    <span>{item.text}</span>
                    <AccountIcon name="arrow" />
                  </Link>
                ))}
                <button type="button" onClick={handleLogout} disabled={loggingOut}>
                  <span className="f2-account__nav-icon"><AccountIcon name="logout" /></span>
                  <span>{loggingOut ? `${label('logout', 'Logging out')}…` : label('logout', 'Log out')}</span>
                  <AccountIcon name="arrow" />
                </button>
              </nav>

              <div className="f2-account__help">
                <span>Need a hand?</span>
                <p>Our support team is ready to help with your account or orders.</p>
                <Link href="/contact">{label('contact_us', 'Contact support')} <AccountIcon name="arrow" /></Link>
              </div>
            </aside>

            <div className="f2-account__content">
              {children}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
