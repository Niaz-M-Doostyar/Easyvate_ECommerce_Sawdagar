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
import MobileBottomNav from '@/components/MobileBottomNav';

export const metadata = {
  title: "Sawdagar - سوداګر | Afghanistan's #1 Online Marketplace",
  description: 'Shop the best products with free delivery across Afghanistan. Pay with Afghani (AFN) on delivery.',
  metadataBase: new URL('https://sawdagar.af'),
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#2563EB',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/x-icon" href="/assets/img/logo/favicon.png" />

        {/* Preconnect to font origins */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Preload critical CSS */}
        <link rel="preload" href="/assets/css/bootstrap.min.css" as="style" />
        <link rel="preload" href="/assets/css/style.css" as="style" />
        <link rel="stylesheet" href="/assets/css/bootstrap.min.css" />
        <link rel="stylesheet" href="/assets/css/style.css" />

        {/* Non-critical CSS — preload then apply asynchronously */}
        <link rel="preload" href="/assets/css/owl.carousel.min.css" as="style" />
        <link rel="preload" href="/assets/css/all-fontawesome.min.css" as="style" />

        {/* Google Fonts — preload for async application */}
        <link rel="preload" href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;700&family=Inter:wght@400;500;600;700;800&display=swap" as="style" crossOrigin="anonymous" />

        {/* Async CSS loader — applies non-critical stylesheets after page render */}
        <script dangerouslySetInnerHTML={{ __html: `
          (function(){
            var sheets = [
              '/assets/css/owl.carousel.min.css',
              '/assets/css/all-fontawesome.min.css',
              'https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;700&family=Inter:wght@400;500;600;700;800&display=swap'
            ];
            if(window.requestIdleCallback){
              requestIdleCallback(function(){sheets.forEach(load)});
            } else {
              setTimeout(function(){sheets.forEach(load)},50);
            }
            function load(href){
              var l=document.createElement('link');
              l.rel='stylesheet';l.href=href;
              document.head.appendChild(l);
            }
          })();
        `}} />
        <noscript>
          <link rel="stylesheet" href="/assets/css/owl.carousel.min.css" />
          <link rel="stylesheet" href="/assets/css/all-fontawesome.min.css" />
          <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;700&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        </noscript>
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
                </CartProvider>
              </AuthProvider>
            </SiteDataProvider>
          </LanguageProvider>
        </ToastProvider>

        <Script src="/assets/js/jquery-3.7.1.min.js" strategy="afterInteractive" />
        <Script src="/assets/js/bootstrap.bundle.min.js" strategy="afterInteractive" />
        <Script src="/assets/js/owl.carousel.min.js" strategy="lazyOnload" />
        <Script src="/assets/js/wow.min.js" strategy="lazyOnload" />
        <Script src="/assets/js/countdown.min.js" strategy="lazyOnload" />
      </body>
    </html>
  );
}
