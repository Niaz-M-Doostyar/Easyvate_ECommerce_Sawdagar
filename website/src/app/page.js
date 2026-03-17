'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteData } from '@/contexts/SiteDataContext';
import MocartInit from '@/components/MocartInit';
import MocartProductItem, { MocartProductListItem } from '@/components/MocartProductItem';
import { formatPrice, CURRENCY_SYMBOL } from '@/lib/currency';

export default function HomePage() {
  const { lang } = useLanguage();
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
  const newsletter = home.newsletter || {};
  const brands = home.brands || {};
  const brandItems = home.brandItems || [];
  const instagramItems = home.instagramItems || [];

  const [videoPlaying, setVideoPlaying] = useState(false);
  const videoUrl = home.video?.videoUrl || 'https://www.youtube.com/watch?v=jLS3DrTJrpI';

  // Extract YouTube video ID
  const getYouTubeId = (url) => {
    const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]+)/);
    return m ? m[1] : null;
  };

  const [subscribeEmail, setSubscribeEmail] = useState('');
  const [subscribeStatus, setSubscribeStatus] = useState(null); // null | 'loading' | 'success' | 'error'
  const [subscribeMsg, setSubscribeMsg] = useState('');
  const [blogPosts, setBlogPosts] = useState([]);

  useEffect(() => {
    fetch('/api/blog?limit=3').then(r => r.json()).then(d => setBlogPosts(d.posts || [])).catch(() => {});
  }, []);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!subscribeEmail) return;
    setSubscribeStatus('loading');
    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: subscribeEmail }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubscribeStatus('success');
        setSubscribeMsg(data.couponCode ? `Welcome! Use code ${data.couponCode} for 10% off!` : 'Subscribed successfully!');
        setSubscribeEmail('');
      } else {
        setSubscribeStatus('error');
        setSubscribeMsg(data.error || 'Something went wrong');
      }
    } catch {
      setSubscribeStatus('error');
      setSubscribeMsg('Network error. Please try again.');
    }
  };

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
      <div className="hero-section hs-1" style={{ marginTop: 0 }}>
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
                          <Link href={hero.secondaryButtonHref || '/search'} className="theme-btn theme-btn2">
                            {hero.secondaryButtonLabel || 'Explore Products'}<i className="fas fa-arrow-right"></i>
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
                          <img src={slide.image} alt="" fetchPriority={i === 0 ? "high" : "low"} />
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
                  <img src={banner.image || `/assets/img/banner/mini-banner-${i+1}.jpg`} alt="" loading="lazy" />
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
                      <img src={feature.image || `/assets/img/icon/${feature.icon || 'delivery-2.svg'}`} alt="" loading="lazy" />
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
                  <img src={home.productBannerImage || '/assets/img/banner/product-banner.jpg'} alt="" loading="lazy" />
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
                  <img src={brand.image || `/assets/img/brand/0${i+1}.png`} alt={brand.name || ''} loading="lazy" />
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
          <div className="video-content" style={{ backgroundImage: !videoPlaying ? `url(${home.video?.backgroundImage || '/assets/img/video/01.jpg'})` : 'none', position: 'relative', overflow: 'hidden' }}>
            {videoPlaying ? (
              <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%' }}>
                <iframe
                  src={`https://www.youtube.com/embed/${getYouTubeId(videoUrl)}?autoplay=1&rel=0`}
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
                  allow="autoplay; encrypted-media"
                  allowFullScreen
                  title="Video"
                />
              </div>
            ) : (
              <div className="video-wrapper">
                <button
                  className="play-btn"
                  onClick={() => setVideoPlaying(true)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                  aria-label="Play video"
                >
                  <i className="fas fa-play"></i>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Product List (On Sale, Best Seller, Top Rated) */}
      <div className="product-list py-100">
        <div className="container wow fadeInUp" data-wow-delay=".25s">
          <div className="row g-4">
            <div className="col-12 col-md-6 col-lg-6 col-xl-4">
              <div className="product-list-box border">
                <Link href="/search?sort=price_asc" style={{textDecoration:'none'}}><h2 className="product-list-title" style={{cursor:'pointer'}}>On Sale <i className="fas fa-angle-right" style={{fontSize:14,marginLeft:6}}></i></h2></Link>
                {onSaleProducts.map(p => <MocartProductListItem key={p.id} product={p} />)}
                {onSaleProducts.length === 0 && products.slice(0, 3).map(p => <MocartProductListItem key={p.id} product={p} />)}
              </div>
            </div>
            <div className="col-12 col-md-6 col-lg-6 col-xl-4">
              <div className="product-list-box border">
                <Link href="/search?sort=best_seller" style={{textDecoration:'none'}}><h2 className="product-list-title" style={{cursor:'pointer'}}>Best Seller <i className="fas fa-angle-right" style={{fontSize:14,marginLeft:6}}></i></h2></Link>
                {bestSellerProducts.map(p => <MocartProductListItem key={p.id} product={p} />)}
              </div>
            </div>
            <div className="col-12 col-md-6 col-lg-6 col-xl-4">
              <div className="product-list-box border">
                <Link href="/search?sort=price_desc" style={{textDecoration:'none'}}><h2 className="product-list-title" style={{cursor:'pointer'}}>Top Rated <i className="fas fa-angle-right" style={{fontSize:14,marginLeft:6}}></i></h2></Link>
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
                      <Link href={dealOfWeek.buttonHref || '/search?sort=price_asc&inStock=true'} className="theme-btn theme-btn2">
                        {dealOfWeek.buttonLabel || 'Shop Now'} <i className="fas fa-arrow-right"></i>
                      </Link>
                    </div>
                  </div>
                  <div className="col-lg-6">
                    <div className="deal-img">
                      <img src={dealOfWeek.image || '/assets/img/deal/01.png'} alt="" loading="lazy" />
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
                    <img src={item.image} alt="" loading="lazy" />
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
                    <img src={t.image || `/assets/img/testimonial/0${i+1}.jpg`} alt="" loading="lazy" />
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
            {(blogPosts.length > 0 ? blogPosts : [
              { slug: '#', image: '/assets/img/blog/01.jpg', createdAt: '2025-08-12', authorName: 'Admin', viewCount: 0, titleEn: 'There are many variations of passage available majority suffered.', excerptEn: 'There are many variations available the majority have suffered alteration randomised words.' },
              { slug: '#', image: '/assets/img/blog/02.jpg', createdAt: '2025-08-15', authorName: 'Admin', viewCount: 0, titleEn: 'Contrary to popular belief making simply random text latin.', excerptEn: 'There are many variations available the majority have suffered alteration randomised words.' },
              { slug: '#', image: '/assets/img/blog/03.jpg', createdAt: '2025-08-18', authorName: 'Admin', viewCount: 0, titleEn: 'If you are going use passage you need sure there middle text.', excerptEn: 'There are many variations available the majority have suffered alteration randomised words.' },
            ]).slice(0, 3).map((blog, i) => {
              const blogTitle = lang === 'ps' ? (blog.titlePs || blog.titleEn) : lang === 'dr' ? (blog.titleDr || blog.titleEn) : blog.titleEn;
              const blogExcerpt = lang === 'ps' ? (blog.excerptPs || blog.excerptEn) : lang === 'dr' ? (blog.excerptDr || blog.excerptEn) : blog.excerptEn;
              return (
              <div className="col-md-6 col-lg-4" key={blog.id || i}>
                <div className="blog-item wow fadeInUp" data-wow-delay=".25s">
                  <div className="blog-item-img">
                    <img src={blog.image || `/assets/img/blog/0${i+1}.jpg`} alt={blogTitle} loading="lazy" onError={e => { e.target.src = `/assets/img/blog/0${(i%3)+1}.jpg`; }} />
                    <span className="blog-date"><i className="far fa-calendar-alt"></i> {new Date(blog.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  </div>
                  <div className="blog-item-info">
                    <div className="blog-item-meta">
                      <ul>
                        <li><i className="far fa-user-circle"></i> By {blog.authorName || 'Admin'}</li>
                        <li><i className="far fa-eye"></i> {blog.viewCount || 0} Views</li>
                      </ul>
                    </div>
                    <h4 className="blog-title">
                      <Link href={blog.slug === '#' ? '#' : `/blog/${blog.slug}`}>{blogTitle}</Link>
                    </h4>
                    <p>{blogExcerpt}</p>
                    <Link className="theme-btn" href={blog.slug === '#' ? '#' : `/blog/${blog.slug}`}>Read More<i className="fas fa-arrow-right"></i></Link>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
          {blogPosts.length > 0 && (
            <div className="text-center mt-4">
              <Link href="/blog" className="theme-btn">View All Posts <i className="fas fa-arrow-right"></i></Link>
            </div>
          )}
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
                    {subscribeStatus === 'success' ? (
                      <div className="alert alert-success text-center" style={{ borderRadius: 30, padding: '12px 20px' }}>{subscribeMsg}</div>
                    ) : (
                      <form onSubmit={handleSubscribe}>
                        <input type="email" className="form-control" placeholder="Your Email Address" value={subscribeEmail} onChange={e => setSubscribeEmail(e.target.value)} required />
                        <button className="theme-btn" type="submit" disabled={subscribeStatus === 'loading'}>
                          {subscribeStatus === 'loading' ? 'Subscribing...' : (newsletter.buttonLabel || 'Subscribe')} <i className="far fa-paper-plane"></i>
                        </button>
                      </form>
                    )}
                    {subscribeStatus === 'error' && <p className="text-danger mt-2 text-center" style={{ fontSize: 14 }}>{subscribeMsg}</p>}
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
            {(instagramItems.length > 0 ? instagramItems : products.slice(0, 7).map(p => ({ image: p.images?.[0] || `/assets/img/instagram/01.jpg`, link: `/products/${p.slug || p.id}` }))).concat(
              instagramItems.length === 0 && products.length < 7 ? [1,2,3,4,5,6,7].slice(products.length).map(n => ({ image: `/assets/img/instagram/0${n}.jpg`, link: '#' })) : []
            ).map((item, i) => (
              <div className="instagram-item" key={i}>
                <div className="instagram-img">
                  <img src={item.image || `/assets/img/instagram/0${i+1}.jpg`} alt="" loading="lazy" onError={e => { e.target.src = `/assets/img/instagram/0${(i%7)+1}.jpg`; }} />
                  <Link href={item.link || '#'}><i className="fab fa-instagram"></i></Link>
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
