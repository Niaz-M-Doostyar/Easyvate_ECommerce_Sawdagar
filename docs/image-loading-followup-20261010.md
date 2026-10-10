# Slider and image loading follow-up — 10 October 2026

## Findings

- The first live slider lossless 1200px image was 1,376,476 bytes. One public download took 15.97 seconds, with a first byte at 2.62 seconds.
- Its lossless 80px preview was 8,116 bytes and downloaded in 4.46 seconds. These are individual observations, not guaranteed timings.
- The production backend readiness endpoint returned HTTP 200 in 0.006 seconds. Public connections were intermittent earlier, including a timed-out site-content request and SSH connection; subsequent requests succeeded.

## Changes

- Display a lightweight image preview underneath the final image while it downloads. This applies to sized RemoteImage displays, including sliders, cards, categories and campaign artwork. Original uploads and final lossless image requests are unchanged. Full-size viewing still requests the original. The temporary preview has less detail; it is removed when the final image loads.
- Persist only public home products, categories and CMS content locally for at most 24 hours. Restore them on reopening, then refresh from the server. Product prices, stock and promotions may briefly reflect the saved snapshot while refreshing.
- Refresh each home section independently. Failed requests preserve previously loaded sections instead of removing the slider or promotions.
- Advance the automatic slider only once the current and next pictures have loaded. Manual navigation remains available.

## Verification

- 41 mobile tests passed, including cache expiry, independent section refresh and damaged/unavailable storage handling.
- Babel compiled the modified components successfully.
- iPhone device and Android release builds succeeded.
- Live lossless image and preview endpoints both returned HTTP 200.

## Restore

The prior source revision is `ee82b359`, preserved in branch `backup/before-image-followup-20261010`. Rebuild that revision to restore the previous app. This follow-up changes no backend route, original upload or database record. Cached home sections use the `sawdagar.public-home.v1.*` AsyncStorage namespace.
