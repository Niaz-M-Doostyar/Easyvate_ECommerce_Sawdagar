# Mobile phone password recovery review

Verified on 2026-10-06 (Asia/Kabul).

## Recovery flow

1. Forgot Password requests a code for the normalized Afghan phone number, using SMS or WhatsApp.
2. Entering six digits automatically calls `POST /api/auth/verify-phone-reset-otp` with the challenge and code. This step does not submit or change a password.
3. Successful verification opens the separate New Password screen with a ten-minute reset proof. The screen uses the same fields, spacing, colors, and keyboard layout as Login.
4. Matching passwords of 6–72 characters are submitted to `POST /api/auth/reset-phone-password` with the challenge and reset proof. Success returns to Login with a notice.

The existing email reset-link option remains available. Customer and supplier signup are unchanged.

## Checks completed

The nine tests in `mobile-app/tests/phone-recovery-flow.test.cjs` run the actual screen handlers and auto-verification hook against mocked APIs. They verified:

- Wrong OTP remains on verification with an error; incomplete and expired codes do not call verification.
- A correct six-digit code opens New Password without including any password in the OTP request.
- Automatic and manual verification overlap produces one request; settling and rerendering do not repeat the code.
- Missing or expired reset proof prevents password API calls.
- Short, over-72-character, and nonmatching passwords are rejected locally.
- `RESET_PROOF_INVALID` presents the request-new-code state; ordinary password validation errors keep the form available.
- A successful password save returns to Login; overlapping saves produce one request.
- Email recovery still sends the normalized email to the legacy endpoint.
- All four changed mobile sources parse with the React Native Babel preset.

Run them from `mobile-app` with `node --test tests/phone-recovery-flow.test.cjs`. They are also included in the existing mobile test script. No SMS, live account creation, or real password change was performed by these checks.


## Native simulator review

Reviewed the actual recovery screens in the iPhone 17 Pro Max and iPad Pro 11 simulators with temporary mocked recovery APIs and a synthetic phone number. Correct six-digit OTP entry ran the auto-verification hook and opened New Password on both devices; an incorrect code stayed on OTP; expired reset proof showed the request-new-code action. Native OTP focus was visible on iPhone and the numeric keyboard appeared on iPad. This check used fixture entry rather than manual typing.

Normal and largest accessibility text settings were reviewed. New Password keeps the same bounded card on iPad and scrolls on phone. Heading and introduction scaling is capped at 2×, with natural line height, to avoid broken words and oversized empty text boxes. Input labels, fields, validation, and action text retain their normal accessibility scaling. Incorrect-code feedback now appears immediately below the OTP boxes; initial request errors appear before resend-method choices.

Temporary fixtures and screen instrumentation were removed, the normal App.js was restored exactly, and simulator text size was restored. No real SMS or password write occurred during native review.
