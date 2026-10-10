# SMS OTP route and physical iPhone reinstall — October 10, 2026

The SMS sender now uses Ghoncha's dedicated `/api/v1/otp/send` with the application's own six-digit code and `ttl: 300`. WhatsApp still uses `/api/v1/otp/send/whatsapp`. No explanatory text is sent. Six-digit validation remains enforced before any request.

The dedicated OTP endpoint selects SMS first for Afghan numbers and may fall back to WhatsApp. The shared auth response now reports the provider's actual channel/fallback, and customer/supplier registration and password recovery on mobile/website use that channel in verification guidance. Local purpose-bound code verification, expiry and rate limits remain unchanged.

Provider reference: https://sms.ghoncha.com/docs (read October 10). The previous generic send payload was also documented; switching routes does not establish that the previous payload was the cause of non-delivery.

## Live test and remaining delivery issue

The user authorized one test up to 1.00 AFN to the previously confirmed controlled number. The dedicated route accepted the test with `status: sent`, `channel: sms`, no fallback, and a 0.50 AFN charge. However, the user reported no receipt. Subsequent provider delivery lookups returned HTTP 200 with message/recipient status `pending`. API acceptance does not prove delivery. Provider/carrier queue investigation is still needed if it remains pending; do not claim SMS delivery is fixed or send more paid tests under the consumed authorization.

## Verification and deployment

Four backend OTP tests passed, including reporting a WhatsApp fallback rather than claiming SMS. Changed mobile/website files pass Babel parsing. Production backend files were backed up under `/root/sawdagar-*-before-otp-route-20261010.js`, corrected and restarted with readiness checked.

The latest Release device build succeeded, installed over `com.niaz.sawdagar.dev` on the connected iPhone 12 Pro Max, and launched successfully. The latest app process remained present after launch. Existing data was preserved. The development profile expires October 13, 2026 at 12:54 Kabul.

## Restore

Git backup branch `backup/before-sms-otp-route-20261010` retains commit `61e88c550a8b6a359505277b5cea5c3da700b289`. This backup already enforces six-digit SMS messages, so it is safe for a route/UI rollback under the provider's digits-only rule.
