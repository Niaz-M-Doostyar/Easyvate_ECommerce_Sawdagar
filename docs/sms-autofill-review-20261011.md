# SMS OTP autofill — 11 October 2026

## Finding and limits

The shared OTP control already used iOS `textContentType="oneTimeCode"`, automatic focus and six-digit paste normalization. WhatsApp and SMS use the same control. WhatsApp filling successfully does not establish that iOS recognized the SMS itself.

Ghoncha requires the SMS payload to contain exactly six digits. Its prior account warning explicitly prohibits verification text; do not add text or a domain-bound suffix. The app cannot force iOS to recognize a digits-only SMS or read the user's Messages inbox. Actual SMS QuickType behavior must be checked with an incoming SMS on the physical iPhone.

Apple reference: https://developer.apple.com/documentation/security/enabling-password-autofill-on-a-text-input-view

## App changes

- Use a visible single native OTP text field instead of transparent text over decorative boxes. Selection, paste, focus and one-tap filling operate directly on that field.
- Explicitly declare matching iOS `autoComplete="one-time-code"` and `textContentType="oneTimeCode"`; retain Android `sms-otp`.
- Keep full six-digit normalization, automatic focus after challenge/resend and when returning to the app, plus automatic verification.
- Explain the Messages copy-and-paste fallback when iOS does not offer a suggestion.
- No provider request, paid SMS test, backend payload or delivery behavior changed.

## Verification and restore

41 mobile tests passed; Babel compiled the modified component. Physical-device build and installation are recorded in this session. SMS QuickType receipt was not verified by an automated or paid delivery test.

Previous revision: `cc1519d1`, saved in `backup/before-sms-autofill-20261011`. Rebuild that revision to restore the previous control.
