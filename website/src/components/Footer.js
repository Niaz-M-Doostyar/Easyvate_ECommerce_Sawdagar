'use client';

import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteData } from '@/contexts/SiteDataContext';

function FooterIcon({ name }) {
  const paths = {
    delivery: <><path d="M3 6h11v11H3zM14 10h4l3 3v4h-7z" /><circle cx="7" cy="18" r="2" /><circle cx="18" cy="18" r="2" /></>,
    cash: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M7 9h.01M17 15h.01" /><circle cx="12" cy="12" r="3" /></>,
    return: <><path d="M8 7H4v-4" /><path d="M4 7a9 9 0 1 1-1 8" /><path d="m8 12 3 3 5-6" /></>,
    support: <><path d="M4 13v-2a8 8 0 0 1 16 0v2" /><path d="M4 12H3a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h2v-6Zm16 0h1a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2v-6ZM19 18c0 2-2 3-5 3" /></>,
    phone: <path d="M6.6 3h3l1.5 4.2-2 1.5a15.5 15.5 0 0 0 6.2 6.2l1.5-2 4.2 1.5v3c0 2-1.6 3.6-3.6 3.5A17 17 0 0 1 3.1 6.6C3 4.6 4.6 3 6.6 3Z" />,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></>,
    pin: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
    store: <><path d="M4 9h16l-1.5-5h-13L4 9Z" /><path d="M5.5 9v11h13V9M9 20v-6h6v6" /></>,
  };

  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

export default function Footer() {
  const { t, lang } = useLanguage();
  const { categories, siteContent, getName: siteGetName } = useSiteData();
  const footer = siteContent?.footer || {};
  const customLogo = (siteContent?.header?.logo || '').trim();
  const logoUrl = customLogo || '/assets/img/logo/sawdagar.png';

  const label = (key, fallback) => {
    const translated = t(key);
    return translated && translated !== key ? translated : fallback;
  };
  const getName = (item) => siteGetName(item, lang);

  const phoneToWhatsApp = (phone) => {
    let digits = (phone || '').toString().replace(/\D/g, '');
    if (!digits) return '#';
    if (digits.startsWith('00')) digits = digits.slice(2);
    if (digits.startsWith('0')) digits = `93${digits.slice(1)}`;
    if (digits.length === 9 && digits.startsWith('7')) digits = `93${digits}`;
    return `https://wa.me/${digits}`;
  };

  const phone = footer.phone || siteContent?.header?.phone || '+93 700 000 000';
  const email = footer.email || siteContent?.header?.email || 'info@sawdagar.af';
  const footerSocial = footer.socialLinks || {};
  const usefulLinks = footer.quickLinks?.length ? footer.quickLinks.slice(0, 6) : [
    { label: 'About Us', href: '/about' },
    { label: 'Contact Us', href: '/contact' },
    { label: 'All Products', href: '/search' },
    { label: 'Shopping Cart', href: '/cart' },
    { label: 'Sign In', href: '/login' },
    { label: 'Register', href: '/register' },
  ];
  const categoryLinks = categories.slice(0, 7);
  const supportLinks = footer.supportLinks?.length ? footer.supportLinks.slice(0, 6) : [
    { label: "FAQ's", href: '/contact' },
    { label: 'How To Buy', href: '/contact' },
    { label: 'Support Center', href: '/contact' },
    { label: 'Track Your Order', href: '/orders' },
    { label: 'Returns Policy', href: '/contact' },
  ];
  const appLinks = [
    { href: footer.playStoreUrl || footer.googlePlayUrl, icon: 'fab fa-google-play', overline: 'Get it on', name: 'Google Play' },
    { href: footer.appStoreUrl, icon: 'fab fa-apple', overline: 'Download on the', name: 'App Store' },
  ].filter((item) => item.href);

  const socialLinks = [
    { href: phoneToWhatsApp(phone), icon: 'fab fa-whatsapp', label: 'WhatsApp' },
    { href: footerSocial.facebook || footer.facebook, icon: 'fab fa-facebook-f', label: 'Facebook' },
    { href: footerSocial.instagram || footer.instagram, icon: 'fab fa-instagram', label: 'Instagram' },
    { href: footerSocial.twitter || footer.twitter, icon: 'fab fa-x-twitter', label: 'X' },
    { href: footerSocial.linkedin || footer.linkedin, icon: 'fab fa-linkedin-in', label: 'LinkedIn' },
    { href: footerSocial.youtube || footer.youtube, icon: 'fab fa-youtube', label: 'YouTube' },
  ].filter((item) => item.href);

  return (
    <footer className="footer-area sd-footer">
      <div className="sd-footer__main">
        <div className="container">
          <div className="sd-footer__top">
            <Link href="/" className="sd-footer__logo" aria-label="Sawdagar home">
              <img src={logoUrl} alt="Sawdagar" />
            </Link>

            <div className="sd-footer__top-social">
              <span>{label('follow_us', 'Follow us')}</span>
              <div className="sd-footer__socials" aria-label="Sawdagar social media">
                {socialLinks.map((item) => (
                  <a key={item.label} href={item.href} target="_blank" rel="noopener noreferrer" aria-label={item.label}>
                    <i className={item.icon} aria-hidden="true" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="sd-footer__grid">
            <div className="sd-footer__about">
              <h3>{label('about_us', 'About Sawdagar')}</h3>
              <p>{footer.aboutText || label('footer_description', "Afghanistan's trusted marketplace for quality products, local suppliers and simple cash-on-delivery shopping.")}</p>
              <ul className="sd-footer__contact-list">
                <li>
                  <FooterIcon name="phone" />
                  <a href={phoneToWhatsApp(phone)} target="_blank" rel="noopener noreferrer" className="sd-ltr">{phone}</a>
                </li>
                <li><FooterIcon name="mail" /><a href={`mailto:${email}`} className="sd-ltr">{email}</a></li>
                <li><FooterIcon name="pin" /><span>{footer.address || 'Kabul, Afghanistan'}</span></li>
                {(footer.businessHours || footer.hours) && <li><i className="far fa-clock" aria-hidden="true" /><span>{footer.businessHours || footer.hours}</span></li>}
              </ul>
            </div>

            <nav className="sd-footer__column" aria-label="Useful links">
              <h3>{label('useful_links', 'Useful links')}</h3>
              {usefulLinks.map((item) => <Link key={`${item.href}-${item.label}`} href={item.href || '/'}>{item.label}</Link>)}
            </nav>

            <nav className="sd-footer__column" aria-label="Category links">
              <h3>{label('categories', 'Categories')}</h3>
              {categoryLinks.map((category) => (
                <Link key={category.id} href={`/categories/${category.slug}`}>{getName(category)}</Link>
              ))}
              <Link href="/search" className="sd-footer__text-link">{label('view_all', 'View all')} <FooterIcon name="arrow" /></Link>
            </nav>

            <nav className="sd-footer__column" aria-label="Support links">
              <h3>{label('support_center', 'Support center')}</h3>
              {supportLinks.map((item) => <Link key={`${item.href}-${item.label}`} href={item.href || '/contact'}>{item.label}</Link>)}
            </nav>

            <div className="sd-footer__column sd-footer__app">
              <h3>{label('shop_on_phone', 'Shop on your phone')}</h3>
              <p>{footer.appText || 'Browse new arrivals and manage every order wherever you are.'}</p>
              {appLinks.length > 0 ? (
                <div className="sd-footer__app-buttons">
                  {appLinks.map((item) => (
                    <a key={item.name} href={item.href} target="_blank" rel="noopener noreferrer" aria-label={`${item.name} download`}>
                      <i className={item.icon} aria-hidden="true" />
                      <span><small>{item.overline}</small><strong>{item.name}</strong></span>
                    </a>
                  ))}
                </div>
              ) : (
                <span className="sd-footer__coming-soon">{label('coming_soon', 'Mobile apps coming soon')}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="sd-footer__bottom">
        <div className="container sd-footer__bottom-inner">
          <p>© {new Date().getFullYear()} {footer.copyrightText || 'Sawdagar'}. {label('all_rights_reserved', 'All rights reserved')}.</p>
          <div>
            <Link href="/orders">{label('track_order', 'Track an order')}</Link>
            <span aria-hidden="true">•</span>
            <span>{label('cash_on_delivery', 'Cash on delivery')}</span>
            <span aria-hidden="true">•</span>
            <Link href="/contact">{label('help_support', 'Help & support')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
