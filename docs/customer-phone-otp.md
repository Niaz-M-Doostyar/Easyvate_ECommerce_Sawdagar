# Customer phone signup

Website and mobile customer signup collect first name, last name, Afghanistan mobile number, password and confirmation. Account creation happens only after verification. Supplier signup also verifies the phone number; supplier email is optional. Existing email accounts can still sign in using email; new customers sign in using phone and password.

Ghoncha documentation: https://sms.ghoncha.com/docs

SMS is the default. The server calls `/api/v1/send` with exactly six digits in `message`, without other text. WhatsApp calls `/api/v1/otp/send/whatsapp` with an application-generated six-digit `code`. Customers may switch channels and resend after 60 seconds. Each resend replaces the challenge and invalidates the previous code; use the most recent requested code. Codes expire after five minutes, with five verification attempts per challenge, five sends per phone per hour and twenty requests per IP per hour. Challenges, password hashes, code hashes and rate limits are stored in MySQL. Provider failures never activate accounts. No provider key or OTP is returned to clients.

## Setup

1. Configure `GHONCHA_API_KEY` in the backend environment only. The supplied key has been added to the ignored local `backend/.env`; configure it separately on the deployment server.
2. Start the configured MySQL server. The local database at `localhost:8889` was started and the OTP schema was applied during simulator testing.
3. Apply the schema using this project's existing workflow: `npm --prefix backend run db:push`. The additive SQL migration is also provided in `backend/prisma/migrations/20260927000000_customer_phone_otp/` for deployments managing Prisma migration history. Use one schema management workflow; do not apply both against the same database without baselining.
4. Regenerate Prisma if needed: `cd backend && npx prisma generate`, then restart the backend.
5. Verify SMS and WhatsApp delivery with a real Afghanistan number. Automated tests mock Ghoncha and do not spend credit.

Phone signup does not require an email. To preserve existing required-email database integrations, these accounts receive an internal identifier at `phone.sawdagar.local`, which is not a deliverable email address. Customer order-confirmation emails are skipped for these accounts. `phoneVerified` and unique `customerPhone` govern identity; verified phone changes are blocked in profile updates. The existing email password-reset flow remains for email accounts; phone-only accounts now recover passwords using the same SMS/WhatsApp OTP methods and a separate purpose-bound reset endpoint.

## Validation

- `node --test backend/tests/phoneOtp.test.js`
- `npm --prefix backend run check:syntax`
- `cd backend && npx prisma validate`
- `npm --prefix website run build`

The updated Debug app was built and launched on the iPhone 16 Pro simulator (iOS 18.2). Both Debug and release builds use the online API at https://sawdagar.com. Live product images were confirmed on the iPhone 17 Pro Max simulator. Physical devices and message receipt on a real phone still require testing. Keep the backend key out of frontend/mobile environment variables.

For Xcode 27, the simulator build required `IPHONEOS_DEPLOYMENT_TARGET=15.1` to override an older dependency target. The running build uses `mobile-app/build/OTPDerivedData/`.

## VPS rollout (2026-09-27)

The active deployment is `/var/www/apps/sawdagar/current`, now pointing to `/var/www/releases/sawdagar/phone-otp-20260927`. The previous release is `/var/www/releases/sawdagar/direct-links-20260907T1555Z`. A complete database backup was made at `/root/sawdagar-before-phone-otp-20260927.sql` before applying the additive migration via `prisma migrate deploy`. Backend and website were restarted and health-checked; uploads remain on the persistent upload symlink. Ghoncha accepted the configured key and reported a 500 AFN balance before any live test sends.

The mobile simulator was restored to the production API. The earlier missing images came from the development API switch, which rewrote image URLs to the local backend. Both original and optimized live images returned HTTP 200, and a live product image was visually verified in the simulator. The new native signup/recovery flow needs a rebuilt app to reach installed production clients; VPS updates alone cannot change their bundled UI.

Public smoke checks cover Afghan-only validation, unissued/expired OTP rejection, reset input validation, and the rendered signup fields. Actual SMS/WhatsApp receipt needs a number controlled by the tester; automated tests and smoke checks do not send to arbitrary numbers.

## Form refinements

Signup keeps Afghanistan's +93 prefix visible and normalizes local, international and Persian/Arabic-digit input. The customer enters nine digits beginning with 7. Name fields have matching icons and autofill metadata; native keyboards support Next navigation and a Done accessory for the phone keypad. Password fields advertise new-password autofill. OTP input advertises one-time-code autofill; actual suggestions depend on the OS and received message. Verification guidance appears in the app/site, while the provider SMS remains strictly six digits. The verification view retains the live resend countdown and code expiry timer.

## Automatic verification

Signup submits verification once the sixth digit is typed, pasted or autofilled. During checking the code field is disabled, and errors are displayed without creating an account. Editing an incorrect code allows another attempt; rerenders and network failures never automatically repeat the same attempt. Resending creates a new challenge. Phone recovery verifies the six-digit code first, then opens a separate New Password screen. Server expiry, attempt limits and one-use verification remain enforced.

## OTP environment repair (2026-10-04)

The production release was missing `GHONCHA_API_KEY` because the deployment
script copies `backend/.env` from `/var/www/sawdagar`, while the key had only
been configured in an earlier release. The key was restored to both the active
release and `/var/www/sawdagar/backend/.env`, without storing it in Git. Secured
environment backups were taken on the VPS before this repair. The backend was
restarted and provider authentication/balance was checked without sending SMS.

Future configuration updates must include the deployment source environment,
not only the active release. Check configuration presence without printing the
key, and verify `/api/ready` after a restart. SMS and WhatsApp delivery failures
now log safe diagnostic categories; provider bodies, phone numbers, keys, and
OTP values are never logged by that diagnostic. Existing validation, expiry,
resend limits, and account verification requirements are preserved.

The repaired service was tested through the production registration endpoint.
One user-approved SMS was accepted and the user confirmed receipt. No account
was created and no password was changed. Customer signup, supplier signup, and
phone-password recovery tests pass. The deployed backend readiness check passed
after the final release, and the provider key was verified in that release.

## Separate recovery steps (October 5, 2026)

`POST /api/auth/verify-phone-reset-otp` accepts `{challengeId, code}`. A valid
recovery code becomes a random, one-use reset token valid for ten minutes. Only
its hash is stored. The OTP is consumed at this transition; no password changes.
The app replaces the verification screen with New Password and submits
`{challengeId, resetToken, password, confirmPassword}` to
`POST /api/auth/reset-phone-password`. Success consumes the token and returns
the customer or supplier to sign in. Invalid, expired, exhausted, or consumed
proofs return `RESET_PROOF_INVALID` and require another code. The existing
single-step OTP/password request is retained for installed clients and the
website; email recovery links are also retained. No schema migration is needed.

The shared OTP input stays a native, focusable text field with visible opacity;
only its glyphs are transparent beneath the six decorative digits. iOS uses
`textContentType="oneTimeCode"`; Android uses `autoComplete="sms-otp"` and
`importantForAutofill="yes"`. Formatted paste and Persian/Arabic numerals normalize
before truncating to six digits. The input focuses after loading and when the
app returns from Messages. These settings follow [React Native input guidance](https://reactnative.dev/docs/0.85/textinput),
[Apple autofill guidance](https://developer.apple.com/documentation/security/enabling-password-autofill-on-a-text-input-view),
and [Android autofill guidance](https://developer.android.com/identity/autofill/autofill-optimize).
Actual SMS suggestions depend on the device, keyboard, received message and
autofill settings; simulator tests cannot establish physical SMS suggestions.
WhatsApp codes can be pasted or typed. No SMS-reading permission is requested.
