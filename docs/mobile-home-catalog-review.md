# Automatic home catalog — October 5, 2026

Featured Products now offers the complete public catalog through automatic
scrolling. The manual Load More button, Featured See All action, and 50/75-item
display limits are removed. Requests use batches of 75; this is a request size,
not a collection limit. Approved products include sold-out items.

One vertical virtualized list renders responsive product rows. The existing
admin slider, announcement, offers, categories, campaign banner and Recommended
for you remain in its header. New Arrivals remains after the product grid.
Quick View, product navigation and Add actions remain available.

Returning from a product preserves loaded pages and scroll position. Pull to
refresh reloads the first page. Request guards prevent duplicate page loads,
stale responses after refresh and endless duplicate-only pages. A quiet spinner
appears while fetching the next page; a failed request shows refresh guidance.

## Verification

- Native iPhone 17 Pro Max and iPad Pro 11-inch simulators both reached all 960
  public products across 13 pages through programmatic scrolling that exercised
  the actual list's end-reached handler. Grid layouts were inspected visually.
- Temporary scrolling effects and count labels were removed after verification.
- All 23 existing/new tests pass, including complete catalog traversal,
  pagination response boundaries, duplicate IDs and responsive layouts.
- Five targeted checks against the actual HomeScreen handlers passed for
  concurrent requests, stale page responses during/after refresh, overlapping
  refresh completion and duplicate-only page termination.
- Production source parsing and diff checks passed. No live accounts or orders
  were created.

## Restore

The preceding mobile version is saved at `e85bc901` on GitHub branch
`backup/mobile-before-all-products-2026-10-05`. Revert the final automatic-catalog
commit to undo only this change while retaining subsequent work. An installed
release must be rebuilt to receive a restore; the database is unaffected.
