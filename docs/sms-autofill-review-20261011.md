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

### Further investigation: automatic suggestion without copying

The user declined contacting Ghoncha and requires unchanged six-digit-only SMS, no copying, and the existing six-box design. A further native-control audit found no remaining app-side blocker: the view has opacity 1, a focused editable native field, a system keyboard, no custom input view or accessory, and a direct mapping to `UITextContentTypeOneTimeCode`. Both channels use the same control. The earlier visible-field trial did not fix the SMS behavior.

Checked the installed iOS 27 SDK's UIKit, AuthenticationServices, UserNotifications and IdentityLookup headers plus Apple's primary documentation. No supported API was found that forces an unrecognized digits-only SMS into the keyboard's OTP suggestions. `ASOneTimeCodeCredential` supplies credentials a provider already holds; it does not read incoming SMS. An SMS filtering extension cannot share message data with its containing shopping app and is not a supported workaround.

Apple's iOS 26 feature list documents verification-code autofill from app notifications (PDF page 14): https://www.apple.com/os/pdf/All_New_Features_iOS_26_Sept_2025.pdf. This is a possible explanation for WhatsApp suggestions; the exact WhatsApp path on the user's phone was not directly observed. This does not expose Messages or other apps' notifications to Sawdagar.

Sources for alternatives checked:
- https://developer.apple.com/documentation/security/one-time-codes
- https://developer.apple.com/documentation/security/enabling-autofill-for-domain-bound-sms-codes
- https://developer.apple.com/videos/play/wwdc2024/10125/
- https://developer.apple.com/documentation/identitylookup/sms-and-mms-message-filtering

Result: automatic SMS suggestion remains unresolved under the requested constraints. Do not claim it has been implemented or guaranteed. Do not return a verification code to the requesting app or create a notification from that returned code: that would bypass evidence that the user received the phone message. No app code, design, SMS payload or installed build changed in this follow-up.
