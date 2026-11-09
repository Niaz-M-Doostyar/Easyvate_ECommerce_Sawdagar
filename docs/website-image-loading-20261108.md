# Website image loading — 8 November 2026

## Findings

Small category pictures and several CMS sections requested full uploaded images.
One 80px category icon downloaded a 2,698,311-byte PNG in 9.88 seconds; its existing
280px lossless derivative downloaded 120,950 bytes in 1.05 seconds in the same
sample. These are individual network measurements, not a universal load-time
guarantee.

The slider started fetching an image only after selecting its slide. Its declared
responsive widths also did not match the backend's supported size buckets.
Successful image responses inherited `Pragma: no-cache` from the general API
middleware despite their persistent image cache.

## Changes

- Use responsive lossless display derivatives for homepage category pictures,
  banners, product cards, lists and other CMS artwork. Cart, checkout, order,
  supplier, blog and About-page display pictures use the same helper.
- Use the actual card column sizes instead of treating each mobile card as 90vw.
- Normalize exact first-party upload URLs and supported width buckets, including
  a new 160px option for 80px icons on retina displays. External sources and
  unlisted static assets keep their existing paths.
- Prepare only the next slider image after the active image settles. Automatic
  rotation waits for the next image; manual selection keeps the current picture
  until the requested picture decodes. Later selections supersede earlier ones.
  Pause, reduced-motion preferences, load errors and viewport changes are handled.
- Generate content-hashed static artwork copies using
  `node scripts/build-storefront-image-assets.cjs`. The manifest describes each
  file's actual output width. Already-compressed artwork retains its original
  bytes when a lossless copy would be larger.
- Cache successful image bytes and hashed static copies for one year. Remove
  conflicting image cache headers while keeping image errors and other API data
  uncached. Inventory, orders and CMS data retain their no-store behavior.
- Defer the lower-page video background until it is close to the viewport.

## Image quality and future products

Original uploads and repository artwork are unchanged. Product zoom and gallery
viewers still use originals. Display copies are resized for their rendered size
and pixel density, then encoded losslessly, including transparency. A resized
copy does not contain every original-resolution pixel.

The existing upload image route generates variants automatically for existing
and future uploads. Source modification time remains part of derivative cache
keys. No product data migration or upload replacement is required.

## Verification

- All four existing backend image tests passed, including original preservation,
  lossless pixels/alpha, concurrent requests and cache refresh.
- Targeted checks passed for 160px output, successful 200/304 cache headers and
  uncached 400/404/500 image errors.
- 36 URL/helper assertions and all 24 static manifest sources passed review.
- All 64 generated static copies match expected visible resized pixels and alpha;
  descriptors match file widths, and no generated copy exceeds its original's
  byte size. Static category copies at 160px total 551,430 bytes versus 3,064,913
  original bytes (82% less).
- Browser checks covered desktop and 390px mobile layout, optimized image URLs,
  and rapid slider selections. The loaded picture stayed visible and the latest
  selected slide appeared after loading.

## Restore

Source backup: `backup/before-website-image-loading-20261108` (includes the contact
email and search/favicon fixes). Previous complete releases remain available to
the existing VPS release manager. Restoring source requires no product-image or
database restore; additional cached display copies can remain unused.
