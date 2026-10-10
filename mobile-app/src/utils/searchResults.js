// Fetch every page; callers can discard work when the query changes or unmounts.
export async function loadSearchResults(fetchPage, term, isActive, onPage) {
  let collected = [];
  const ids = new Set();
  for (let page = 1; isActive(); page += 1) {
    const data = await fetchPage({ q: term, page, limit: 100 });
    if (!isActive()) return;
    const products = data.products || (Array.isArray(data) ? data : []);
    for (const product of products) {
      if (!ids.has(product.id)) { ids.add(product.id); collected.push(product); }
    }
    const pages = data.totalPages ?? data.pagination?.totalPages ?? 1;
    const hasMore = page < pages && products.length > 0;
    onPage([...collected], data.total ?? collected.length, hasMore);
    if (!hasMore) return;
  }
}
