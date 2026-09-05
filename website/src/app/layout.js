import './globals.css';
import './sawdagar-system.css';
import './sawdagar-shell.css';
import './sawdagar-home.css';
import './sawdagar-furniture2.css';
import './sawdagar-content-pages.css';
import './sawdagar-commerce.css';
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
  themeColor: '#F59A57',
};

// Storefront content is managed by the admin panel and must always reflect the
// latest database state instead of being captured during a static build.
export const dynamic = 'force-dynamic';

export default async function RootLayout({ children }) {
  const [categoryData, siteData] = await Promise.all([
    fetchPublicJson('/api/categories', { categories: [] }),
    fetchPublicJson('/api/site-content', { content: null }),
  ]);

  const initialCategories = Array.isArray(categoryData?.categories) ? categoryData.categories : [];
  const initialSiteContent = siteData?.content || null;

  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
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
        <link href="https://fonts.googleapis.com/css2?family=Urbanist:wght@600;700;800&family=Work+Sans:wght@400;500;600&family=Vazirmatn:wght@400;500;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Script id="sawdagar-language" strategy="beforeInteractive">
          {`try{var l=localStorage.getItem('sawdagar_lang')||'en';document.documentElement.lang=l;document.documentElement.dir=(l==='ps'||l==='dr')?'rtl':'ltr'}catch(e){}`}
        </Script>
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

        <Script src="/assets/js/bootstrap.bundle.min.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
