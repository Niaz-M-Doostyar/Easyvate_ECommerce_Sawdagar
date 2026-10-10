# Image loading with preserved originals — October 10, 2026

## Diagnosis

Startup prefetched full-size original uploads for several products, sponsored products and campaign banners, while cards separately requested thumbnails. The slider additionally rendered two image sizes and prefetched variants. This created competing downloads before the user reached the lower sections.

Four sampled thumbnails took roughly 7–9 seconds over the external network. Original PNGs of 1.2–2.3 MB did not finish within 35 seconds. The same cached thumbnail served inside the VPS in 0.0045 seconds. External delivery remained variable during verification, so no universal load-time guarantee is claimed.

## Changes

- Removed startup original-image prefetches for products and campaigns.
- Home sections/featured rows defer remote images until within 240 points of the viewport; enabled sections remain loaded. Scrolling and layout/rotation trigger checks.
- Slider requests one density-aware image per slide, starting the next slide only after the active image loads. No separate duplicate prefetch.
- CMS campaign artwork and category thumbnails request display variants instead of full original uploads. Native image caching prefers available cached data.
- Width-based mobile image requests use lossless WebP derivatives. Existing lossy/social API variants remain compatible. Lossless variants use separate persistent cache keys and atomic writes to prevent concurrent requests seeing incomplete files.

## Quality and future uploads

Original uploads are not edited by this change. Full-screen zoom still requests the original without resizing/recompression. Display variants are resized for the UI; lossless encoding preserves every pixel of the resized image, alpha/transparency and colors without introducing lossy compression artifacts. This is not a claim that a thumbnail contains all original-resolution pixels.

The same automatic derivative route applies to existing and future uploads, with cache keys including source modification time. No database migration or bulk overwrite of product pictures is needed.

Sample: a 1,207,551-byte original produced a 75,118-byte lossless 420-pixel derivative (about 94% fewer bytes) and a 44,372-byte 320-pixel derivative. Original remains unchanged.

## Verification

Four backend image tests passed: social preview compatibility, path validation, concurrent complete lossless responses, exact resized-pixel/alpha preservation, unchanged originals and cache refresh after modification. All 37 pre-existing mobile tests and two new image-URL tests passed. The full suite must run with `mobile-app` as its working directory to resolve its Babel preset.

iOS simulator home/scroll XCTest passed; later visual capture confirmed loaded product pictures after scrolling. iOS device and Android release builds succeeded. Updated development app installed and launched on the USB iPhone 12 Pro Max, and Android APK installed/launched in the emulator. These do not publish new App Store/Play releases.

The backend route was deployed immediately with a restore copy at `/root/sawdagar-image-before-lossless-20261010.js`; readiness passed. Cache stays under persistent uploads `.cache`.

## Restore

Backup branch `backup/before-image-loading-20261010` points to `8929e67374283728d9dbb9a407bd0157d466d1b6`. Source rollback restores the previous mobile loading behavior and image API. Original product photos are untouched and need no restoration. Keep the provider's six-digit-only OTP fixes when restoring unrelated UI changes.
