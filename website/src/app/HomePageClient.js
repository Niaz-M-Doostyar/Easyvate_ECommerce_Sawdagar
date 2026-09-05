'use client';

import { Fragment, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSiteData } from '@/contexts/SiteDataContext';
import MocartProductItem, { MocartProductListItem } from '@/components/MocartProductItem';
import { DealCountdown, StorefrontCarousel, StorefrontHero } from '@/components/StorefrontCarousel';

function asArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function imageSource(value) {
  const source = typeof value === 'string'
    ? value.trim()
    : value?.image || value?.url || value?.src || '';

  if (!source) return '';
  if (source.startsWith('http') || source.startsWith('//') || source.startsWith('/') || source.startsWith('data:')) {
    return source;
  }
  return '/' + source;
}

function localizedValue(item, field, lang) {
  if (!item) return '';
  if (lang === 'ps') return item[field + 'Ps'] || item[field + 'En'] || item[field] || '';
  if (lang === 'dr') return item[field + 'Dr'] || item[field + 'En'] || item[field] || '';
  return item[field + 'En'] || item[field] || '';
}

function getYouTubeId(url) {
  if (typeof url !== 'string') return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|shorts\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s/]+)/);
  return match ? match[1] : null;
}

function productBelongsToCategory(product, category) {
  const productCategoryId = product?.categoryId || product?.category?.id;
  if (productCategoryId && category?.id && String(productCategoryId) === String(category.id)) return true;
  return Boolean(product?.category?.slug && category?.slug && product.category.slug === category.slug);
}

function formatBlogDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return String(value);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

async function fetchPublicJson(url, signal) {
  const response = await fetch(url, { cache: 'no-store', signal });
  if (!response.ok) throw new Error('Request failed');
  return response.json();
}

function MultilineText({ value }) {
  const lines = String(value || '').split(/\r?\n/);
  return lines.map((line, index) => (
    <Fragment key={index}>
      {line}
      {index < lines.length - 1 && <br />}
    </Fragment>
  ));
}

function SectionHeading({
  eyebrow,
  title,
  description,
  actionHref,
  actionLabel,
  centered = false,
}) {
  if (!eyebrow && !title && !description) return null;

  return (
    <div className={'sd-section-heading' + (centered ? ' sd-section-heading-center' : '')}>
      <div>
        {eyebrow && <span className="sd-eyebrow">{eyebrow}</span>}
        {title && <h2>{title}</h2>}
        {description && <p>{description}</p>}
      </div>
      {actionHref && actionLabel && (
        <Link href={actionHref} className="sd-text-link">
          {actionLabel} <i className="far fa-arrow-right" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}

function ProductCarouselSection({ title, products, href = '/search', actionLabel = 'View More', tinted = false, label }) {
  const items = asArray(products).filter((product) => product?.id);
  if (items.length === 0) return null;

  return (
    <section className={'sd-section' + (tinted ? ' sd-section-tint' : '')}>
      <div className="container">
        <SectionHeading title={title} actionHref={href} actionLabel={actionLabel} />
        <StorefrontCarousel className="storefront-product-carousel" label={label || title}>
          {items.map((product) => <MocartProductItem key={product.id} product={product} />)}
        </StorefrontCarousel>
      </div>
    </section>
  );
}

export default function HomePageClient({
  initialProducts = [],
  initialSponsoredProducts = [],
  initialBlogPosts = [],
}) {
  const { lang } = useLanguage();
  const { categories: siteCategories, siteContent, getName: siteGetName } = useSiteData();
  const [products, setProducts] = useState(asArray(initialProducts));
  const [sponsoredProducts, setSponsoredProducts] = useState(asArray(initialSponsoredProducts));
  const [blogPosts, setBlogPosts] = useState(asArray(initialBlogPosts));
  const [activeTab, setActiveTab] = useState(null);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [subscribeEmail, setSubscribeEmail] = useState('');
  const [subscribeStatus, setSubscribeStatus] = useState(null);
  const [subscribeMsg, setSubscribeMsg] = useState('');

  const getName = useCallback(
    (item) => siteGetName(item, lang) || item?.name || '',
    [siteGetName, lang],
  );

  useEffect(() => {
    const controller = new AbortController();

    Promise.allSettled([
      fetchPublicJson('/api/products?limit=50&status=approved', controller.signal),
      fetchPublicJson('/api/products/sponsored', controller.signal),
      fetchPublicJson('/api/blog?limit=3', controller.signal),
    ]).then(([productsResult, sponsoredResult, blogResult]) => {
      if (controller.signal.aborted) return;

      if (productsResult.status === 'fulfilled') {
        const payload = productsResult.value;
        const nextProducts = Array.isArray(payload?.products)
          ? payload.products
          : Array.isArray(payload) ? payload : [];
        setProducts(nextProducts);
      }

      if (sponsoredResult.status === 'fulfilled') {
        const payload = sponsoredResult.value;
        const nextSponsored = Array.isArray(payload?.products)
          ? payload.products
          : Array.isArray(payload) ? payload : [];
        setSponsoredProducts(nextSponsored);
      }

      if (blogResult.status === 'fulfilled') {
        const payload = blogResult.value;
        const nextPosts = Array.isArray(payload?.posts)
          ? payload.posts
          : Array.isArray(payload) ? payload : [];
        setBlogPosts(nextPosts);
      }
    });

    return () => controller.abort();
  }, []);

  const home = siteContent?.home || {};
  const hero = home.hero || {};
  const categories = asArray(siteCategories).filter((category) => (
    category?.id && category?.slug && getName(category)
  ));
  const promoBanners = asArray(home.promoBanners).filter((banner) => imageSource(banner?.image));
  const features = asArray(home.features).filter((feature) => (
    feature?.title || feature?.desc || feature?.description || feature?.image || feature?.icon
  ));
  const brandsConfig = home.brands || {};
  const brandItems = asArray(home.brandItems).filter((brand) => brand?.name || imageSource(brand?.image));
  const bigBanner = home.bigBanner || {};
  const video = home.video || {};
  const dealOfWeek = home.dealOfWeek || {};
  const gallery = home.gallery || {};
  const testimonials = home.testimonials || {};
  const testimonialItems = asArray(home.testimonialItems).filter((item) => item?.text || item?.review || item?.comment || item?.name);
  const blogConfig = home.blog || {};
  const newsletter = home.newsletter || {};
  const instagram = home.instagram || {};
  const instagramItems = asArray(home.instagramItems)
    .map((item) => ({ ...item, resolvedImage: imageSource(item?.image) }))
    .filter((item) => item.resolvedImage);

  const configuredSlides = asArray(hero.slides)
    .map((slide) => ({ ...slide, image: imageSource(slide?.image) }))
    .filter((slide) => slide.subtitle || slide.title || slide.description || slide.image || slide.priceValue);
  const singleConfiguredSlide = {
    subtitle: hero.badge,
    title: Array.isArray(hero.titleLines) ? hero.titleLines.filter(Boolean).join(' ') : hero.title,
    description: hero.description,
    image: imageSource(hero.image),
    priceLabel: hero.priceLabel,
    priceValue: hero.priceValue,
  };
  const heroSlides = configuredSlides.length > 0
    ? configuredSlides
    : Object.values(singleConfiguredSlide).some(Boolean) ? [singleConfiguredSlide] : [];

  const realProducts = asArray(products).filter((product) => product?.id);
  const realSponsoredProducts = asArray(sponsoredProducts).filter((product) => product?.id);
  const trendingProducts = realProducts.slice(0, 20);
  const featuredProducts = realProducts.slice(0, 30);
  const onSaleProducts = realProducts.filter((product) => {
    const currentPrice = Number(product.retailPrice || 0);
    const compareAt = Number(product.suggestedPrice || product.wholesaleCost || 0);
    return currentPrice > 0 && compareAt > currentPrice;
  }).slice(0, 3);
  const bestSellerProducts = realProducts.slice(0, 3);
  const ratedProducts = realProducts.filter((product) => Number(product.averageRating || product.rating || 0) > 0);
  const topRatedProducts = (ratedProducts.length > 0
    ? [...ratedProducts].sort((a, b) => Number(b.averageRating || b.rating || 0) - Number(a.averageRating || a.rating || 0))
    : realProducts.slice(3, 6)
  ).slice(0, 3);

  const tabCategories = categories
    .filter((category) => realProducts.some((product) => productBelongsToCategory(product, category)))
    .slice(0, 6);
  const selectedCategory = tabCategories.find((category) => String(category.id) === String(activeTab))
    || tabCategories[0];
  const tabProducts = selectedCategory
    ? realProducts.filter((product) => productBelongsToCategory(product, selectedCategory)).slice(0, 8)
    : [];

  const videoId = getYouTubeId(video.videoUrl);
  const videoImage = imageSource(video.backgroundImage);
  const bigBannerImage = imageSource(bigBanner.image);
  const hasBigBanner = Boolean(bigBannerImage && (
    bigBanner.subtitle
    || bigBanner.title
    || bigBanner.description
    || (bigBanner.buttonLabel && bigBanner.buttonHref)
  ));
  const dealImage = imageSource(dealOfWeek.image);
  const dealTarget = dealOfWeek.endsAt || dealOfWeek.countdownDate;
  const hasDeal = Boolean(
    dealOfWeek.badge
    || dealOfWeek.title
    || dealOfWeek.description
    || dealImage
    || dealTarget
    || (dealOfWeek.buttonLabel && dealOfWeek.buttonHref)
  );
  const galleryImages = asArray(home.galleryImages)
    .map((item) => ({
      ...item,
      resolvedImage: imageSource(item?.image || item),
      isWide: typeof item?.size === 'string' && /col-(?:md|lg)-(?:6|8|12)/.test(item.size),
    }))
    .filter((item) => item.resolvedImage);
  const liveBlogPosts = asArray(blogPosts).filter((post) => localizedValue(post, 'title', lang));
  const hasNewsletter = Boolean(newsletter.buttonLabel && (newsletter.title || newsletter.description));

  useEffect(() => {
    setVideoPlaying(false);
  }, [video.videoUrl]);

  useEffect(() => {
    if (!galleryOpen) return undefined;
    if (galleryImages.length === 0) {
      setGalleryOpen(false);
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setGalleryOpen(false);
      if (event.key === 'ArrowRight') {
        setGalleryIndex((current) => (current + 1) % galleryImages.length);
      }
      if (event.key === 'ArrowLeft') {
        setGalleryIndex((current) => (current - 1 + galleryImages.length) % galleryImages.length);
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [galleryOpen, galleryImages.length]);

  const handleSubscribe = async (event) => {
    event.preventDefault();
    if (!subscribeEmail || subscribeStatus === 'loading') return;
    setSubscribeStatus('loading');
    setSubscribeMsg('');

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: subscribeEmail }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setSubscribeStatus('error');
        setSubscribeMsg(data.error || 'Something went wrong. Please try again.');
        return;
      }

      setSubscribeStatus('success');
      setSubscribeMsg(
        data.couponCode
          ? 'Welcome! Use code ' + data.couponCode + ' for 10% off!'
          : 'Subscribed successfully!',
      );
      setSubscribeEmail('');
    } catch {
      setSubscribeStatus('error');
      setSubscribeMsg('Network error. Please try again.');
    }
  };

  const openGallery = (index) => {
    setGalleryIndex(index);
    setGalleryOpen(true);
  };

  const listPanels = [
    { title: 'On Sale', href: '/search?sort=price_asc', products: onSaleProducts },
    { title: 'Best Seller', href: '/search?sort=best_seller', products: bestSellerProducts },
    { title: 'Top Rated', href: '/search?sort=price_desc', products: topRatedProducts },
  ].filter((panel) => panel.products.length > 0);

  return (
    <div className="f2-market-home sd-home">
      <StorefrontHero slides={heroSlides} hero={hero} />

      {features.length > 0 && (
        <section className="sd-feature-strip" aria-label="Shopping benefits">
          <div className="container">
            <div className="sd-feature-grid">
              {features.map((feature, index) => {
                const featureImage = imageSource(feature.image)
                  || (feature.icon ? '/assets/img/icon/' + feature.icon : '');
                return (
                  <article className="sd-feature" key={feature.id || feature.title || index}>
                    {featureImage && (
                      <span className="sd-feature-icon">
                        <img src={featureImage} alt="" loading="lazy" decoding="async" />
                      </span>
                    )}
                    <div>
                      {feature.title && <h3>{feature.title}</h3>}
                      {(feature.desc || feature.description) && <p>{feature.desc || feature.description}</p>}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {categories.length > 0 && (
        <section className="sd-section sd-category-section">
          <div className="container">
            <SectionHeading title="Top Category" actionHref="/search" actionLabel="View More" />
            <StorefrontCarousel className="storefront-category-carousel" label="Categories">
              {categories.map((category) => {
                const categoryImage = imageSource(category.image)
                  || getCategory3DIcon(category.slug)
                  || '/assets/img/icon/' + getCategoryIcon(category.slug);
                const productCount = category._count?.products ?? category.productCount ?? 0;
                return (
                  <article className="sd-category-card" key={category.id}>
                    <Link href={'/categories/' + category.slug}>
                      <span className="sd-category-image">
                        <img src={categoryImage} alt="" loading="lazy" decoding="async" />
                      </span>
                      <h3>{getName(category)}</h3>
                      <p>{productCount} Items</p>
                    </Link>
                  </article>
                );
              })}
            </StorefrontCarousel>
          </div>
        </section>
      )}

      {promoBanners.length > 0 && (
        <section className="sd-section-compact">
          <div className="container">
            <div className="sd-promo-grid">
              {promoBanners.slice(0, 3).map((banner, index) => (
                <article className="sd-promo-card" key={banner.id || banner.title || index}>
                  <img src={imageSource(banner.image)} alt="" loading="lazy" decoding="async" />
                  <span className="sd-promo-overlay" aria-hidden="true" />
                  <div className="sd-promo-content">
                    {banner.label && <span>{banner.label}</span>}
                    {banner.title && <h2><MultilineText value={banner.title} /></h2>}
                    {banner.buttonLabel && banner.buttonHref && (
                      <Link href={banner.buttonHref}>
                        {banner.buttonLabel} <i className="far fa-arrow-right" aria-hidden="true" />
                      </Link>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <ProductCarouselSection
        title="New Arrivals"
        products={trendingProducts}
        label="Trending products"
      />

      <ProductCarouselSection
        title="Sponsored Products"
        products={realSponsoredProducts}
        href="/search?sponsored=true"
        actionLabel="View All"
        label="Sponsored products"
        tinted
      />

      {tabCategories.length > 0 && tabProducts.length > 0 && (
        <section className="sd-section">
          <div className="container">
            <SectionHeading title="Popular Items" actionHref="/search" actionLabel="All Products" />
            <div className="sd-product-tabs" role="tablist" aria-label="Popular product categories">
              {tabCategories.map((category) => {
                const isActive = String(category.id) === String(selectedCategory?.id);
                return (
                  <button
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    className={isActive ? 'active' : ''}
                    key={category.id}
                    onClick={() => setActiveTab(category.id)}
                  >
                    {getName(category)}
                  </button>
                );
              })}
            </div>
            <div className="sd-product-grid">
              {tabProducts.map((product) => <MocartProductItem key={product.id} product={product} />)}
            </div>
          </div>
        </section>
      )}

      {brandItems.length > 0 && (
        <section className="sd-section sd-brand-section">
          <div className="container">
            <SectionHeading
              title={brandsConfig.title}
              actionHref="/search"
              actionLabel="All Brands"
            />
            <StorefrontCarousel className="storefront-brand-carousel" label="Brands">
              {brandItems.map((brand, index) => (
                <article className="sd-brand-card" key={brand.id || brand.name || index}>
                  <Link href={brand.href || brand.link || '/search'}>
                    {imageSource(brand.image) && (
                      <span className="sd-brand-logo">
                        <img src={imageSource(brand.image)} alt={brand.name || ''} loading="lazy" decoding="async" />
                      </span>
                    )}
                    {brand.name && <span className="sd-brand-name">{brand.name}</span>}
                    {(brand.location || brand.description) && <small>{brand.location || brand.description}</small>}
                  </Link>
                </article>
              ))}
            </StorefrontCarousel>
          </div>
        </section>
      )}

      {hasBigBanner && (
        <section className="sd-section">
          <div className="container">
            <div
              className="sd-collection-banner"
              style={{ '--sd-banner-image': 'url("' + bigBannerImage + '")' }}
            >
              <div className="sd-collection-copy">
                {bigBanner.subtitle && <span>{bigBanner.subtitle}</span>}
                {bigBanner.title && <h2>{bigBanner.title}</h2>}
                {bigBanner.description && <p>{bigBanner.description}</p>}
                {bigBanner.buttonLabel && bigBanner.buttonHref && (
                  <Link href={bigBanner.buttonHref} className="sd-button sd-button-light">
                    {bigBanner.buttonLabel} <i className="far fa-arrow-right" aria-hidden="true" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      <ProductCarouselSection
        title="Featured Items"
        products={featuredProducts}
        label="Featured products"
      />

      {videoId && (
        <section className="sd-section sd-editorial-section">
          <div className="container">
            <div
              className="sd-video-card"
              style={{ '--sd-video-image': videoImage ? 'url("' + videoImage + '")' : 'none' }}
            >
              {videoPlaying ? (
                <iframe
                  src={'https://www.youtube.com/embed/' + videoId + '?autoplay=1&rel=0'}
                  title={video.title || 'Sawdagar video'}
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="sd-video-cover">
                  {video.label && <span>{video.label}</span>}
                  {video.title && <h2>{video.title}</h2>}
                  <button type="button" onClick={() => setVideoPlaying(true)} aria-label="Play video">
                    <i className="fas fa-play" aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {listPanels.length > 0 && (
        <section className="sd-section sd-product-lists-section">
          <div className="container">
            <div className="sd-product-list-grid">
              {listPanels.map((panel) => (
                <article className="sd-product-list-panel" key={panel.title}>
                  <Link href={panel.href} className="sd-list-heading">
                    {panel.title} <i className="far fa-arrow-right" aria-hidden="true" />
                  </Link>
                  {panel.products.map((product) => (
                    <MocartProductListItem key={product.id} product={product} />
                  ))}
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {hasDeal && (
        <section className="sd-section sd-deal-section">
          <div className="container">
            <div
              className="sd-deal-card"
              style={dealImage ? undefined : { gridTemplateColumns: 'minmax(0, 1fr)' }}
            >
              <div className="sd-deal-copy">
                {dealOfWeek.badge && <span className="sd-deal-label">{dealOfWeek.badge}</span>}
                {dealOfWeek.title && <h2>{dealOfWeek.title}</h2>}
                {dealOfWeek.description && <p>{dealOfWeek.description}</p>}
                {dealTarget && <DealCountdown target={dealTarget} />}
                {dealOfWeek.buttonLabel && dealOfWeek.buttonHref && (
                  <Link href={dealOfWeek.buttonHref} className="sd-button sd-button-light">
                    {dealOfWeek.buttonLabel} <i className="far fa-arrow-right" aria-hidden="true" />
                  </Link>
                )}
              </div>
              {dealImage && (
                <div className="sd-deal-visual">
                  <img src={dealImage} alt="" loading="lazy" decoding="async" />
                  {dealOfWeek.discountPercent !== undefined && dealOfWeek.discountPercent !== '' && (
                    <span className="sd-deal-discount">
                      <strong>
                        {String(dealOfWeek.discountPercent).includes('%')
                          ? dealOfWeek.discountPercent
                          : dealOfWeek.discountPercent + '%'}
                      </strong>
                      <span>Off</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {galleryImages.length > 0 && (
        <section className="sd-section">
          <div className="container">
            <SectionHeading
              eyebrow={gallery.tagline}
              title={gallery.title}
              description={gallery.description}
              centered
            />
            <div className="sd-gallery-grid">
              {galleryImages.map((item, index) => (
                <button
                  type="button"
                  className={'sd-gallery-item' + (item.isWide ? ' sd-gallery-wide' : '')}
                  key={item.id || item.resolvedImage || index}
                  onClick={() => openGallery(index)}
                  aria-label={'Open gallery image ' + (index + 1)}
                >
                  <img src={item.resolvedImage} alt={item.alt || ''} loading="lazy" decoding="async" />
                  <span><i className="fal fa-plus" aria-hidden="true" /></span>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {galleryOpen && galleryImages[galleryIndex] && (
        <div className="sd-gallery-modal" role="dialog" aria-modal="true" aria-label="Gallery image viewer">
          <button type="button" className="sd-gallery-backdrop" onClick={() => setGalleryOpen(false)} aria-label="Close gallery" />
          <div className="sd-gallery-dialog">
            <img
              src={galleryImages[galleryIndex].resolvedImage}
              alt={galleryImages[galleryIndex].alt || ''}
            />
            <button type="button" className="sd-gallery-close" onClick={() => setGalleryOpen(false)} aria-label="Close gallery">
              <i className="far fa-times" aria-hidden="true" />
            </button>
            {galleryImages.length > 1 && (
              <>
                <button
                  type="button"
                  className="sd-gallery-nav sd-gallery-prev"
                  onClick={() => setGalleryIndex((current) => (current - 1 + galleryImages.length) % galleryImages.length)}
                  aria-label="Previous gallery image"
                >
                  <i className="far fa-arrow-left" aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="sd-gallery-nav sd-gallery-next"
                  onClick={() => setGalleryIndex((current) => (current + 1) % galleryImages.length)}
                  aria-label="Next gallery image"
                >
                  <i className="far fa-arrow-right" aria-hidden="true" />
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {testimonialItems.length > 0 && (
        <section className="sd-section sd-testimonial-section">
          <div className="container">
            <SectionHeading
              eyebrow={testimonials.tagline}
              title={testimonials.title}
              description={testimonials.description}
              centered
            />
            <StorefrontCarousel className="storefront-testimonial-carousel" label="Testimonials">
              {testimonialItems.map((item, index) => {
                const rating = Math.max(0, Math.min(5, Math.round(Number(item.rating || 0))));
                const text = item.text || item.review || item.comment;
                return (
                  <figure className="sd-testimonial-card" key={item.id || item.name || index}>
                    {rating > 0 && (
                      <div className="sd-testimonial-stars" aria-label={rating + ' out of 5 stars'}>
                        {Array.from({ length: rating }, (_, starIndex) => (
                          <i className="fas fa-star" aria-hidden="true" key={starIndex} />
                        ))}
                      </div>
                    )}
                    {text && <blockquote>{text}</blockquote>}
                    {(item.name || item.role || imageSource(item.image)) && (
                      <figcaption>
                        {imageSource(item.image) && (
                          <img src={imageSource(item.image)} alt="" loading="lazy" decoding="async" />
                        )}
                        <span>
                          {item.name && <strong>{item.name}</strong>}
                          {item.role && <small>{item.role}</small>}
                        </span>
                      </figcaption>
                    )}
                  </figure>
                );
              })}
            </StorefrontCarousel>
          </div>
        </section>
      )}

      {liveBlogPosts.length > 0 && (
        <section className="sd-section">
          <div className="container">
            <SectionHeading
              eyebrow={blogConfig.tagline}
              title={blogConfig.title}
              description={blogConfig.description}
              actionHref="/blog"
              actionLabel="View All Posts"
            />
            <div className="sd-blog-grid">
              {liveBlogPosts.slice(0, 3).map((post, index) => {
                const title = localizedValue(post, 'title', lang);
                const excerpt = localizedValue(post, 'excerpt', lang);
                const postHref = post.slug ? '/blog/' + post.slug : '';
                const postImage = imageSource(post.image);
                const date = formatBlogDate(post.createdAt || post.date);
                const author = post.authorName || post.author;
                const hasViews = post.viewCount !== undefined && post.viewCount !== null;

                return (
                  <article className="sd-blog-card" key={post.id || post.slug || index}>
                    {postImage && (
                      postHref ? (
                        <Link href={postHref} className="sd-blog-image">
                          <img src={postImage} alt={title} loading="lazy" decoding="async" />
                        </Link>
                      ) : (
                        <span className="sd-blog-image">
                          <img src={postImage} alt={title} loading="lazy" decoding="async" />
                        </span>
                      )
                    )}
                    <div className="sd-blog-content">
                      {(date || author || hasViews) && (
                        <div className="sd-blog-meta">
                          {date && <span><i className="far fa-calendar-alt" aria-hidden="true" /> {date}</span>}
                          {author && <span><i className="far fa-user" aria-hidden="true" /> {author}</span>}
                          {hasViews && <span><i className="far fa-eye" aria-hidden="true" /> {post.viewCount}</span>}
                        </div>
                      )}
                      <h3>{postHref ? <Link href={postHref}>{title}</Link> : title}</h3>
                      {excerpt && <p>{excerpt}</p>}
                      {postHref && (
                        <Link href={postHref} className="sd-text-link">
                          Read More <i className="far fa-arrow-right" aria-hidden="true" />
                        </Link>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {hasNewsletter && (
        <section className="sd-newsletter-section">
          <div className="container">
            <div className="sd-newsletter-card">
              <div className="sd-newsletter-copy">
                {newsletter.label && <span className="sd-eyebrow">{newsletter.label}</span>}
                {newsletter.title && <h2>{newsletter.title}</h2>}
                {newsletter.description && <p>{newsletter.description}</p>}
              </div>
              <div className="sd-newsletter-form-wrap">
                {subscribeStatus === 'success' ? (
                  <div className="sd-form-message" role="status">
                    <i className="far fa-check-circle" aria-hidden="true" /> {subscribeMsg}
                  </div>
                ) : (
                  <form className="sd-newsletter-form" onSubmit={handleSubscribe}>
                    <label className="sd-visually-hidden" htmlFor="home-newsletter-email">Email address</label>
                    <input
                      id="home-newsletter-email"
                      type="email"
                      autoComplete="email"
                      placeholder="Your Email Address"
                      value={subscribeEmail}
                      onChange={(event) => setSubscribeEmail(event.target.value)}
                      required
                    />
                    <button type="submit" disabled={subscribeStatus === 'loading'}>
                      {subscribeStatus === 'loading' ? 'Subscribing...' : newsletter.buttonLabel}
                      <i className="far fa-paper-plane" aria-hidden="true" />
                    </button>
                  </form>
                )}
                {subscribeStatus === 'error' && (
                  <p className="sd-form-error" role="alert">{subscribeMsg}</p>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      {instagramItems.length > 0 && (
        <section className="sd-section sd-instagram-section">
          <div className="container">
            <SectionHeading title={instagram.title} centered />
            <StorefrontCarousel className="storefront-instagram-carousel" label="Instagram">
              {instagramItems.map((item, index) => {
                const content = (
                  <>
                    <img src={item.resolvedImage} alt={item.alt || ''} loading="lazy" decoding="async" />
                    <span><i className="fab fa-instagram" aria-hidden="true" /></span>
                  </>
                );
                return item.link || item.href ? (
                  <Link
                    href={item.link || item.href}
                    className="sd-instagram-card"
                    key={item.id || item.resolvedImage || index}
                  >
                    {content}
                  </Link>
                ) : (
                  <div className="sd-instagram-card" key={item.id || item.resolvedImage || index}>
                    {content}
                  </div>
                );
              })}
            </StorefrontCarousel>
          </div>
        </section>
      )}
    </div>
  );
}

// Map live category slugs to the same 3D PNG icons the mobile app uses
// (copied to /public/category-icons). Falls back to undefined when no match.
function getCategory3DIcon(slug) {
  if (!slug) return undefined;
  const s = String(slug).toLowerCase();
  const map = {
    'auto-parts': 'auto-parts', automotive: 'auto-parts', auto: 'auto-parts',
    bathroom: 'bathroom',
    baverages: 'beverages', beverages: 'beverages', beverage: 'beverages', juice: 'juice',
    clothing: 'clothing', fashion: 'clothing',
    curd: 'curd', milk: 'milk', dairy: 'milk',
    electronics: 'electronics', phones: 'phones', phone: 'phones',
    food: 'food-groceries', 'food-groceries': 'food-groceries', grocery: 'food-groceries', groceries: 'food-groceries',
    health: 'health-beauty', 'health-beauty': 'health-beauty', beauty: 'health-beauty', medical: 'medical',
    home: 'home-garden', 'home-garden': 'home-garden', garden: 'home-garden', furniture: 'home-garden',
    jewelry: 'jewelry', jewellery: 'jewelry',
    kitchen: 'kitchen',
    marketplace: 'marketplace', general: 'general',
    paste: 'tomato-paste', 'tomato-paste': 'tomato-paste', tomato: 'tomato-paste',
    shoes: 'shoes', shoe: 'shoes',
    sports: 'sports', sport: 'sports', toys: 'sports', toy: 'sports',
  };
  const file = map[s];
  return file ? `/category-icons/${file}.png` : undefined;
}

function getCategoryIcon(slug) {
  const iconMap = {
    fashion: 'fashion.svg',
    electronics: 'electronics.svg',
    grocery: 'grocery.svg',
    furniture: 'furniture.svg',
    music: 'music.svg',
    toys: 'toy.svg',
    toy: 'toy.svg',
    gifts: 'gift.svg',
    gift: 'gift.svg',
    babies: 'baby-mom.svg',
    baby: 'baby-mom.svg',
    beauty: 'beauty.svg',
    health: 'beauty.svg',
    sports: 'sports.svg',
    sport: 'sports.svg',
    garden: 'garden.svg',
    automotive: 'automotive.svg',
    auto: 'automotive.svg',
  };

  if (!slug) return 'new.svg';
  for (const [key, icon] of Object.entries(iconMap)) {
    if (slug.includes(key)) return icon;
  }
  return 'new.svg';
}
