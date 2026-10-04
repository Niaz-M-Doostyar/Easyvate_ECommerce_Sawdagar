# Responsive mobile UI review — October 4, 2026

## Design changes

- Shared page bounds, safe area handling, readable headings, quieter surfaces,
  consistent form cards, and controls with comfortable touch targets.
- Compact home presentation with localized marketplace introduction and a
  responsive product carousel. Large text switches the carousel to a vertical
  arrangement for legibility.
- Product, search, home, and category grids choose their density using the usable
  window width and text size rather than device names. Phone catalogs now have
  two readable columns; narrower windows or larger text reduce density.
- Tablet product detail uses image and information columns. Purchase actions
  adapt to narrow screens and large text.
- Product images keep discount and verification metadata beneath them. Product
  names and metadata have reserved space; Add labels no longer shrink to tiny
  text. Controls grow with larger text.
- Password recovery, login, registration, edit profile, and change password use
  consistent form presentation. Validation and toast colors have clearer
  contrast. Loading products shows catalog placeholders and a loading label.
- Product previews, province selection, ads, and update prompts have bounded
  layouts. Ads retain image padding, product names, tap navigation, dismissal,
  random selection, and the four-second display behavior.
- Loading placeholders respect Reduce Motion. Shared components propagate these
  improvements to customer, supplier, and delivery screens.

## Verification

- All 74 JavaScript source files transformed successfully with the project's
  Babel configuration.
- All 12 mobile Node tests passed, including responsive grid cases covering
  11 widths (320–1366 points) and four text scales, plus Split View density.
- Visually reviewed representative home, catalog, product detail, and login
  screens on iPhone 16e, iPhone 17 Pro Max, and iPad Pro 11-inch M5 simulators.
- Checked login at iOS accessibility-large text size; content remains scrollable.
- Landscape and Split View widths are covered by layout tests. Interactive
  landscape, every iPhone/iPad model, and authenticated supplier/delivery
  workflows have not all been manually tested.

## Restore

See `mobile-design-restore.md`. The pre-redesign GitHub branch is
`backup/mobile-ui-before-responsive-2026-10-04` at `ceb90d86`.

## Featured Products follow-up

- Dedicated compact cards with contained images, two-line names, prices, optional
  discount/verification metadata below images, and one readable Add action.
- Featured Products uses three columns and three rows (nine items) on ordinary
  phone widths. Narrow windows and larger text reduce columns; iPads use four
  to six columns. See All still opens the full catalog.
- Recommended and New Arrivals use the same compact card and remain distinct.
- Admin content remains connected to the existing content API: slider, button
  destinations, offers, announcement, main campaign banner, and sponsored ad.
  Offer and campaign captions now use normal card layout for readable content.
- Removed static marketplace introductory copy, service tiles, header tagline,
  and the unused action carousel. No admin settings or content were deleted.
- All 76 source files parsed; all 16 mobile Node tests passed. Visually inspected
  the featured grid on iPhone 17 Pro Max and iPad Pro 11-inch M5, and checked
  that the restored admin sections appear. Large text and narrow windows are
  additionally covered by layout tests.
- Restore point: `fef95e9c`, GitHub branch
  `backup/mobile-home-before-featured-2026-10-04`.
