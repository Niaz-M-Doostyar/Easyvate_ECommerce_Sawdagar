# Home palette and Shop grid — October 6, 2026

## Home color management

Phone offer and discovery cards previously used fixed pastel fills. They now
read the active theme selected by admin, just like Home. Every offer uses the
same `brandSurface` background, with `brandSurfaceStrong` behind the artwork.
Discovery uses the same pair.
Buttons use `primaryDark` with `white` text. Transparent PNG artwork and iPad
card styling are retained.

The actual palette was checked for all five built-in themes. Button contrast
is 10.59:1 in light themes and 7.70:1 in dark themes. An independent review
also confirmed readable card titles and secondary text. On app startup, the
existing ThemeProvider loads the admin-selected theme and applies it to these
cards.

## Shop

Shop uses three columns on normal 375, 390 and 440pt phone windows, with card
widths of 109, 114 and 130.67pt respectively. A 320pt window uses two columns;
larger text also reduces columns so Add and Quick View retain their 44pt
targets. Existing tablet sizing is preserved, including four columns at 834pt
and five at 1024pt. Loading placeholders match the phone grid.

The full catalog card retains category, stock, discount, verified and sponsored
information. Filters, sorting, product navigation, quick view and pagination
requests are unchanged. Search uses its previous layout.

## Native review

During the theme/Shop update, the full app was checked in iPhone 17 Pro Max and
iPhone 16e simulators at normal text size: both show three cards per row, with
loaded product images, aligned actions and no horizontal overflow. The iPad Pro 11-inch simulator
retains its four-column layout. The phone marketing components were also
checked in light and dark/RTL themes with the actual transparent PNG assets.
Screenshots are saved in
`/private/tmp/sawdagar-theme-shop-qa-20261006/`.

Temporary preview routes and component fixtures were restored before commit.

For the uniform-background follow-up, all three actual phone offer components
were displayed together in the iPhone 17 Pro Max simulator. Their fills and
artwork backgrounds match, and all three transparent PNG images load correctly.
The full app was restored after the check. Screenshots are saved in
`/private/tmp/sawdagar-uniform-offers-20261006/`.

## Restore

The complete version before the theme/Shop update is saved at `4020ef0d` on
GitHub branch
`backup/mobile-before-theme-shop-grid-2026-10-06`.
To undo only this change while preserving later work, find and revert the
commit titled `Match home cards to active theme and show three Shop columns`,
then rebuild the mobile app. This update requires no website/admin/backend
or database deployment.

The follow-up that gives all phone offers one background has its own restore
point and commit listed in [design restore instructions](mobile-design-restore.md).
