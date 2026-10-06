# Phone offers and discovery redesign — October 6, 2026

Featured Offers uses compact tonal cards with transparent product artwork,
normal-flow copy and a clear 44pt action. The carousel shows the next card and
snaps between offers. The below-category discovery campaign is a single
integrated card rather than a photo frame above a separate copy block.
Phone layouts stack for narrow space or larger text, mirror copy/actions for
RTL, and use corresponding dark colors. Marketing-card text can grow up to
twice its normal size without truncating the content. Admin text and destinations
are kept.

Card fills, artwork backgrounds and buttons now follow the same admin-selected
theme as Home through `brandSurface`, `brandSurfaceStrong`, `primaryDark`
and `white`. All phone offers use the same fill and artwork background. The earlier fixed pastel fills
were replaced in the theme/Shop follow-up described
[here](mobile-theme-shop-review.md).

The iOS device idiom selects the iPad layout, including Split View; iPhones in
landscape continue using the phone design. iPad photos and all 14 original
section style values are retained. Android retains the existing tablet flag.
The fixed 60 products, hero slider, shelves and sponsored popup are unchanged.

The four new PNGs have real alpha transparency. Only known default image URLs
map to them; custom admin images remain primary and use a bundled PNG if their
remote image fails. See [assets and exact prompts](home-campaign-images.md).

## Verification

- Actual components were reviewed natively on iPhone 17 Pro Max and iPad Pro
  using the current public CMS copy/images. Both phone sections were also
  inspected inside the real Home page.
- iPhone 16e checks cover the largest accessibility text setting and a native
  preview constrained to 320pt width. Text, artwork and actions stay separate.
  The large-text check exposed a decoration overlap and mid-word heading split;
  bounded circular decoration and scalable typography corrected both.
- A dark-mode phone preview with Dari copy checked RTL card order, alignment,
  contrast and left-pointing actions.
- All 14 tablet style values match the prior version. The native tablet preview
  retains the original photography, frames and horizontal discovery layout.
- The actual artwork resolver was checked with relative/default Sawdagar URLs,
  external custom URLs and custom uploads. Source parsing and diff checks pass.
- Temporary fixtures and scroll offsets were removed. Original App.js and
  normal simulator text settings were restored before reopening the app.

Native screenshot evidence is retained locally at
`/private/tmp/sawdagar-phone-campaign-qa-20261006/`.

## Restore

The complete source before this change is saved at `9e36b640` on GitHub branch
`backup/mobile-before-phone-campaigns-2026-10-06`.

To undo only this change while preserving later work, find and revert the
commit titled `Redesign phone offers and discovery with transparent artwork`,
then rebuild the mobile app. No backend, website, admin or database deployment
is required for this phone-only change.
