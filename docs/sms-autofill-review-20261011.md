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

### Follow-up: design restored

The user tested the visible field and reported that SMS suggestions still did not appear. The field redesign did not resolve the reported problem. Restored the previous six-box design exactly, retaining only the matching iOS autofill property and the nonvisual test identifier. Do not claim the SMS recognition problem is solved. Neither further provider requests nor SMS content changes were made.

41 mobile tests passed; Babel compiled the modified component. Physical-device build and installation are recorded in this session. SMS QuickType receipt was not verified by an automated or paid delivery test.

Previous revision: `cc1519d1`, saved in `backup/before-sms-autofill-20261011`. Rebuild that revision to restore the previous control.

### Recognition investigation

The user confirmed Apple’s built-in keyboard and enabled AutoFill. React Native’s implementation forwards the declared `oneTimeCode` value directly to the native text input; no custom input view or accessory is attached to the OTP field.

Apple’s Security Code AutoFill session states that its message detector looks for words such as code/passcode near the code, and gives a diagnostic: tapping a recognized code in Messages offers “Copy Code.” Reference: https://developer.apple.com/videos/play/wwdc2018/204/ (26-minute section). This makes digits-only SMS recognition a likely cause, but does not establish the specific iOS detector outcome without the user’s Messages check.

Ghoncha’s public documentation was retrieved on 11 October from https://sms.ghoncha.com/docs. It documents the existing OTP route and generic send route but no iOS autofill/sender-metadata option. Its generic text examples permit custom wording, which conflicts with the account-specific warning supplied by the user. Do not use those generic examples to override the explicit digits-only requirement. Obtain written provider confirmation before modifying message format.

No paid test, SMS payload change, additional installation or design change was performed during this investigation. A provider support question is prepared separately and has not been sent.
