# Previous slider restored — October 5, 2026

The requested slider design is restored from `0fa42379`, the latest main commit
before October 2, 2026 in Kabul time. Its carousel source last changed at
`9833ba5b` on September 6; both commits contain the same slider component.

The layout restores the blue image background, a larger photo above the copy
on phones, subtitle/price row, earlier typography, both shopping actions, and
the earlier card widths, spacing and pagination controls. Tablets use the
earlier image/details columns. Safe window sizing and stacking for larger text
are retained. Shared buttons and theme retain their current accessibility
support.

CMS slide fields and destination callbacks remain connected. Autoplay timing,
swiping, pause controls, foreground/focus rules, Reduce Motion, screen-reader
handling and RTL offsets match the earlier component. Home catalog pagination,
offers, categories and product shelves remain available.

## Verification

- Native iPhone 17 Pro Max and iPad Pro 11-inch layouts checked visually with
  current public CMS content and loaded product images.
- Carousel source parsed successfully; all 23 existing tests pass.
- Historical comparison confirms only safe window sizing and larger-text
  stacking differ from the earlier carousel source.
- Diff checks pass. No backend, admin data or order changes.

## Restore point

The version before this slider restore is saved at `dff79a89`, branch
`backup/mobile-before-slider-restore-2026-10-05`. Revert the slider restore commit
to undo this change while retaining later work. Rebuild installed releases to
receive a restore; the production database is unaffected.
