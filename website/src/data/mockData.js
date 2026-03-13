// Comprehensive mock data for Sawdagar - Mocart Theme
// Uses picsum.photos for realistic placeholder images

export const mockCategories = [
  { id: 1, nameEn: "Electronics", namePs: "بريښنايي", nameDr: "الکترونیک", slug: "electronics", image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=300&fit=crop", thumbs: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&h=80&fit=crop","https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&h=80&fit=crop"], count: 156, startPrice: 29.99 },
  { id: 2, nameEn: "Fashion", namePs: "فیشن", nameDr: "مد و لباس", slug: "fashion", image: "https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=300&fit=crop", thumbs: ["https://images.unsplash.com/photo-1434389677669-e08b4cda3a05?w=100&h=80&fit=crop","https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=100&h=80&fit=crop"], count: 234, startPrice: 19.99 },
  { id: 3, nameEn: "Home & Garden", namePs: "کور او باغ", nameDr: "خانه و باغ", slug: "home-garden", image: "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=400&h=300&fit=crop", thumbs: ["https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=100&h=80&fit=crop","https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=100&h=80&fit=crop"], count: 89, startPrice: 34.99 },
  { id: 4, nameEn: "Sports & Outdoors", namePs: "سپورت", nameDr: "ورزش", slug: "sports", image: "https://images.unsplash.com/photo-1461896836934-bd45ba81e645?w=400&h=300&fit=crop", thumbs: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&h=80&fit=crop","https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=100&h=80&fit=crop"], count: 67, startPrice: 24.99 },
  { id: 5, nameEn: "Health & Beauty", namePs: "روغتیا او ښکلا", nameDr: "سلامت و زیبایی", slug: "health-beauty", image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=300&fit=crop", thumbs: ["https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=100&h=80&fit=crop","https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=100&h=80&fit=crop"], count: 112, startPrice: 12.99 },
  { id: 6, nameEn: "Books & Stationery", namePs: "کتابونه", nameDr: "کتاب", slug: "books", image: "https://images.unsplash.com/photo-1524578271613-d550eacf6090?w=400&h=300&fit=crop", thumbs: ["https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=100&h=80&fit=crop","https://images.unsplash.com/photo-1512820790803-83ca734da794?w=100&h=80&fit=crop"], count: 78, startPrice: 8.99 },
  { id: 7, nameEn: "Toys & Games", namePs: "لوبې", nameDr: "اسباب بازی", slug: "toys", image: "https://images.unsplash.com/photo-1558877385-81a1c7e67d72?w=400&h=300&fit=crop", thumbs: ["https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?w=100&h=80&fit=crop","https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=100&h=80&fit=crop"], count: 45, startPrice: 14.99 },
  { id: 8, nameEn: "Groceries", namePs: "خوراکي توکي", nameDr: "مواد غذایی", slug: "groceries", image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=300&fit=crop", thumbs: ["https://images.unsplash.com/photo-1608686207856-001b95cf60ca?w=100&h=80&fit=crop","https://images.unsplash.com/photo-1579113800032-c38bd7635818?w=100&h=80&fit=crop"], count: 198, startPrice: 4.99 },
];

export const mockProducts = [
  { id: 1, nameEn: "Wireless Bluetooth Headphones", namePs: "بلوتوث هيډفون", nameDr: "هدفون بلوتوث", slug: "wireless-headphones", category: { slug: "electronics", nameEn: "Electronics" }, retailPrice: 89.99, wholesalePrice: 120, stock: 45, rating: 5, isNew: true, images: [{ url: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop" }] },
  { id: 2, nameEn: "Smart Watch Pro Max", namePs: "سمارټ ګړۍ", nameDr: "ساعت هوشمند", slug: "smart-watch-pro", category: { slug: "electronics", nameEn: "Electronics" }, retailPrice: 199.99, wholesalePrice: 250, stock: 28, rating: 4, isSponsored: true, images: [{ url: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop" }] },
  { id: 3, nameEn: "Premium Leather Backpack", namePs: "چرمي بيګ", nameDr: "کوله پشتی چرمی", slug: "leather-backpack", category: { slug: "fashion", nameEn: "Fashion" }, retailPrice: 79.99, wholesalePrice: 0, stock: 0, rating: 4, images: [{ url: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop" }] },
  { id: 4, nameEn: "Running Shoes Ultra Boost", namePs: "منډې پوټکي", nameDr: "کفش دویدن", slug: "running-shoes", category: { slug: "sports", nameEn: "Sports" }, retailPrice: 129.99, wholesalePrice: 160, stock: 67, rating: 5, isNew: true, images: [{ url: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=400&fit=crop" }] },
  { id: 5, nameEn: "Organic Face Cream Set", namePs: "د مخ کريم", nameDr: "کرم صورت", slug: "face-cream-set", category: { slug: "health-beauty", nameEn: "Health & Beauty" }, retailPrice: 49.99, wholesalePrice: 65, stock: 150, rating: 4, images: [{ url: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&h=400&fit=crop" }] },
  { id: 6, nameEn: "Minimalist Desk Lamp", namePs: "ډيسک څراغ", nameDr: "چراغ رومیزی", slug: "desk-lamp", category: { slug: "home-garden", nameEn: "Home & Garden" }, retailPrice: 59.99, wholesalePrice: 0, stock: 33, rating: 5, images: [{ url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop" }] },
  { id: 7, nameEn: "Classic Aviator Sunglasses", namePs: "لمر عینکې", nameDr: "عینک آفتابی", slug: "aviator-sunglasses", category: { slug: "fashion", nameEn: "Fashion" }, retailPrice: 34.99, wholesalePrice: 50, stock: 200, rating: 4, images: [{ url: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=400&fit=crop" }] },
  { id: 8, nameEn: "Professional Camera Lens", namePs: "کمرې لينز", nameDr: "لنز دوربین", slug: "camera-lens", category: { slug: "electronics", nameEn: "Electronics" }, retailPrice: 349.99, wholesalePrice: 450, stock: 12, rating: 5, isSponsored: true, images: [{ url: "https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=400&h=400&fit=crop" }] },
  { id: 9, nameEn: "Stainless Steel Water Bottle", namePs: "د اوبو بوتل", nameDr: "بطری آب", slug: "water-bottle", category: { slug: "sports", nameEn: "Sports" }, retailPrice: 24.99, wholesalePrice: 35, stock: 500, rating: 4, isNew: true, images: [{ url: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&h=400&fit=crop" }] },
  { id: 10, nameEn: "Cozy Throw Blanket", namePs: "کمبل", nameDr: "پتو", slug: "throw-blanket", category: { slug: "home-garden", nameEn: "Home & Garden" }, retailPrice: 39.99, wholesalePrice: 55, stock: 80, rating: 4, images: [{ url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=400&fit=crop" }] },
  { id: 11, nameEn: "Vitamin C Serum Premium", namePs: "ویټامین سي سيرم", nameDr: "سرم ویتامین سی", slug: "vitamin-c-serum", category: { slug: "health-beauty", nameEn: "Health & Beauty" }, retailPrice: 29.99, wholesalePrice: 40, stock: 220, rating: 5, images: [{ url: "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&h=400&fit=crop" }] },
  { id: 12, nameEn: "Mechanical Gaming Keyboard", namePs: "ګيمنګ کيبورډ", nameDr: "کیبورد گیمینگ", slug: "gaming-keyboard", category: { slug: "electronics", nameEn: "Electronics" }, retailPrice: 149.99, wholesalePrice: 190, stock: 35, rating: 5, isNew: true, images: [{ url: "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=400&h=400&fit=crop" }] },
];

export const mockTestimonials = [
  { id: 1, name: "Ahmad Shaheer", role: "Customer", text: "Sawdagar transformed my shopping experience. The delivery was fast, products were genuine, and customer service was exceptional. Highly recommended!", rating: 5, image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face" },
  { id: 2, name: "Fatima Zahra", role: "Customer", text: "I love the variety of products available. From electronics to fashion, everything is at competitive prices. The app makes ordering so easy!", rating: 5, image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face" },
  { id: 3, name: "Mohammad Reza", role: "Customer", text: "As a regular customer, I appreciate the consistent quality and reliable delivery. The return policy gives me confidence in every purchase.", rating: 5, image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face" },
  { id: 4, name: "Zainab Ahmadi", role: "Customer", text: "Best online marketplace in Afghanistan! The product descriptions are accurate and the payment process is smooth and secure.", rating: 5, image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face" },
];

export const mockBlogs = [
  { id: 1, title: "Top 10 Tech Gadgets You Need in 2026", excerpt: "Discover the most innovative technology products that are changing how we live and work every day.", date: "Mar 05, 2026", author: "Ahmad Nazari", comments: 24, image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&h=400&fit=crop" },
  { id: 2, title: "Sustainable Fashion: The Future of Style", excerpt: "How eco-friendly fashion choices can make a massive impact on our environment while keeping you stylish.", date: "Feb 28, 2026", author: "Sara Mohammadi", comments: 18, image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=400&fit=crop" },
  { id: 3, title: "Home Decor Trends That Will Dominate 2026", excerpt: "Transform your living space with these trendy interior design ideas. From minimalist to cozy aesthetics.", date: "Feb 20, 2026", author: "Rahmat Karimi", comments: 31, image: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=600&h=400&fit=crop" },
];

export const mockSellers = [
  { id: 1, name: "Kabul Electronics", image: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=120&h=120&fit=crop" },
  { id: 2, name: "Afghan Fashion Hub", image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=120&h=120&fit=crop" },
  { id: 3, name: "Home Harmony Store", image: "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=120&h=120&fit=crop" },
  { id: 4, name: "Sports Galaxy", image: "https://images.unsplash.com/photo-1461896836934-bd45ba81e645?w=120&h=120&fit=crop" },
  { id: 5, name: "Beauty Paradise", image: "https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=120&h=120&fit=crop" },
  { id: 6, name: "Tech World AF", image: "https://images.unsplash.com/photo-1498049794561-7780e7231661?w=120&h=120&fit=crop" },
  { id: 7, name: "Book Corner", image: "https://images.unsplash.com/photo-1524578271613-d550eacf6090?w=120&h=120&fit=crop" },
  { id: 8, name: "Fresh Market", image: "https://images.unsplash.com/photo-1542838132-92c53300491e?w=120&h=120&fit=crop" },
];

export const mockGallery = [
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=400&fit=crop",
  "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=800&h=400&fit=crop",
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&h=400&fit=crop",
  "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=600&h=400&fit=crop",
];

export const mockBrands = [
  { name: "Samsung", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Samsung_Logo.svg/200px-Samsung_Logo.svg.png" },
  { name: "Apple", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/100px-Apple_logo_black.svg.png" },
  { name: "Nike", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Logo_NIKE.svg/200px-Logo_NIKE.svg.png" },
  { name: "Sony", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Sony_logo.svg/200px-Sony_logo.svg.png" },
  { name: "Adidas", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/2/20/Adidas_Logo.svg/200px-Adidas_Logo.svg.png" },
  { name: "LG", logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/LG_logo_%282015%29.svg/200px-LG_logo_%282015%29.svg.png" },
];

export const mockInstagram = [
  "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1607082349566-187342175e2f?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1472851294608-062f824d29cc?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=300&h=300&fit=crop",
  "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=300&h=300&fit=crop",
];
