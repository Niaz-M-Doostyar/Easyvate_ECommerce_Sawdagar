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
The subsequent delivery-status lookup returned HTTP 500 with
`operator configuration missing`. [Ghoncha's documentation](https://sms.ghoncha.com/docs)
says a WhatsApp charge means accepted for delivery and can remain even when
the message never arrives. The documentation describes status lookup alongside
SMS and does not confirm support for WhatsApp message IDs, so this lookup error
does not establish the cause of the missing WhatsApp message. WhatsApp must be
active and online on the same number; provider delivery investigation remains
necessary. No further paid messages are authorized by the completed two-message
test. No account was created or password changed; the
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

## Production rollout

The existing CI deployed `61e0d669` successfully to
`/var/www/releases/sawdagar/61e0d6690afab66bf729df4d63d3cadf4476b992-20261007T071106Z`.
The API health/readiness checks, admin login, website home, public signup and
password-recovery pages returned HTTP 200. An invalid-phone request to the public
supplier OTP endpoint returned HTTP 400 before any database write or provider send.
The active API and changed website sources match the local SHA-256 hashes.

CI saved a database backup at
`/var/backups/cicd/sawdagar/sawdagar-61e0d6690afa-20261007T071109Z.sql.gz`.
The earlier release remains available, and product uploads still resolve to
`/var/lib/cicd/persistent/sawdagar/backend-uploads`. No new schema migration was
required for this repair.

## WhatsApp provider investigation

The existing message can be investigated without charging for another send.
Its provider message ID is `8a3debb1-4289-478f-87fa-63c65ed8c015`.
Ask Ghoncha to check that message's downstream delivery result, confirm whether
`GET /api/v1/status/{id}` supports WhatsApp IDs, and identify the correct receipt
mechanism. The accepted request used `POST /api/v1/otp/send/whatsapp`, returned
`channel: whatsapp` and `status: sent`, and cost 1.00 AFN. SMS was delivered.
No support message has been sent on the user's behalf.

## Physical iPhone

The USB iPhone 12 Pro Max uses iOS 27.0.1. A signed Release app was built with
embedded JavaScript and installed as `com.niaz.sawdagar.dev`, preserving existing
data. The user trusted the developer certificate. Its original startup then
crashed because the SDK 27 build used the legacy UIKit window lifecycle.

The fix adds a single-scene manifest and SceneDelegate, creates the window from
UIWindowScene and forwards cold/warm URLs and user activities through the
existing React Native factory/Linking manager. Signing settings are unchanged.
Release rebuild and code-signature validation passed. The phone later appeared
in USB inventory, but its developer connection timed out. Restarting and
unlocking the iPhone recovered the paired wired connection. The scene-compatible
Release app was installed successfully. Startup and a separate cold launch
produced running processes; the old scene-lifecycle crash did not recur during
the check. A physical screenshot confirmed the Cart screen, product image and
controls rendered. This verifies startup/rendering, not every authenticated flow
or a frame-rate benchmark.

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
