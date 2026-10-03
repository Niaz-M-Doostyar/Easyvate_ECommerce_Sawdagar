# Product sharing and app links

Mobile shares `https://sawdagar.com/share/products/<id>`. The website serves a server-rendered HTML response with Open Graph and Twitter image metadata. Crawlers receive HTML rather than an HTTP store redirect. Verified Universal Links and Android App Links open an installed app directly. If an in-app browser reaches the landing page, it attempts the Sawdagar app and falls back to the appropriate store. Android's Play Store URL includes a product install referrer. On iOS, **Copy product link & install** remains available to preserve the product across a first installation because the App Store has no Play-style install-referrer API. Desktop visitors see the product preview and website link.

Verified Universal Links / Android App Links bypass that page and open ProductDetail when the updated app is installed. Existing `/products/<id>` and `sawdagar://products/<id>` routes remain supported. iOS AppDelegate now forwards URL and universal-link events to React Native. Product loading clears stale details and ignores outdated responses when a second link arrives.

## Release

1. The website was deployed on 2026-09-07, including `public/.well-known/apple-app-site-association`. Both association files are served as JSON over HTTPS and `/share/products/*` reaches Next.js. The previous website build is retained at `/var/www/releases/sawdagar-sharing-20260907-rollback` on the VPS.
2. The installed production Android certificate fingerprint `05:27:D6:11:BF:EC:35:84:71:E3:29:2A:56:7A:FC:70:18:F3:1F:5F:D4:E7:24:6B:92:15:E1:0D:27:44:8E:63` matches `assetlinks.json`. Apple's CDN returns the deployed AASA entry `UFSF57GHNA.com.nabat.sawdagar.online.shoping` with `/share/products/*`.
3. Build and release updated native apps. Native folders are ignored by this repository; the local native edits are preserved in `mobile-app/patches/product-links.patch`. On another checkout with the same native scaffold, apply from repository root using `git apply mobile-app/patches/product-links.patch`. Do not reapply to the already-patched local folders. Preserve existing associated-domains entitlements and URL scheme configuration.
4. The default iOS listing is https://apps.apple.com/app/sawdagar/id6763734260. Override with server environment variable `IOS_APP_STORE_URL` if necessary. Android uses the native application ID `com.ahmadwali.afghan_bazar.afghan_bazar`.
5. The mobile store versions prepared for this update are Android `1.0.5` build `13` and iOS `3.0` build `3`.
6. Android's signed bundle is at `mobile-app/build/releases/Sawdagar-1.0.5-build13-product-links.aab`. iOS compiles and archives, but the final signed archive requires adding Apple team `UFSF57GHNA` to Xcode. The older Store profile expires in 2027 but does not contain the Associated Domains entitlement, so it must not be reused for this release.

## Post-install product recovery

Android uses Google Play's official Install Referrer API. The share page adds `sawdagar_product=<id>` to the Play URL, and the app validates and consumes it on first launch. The final store-delivery step can only be tested after the updated signed bundle is uploaded to a Play testing track; sideloaded APKs do not receive a Play install referrer.

iOS uses an explicit, consent-based clipboard handoff because the App Store does not provide an equivalent install referrer. The website copies only after the recipient taps **Copy product link & install**. On first launch, Sawdagar explains the action, reads only after **Paste & open**, and iOS displays its own paste permission. Only recent Sawdagar product URLs are accepted. A recipient who downloads without copying can return to the message and tap the link after installation.

## Verification

- `npm --prefix mobile-app run test:product-links`
- `node --test website/tests/productShare.test.cjs`
- `npm --prefix website run build`
- Send a real product link in WhatsApp and verify its image after deployment. Preview display/caching is controlled by the receiving platform.
- On release-signed iOS and Android devices, tap a shared link with the app stopped and running. Then tap a different product link while ProductDetail is open; verify the new product and back navigation.
- Upload the release bundle to a Play internal-testing track, install it through Google Play from a product share URL, and verify first-launch restoration. Google Play owns delivery of the install referrer.
- In-app browsers and user-disabled app-link settings can keep links in the browser even with the app installed; the browser fallback cannot reliably detect installation.

Verification completed on 2026-09-07: 15 automated sharing/recovery tests passed; website production build passed; Android debug, signed APK, and signed App Bundle builds passed with JDK 17; iOS simulator release build and unsigned device archive compilation passed; cold and warm product links opened products 1027 (Light) and 1026 (Chair) on both platforms; the signed Android build verified both production domains and opened a cold HTTPS App Link directly; a clean iOS installation restored product 1027 after both consent prompts; live HTTPS metadata, preview image, store links, AASA, Apple CDN cache, and Android signing fingerprint passed. Android's share sheet contained the product name, price, and new public URL. WhatsApp's crawler response contains the required Open Graph image metadata. No message was sent to another person during testing. iOS HTTPS association cannot be validated with the unsigned simulator app; the AASA file, Apple CDN copy, entitlements, native event forwarding, custom-scheme routing, and post-install recovery were verified separately.
