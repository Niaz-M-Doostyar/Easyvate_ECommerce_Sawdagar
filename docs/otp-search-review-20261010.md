# Ghoncha digits-only correction and complete mobile search — October 10, 2026

## Changes

- SMS sends `message: code` and WhatsApp sends `code: code`, strictly six ASCII digits. Provider-boundary validation rejects text, wrong lengths, trailing newlines and numeric rather than string payloads before any request.
- This corrects the October 7 explanatory SMS wording following Ghoncha's explicit warning. All signup and recovery handlers share the corrected sender.
- Mobile search requests pages of 100 until all matching pages are loaded, publishes results progressively, displays the API total, deduplicates overlapping pages, ignores obsolete requests and offers retry after network failure. No fixed result cap or more-products button.
- Both platforms retain responsive product grids and virtualized rendering.

## Verification

- Four backend OTP tests passed with a mocked provider, covering signup, recovery and invalid outbound messages. No paid SMS/WhatsApp sent.
- Five mobile search/layout tests passed, including 237 matches across three pages and obsolete-query suppression.
- iOS Release simulator build succeeded; XCTest search interaction passed on iPhone 17 Pro Max (iOS 26.2), verified `74 results` for `watch` and scrolled beyond ten cards.
- Android Release APK build succeeded and was installed/launched on Pixel 6 emulator; `watch` showed 74 results and a two-column grid, with scrolling beyond ten verified.
- iOS simulator is visible in Xcode 27 Device Hub (`Xcode.app/Contents/Applications/DeviceHub.app`), which replaces the former Simulator app path in this installation.
- Production backend sender was patched and restarted immediately with readiness HTTP 200 before the GitHub deployment, avoiding continued explanatory messages.

## Restore

Before this change, Git backup branch `backup/before-digits-only-search-20261010` points to `4de4b9c475bc3f8cb40aba015d47c4ed0ff02568`.
The VPS also retains `/root/sawdagar-phoneOtp-before-digits-only-20261010.js` for historical comparison. Do not restore its explanatory SMS wording: it violates Ghoncha's current requirement. UI rollback can preserve the corrected `backend/lib/phoneOtp.js` independently.
The Android emulator's previous APK was copied to `/private/tmp/sawdagar-emulator-before-20261010.apk` before replacing an installation with an incompatible signing key. Physical devices were not changed.

Existing Play/App Store uploaded artifacts have not been replaced by these local emulator builds. Native code input hints remain enabled, but actual keyboard OTP suggestions are controlled by the device OS.
