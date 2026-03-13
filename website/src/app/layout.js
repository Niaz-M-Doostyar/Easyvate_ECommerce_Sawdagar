import './globals.css';
import Script from 'next/script';
import { ToastProvider } from '@/contexts/ToastContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { CartProvider } from '@/contexts/CartContext';
import { SiteDataProvider } from '@/contexts/SiteDataContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ScrollToTop from '@/components/ScrollToTop';
import PageLoader from '@/components/PageLoader';
import AnimationInit from '@/components/AnimationInit';
import MobileBottomNav from '@/components/MobileBottomNav';

export const metadata = {
  title: "Sawdagar - سوداګر | Afghanistan's #1 Online Marketplace",
  description: 'Shop the best products with free delivery across Afghanistan. Pay with Afghani (AFN) on delivery.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/x-icon" href="/assets/img/logo/favicon.png" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;700&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="/assets/css/bootstrap.min.css" />
        <link rel="stylesheet" href="/assets/css/all-fontawesome.min.css" />
        <link rel="stylesheet" href="/assets/css/owl.carousel.min.css" />
        <link rel="stylesheet" href="/assets/css/style.css" />
      </head>
      <body>
        <PageLoader />
        <ToastProvider>
          <LanguageProvider>
            <SiteDataProvider>
              <AuthProvider>
                <CartProvider>
                  <Header />
                  <main className="main">{children}</main>
                  <Footer />
                  <MobileBottomNav />
                  <ScrollToTop />
                  <AnimationInit />
                </CartProvider>
              </AuthProvider>
            </SiteDataProvider>
          </LanguageProvider>
        </ToastProvider>

        <Script src="/assets/js/jquery-3.7.1.min.js" strategy="afterInteractive" />
        <Script src="/assets/js/bootstrap.bundle.min.js" strategy="afterInteractive" />
        <Script src="/assets/js/owl.carousel.min.js" strategy="afterInteractive" />
        <Script src="/assets/js/wow.min.js" strategy="afterInteractive" />
        <Script src="/assets/js/jquery.magnific-popup.min.js" strategy="lazyOnload" />
        <Script src="/assets/js/jquery.appear.min.js" strategy="lazyOnload" />
        <Script src="/assets/js/jquery.easing.min.js" strategy="lazyOnload" />
        <Script src="/assets/js/imagesloaded.pkgd.min.js" strategy="lazyOnload" />
        <Script src="/assets/js/isotope.pkgd.min.js" strategy="lazyOnload" />
        <Script src="/assets/js/counter-up.js" strategy="lazyOnload" />
        <Script src="/assets/js/jquery-ui.min.js" strategy="lazyOnload" />
        <Script src="/assets/js/jquery.nice-select.min.js" strategy="lazyOnload" />
        <Script src="/assets/js/countdown.min.js" strategy="lazyOnload" />
        <Script src="/assets/js/modernizr.min.js" strategy="lazyOnload" />
        {/* main.js disabled — MocartInit handles all plugin initialization */}
      </body>
    </html>
  );
}
