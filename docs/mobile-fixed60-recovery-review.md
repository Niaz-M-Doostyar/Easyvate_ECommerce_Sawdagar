# Fixed Featured Products and phone recovery

## Home

Featured Products requests page 1 with limit 60 and deduplicates/caps the result
at 60 real products. If fewer are available, only those products are shown.
Scrolling no longer requests or appends additional pages. Pull refresh replaces
the same collection; returning from a product preserves it and the scroll
position. The full catalog remains available in Shop and Search. Offers use
matching shopping images in padded, contained frames. The campaign
below Categories has a full-width image above its copy on phones and an airy
horizontal layout on tablets. Its text, image and destination remain editable
in admin. The restored pre-October-2 slider, admin promotions and both distinct
product shelves remain.
This replaces the automatic pagination described in the earlier catalog review.

## Phone recovery

Phone number → send code → verify code → New Password → sign in. Incorrect OTPs
stay on verification. A valid OTP opens the password form without requiring a
password first. The server issues a hashed, short-lived proof and consumes it
only when a valid new password is saved. Expired proofs require a fresh code.
Existing website/installed-client requests and email recovery remain supported.

OTP keyboard hints apply to customer signup, supplier signup and recovery.
Native input focus, paste and numeral normalization are shared. Physical SMS
suggestions still need verification on an actual device; no extra paid SMS was
sent during this work.

## Verification

- Backend handler tests cover both recovery contracts, incorrect/expired codes,
  attempt limits, purpose isolation, unchanged password during verification,
  invalid/expired/reused proof, and inactive account protection.
- Mobile helper checks cover formatted codes and responsive OTP digit boxes.
- Home handler checks cover 0/26/59/60/100 available products, deduplication,
  focus return, both shelves, and overlapping refresh responses.
- Native iPhone 17 Pro Max and iPad checks show 60 products and one request
  after repeated end scrolling. The offer and campaign layouts were inspected.
- The mobile suite contains 34 passing tests; all 9 backend tests pass, including
  recovery security checks. Mobile JavaScript sources parse successfully.

See [phone recovery review](mobile-phone-recovery-review.md) for the native
recovery checks and [image assets and prompts](home-campaign-images.md).

## Restore

GitHub restore branch: `backup/mobile-before-fixed60-offers-recovery-2026-10-06`
at `8a207232`. Revert the change commit and rebuild the app to retain later work.
No database migration is introduced by this change.

The VPS keeps the previous full release path in
`/root/sawdagar-before-fixed60-offers-phone-reset-20261006-release.txt`.
The image update keeps the original CMS record in
`/root/sawdagar-home-images-before-20261006.json` (mode 600).
Restore just the four image replacements while retaining later admin edits:

```sh
node /root/sawdagar-update-home-images.cjs --restore
```

To restore the previous API/site/admin code, point
`/var/www/apps/sawdagar/current` to the saved release path and restart
`sawdagar-backend`, `sawdagar-website`, and `sawdagar-admin` in PM2. Revert/rebuild
the matching mobile source too. The replacement JPEGs remain available in the
repository if the new campaign is wanted again.
