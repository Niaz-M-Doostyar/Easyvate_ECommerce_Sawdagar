# Product-focused mobile pages — October 5, 2026

## Design changes

This pass updates 14 production UI files to carry the home product-card style
through browsing, buying, order review, and supplier product management.

| File in `mobile-app/src` | Changes |
| --- | --- |
| `components/ProductCard.js` | Contained images, quieter 16-point card surfaces, readable names/prices, metadata below images, and separate Add and visible 44-point Quick View actions. |
| `components/ProductQuickView.js` | Image controls below the photo, consistent preview surfaces, readable product information, and the existing localized description field. |
| `components/ScreenHeader.js` | Separate controls and full-width title rows on smaller phones with large accessibility text. |
| `components/FilterTabs.js` | Scaled chip and strip heights keep filter labels fully visible at larger text sizes. |
| `screens/products/ProductsScreen.js` | Responsive catalog spacing, localized category/filter/sort controls, and a bounded sort modal with scrollable options and a pinned close button. |
| `screens/products/SearchScreen.js` | Matching product cards, concise localized search guidance, and product suggestions in place of the oversized static promotion card. |
| `screens/products/CategoriesScreen.js` | Image-led category cards, readable names and product links, category search, and compact browsing shortcuts. |
| `screens/products/ProductDetailScreen.js` | Photo-only gallery with thumbnails, product information and optional metadata below, responsive image/information columns, and purchase controls. |
| `screens/cart/CartScreen.js` | Clear product thumbnails, names, quantities and line totals, consistent item controls, and a safe-area-aware purchase summary. |
| `screens/cart/CheckoutScreen.js` | Visible product rows, readable address/payment/coupon sections, province selection with delivery fees, and a clearer bill. |
| `screens/cart/OrderSuccessScreen.js` | Product-led order confirmation with server-confirmed items, prices, quantities and totals; the cart snapshot fills missing photos and names only. |
| `screens/orders/OrdersScreen.js` | Product previews in order cards, readable status/address/totals, and compact order summaries. |
| `screens/orders/OrderDetailScreen.js` | Product rows, readable bill and delivery progress, and clearly grouped cancellation/confirmation review controls. |
| `screens/supplier/SupplierProductsScreen.js` | Responsive image-led inventory cards, status below images, and accessible edit/delete actions. |

Layouts use available width and text size, including narrower iPhone windows and
iPad layouts. Product images contain only the image or its unavailable-image
placeholder. Optional discount, verification and other metadata appear below;
missing metadata does not leave a decorative badge placeholder. Localized
labels, RTL alignment and light/dark theme colors are retained.

## Preserved flows and home content

Catalog navigation, search, category/stock/price filters, sorting, pagination,
Quick View, image viewing, supplier storefront links and cart actions remain.
Checkout retains address validation, province delivery charges, coupons and
cash on delivery. Order status, the existing review timer, immediate confirmation
and cancellation actions remain connected to their existing services. Supplier
status filters and add/edit/delete navigation remain.

This pass does not change the backend, OTP services, admin settings or stored
customer/order data. `HomeScreen.js` and its slider are unchanged. Admin-managed
slides, offers, announcement, campaign banner and sponsored ads remain, along
with the existing Featured Products collection. Slider options A (clean campaign
banner), B (product spotlight) and C (swipeable campaign cards) still await the
user's choice.

## Verification

- Native iPhone 17 Pro Max simulator: visually checked catalog, categories,
  search, product detail, Quick View, cart, checkout, order success, order list,
  order detail, supplier products, sorting and province selection.
- Native iPad simulator: visually checked product detail and supplier products.
- Native iPhone 16e with accessibility-large text: visually checked product
  detail, cart, sorting and supplier products. Corrected the crowded header and
  clipped status filters, then captured the corrected layouts again.
- Public browsing screens use actual public product data. Private
  cart/order/supplier layouts were checked with temporary local display
  fixtures. These are layout checks; no live order or account was created.
- All 76 JavaScript app source files parse with the project's Babel setup.
- All 16 existing product-link/responsive-layout tests pass; `git diff --check`
  is clean.
- Targeted receipt checks cover changed server prices/names/quantities,
  removed items, an explicitly empty item list, server photo precedence,
  missing photo/name enrichment and the legacy response fallback.

Temporary display fixtures were removed. Navigation and authentication/cart
contexts were restored without production changes, all simulator app sessions
were restarted, and the smaller simulator's text size was restored to its
original setting.

## Restore

The version before this pass is preserved at commit `325117c4`, branch
`backup/mobile-products-before-related-pages-2026-10-05`.

To undo only this pass while retaining later work, revert its final UI commit.
To restore the exact earlier mobile source instead:

```sh
git restore --source=backup/mobile-products-before-related-pages-2026-10-05 -- mobile-app/src
git add mobile-app/src
git commit -m 'Restore mobile product pages before October 5 refresh'
git push
```

The exact-source restore also replaces later edits within `mobile-app/src`.
Rebuild the app to apply a restore to installed releases. Neither restore method
changes the production database.
