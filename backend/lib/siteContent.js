const prisma = require('./prisma');

const SITE_CONTENT_KEY = 'website_content';

// Default site content embedded directly — NO JSON file dependency
const defaultSiteContent = {
  "header": {
    "email": "onlinesawdagar@gmail.com",
    "phone": "+93 706 151 322",
    "topBarMessage": "Welcome to Sawdagar Online Shopping Store!",
    "socialLinks": {
      "facebook": "#",
      "twitter": "#",
      "instagram": "#",
      "youtube": "#"
    },
    "logo": ""
  },
  "footer": {
    "aboutText": "Sawdagar connects Afghan suppliers, retailers and customers through online shopping. Browse products in Pashto, Dari and English, with prices in AFN.",
    "phone": "+93 706 151 322",
    "email": "onlinesawdagar@gmail.com",
    "address": "Kabul, Afghanistan",
    "businessHours": "Sat - Thu (8:00 AM - 5:00 PM)",
    "quickLinks": [
      {
        "label": "About Us",
        "href": "/about"
      },
      {
        "label": "Contact Us",
        "href": "/contact"
      },
      {
        "label": "Shop",
        "href": "/search"
      },
      {
        "label": "My Account",
        "href": "/dashboard"
      }
    ],
    "supportLinks": [
      {
        "label": "FAQ",
        "href": "/contact"
      },
      {
        "label": "Returns & Refunds",
        "href": "/contact"
      },
      {
        "label": "Shipping Info",
        "href": "/contact"
      },
      {
        "label": "Privacy Policy",
        "href": "/contact"
      }
    ],
    "socialLinks": {
      "facebook": "#",
      "twitter": "#",
      "instagram": "#",
      "youtube": "#",
      "pinterest": "#"
    },
    "appStoreUrl": "#",
    "playStoreUrl": "#",
    "copyrightText": "Sawdagar"
  },
  "home": {
    "advertText": "",
    "hero": {
      "badge": "Online shopping in Afghanistan",
      "titleLines": [
        "Explore",
        "Unique",
        "Products"
      ],
      "description": "Shop products from Afghan sellers on Sawdagar. Browse in Pashto, Dari or English and check prices in Afghan afghanis (AFN).",
      "primaryButtonLabel": "Shop Now",
      "primaryButtonHref": "/search",
      "secondaryButtonLabel": "Learn More",
      "secondaryButtonHref": "/about",
      "image": "",
      "priceLabel": "",
      "priceValue": "",
      "slides": [
        {
          "subtitle": "Shop with Sawdagar",
          "title": "Explore The Trendy products for you.",
          "description": "Explore products for your home and everyday needs on Sawdagar.",
          "image": "/assets/img/hero/01.png",
          "priceLabel": "",
          "priceValue": ""
        },
        {
          "subtitle": "Shop with Sawdagar",
          "title": "Explore The Trendy products for you.",
          "description": "Explore products for your home and everyday needs on Sawdagar.",
          "image": "/assets/img/hero/02.png",
          "priceLabel": "",
          "priceValue": ""
        },
        {
          "subtitle": "Shop with Sawdagar",
          "title": "Explore The Trendy products for you.",
          "description": "Explore products for your home and everyday needs on Sawdagar.",
          "image": "/assets/img/hero/03.png",
          "priceLabel": "",
          "priceValue": ""
        }
      ]
    },
    "promoBanners": [
      {
        "label": "Everyday essentials",
        "title": "Find Your Everyday\nEssentials",
        "image": "/assets/img/banner/mini-banner-1.jpg",
        "buttonLabel": "Shop Now",
        "buttonHref": "/search"
      },
      {
        "label": "Explore products",
        "title": "Discover More\nOn Sawdagar",
        "image": "/assets/img/banner/mini-banner-2.jpg",
        "buttonLabel": "Discover Now",
        "buttonHref": "/search"
      },
      {
        "label": "Shop the collection",
        "title": "Explore Our\nLatest Products",
        "image": "/assets/img/banner/mini-banner-3.jpg",
        "buttonLabel": "Discover Now",
        "buttonHref": "/search"
      }
    ],
    "features": [
      {
        "title": "Delivery information",
        "desc": "Check delivery details at checkout",
        "icon": "delivery-2.svg"
      },
      {
        "title": "Order assistance",
        "desc": "Contact us about returns",
        "icon": "refund.svg"
      },
      {
        "title": "Cash on delivery",
        "desc": "Pay when your order arrives",
        "icon": "payment.svg"
      },
      {
        "title": "Customer support",
        "desc": "Contact the Sawdagar team",
        "icon": "support.svg"
      }
    ],
    "productBannerImage": "/assets/img/banner/product-banner.jpg",
    "bigBanner": {
      "subtitle": "Shop Sawdagar",
      "title": "Discover Products for Everyday Life",
      "description": "Browse our online marketplace in Afghanistan.",
      "buttonLabel": "Shop Now",
      "buttonHref": "/search",
      "image": "/assets/img/banner/big-banner.jpg"
    },
    "brands": {
      "title": "Popular Brands"
    },
    "brandItems": [],
    "video": {
      "backgroundImage": "/assets/img/video/01.jpg",
      "videoUrl": ""
    },
    "dealOfWeek": {
      "badge": "Explore the store",
      "title": "Find Your Next Purchase",
      "description": "Browse available products and check current prices in AFN.",
      "buttonLabel": "Shop Now",
      "buttonHref": "/search",
      "image": "/assets/img/deal/01.png",
      "discountPercent": "",
      "countdownDate": ""
    },
    "gallery": {
      "tagline": "Our Gallery",
      "title": "Let's Check Our Photo Gallery"
    },
    "galleryImages": [],
    "testimonials": {
      "tagline": "Testimonials",
      "title": "What Our Clients Say About Us"
    },
    "testimonialItems": [],
    "blog": {
      "tagline": "Our Blog",
      "title": "Our Latest News & Blog"
    },
    "blogItems": [],
    "newsletter": {
      "title": "Get 20% Off Discount Coupon",
      "description": "By subscribing our newsletter",
      "buttonLabel": "Subscribe"
    },
    "instagram": {
      "title": "@sawdagar"
    },
    "instagramItems": []
  },
  "about": {
    "heroTitle": "About Sawdagar",
    "heroDescription": "An online marketplace connecting Afghan suppliers, retailers and customers.",
    "missionLabel": "Our Mission",
    "missionTitle": "Empowering Afghan Commerce",
    "missionParagraphs": [
      "Sawdagar bridges the gap between wholesale suppliers and retail customers, creating a seamless marketplace that serves all of Afghanistan.",
      "We are committed to making e-commerce accessible, reliable, and affordable for every Afghan citizen."
    ],
    "missionImage": "",
    "stats": [],
    "steps": [
      {
        "step": "01",
        "title": "Suppliers List",
        "desc": "Verified suppliers upload products with wholesale prices"
      },
      {
        "step": "02",
        "title": "Admin Reviews",
        "desc": "Our team reviews, approves, and sets fair retail pricing"
      },
      {
        "step": "03",
        "title": "Customers Shop",
        "desc": "Browse, search, and add products to your cart"
      },
      {
        "step": "04",
        "title": "COD Delivery",
        "desc": "Pay cash on delivery when your order arrives"
      }
    ],
    "ctaTitle": "Ready to Start Shopping?",
    "ctaDescription": "Explore products and shop with Sawdagar in Afghanistan.",
    "primaryButtonLabel": "Browse Products",
    "primaryButtonHref": "/search",
    "secondaryButtonLabel": "Become a Supplier",
    "secondaryButtonHref": "/register"
  },
  "contact": {
    "heroTitle": "Contact Us",
    "heroDescription": "Have questions? We'd love to hear from you.",
    "cards": [
      {
        "icon": "M15 10.5a3 3 0 11-6 0 3 3 0 016 0z M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z",
        "title": "Our Office",
        "lines": [
          "Kandahar, Afghanistan"
        ]
      },
      {
        "icon": "M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z",
        "title": "Phone",
        "lines": [
          "+93 706 151 322"
        ]
      },
      {
        "icon": "M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75",
        "title": "Email",
        "lines": [
          "onlinesawdagar@gmail.com"
        ]
      }
    ],
    "businessHoursTitle": "Business Hours",
    "businessHours": [
      {
        "day": "Saturday - Thursday",
        "time": "8:00 AM - 5:00 PM"
      },
      {
        "day": "Friday",
        "time": "Closed"
      }
    ],
    "formTitle": "Send Us a Message",
    "successMessage": "Message sent! We'll get back to you soon."
  },
  "mobileTheme": {
    "activeTheme": "ocean"
  },
  "mobileApp": {
    "audienceMessage": ""
  }
};

function isObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function mergeContent(base, incoming) {
  if (Array.isArray(base)) {
    return Array.isArray(incoming) ? incoming : base;
  }

  if (isObject(base)) {
    const next = { ...base };
    const source = isObject(incoming) ? incoming : {};
    for (const key of Object.keys(next)) {
      next[key] = mergeContent(base[key], source[key]);
    }
    return next;
  }

  return incoming === undefined ? base : incoming;
}

async function getSiteContent() {
  const record = await prisma.siteContent.findUnique({ where: { key: SITE_CONTENT_KEY } });

  if (!record) {
    // Auto-seed defaults into DB on first access
    await prisma.siteContent.create({
      data: { key: SITE_CONTENT_KEY, value: JSON.stringify(defaultSiteContent) },
    });
    return { ...defaultSiteContent };
  }

  try {
    const parsed = JSON.parse(record.value || '{}');
    return mergeContent(defaultSiteContent, parsed);
  } catch {
    return { ...defaultSiteContent };
  }
}

async function saveSiteContent(content) {
  const merged = mergeContent(defaultSiteContent, content || {});

  await prisma.siteContent.upsert({
    where: { key: SITE_CONTENT_KEY },
    update: { value: JSON.stringify(merged) },
    create: { key: SITE_CONTENT_KEY, value: JSON.stringify(merged) },
  });

  return merged;
}

module.exports = {
  defaultSiteContent,
  getSiteContent,
  saveSiteContent,
  mergeContent,
};
