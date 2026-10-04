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

## Previous Featured Products layout

- Dedicated compact cards with contained images, two-line names, prices, optional
  discount/verification metadata below images, and one readable Add action.
- This previous layout used three columns and three rows (nine items) on ordinary
  phone widths. The nine-item limit is superseded by the follow-up below. Narrow
  windows and larger text reduce columns; iPads use four to six columns.
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

## Featured Products and slider follow-up — October 4, 2026

- Restored a visible Quick View eye button beside Add, with 44-point touch
  targets. Preview access no longer depends on discovering a long press.
- Featured Products requests up to 75 products, displays up to 50 initially,
  and reveals the next 25 with Load More. If fewer products are available, only
  the actual products appear; products are not duplicated to fill the grid.
- All admin-managed content remains connected: slides and their photos, titles,
  descriptions and button links, offers, announcement, campaign banner, and
  sponsored ad. The slider design is pending the user's choice:
  - **A. Clean campaign banner (recommended):** wide image with a compact caption
    and shop action underneath.
  - **B. Product spotlight:** centered product image with information and action
    underneath.
  - **C. Swipeable campaign cards:** smaller cards with a visible preview of the
    next offer.
- Visually checked the updated featured grid on iPhone 17 Pro Max this turn.
  All 76 JavaScript source files parsed and all 16 mobile Node tests passed.
  The live public catalog returned 75 distinct products for the requested limit.
- The slider alternatives are suggestions and have not yet replaced the current
  slider. The interactive comparison in `design-previews/sawdagar-slider-options.html`
  was checked at narrow phone and wider widths, with light/dark appearances and
  working option switching and Quick View open/close.
- The state before this follow-up is preserved at commit `b72d6b73`.
