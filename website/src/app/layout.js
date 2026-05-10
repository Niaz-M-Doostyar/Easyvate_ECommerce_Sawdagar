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
import { fetchPublicJson } from '@/lib/serverApi';

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

export default async function RootLayout({ children }) {
  const [categoryData, siteData] = await Promise.all([
    fetchPublicJson('/api/categories', { categories: [] }, { next: { revalidate: 60 } }),
    fetchPublicJson('/api/site-content', { content: null }, { next: { revalidate: 60 } }),
  ]);

  const initialCategories = Array.isArray(categoryData?.categories) ? categoryData.categories : [];
  const initialSiteContent = siteData?.content || null;

  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/x-icon" href="/assets/img/logo/favicon.png" />

        {/* Preconnect to font origins */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Load shared theme assets eagerly so first uncached visits render correctly. */}
        <link rel="stylesheet" href="/assets/css/bootstrap.min.css" />
        <link rel="stylesheet" href="/assets/css/style.css" />
        <link rel="stylesheet" href="/assets/css/owl.carousel.min.css" />
        <link rel="stylesheet" href="/assets/css/all-fontawesome.min.css" />
        <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;700&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <PageLoader />
        <ToastProvider>
          <LanguageProvider>
            <SiteDataProvider initialCategories={initialCategories} initialSiteContent={initialSiteContent}>
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
        <Script src="/assets/js/owl.carousel.min.js" strategy="afterInteractive" />
        <Script src="/assets/js/wow.min.js" strategy="afterInteractive" />
        <Script src="/assets/js/countdown.min.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
