'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCart } from '@/contexts/CartContext';
import { useSiteData } from '@/contexts/SiteDataContext';
import MocartInit from '@/components/MocartInit';
import MocartProductItem, { MocartProductListItem } from '@/components/MocartProductItem';
import { formatPrice, CURRENCY_SYMBOL } from '@/lib/currency';

export default function HomePage() {
  const { lang } = useLanguage();
  const { addToCart } = useCart();
  const { categories, siteContent, getName: siteGetName } = useSiteData();
  const [products, setProducts] = useState([]);
  const [sponsoredProducts, setSponsoredProducts] = useState([]);
  const [activeTab, setActiveTab] = useState(0);

  const getName = useCallback((item) => siteGetName(item, lang), [siteGetName, lang]);

  useEffect(() => {
    Promise.all([
      fetch('/api/products?limit=24&status=approved').then(r => r.json()).catch(() => ({})),
      fetch('/api/products/sponsored').then(r => r.json()).catch(() => ({})),
    ]).then(([pData, sponsoredData]) => {
      setProducts(pData.products || []);
      setSponsoredProducts(sponsoredData.products || sponsoredData || []);
    });
  }, []);

  const home = siteContent?.home || {};
  const hero = home.hero || {};
  const promoBanners = home.promoBanners || [];
  const features = home.features || [];
  const bigBanner = home.bigBanner || {};
  const dealOfWeek = home.dealOfWeek || {};
  const gallery = home.gallery || {};
  const galleryImages = home.galleryImages || [
    { image: '/assets/img/gallery/02.jpg', size: 'col-md-4 col-lg-3' },
    { image: '/assets/img/gallery/03.jpg', size: 'col-md-4 col-lg-3' },
    { image: '/assets/img/gallery/01.jpg', size: 'col-md-12 col-lg-6' },
    { image: '/assets/img/gallery/06.jpg', size: 'col-md-8 col-lg-6' },
    { image: '/assets/img/gallery/04.jpg', size: 'col-md-4 col-lg-3' },
    { image: '/assets/img/gallery/05.jpg', size: 'col-md-4 col-lg-3' },
  ];
  const testimonials = home.testimonials || {};
  const testimonialItems = home.testimonialItems || [];
  const blogItems = home.blogItems || [];
  const newsletter = home.newsletter || {};
  const brands = home.brands || {};
  const brandItems = home.brandItems || [];
  const instagramItems = home.instagramItems || [];

  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);

  const openGallery = (index) => {
    setGalleryIndex(index);
    setGalleryOpen(true);
  };

  const closeGallery = () => setGalleryOpen(false);

  const goNext = () => setGalleryIndex((prev) => (prev + 1) % galleryImages.length);
  const goPrev = () => setGalleryIndex((prev) => (prev - 1 + galleryImages.length) % galleryImages.length);

  // Split products for different sections
  const trendingProducts = products.slice(0, 8);
  const featuredProducts = products.slice(4, 12);
  const onSaleProducts = products.filter(p => p.wholesaleCost > (p.retailPrice || 0)).slice(0, 3);
  const bestSellerProducts = products.slice(0, 3);
  const topRatedProducts = products.slice(3, 6);

  // Products by category for tabs
  const tabCategories = categories.slice(0, 6);
  const getTabProducts = (catIndex) => {
    if (catIndex >= tabCategories.length) return products.slice(0, 8);
    const cat = tabCategories[catIndex];
    const filtered = products.filter(p => p.categoryId === cat.id || p.category?.id === cat.id);
    return filtered.length > 0 ? filtered.slice(0, 8) : products.slice(0, 8);
  };

  const heroSlides = hero.slides || [
    { subtitle: hero.badge || `Start From ${CURRENCY_SYMBOL}999`, title: hero.titleLines?.join(' ') || 'Explore The Trendy products for you.', description: hero.description || '', image: hero.image || '/assets/img/hero/01.png', priceLabel: hero.priceLabel || 'Price', priceValue: hero.priceValue || formatPrice(2500) },
    { subtitle: `Start From ${CURRENCY_SYMBOL}999`, title: 'Explore The Trendy products for you.', description: '', image: '/assets/img/hero/02.png', priceLabel: 'Price', priceValue: formatPrice(2500) },
    { subtitle: `Start From ${CURRENCY_SYMBOL}999`, title: 'Explore The Trendy products for you.', description: '', image: '/assets/img/hero/03.png', priceLabel: 'Price', priceValue: formatPrice(2500) },
  ];

  return (
    <>
      {/* Initialize Mocart JS plugins (owl carousel, magnific popup, etc.) */}
      <MocartInit />

      {/* Hero Slider */}
      <div className="hero-section hs-1 mt-30">
        <div className="container">
          <div className="hero-slider owl-carousel owl-theme">
            {heroSlides.map((slide, i) => (
              <div className="hero-single" key={i}>
                <div className="container">
                  <div className="row align-items-center">
                    <div className="col-lg-6">
                      <div className="hero-content">
                        <h6 className="hero-sub-title" data-animation="fadeInUp" data-delay=".25s">
                          {slide.subtitle}
                        </h6>
                        <h1 className="hero-title" data-animation="fadeInRight" data-delay=".50s">
                          {slide.title.split(' ').map((word, wi) => {
                            if (word.toLowerCase() === 'products' || word.toLowerCase() === 'unique') {
                              return <span key={wi}>{word} </span>;
                            }
                            return word + ' ';
                          })}
                        </h1>
                        <p data-animation="fadeInLeft" data-delay=".75s">
                          {slide.description || hero.description || 'There are many variations of passages available but the majority have suffered alteration in some form.'}
                        </p>
                        <div className="hero-btn" data-animation="fadeInUp" data-delay="1s">
                          <Link href={hero.primaryButtonHref || '/search'} className="theme-btn">
                            {hero.primaryButtonLabel || 'Shop Now'}<i className="fas fa-arrow-right"></i>
                          </Link>
                          <Link href={hero.secondaryButtonHref || '/about'} className="theme-btn theme-btn2">
                            {hero.secondaryButtonLabel || 'Learn More'}<i className="fas fa-arrow-right"></i>
                          </Link>
                        </div>
                      </div>
                    </div>
                    <div className="col-lg-6">
                      <div className="hero-right" data-animation="fadeInRight" data-delay=".25s">
                        <div className="hero-img">
                          <div className="hero-img-price">
                            <span>{slide.priceLabel}</span>
                            <span>{slide.priceValue}</span>
                          </div>
                          <img src={slide.image} alt="" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Category Area */}
      <div className="category-area pt-80 pb-100">
        <div className="container">
          <div className="row">
            <div className="col-12 wow fadeInDown" data-wow-delay=".25s">
              <div className="site-heading-inline">
                <h2 className="site-title">Top Category</h2>
                <Link href="/search">View More <i className="fas fa-angle-double-right"></i></Link>
              </div>
            </div>
          </div>
          <div className="category-slider owl-carousel owl-theme wow fadeInUp" data-wow-delay=".25s">
            {categories.map(cat => (
              <div className="category-item" key={cat.id}>
                <Link href={`/categories/${cat.slug}`}>
                  <div className="category-info">
                    <div className="icon">
                      <img src={cat.image || `/assets/img/icon/${getCategoryIcon(cat.slug)}`} alt="" />
                    </div>
                    <div className="content">
                      <h4>{getName(cat)}</h4>
                      <p>{cat._count?.products || 0} Items</p>
                    </div>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Small Banners */}
      <div className="small-banner pb-100">
        <div className="container wow fadeInUp" data-wow-delay=".25s">
          <div className="row g-4">
            {(promoBanners.length > 0 ? promoBanners : [
              { label: 'Travel Sale', title: 'Best Travel Sale\nCollections', image: '/assets/img/banner/mini-banner-1.jpg', buttonLabel: 'Shop Now' },
              { label: 'Hot Sale', title: 'Headphone Sale\nCollections', image: '/assets/img/banner/mini-banner-2.jpg', buttonLabel: 'Discover Now' },
              { label: 'Shoe Sale', title: 'Summer Shoe Sale\nUp To 50% Off', image: '/assets/img/banner/mini-banner-3.jpg', buttonLabel: 'Discover Now' },
            ]).slice(0, 3).map((banner, i) => (
              <div className="col-12 col-md-6 col-lg-4" key={i}>
                <div className="banner-item">
                  <img src={banner.image || `/assets/img/banner/mini-banner-${i+1}.jpg`} alt="" />
                  <div className="banner-content">
                    <p>{banner.label}</p>
                    <h3 dangerouslySetInnerHTML={{ __html: (banner.title || '').replace(/\n/g, '<br/>') }} />
                    <Link href={banner.buttonHref || '/search'}>{banner.buttonLabel || 'Shop Now'}</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trending Items */}
      <div className="product-area pb-100">
        <div className="container">
          <div className="row">
            <div className="col-12 wow fadeInDown" data-wow-delay=".25s">
              <div className="site-heading-inline">
                <h2 className="site-title">Trending Items</h2>
                <Link href="/search">View More <i className="fas fa-angle-double-right"></i></Link>
              </div>
            </div>
          </div>
          <div className="product-wrap item-2 wow fadeInUp" data-wow-delay=".25s">
            <div className="product-slider owl-carousel owl-theme">
              {trendingProducts.map(p => (
                <MocartProductItem key={p.id} product={p} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sponsored Products */}
      {sponsoredProducts.length > 0 && (
        <div className="product-area pb-100">
          <div className="container">
            <div className="row">
              <div className="col-12 wow fadeInDown" data-wow-delay=".25s">
                <div className="site-heading-inline">
                  <h2 className="site-title"><i className="fas fa-bolt me-2" style={{ color: 'var(--theme-color)' }}></i>Sponsored Products</h2>
                  <Link href="/search?sponsored=true">View All <i className="fas fa-angle-double-right"></i></Link>
                </div>
              </div>
            </div>
            <div className="product-wrap item-2 wow fadeInUp" data-wow-delay=".25s">
              <div className="product-slider owl-carousel owl-theme">
                {sponsoredProducts.map(p => (
                  <MocartProductItem key={p.id} product={p} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feature Area */}
      <div className="feature-area pb-100">
        <div className="container wow fadeInUp" data-wow-delay=".25s">
          <div className="feature-wrap">
            <div className="row g-0">
              {(features.length > 0 ? features : [
                { title: 'Free Delivery', desc: `Orders Over ${formatPrice(5000)}`, icon: 'delivery-2.svg' },
                { title: 'Get Refund', desc: 'Within 30 Days Returns', icon: 'refund.svg' },
                { title: 'Safe Payment', desc: '100% Secure Payment', icon: 'payment.svg' },
                { title: '24/7 Support', desc: 'Feel Free To Call Us', icon: 'support.svg' },
              ]).map((feature, i) => (
                <div className="col-12 col-md-6 col-lg-3" key={i}>
                  <div className="feature-item">
                    <div className="feature-icon">
                      <img src={feature.image || `/assets/img/icon/${feature.icon || 'delivery-2.svg'}`} alt="" />
                    </div>
                    <div className="feature-content">
                      <h4>{feature.title}</h4>
                      <p>{feature.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Popular Items (Tabbed by Category) */}
      <div className="product-area">
        <div className="container">
          <div className="row g-4">
            <div className="col-lg-3">
              <div className="product-banner wow fadeInLeft" data-wow-delay=".25s">
                <Link href="/search">
                  <img src={home.productBannerImage || '/assets/img/banner/product-banner.jpg'} alt="" />
                </Link>
              </div>
            </div>
            <div className="col-lg-9">
              <div className="row">
                <div className="col-12 wow fadeInDown" data-wow-delay=".25s">
                  <div className="site-heading-inline">
                    <h2 className="site-title">Popular Items</h2>
                    <Link href="/search">All Products <i className="fas fa-angle-double-right"></i></Link>
                  </div>
                  <div className="item-tab">
                    <ul className="nav nav-pills mt-40 mb-50" role="tablist">
                      {tabCategories.map((cat, i) => (
                        <li className="nav-item" key={cat.id} role="presentation">
                          <button
                            className={`nav-link${activeTab === i ? ' active' : ''}`}
                            onClick={() => setActiveTab(i)}
                            type="button"
                            role="tab"
                          >
                            {getName(cat)}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
              <div className="wow fadeInUp" data-wow-delay=".25s">
                <div className="row g-3 item-2">
                  {getTabProducts(activeTab).slice(0, 8).map(p => (
                    <div className="col-md-6 col-lg-4 col-xl-3" key={p.id}>
                      <MocartProductItem product={p} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Brand Area */}
      <div className="brand-area py-100">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <div className="site-heading-inline">
                <h2 className="site-title">{brands.title || 'Popular Brands'}</h2>
                <Link href="/search">All Brands <i className="fas fa-angle-double-right"></i></Link>
              </div>
            </div>
          </div>
          <div className="brand-slider owl-carousel owl-theme">
            {(brandItems.length > 0 ? brandItems : [1,2,3,4,5,6].map(n => ({ image: `/assets/img/brand/0${n}.png` }))).map((brand, i) => (
              <div className="brand-item" key={i}>
                <Link href="/search">
                  <img src={brand.image || `/assets/img/brand/0${i+1}.png`} alt={brand.name || ''} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Big Banner */}
      <div className="big-banner">
        <div className="container wow fadeInUp" data-wow-delay=".25s">
          <div className="banner-wrap" style={{ backgroundImage: `url(${bigBanner.image || '/assets/img/banner/big-banner.jpg'})` }}>
            <div className="row">
              <div className="col-lg-8 mx-auto">
                <div className="banner-content">
                  <div className="banner-info">
                    <h6>{bigBanner.subtitle || 'Mega Collections'}</h6>
                    <h2>{bigBanner.title ? bigBanner.title.split(/(\d+%)/).map((part, i) => /\d+%/.test(part) ? <span key={i}>{part}</span> : part) : <>Huge Sale Up To <span>40%</span> Off</>}</h2>
                    <p>{bigBanner.description || 'at our outlet stores'}</p>
                  </div>
                  <Link href={bigBanner.buttonHref || '/search'} className="theme-btn">
                    {bigBanner.buttonLabel || 'Shop Now'}<i className="fas fa-arrow-right"></i>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Featured Items */}
      <div className="product-area pt-80">
        <div className="container">
          <div className="row">
            <div className="col-12 wow fadeInDown" data-wow-delay=".25s">
              <div className="site-heading-inline">
                <h2 className="site-title">Featured Items</h2>
                <Link href="/search">View More <i className="fas fa-angle-double-right"></i></Link>
              </div>
            </div>
          </div>
          <div className="product-wrap item-2 wow fadeInUp" data-wow-delay=".25s">
            <div className="product-slider owl-carousel owl-theme">
              {featuredProducts.map(p => (
                <MocartProductItem key={p.id} product={p} />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Video Area */}
      <div className="video-area pt-100">
        <div className="container-fluid px-0">
          <div className="video-content" style={{ backgroundImage: `url(${home.video?.backgroundImage || '/assets/img/video/01.jpg'})` }}>
            <div className="video-wrapper">
              <a className="play-btn popup-youtube" href={home.video?.videoUrl || 'https://www.youtube.com/watch?v=jLS3DrTJrpI'}>
                <i className="fas fa-play"></i>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Product List (On Sale, Best Seller, Top Rated) */}
      <div className="product-list py-100">
        <div className="container wow fadeInUp" data-wow-delay=".25s">
          <div className="row g-4">
            <div className="col-12 col-md-6 col-lg-6 col-xl-4">
              <div className="product-list-box border">
                <h2 className="product-list-title">On Sale</h2>
                {onSaleProducts.map(p => <MocartProductListItem key={p.id} product={p} />)}
                {onSaleProducts.length === 0 && products.slice(0, 3).map(p => <MocartProductListItem key={p.id} product={p} />)}
              </div>
            </div>
            <div className="col-12 col-md-6 col-lg-6 col-xl-4">
              <div className="product-list-box border">
                <h2 className="product-list-title">Best Seller</h2>
                {bestSellerProducts.map(p => <MocartProductListItem key={p.id} product={p} />)}
              </div>
            </div>
            <div className="col-12 col-md-6 col-lg-6 col-xl-4">
              <div className="product-list-box border">
                <h2 className="product-list-title">Top Rated</h2>
                {topRatedProducts.map(p => <MocartProductListItem key={p.id} product={p} />)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Deal Area */}
      <div className="deal-area pt-50 pb-50">
        <div className="deal-text-shape">Deal</div>
        <div className="container">
          <div className="deal-wrap wow fadeInUp" data-wow-delay=".25s">
            <div className="deal-slider owl-carousel owl-theme">
              <div className="deal-item">
                <div className="row align-items-center">
                  <div className="col-lg-6">
                    <div className="deal-content">
                      <div className="deal-info">
                        <span>{dealOfWeek.badge || 'Weekly Deal'}</span>
                        <h1>{dealOfWeek.title || 'Best Deal For This Week'}</h1>
                        <p>{dealOfWeek.description || 'There are many variations of passages available but the majority have suffered alteration in some form.'}</p>
                      </div>
                      <div className="deal-countdown">
                        <div className="countdown" data-countdown="2027/12/30"></div>
                      </div>
                      <Link href={dealOfWeek.buttonHref || '/search'} className="theme-btn theme-btn2">
                        {dealOfWeek.buttonLabel || 'Shop Now'} <i className="fas fa-arrow-right"></i>
                      </Link>
                    </div>
                  </div>
                  <div className="col-lg-6">
                    <div className="deal-img">
                      <img src={dealOfWeek.image || '/assets/img/deal/01.png'} alt="" />
                      <div className="deal-discount">
                        <span>{dealOfWeek.discountPercent || '35'}%</span>
                        <span>off</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Gallery Area */}
      <div className="gallery-area pb-100">
        <div className="container">
          <div className="row">
            <div className="col-lg-6 mx-auto wow fadeInDown" data-wow-delay=".25s">
              <div className="site-heading text-center">
                <span className="site-title-tagline">{gallery.tagline || 'Our Gallery'}</span>
                <h2 className="site-title">{gallery.title ? gallery.title.split(' ').slice(0, -1).join(' ') : "Let's Check Our Photo"} <span>{gallery.title ? gallery.title.split(' ').pop() : 'Gallery'}</span></h2>
              </div>
            </div>
          </div>
          <div className="row g-4 popup-gallery">
            {galleryImages.map((item, i) => (
              <div className={item.size || 'col-md-4 col-lg-3'} key={i}>
                <div className="gallery-item wow fadeInDown" data-wow-delay=".25s">
                  <div className="gallery-img">
                    <img src={item.image} alt="" />
                    <a
                      className="gallery-link"
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        openGallery(i);
                      }}
                    >
                      <i className="fal fa-plus"></i>
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonial Area */}
      <div className="testimonial-area ts-bg py-80">
        <div className="container">
          <div className="row">
            <div className="col-lg-6 mx-auto wow fadeInDown" data-wow-delay=".25s">
              <div className="site-heading text-center">
                <span className="site-title-tagline">{testimonials.tagline || 'Testimonials'}</span>
                <h2 className="site-title text-white">{testimonials.title || "What Our Client Say's"} <span>About Us</span></h2>
              </div>
            </div>
          </div>
          <div className="testimonial-slider owl-carousel owl-theme wow fadeInUp" data-wow-delay=".25s">
            {(testimonialItems.length > 0 ? testimonialItems : [
              { name: 'Sylvia H Green', role: 'Customer', image: '/assets/img/testimonial/01.jpg', text: 'There are many variations of long passages available but the content majority have suffered to the editor page when looking at its layout alteration in some injected.' },
              { name: 'Gordo Novak', role: 'Customer', image: '/assets/img/testimonial/02.jpg', text: 'There are many variations of long passages available but the content majority have suffered to the editor page when looking at its layout alteration in some injected.' },
              { name: 'Reid E Butt', role: 'Customer', image: '/assets/img/testimonial/03.jpg', text: 'There are many variations of long passages available but the content majority have suffered to the editor page when looking at its layout alteration in some injected.' },
              { name: 'Parker Jimenez', role: 'Customer', image: '/assets/img/testimonial/04.jpg', text: 'There are many variations of long passages available but the content majority have suffered to the editor page when looking at its layout alteration in some injected.' },
            ]).map((t, i) => (
              <div className="testimonial-item" key={i}>
                <div className="testimonial-author">
                  <div className="testimonial-author-img">
                    <img src={t.image || `/assets/img/testimonial/0${i+1}.jpg`} alt="" />
                  </div>
                  <div className="testimonial-author-info">
                    <h4>{t.name}</h4>
                    <p>{t.role || 'Customer'}</p>
                  </div>
                </div>
                <div className="testimonial-quote">
                  <p>{t.text}</p>
                </div>
                <div className="testimonial-rate">
                  {[...Array(t.rating || 5)].map((_, si) => <i className="fas fa-star" key={si}></i>)}
                </div>
                <div className="testimonial-quote-icon"><img src="/assets/img/icon/quote.svg" alt="" /></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Gallery Modal (fallback for Magnific Popup) */}
      {galleryOpen && (
        <div className="gallery-modal" role="dialog" aria-modal="true">
          <div className="gallery-modal-backdrop" onClick={closeGallery} />
          <div className="gallery-modal-content">
            <button type="button" className="gallery-modal-close" onClick={closeGallery} aria-label="Close">
              <i className="fas fa-times"></i>
            </button>
            <div className="gallery-modal-body">
              <button className="gallery-modal-nav prev" onClick={goPrev} aria-label="Previous">
                <i className="fas fa-chevron-left"></i>
              </button>
              <img src={galleryImages[galleryIndex]?.image} alt="Gallery" />
              <button className="gallery-modal-nav next" onClick={goNext} aria-label="Next">
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Blog Area */}
      <div className="blog-area py-100">
        <div className="container">
          <div className="row">
            <div className="col-lg-6 mx-auto wow fadeInDown" data-wow-delay=".25s">
              <div className="site-heading text-center">
                <span className="site-title-tagline">{home.blog?.tagline || 'Our Blog'}</span>
                <h2 className="site-title">{home.blog?.title || 'Our Latest News &'} <span>Blog</span></h2>
              </div>
            </div>
          </div>
          <div className="row g-4">
            {(blogItems.length > 0 ? blogItems : [
              { image: '/assets/img/blog/01.jpg', date: 'Aug 12, 2025', author: 'Alicia Davis', comments: '2.5k', title: 'There are many variations of passage available majority suffered.', excerpt: 'There are many variations available the majority have suffered alteration randomised words.' },
              { image: '/assets/img/blog/02.jpg', date: 'Aug 15, 2025', author: 'Alicia Davis', comments: '3.1k', title: 'Contrary to popular belief making simply random text latin.', excerpt: 'There are many variations available the majority have suffered alteration randomised words.' },
              { image: '/assets/img/blog/03.jpg', date: 'Aug 18, 2025', author: 'Alicia Davis', comments: '1.6k', title: 'If you are going use passage you need sure there middle text.', excerpt: 'There are many variations available the majority have suffered alteration randomised words.' },
            ]).slice(0, 3).map((blog, i) => (
              <div className="col-md-6 col-lg-4" key={i}>
                <div className="blog-item wow fadeInUp" data-wow-delay=".25s">
                  <div className="blog-item-img">
                    <img src={blog.image || `/assets/img/blog/0${i+1}.jpg`} alt="" />
                    <span className="blog-date"><i className="far fa-calendar-alt"></i> {blog.date}</span>
                  </div>
                  <div className="blog-item-info">
                    <div className="blog-item-meta">
                      <ul>
                        <li><a href="#"><i className="far fa-user-circle"></i> By {blog.author}</a></li>
                        <li><a href="#"><i className="far fa-comments"></i> {blog.comments} Comments</a></li>
                      </ul>
                    </div>
                    <h4 className="blog-title">
                      <a href="#">{blog.title}</a>
                    </h4>
                    <p>{blog.excerpt}</p>
                    <a className="theme-btn" href="#">Read More<i className="fas fa-arrow-right"></i></a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Newsletter Area */}
      <div className="newsletter-area pb-100">
        <div className="container wow fadeInUp" data-wow-delay=".25s">
          <div className="newsletter-wrap">
            <div className="row">
              <div className="col-lg-6 mx-auto">
                <div className="newsletter-content">
                  <h3>{newsletter.title ? newsletter.title.split(/(\d+%)/).map((part, i) => /\d+%/.test(part) ? <span key={i}>{part}</span> : part) : <>Get <span>20%</span> Off Discount Coupon</>}</h3>
                  <p>{newsletter.description || 'By Subscribe Our Newsletter'}</p>
                  <div className="subscribe-form">
                    <form onSubmit={e => e.preventDefault()}>
                      <input type="email" className="form-control" placeholder="Your Email Address" />
                      <button className="theme-btn" type="submit">
                        {newsletter.buttonLabel || 'Subscribe'} <i className="far fa-paper-plane"></i>
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Instagram Area */}
      <div className="instagram-area pb-100">
        <div className="container wow fadeInUp" data-wow-delay=".25s">
          <div className="row">
            <div className="col-lg-6 mx-auto">
              <div className="site-heading text-center">
                <h2 className="site-title">Instagram <span>{home.instagram?.title || '@sawdagar'}</span></h2>
              </div>
            </div>
          </div>
          <div className="instagram-slider owl-carousel owl-theme">
            {(instagramItems.length > 0 ? instagramItems : [1,2,3,4,5,6,7].map(n => ({ image: `/assets/img/instagram/0${n}.jpg` }))).map((item, i) => (
              <div className="instagram-item" key={i}>
                <div className="instagram-img">
                  <img src={item.image || `/assets/img/instagram/0${i+1}.jpg`} alt="" />
                  <a href="#"><i className="fab fa-instagram"></i></a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function getCategoryIcon(slug) {
  const iconMap = {
    'fashion': 'fashion.svg', 'electronics': 'electronics.svg', 'grocery': 'grocery.svg',
    'furniture': 'furniture.svg', 'music': 'music.svg', 'toys': 'toy.svg', 'toy': 'toy.svg',
    'gifts': 'gift.svg', 'gift': 'gift.svg', 'babies': 'baby-mom.svg', 'baby': 'baby-mom.svg',
    'beauty': 'beauty.svg', 'health': 'beauty.svg', 'sports': 'sports.svg', 'sport': 'sports.svg',
    'garden': 'garden.svg', 'automotive': 'automotive.svg', 'auto': 'automotive.svg',
  };
  if (!slug) return 'new.svg';
  for (const [key, icon] of Object.entries(iconMap)) {
    if (slug.includes(key)) return icon;
  }
  return 'new.svg';
}
