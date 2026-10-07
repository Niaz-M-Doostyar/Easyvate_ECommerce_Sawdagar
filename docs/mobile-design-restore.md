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

## Fixed 60 products, offers and recovery restore point

The version before the fixed Featured Products count, offer images and separate New Password
screen is saved at `8a207232`, branch
`backup/mobile-before-fixed60-offers-recovery-2026-10-06`.

Find the change with `git log --oneline --grep='Fix home product count and separate phone password recovery'`
and revert that commit to retain later work. Rebuild installed apps after a
restore. The backend supports both the existing one-step recovery request and
the new two-step request; restore the matching app and API version together.
See [verification and deployment](mobile-fixed60-recovery-review.md).

## Phone offers and discovery restore point

The version before the phone-only campaign redesign is saved at `9e36b640`,
branch `backup/mobile-before-phone-campaigns-2026-10-06`.

Find and revert the commit titled
`Redesign phone offers and discovery with transparent artwork`, then rebuild
the mobile app. This restores the previous phone offer/campaign sections while
retaining later work. See [phone campaign review](mobile-phone-campaign-review.md).

## Home theme and three-column Shop restore point

The version before matching phone campaign colors to the admin-selected theme
and changing Shop to three columns is saved at `4020ef0d`, branch
`backup/mobile-before-theme-shop-grid-2026-10-06`.

Find and revert the commit titled
`Match home cards to active theme and show three Shop columns`, then rebuild
the mobile app. See [theme and Shop review](mobile-theme-shop-review.md).

## Uniform phone offer backgrounds restore point

The version before making every phone offer use the same theme background is
saved at `51aef0aa`, branch
`backup/mobile-before-uniform-offers-2026-10-06`.

Find and revert the commit titled
`Use one theme background for every phone offer card`, then rebuild the mobile
app. Shop sizing, iPad styling and admin content are preserved.

## Supplier OTP and physical iPhone restore point

The application source before this repair is saved at `4dbf4676`, branch
`backup/before-supplier-otp-ios-device-2026-10-07`. Original iOS startup files,
which were previously ignored by Git, are preserved at `a8ad578e`, branch
`backup/native-before-scenes-2026-10-07`.

Find and revert `Repair OTP retry feedback and iOS 27 device startup`, then
rebuild/redeploy the affected app/API/website. Restoring the legacy iOS startup
will also restore its SDK 27 launch failure. See
[verification and device instructions](supplier-otp-device-review-20261007.md).
