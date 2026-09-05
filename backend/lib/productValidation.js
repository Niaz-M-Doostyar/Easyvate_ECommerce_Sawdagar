function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function validateCompleteProduct(product, images) {
  const missing = [];
  const labels = {
    nameEn: 'English name', namePs: 'Pashto name', nameDr: 'Dari name',
    descEn: 'English description', descPs: 'Pashto description', descDr: 'Dari description',
  };
  Object.entries(labels).forEach(([field, label]) => {
    if (!hasText(product[field])) missing.push(label);
  });
  if (!Number.isFinite(Number(product.wholesaleCost)) || Number(product.wholesaleCost) <= 0) missing.push('wholesale cost');
  if (!Number.isFinite(Number(product.suggestedPrice)) || Number(product.suggestedPrice) <= 0) missing.push('suggested price');
  if (!Number.isInteger(Number(product.stock)) || Number(product.stock) < 0) missing.push('valid stock');
  if (!Number.isInteger(Number(product.categoryId)) || Number(product.categoryId) <= 0) missing.push('category');
  if (!Array.isArray(images) || images.filter(hasText).length === 0) missing.push('at least one product image');
  return missing;
}

module.exports = { validateCompleteProduct };
