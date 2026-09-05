const publicSliderWhere = {
  isSliderPromoted: true,
  status: 'approved',
  isDeleted: false,
  stock: { gt: 0 },
  retailPrice: { gt: 0 },
  images: { some: { url: { not: '' } } },
};

function productToSlide(product) {
  return {
    id: 'product-' + product.id,
    productId: product.id,
    title: product.nameEn,
    titlePs: product.namePs,
    titleDr: product.nameDr,
    subtitle: product.category?.nameEn || 'Featured product',
    subtitlePs: product.category?.namePs,
    subtitleDr: product.category?.nameDr,
    description: (product.descEn || '').replace(/<[^>]*>/g, '').slice(0, 180),
    descriptionPs: (product.descPs || '').replace(/<[^>]*>/g, '').slice(0, 180),
    descriptionDr: (product.descDr || '').replace(/<[^>]*>/g, '').slice(0, 180),
    image: product.images[0]?.url || '',
    retailPrice: product.retailPrice,
    priceLabel: 'AFN',
    priceValue: '؋' + Number(product.retailPrice).toLocaleString('en-US'),
    primaryButtonLabel: 'Shop now',
    primaryButtonHref: '/products/' + product.id,
  };
}

async function getProductSlides(prisma) {
  const products = await prisma.product.findMany({
    where: publicSliderWhere,
    select: {
      id: true, nameEn: true, namePs: true, nameDr: true,
      descEn: true, descPs: true, descDr: true, retailPrice: true,
      category: { select: { nameEn: true, namePs: true, nameDr: true } },
      images: { where: { url: { not: '' } }, orderBy: { sortOrder: 'asc' }, take: 1, select: { url: true } },
    },
    orderBy: { id: 'desc' },
  });
  return products.map(productToSlide);
}

async function setSliderPromotion(prisma, id, promoted) {
  if (!Number.isSafeInteger(id) || id < 1 || typeof promoted !== 'boolean') {
    throw Object.assign(new Error('Provide a valid product ID and promoted boolean'), { status: 400 });
  }
  // Check eligibility in the same update so repeat clicks are idempotent.
  const { isSliderPromoted, ...eligible } = publicSliderWhere;
  const result = await prisma.product.updateMany({
    where: promoted ? { ...eligible, id } : { id, isDeleted: false },
    data: { isSliderPromoted: promoted },
  });
  if (!result.count) {
    throw Object.assign(new Error(promoted
      ? 'Only approved, in-stock products with a selling price and image can be promoted'
      : 'Product not found'), { status: promoted ? 400 : 404 });
  }
  return { id, isSliderPromoted: promoted };
}

module.exports = { publicSliderWhere, productToSlide, getProductSlides, setSliderPromotion };
