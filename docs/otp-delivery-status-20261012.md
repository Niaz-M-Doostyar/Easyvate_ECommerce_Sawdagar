# OTP delivery status accuracy — 12 October 2026

The approved filming request was accepted by Ghoncha's OTP endpoint as SMS. Two read-only status checks remained `pending`, more than 32 minutes apart. No WhatsApp fallback was confirmed. This is not evidence of handset delivery, and no additional paid request was made.

The backend now validates the documented provider response fields and returns safe delivery status to mobile and website verification screens. Only an explicit `delivered` status claims delivery. Other accepted states say the code was requested. Malformed responses invalidate the challenge rather than reporting success.

The six-digit payload, provider endpoints, verification checks, expiry, resend limits and app layout remain unchanged. SMS keyboard suggestions are conditional on device recognition.

Validation: four backend OTP tests and 41 mobile tests passed; edited JSX parsed successfully. Mocked checks cover pending/sent/delivered replies, malformed HTTP 200 replies and provider errors.

This correction improves status accuracy. It does not fix an OTP queued by the provider. It has not been deployed to the VPS or included in a new store binary.

Provider contract: https://sms.ghoncha.com/docs (checked 12 October 2026).

Restore source to the preceding commit `7ce25ef4` or revert this correction's commit. No database migration is required.
