# Mobile design restore point

The app design before the October 4, 2026 refresh is saved at:

- Commit: `4ee61aa3`
- Local and GitHub branch: `backup/mobile-design-before-refresh-2026-10-04`

## Undo only this refresh

Find the refresh commit:

```sh
git log --oneline --grep='Modernize mobile app surfaces typography and page layouts'
```

Then run `git revert <refresh-commit-hash>` and push the resulting commit. This
preserves history and later changes; resolve any conflicts if later edits touch
the same styles. Rebuild the mobile app for installed versions to receive the
restored design.

## Restore the exact earlier mobile source

If the exact earlier mobile source is wanted, use:

```sh
git restore --source=backup/mobile-design-before-refresh-2026-10-04 -- mobile-app/src
git add mobile-app/src
git commit -m 'Restore mobile design before October refresh'
git push
```

This second option replaces subsequent changes within `mobile-app/src` too.
Neither option changes customer data, orders, or the database.

## Verification scope

All app screen and component source files were reviewed for shared styling and
parsed with Babel. Representative simulator screens are checked visually.
Authenticated supplier and delivery workflows need their corresponding accounts
for full interactive verification.

## Responsive redesign restore point

The version immediately before the responsive redesign is preserved on GitHub:

- Commit: `ceb90d86`
- Branch: `backup/mobile-ui-before-responsive-2026-10-04`

This restore point includes the working OTP integration and confirmed SMS test.
To undo this design pass while retaining later work, find and revert its commit:

```sh
git log --oneline --grep='Modernize responsive mobile layouts and shared controls'
git revert <redesign-commit-hash>
git push
```

To restore the exact mobile source from this newer backup:

```sh
git restore --source=backup/mobile-ui-before-responsive-2026-10-04 -- mobile-app/src mobile-app/tests
git add mobile-app/src mobile-app/tests
git commit -m 'Restore mobile UI before responsive redesign'
git push
```

Rebuild and distribute the mobile app to apply a restore to installed release
versions. These commands do not modify production accounts, orders, or databases.

## Featured Products redesign restore point

The home design before the compact Featured Products update is saved on GitHub
at `fef95e9c`, branch `backup/mobile-home-before-featured-2026-10-04`.

To undo this update while retaining later work:

```sh
git log --oneline --grep='Redesign featured products and preserve admin home content'
git revert <featured-redesign-commit-hash>
git push
```

The update retains the admin-controlled slider, offers, announcement, campaign
banner, and sponsored ad. It removes static introductory copy, service tiles,
and an unused action carousel, and introduces a compact three-row product grid.

## Product pages restore point — October 5, 2026

The source before the product pages update is saved on GitHub at `325117c4`,
branch `backup/mobile-products-before-related-pages-2026-10-05`.

To undo this update while retaining later work:

```sh
git log --oneline --grep='Unify product-focused mobile shopping pages'
git revert <product-pages-commit-hash>
git push
```

The exact earlier source can also be restored with:

```sh
git restore --source=backup/mobile-products-before-related-pages-2026-10-05 -- mobile-app/src
git add mobile-app/src
git commit -m 'Restore mobile product pages before October 5 refresh'
git push
```

The exact-source option replaces subsequent mobile source edits too. Rebuild
the app to apply either restore to installed releases. Customer data, orders,
and the database are unaffected.

## Automatic home catalog restore point

The version before removing the Featured Products display limits and manual
Load More button is saved at `e85bc901`, branch
`backup/mobile-before-all-products-2026-10-05`.

Find the update with `git log --oneline --grep='Show all home products with automatic pagination'`
and revert that commit to retain other later changes. Rebuild installed releases
to apply a restore. See [catalog verification](mobile-home-catalog-review.md).

## Previous slider restore point

The version before restoring the pre-October-2 slider is saved at `dff79a89`,
branch `backup/mobile-before-slider-restore-2026-10-05`.

Find the update with `git log --oneline --grep='Restore mobile slider design from before October 2'`
and revert it to retain later changes. Rebuild installed releases to apply the
restore. See [slider verification](mobile-slider-restore-review.md).
