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
