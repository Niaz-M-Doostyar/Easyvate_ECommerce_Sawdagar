const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const adminPassword = bcrypt.hashSync('admin123', 10);
  const supplierPassword = bcrypt.hashSync('supplier123', 10);
  const customerPassword = bcrypt.hashSync('customer123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@sawdagar.af' },
    update: {},
    create: {
      email: 'admin@sawdagar.af',
      password: adminPassword,
      fullName: 'Sawdagar Admin',
      phone: '0700000001',
      role: 'admin',
      isActive: true,
      isApproved: true,
      emailVerified: true,
      province: 'Kabul',
      district: 'District 1',
    },
  });

  const supplier = await prisma.user.upsert({
    where: { email: 'supplier@sawdagar.af' },
    update: {},
    create: {
      email: 'supplier@sawdagar.af',
      password: supplierPassword,
      fullName: 'Ahmad Supplier',
      phone: '0700000002',
      role: 'supplier',
      isActive: true,
      isApproved: true,
      emailVerified: true,
      companyName: 'Afghan Goods Co.',
      contactPerson: 'Ahmad',
      province: 'Kabul',
      district: 'District 3',
    },
  });

  const customer = await prisma.user.upsert({
    where: { email: 'customer@sawdagar.af' },
    update: {},
    create: {
      email: 'customer@sawdagar.af',
      password: customerPassword,
      fullName: 'Mohammad Customer',
      phone: '0700000003',
      role: 'customer',
      isActive: true,
      isApproved: true,
      emailVerified: true,
      province: 'Herat',
      district: 'District 5',
    },
  });

  const delivery = await prisma.user.upsert({
    where: { email: 'delivery@sawdagar.af' },
    update: {},
    create: {
      email: 'delivery@sawdagar.af',
      password: bcrypt.hashSync('delivery123', 10),
      fullName: 'Karim Delivery',
      phone: '0700000004',
      role: 'delivery',
      isActive: true,
      isApproved: true,
      emailVerified: true,
      province: 'Kabul',
      district: 'District 2',
    },
  });

  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'electronics' },
      update: {},
      create: { slug: 'electronics', nameEn: 'Electronics', namePs: 'بریښنایی توکي', nameDr: 'الکترونیک' },
    }),
    prisma.category.upsert({
      where: { slug: 'clothing' },
      update: {},
      create: { slug: 'clothing', nameEn: 'Clothing', namePs: 'جامې', nameDr: 'پوشاک' },
    }),
    prisma.category.upsert({
      where: { slug: 'food' },
      update: {},
      create: { slug: 'food', nameEn: 'Food & Groceries', namePs: 'خوراکي توکي', nameDr: 'مواد غذایی' },
    }),
    prisma.category.upsert({
      where: { slug: 'home' },
      update: {},
      create: { slug: 'home', nameEn: 'Home & Garden', namePs: 'کور او باغ', nameDr: 'خانه و باغ' },
    }),
    prisma.category.upsert({
      where: { slug: 'health' },
      update: {},
      create: { slug: 'health', nameEn: 'Health & Beauty', namePs: 'روغتیا او ښکلا', nameDr: 'صحت و زیبایی' },
    }),
    prisma.category.upsert({
      where: { slug: 'sports' },
      update: {},
      create: { slug: 'sports', nameEn: 'Sports & Outdoors', namePs: 'ورزش', nameDr: 'ورزش و فضای باز' },
    }),
  ]);

  const products = [
    {
      nameEn: 'Samsung Galaxy A54',
      namePs: 'سامسنګ ګلکسي A54',
      nameDr: 'سامسونگ گلکسی A54',
      descEn: 'Latest Samsung smartphone with great camera and battery life.',
      descPs: 'وروستی سامسنګ سمارټ فون د ښه کامرې او بیټرۍ سره.',
      descDr: 'آخرین گوشی هوشمند سامسونگ با دوربین و باتری عالی.',
      wholesaleCost: 280,
      suggestedPrice: 350,
      retailPrice: 340,
      stock: 50,
      status: 'approved',
      supplierId: supplier.id,
      categoryId: categories[0].id,
    },
    {
      nameEn: 'Afghan Silk Scarf',
      namePs: 'افغان ابریښمي لونګۍ',
      nameDr: 'شال ابریشمی افغانی',
      descEn: 'Handmade Afghan silk scarf with traditional patterns.',
      descPs: 'لاسي جوړ شوی افغان ابریښمي لونګۍ د دودیزو نقشو سره.',
      descDr: 'شال ابریشمی دست‌ساز افغانی با نقش‌های سنتی.',
      wholesaleCost: 15,
      suggestedPrice: 30,
      retailPrice: 28,
      stock: 200,
      status: 'approved',
      supplierId: supplier.id,
      categoryId: categories[1].id,
    },
    {
      nameEn: 'Afghan Saffron (1g)',
      namePs: 'افغان زعفران (۱ ګرامه)',
      nameDr: 'زعفران افغانی (۱ گرم)',
      descEn: 'Premium Afghan saffron from Herat province.',
      descPs: 'لوړ کیفیت لرونکی افغان زعفران د هرات ولایت څخه.',
      descDr: 'زعفران درجه یک افغانی از ولایت هرات.',
      wholesaleCost: 5,
      suggestedPrice: 12,
      retailPrice: 10,
      stock: 500,
      status: 'approved',
      supplierId: supplier.id,
      categoryId: categories[2].id,
    },
    {
      nameEn: 'Handmade Afghan Carpet',
      namePs: 'لاسي جوړه افغان قالین',
      nameDr: 'قالین دست‌بافت افغانی',
      descEn: 'Beautiful handwoven Afghan carpet with intricate designs.',
      descPs: 'ښکلی لاسي اوبدلی افغان قالین د پیچلو ډیزاینونو سره.',
      descDr: 'قالین زیبای دست‌بافت افغانی با طرح‌های پیچیده.',
      wholesaleCost: 150,
      suggestedPrice: 280,
      retailPrice: 260,
      stock: 30,
      status: 'approved',
      supplierId: supplier.id,
      categoryId: categories[3].id,
    },
    {
      nameEn: 'Wireless Bluetooth Headphones',
      namePs: 'بې سیمه بلوتوت هیډفون',
      nameDr: 'هدفون بلوتوث بی‌سیم',
      descEn: 'High quality wireless headphones with noise cancellation.',
      descPs: 'لوړ کیفیت بې سیمه هیډفون د شور لغوه کولو سره.',
      descDr: 'هدفون بی‌سیم با کیفیت بالا و حذف نویز.',
      wholesaleCost: 25,
      suggestedPrice: 50,
      retailPrice: 45,
      stock: 100,
      status: 'approved',
      supplierId: supplier.id,
      categoryId: categories[0].id,
    },
    {
      nameEn: 'Pending Product Example',
      namePs: 'په تمه محصول بېلګه',
      nameDr: 'نمونه محصول در انتظار',
      descEn: 'This product is awaiting admin approval.',
      descPs: 'دا محصول د اډمین تایید په تمه کې دی.',
      descDr: 'این محصول در انتظار تایید مدیر است.',
      wholesaleCost: 10,
      suggestedPrice: 25,
      stock: 40,
      status: 'pending',
      supplierId: supplier.id,
      categoryId: categories[4].id,
    },
  ];

  for (const p of products) {
    await prisma.product.create({ data: p });
  }

  await prisma.sponsorshipPackage.createMany({
    data: [
      { name: '1 Week Spotlight', durationDays: 7, price: 10, description: 'Feature your product for 1 week on the homepage.' },
      { name: '2 Week Boost', durationDays: 14, price: 18, description: 'Feature your product for 2 weeks with priority placement.' },
      { name: '1 Month Premium', durationDays: 30, price: 30, description: 'Full month of premium visibility across the platform.' },
    ],
    skipDuplicates: true,
  });

  console.log('Seed completed successfully');
  console.log('Admin: admin@sawdagar.af / admin123');
  console.log('Supplier: supplier@sawdagar.af / supplier123');
  console.log('Customer: customer@sawdagar.af / customer123');
  console.log('Delivery: delivery@sawdagar.af / delivery123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
