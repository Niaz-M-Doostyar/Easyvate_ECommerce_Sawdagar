function integer(value, minimum) {
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  if (typeof value === 'string' && !value.trim()) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= minimum ? parsed : null;
}

function productKey(product) {
  if (!product || typeof product !== 'object' || Array.isArray(product)) return null;
  const id = product.id;
  if (typeof id === 'number' && Number.isFinite(id)) return String(id);
  if (typeof id === 'string' && id.trim()) return String(id);
  return null;
}

// Keep first-seen positions while replacing stale objects with newer responses.
export function appendProducts(current, incoming) {
  const result = [];
  const positions = new Map();
  const append = (products) => {
    if (!Array.isArray(products)) return;
    products.forEach((product) => {
      const key = productKey(product);
      if (key == null) return;
      if (positions.has(key)) {
        result[positions.get(key)] = product;
      } else {
        positions.set(key, result.length);
        result.push(product);
      }
    });
  };
  append(current);
  append(incoming);
  return result;
}

export function readProductPage(response, requestedPage, limit) {
  const body = response && typeof response === 'object' && !Array.isArray(response)
    ? response : {};
  const metadata = body.pagination && typeof body.pagination === 'object' && !Array.isArray(body.pagination)
    ? body.pagination : {};
  const products = appendProducts([], Array.isArray(response) ? response : body.products);
  const requestPage = integer(requestedPage, 1) ?? 1;
  const reportedPage = integer(metadata.page, 1) ?? integer(body.page, 1);
  // A stale or malformed page number must not make the next request repeat.
  const page = Math.max(requestPage, reportedPage ?? requestPage);
  // The API caps requests at 100 and defaults to 10 when no limit is supplied.
  const pageLimit = integer(metadata.limit, 1) ?? integer(body.limit, 1)
    ?? Math.min(100, integer(limit, 1) ?? 10);
  const total = integer(metadata.total, 0) ?? integer(body.total, 0);
  const totalPages = integer(metadata.totalPages, 1) ?? integer(body.totalPages, 1)
    ?? (total != null ? Math.max(1, Math.ceil(total / pageLimit)) : null);
  const hasMore = products.length > 0 && page < Number.MAX_SAFE_INTEGER
    && (totalPages != null ? page < totalPages : products.length >= pageLimit);
  return { products, page, hasMore };
}
