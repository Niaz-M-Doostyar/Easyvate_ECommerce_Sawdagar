# Supplier OTP and physical iPhone review — October 7, 2026

## Supplier verification

Mobile and website supplier signup send the correct shared OTP endpoint,
account role and selected SMS/WhatsApp channel. Optional email, province,
company details and Afghan phone normalization match the backend. Production
has the provider key, sufficient credit, and matching generated Prisma/database
registration fields. The test phone is not an existing account.

One approved supplier SMS test was accepted by Ghoncha, progressed to delivered,
and was confirmed received by the user. One approved WhatsApp test was accepted
with status `sent` and charged 1.00 AFN, but the user reported no WhatsApp receipt.
Ghoncha's delivery-status API returned HTTP 500 with
`operator configuration missing` for that message. WhatsApp receipt is
unresolved; the provider's configuration/status lookup needs investigation,
and WhatsApp must be active and online on the same phone. No further paid messages are authorized by the
completed two-message test. No account was created or password changed; the
test challenges were expired. Total test cost: 1.50 AFN.

Delivery keys, OTP values, passwords and provider response bodies were kept out
of tool output and logs. No key/configuration change or schema migration was
needed.

## Retry and error repair

The API now supplies `retryAfter` and `Retry-After` for send failures, minute
cooldowns, hourly phone/IP limits and concurrent-send conflicts. Clients
preserve this response data, disable early retries, show the countdown and keep
send failures visible. This prevents a failed send followed by immediate taps
from obscuring the original problem with a generic rate-limit message. Existing
expiry, verification attempt limits and account approval rules remain enforced.

Verification: four backend OTP tests passed, including supplier verification,
failed-send protection, minute/hour/IP cooldowns and first-send collisions.
Changed client files parse with Babel, and the website production build passed.

## Physical iPhone

The USB iPhone 12 Pro Max uses iOS 27.0.1. A signed Release app was built with
embedded JavaScript and installed as `com.niaz.sawdagar.dev`, preserving existing
data. The user trusted the developer certificate. Its original startup then
crashed because the SDK 27 build used the legacy UIKit window lifecycle.

The fix adds a single-scene manifest and SceneDelegate, creates the window from
UIWindowScene and forwards cold/warm URLs and user activities through the
existing React Native factory/Linking manager. Signing settings are unchanged.
Release rebuild and code-signature validation passed. Installation of the fixed
build and sustained running verification await USB reconnection.

Artifacts: `/private/tmp/sawdagar-iphone-release-20261007*`.
The development provisioning profile expires October 13, 2026, 08:24 UTC
(12:54 Kabul); this is a device test installation, not an App Store publication.

## Restore

The earlier application code is saved at `4dbf4676`, branch
`backup/before-supplier-otp-ios-device-2026-10-07`. The previously ignored iOS
startup sources are separately preserved at `a8ad578e`, branch
`backup/native-before-scenes-2026-10-07`.

Revert the commit titled `Repair OTP retry feedback and iOS 27 device startup`
to undo this repair while retaining later work, then rebuild/redeploy the affected
clients/API. Restoring the legacy native lifecycle will reintroduce the SDK 27
launch failure. Restoring only the OTP/UI sources retains device compatibility.
These changes do not migrate or restore production account/order data.
