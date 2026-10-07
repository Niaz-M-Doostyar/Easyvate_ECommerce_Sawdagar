# Product sharing preview review — October 7, 2026

## Findings

Public shared-product pages already provided Open Graph image URLs, but those
URLs served original uploads. The latest sample PNGs were 0.8–2.3 MB. The VPS
catalog file audit found every referenced upload present; 387 of 1,172 first
images across all product records exceeded 300 KB. The public catalog contained
966 approved products, including one without an image. The precise WhatsApp
client failure was not established from metadata alone.

## Repair

Shared pages and regular product metadata now advertise a public JPEG endpoint,
`/share/products/<id>/image.jpg`, with explicit MIME type, secure URL and
1200 × 630 dimensions. The backend contains the entire product on white,
flattens transparency and caps previews at 280 KB. A bounded recipe and source
modification time identify cached variants; completed previews are written
atomically to the persistent upload cache.

Future mobile shares and the shared page's canonical URL use `?preview=2`.
Preview image URLs include an image/product version hash. Existing product links,
Universal Links, Android install referrers and the iOS Copy & install action
retain their product IDs. Actual uploaded images are retained for product pages.
Products without an image use the existing logo fallback.

The metadata follows the image structured properties in the
[Open Graph protocol](https://ogp.me/).

## Verification

Eight website sharing tests, three image-route tests and ten native link/recovery
tests passed. These cover HTML escaping, untrusted links, image-version changes,
copy/install consent, transparent images, JPEG dimensions, the payload cap,
conditional cache requests and existing WebP variants. The website production
build and signed iPhone Release rebuild passed. The rebuilt bundle contains
`?preview=2`.

Production release `c8d38453` is active. The live catalog audit checked all 967
public product pages and their advertised images: 966 JPEG previews, one logo
fallback, zero failures. Every preview was 1200 × 630, opaque and below the
280 KB cap; the largest was 128,485 bytes. The audit took 139 seconds.

The signed sharing build was installed on the USB iPhone 12 Pro Max and cold
launched into product 1187. A physical screenshot confirmed the native product
page and photo rendered. Actual WhatsApp compose-preview confirmation remains
pending; existing sent messages may retain their cached previews.

## Restore

Source before this repair is preserved on GitHub at `956ac58d`, branch
`backup/before-product-share-preview-2026-10-07`. Revert
`Serve lightweight JPEG product previews for social sharing`, then rebuild and
redeploy the app/API/website. The generated cache contains derived images;
restoring this source does not require changing products, uploads or account data.
