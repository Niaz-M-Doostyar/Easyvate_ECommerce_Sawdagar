# Mobile refresh and product promotions

In **Admin → Products**, select **Promote in slider** on an approved product
that has stock, a selling price, and an image. The action toggles to
**Remove promotion**. Slider placement is separate from paid sponsorships.

The website and mobile homepage use the same live product data. Every slide
uses the first product image (by image sort order), current selling price,
localized name/description, and a Shop button linking to that product.
Images use contain sizing inside a consistent frame; no banner design is
required. Products that become unavailable are automatically hidden. There
is no three-product limit. With no eligible promoted products, the slider is
hidden instead of showing sample products. Existing manual slide settings
remain stored but no longer drive the public slider.

After changing promotions, reload the website or refresh/revisit mobile Home.
Deploy the additive Prisma migration before starting the new backend.

The mobile UI refresh includes the home carousel, reusable raised buttons,
fields, product cards, headers, navigation, auth/profile/cart/checkout screens,
responsive product grids, and contained product-detail images. The carousel
pauses after interaction, when Home loses focus, in the background, and for
screen readers or reduced-motion preferences.

Mobile changes require a new native app build and installation. A GitHub/VPS
deployment updates the API and web apps, but does not update installed apps
or submit a release to app stores.

Verification commands:

```sh
node --test backend/tests/sliderPromotions.test.js
npm --prefix backend run check:syntax
npm --prefix website run build
npm --prefix admin run build
cd mobile-app/android && ./gradlew assembleRelease
```
