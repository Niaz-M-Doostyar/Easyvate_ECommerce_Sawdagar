'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

export default function Footer() {
  const { lang } = useLanguage();
  const [categories, setCategories] = useState([]);
  const [siteContent, setSiteContent] = useState(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/categories').then(r => r.json()).catch(() => null),
      fetch('/api/site-content').then(r => r.json()).catch(() => null),
    ]).then(([catData, siteData]) => {
      const cats = Array.isArray(catData?.categories)
        ? catData.categories
        : Array.isArray(catData)
        ? catData
        : [];
      setCategories(cats);
      if (siteData?.content) setSiteContent(siteData.content);
    });
  }, []);

  const getName = (item) => {
    if (!item) return '';
    if (lang === 'ps' && item.namePs) return item.namePs;
    if (lang === 'dr' && item.nameDr) return item.nameDr;
    return item.nameEn || '';
  };

  const footer = siteContent?.footer || {};

  return (
    <footer className="footer-area ft-bg">
      <div className="footer-widget">
        <div className="container">
          <div className="row footer-widget-wrapper pt-100 pb-40">
            <div className="col-md-6 col-lg-3">
              <div className="footer-widget-box about-us">
                <Link href="/" className="footer-logo">
                  <img src="/assets/img/logo/logo-light.png" alt="Sawdagar" />
                </Link>
                <p className="mb-3">
                  {footer.aboutText || "Afghanistan's premier online marketplace connecting suppliers, retailers, and customers nationwide."}
                </p>
                <ul className="footer-contact">
                  <li><a href={`tel:${footer.phone || '+93 700 000 000'}`}><i className="far fa-phone"></i>{footer.phone || '+93 700 000 000'}</a></li>
                  <li><i className="far fa-map-marker-alt"></i>{footer.address || 'Kabul, Afghanistan'}</li>
                  <li><a href={`mailto:${footer.email || 'info@sawdagar.af'}`}><i className="far fa-envelope"></i>{footer.email || 'info@sawdagar.af'}</a></li>
                  <li><i className="far fa-clock"></i>{footer.hours || 'Sat-Thu (8:00AM - 5:00PM)'}</li>
                </ul>
              </div>
            </div>
            <div className="col-md-6 col-lg-2">
              <div className="footer-widget-box list">
                <h4 className="footer-widget-title">Quick Links</h4>
                <ul className="footer-list">
                  <li><Link href="/about">About Us</Link></li>
                  <li><Link href="/contact">Contact Us</Link></li>
                  <li><Link href="/search">All Products</Link></li>
                  <li><Link href="/cart">Shopping Cart</Link></li>
                  <li><Link href="/login">Sign In</Link></li>
                  <li><Link href="/register">Register</Link></li>
                </ul>
              </div>
            </div>
            <div className="col-md-6 col-lg-2">
              <div className="footer-widget-box list">
                <h4 className="footer-widget-title">Browse Category</h4>
                <ul className="footer-list">
                  {categories.slice(0, 7).map(cat => (
                    <li key={cat.id}>
                      <Link href={`/categories/${cat.slug}`}>{getName(cat)}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="col-md-6 col-lg-2">
              <div className="footer-widget-box list">
                <h4 className="footer-widget-title">Support Center</h4>
                <ul className="footer-list">
                  <li><Link href="/contact">FAQ&apos;s</Link></li>
                  <li><Link href="/contact">How To Buy</Link></li>
                  <li><Link href="/contact">Support Center</Link></li>
                  <li><Link href="/orders">Track Your Order</Link></li>
                  <li><Link href="/contact">Returns Policy</Link></li>
                </ul>
              </div>
            </div>
            <div className="col-md-6 col-lg-3">
              <div className="footer-widget-box list">
                <h4 className="footer-widget-title">Get Mobile App</h4>
                <p>{footer.appText || 'Sawdagar App is now available on App Store & Google Play.'}</p>
                <div className="footer-download">
                  <h5>Download Our Mobile App</h5>
                  <div className="footer-download-btn">
                    <a href={footer.googlePlayUrl || '#'}>
                      <i className="fab fa-google-play"></i>
                      <div className="download-btn-info">
                        <span>Get It On</span>
                        <h6>Google Play</h6>
                      </div>
                    </a>
                    <a href={footer.appStoreUrl || '#'}>
                      <i className="fab fa-app-store"></i>
                      <div className="download-btn-info">
                        <span>Get It On</span>
                        <h6>App Store</h6>
                      </div>
                    </a>
                  </div>
                </div>
                <div className="footer-payment mt-20">
                  <span>We Accept:</span>
                  <img src="/assets/img/payment/visa.svg" alt="Visa" />
                  <img src="/assets/img/payment/mastercard.svg" alt="Mastercard" />
                  <img src="/assets/img/payment/amex.svg" alt="Amex" />
                  <img src="/assets/img/payment/discover.svg" alt="Discover" />
                  <img src="/assets/img/payment/paypal.svg" alt="PayPal" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="copyright">
        <div className="container">
          <div className="copyright-wrap">
            <div className="row">
              <div className="col-12 col-lg-6 align-self-center">
                <p className="copyright-text">
                  &copy; {new Date().getFullYear()} <Link href="/"> Sawdagar </Link> All Rights Reserved.
                </p>
              </div>
              <div className="col-12 col-lg-6 align-self-center">
                <div className="footer-social">
                  <span>Follow Us:</span>
                  <a href={footer.facebook || '#'}><i className="fab fa-facebook-f"></i></a>
                  <a href={footer.twitter || '#'}><i className="fab fa-x-twitter"></i></a>
                  <a href={footer.linkedin || '#'}><i className="fab fa-linkedin-in"></i></a>
                  <a href={footer.youtube || '#'}><i className="fab fa-youtube"></i></a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
