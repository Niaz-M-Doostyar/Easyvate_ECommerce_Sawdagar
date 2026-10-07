# Product cart feedback and SMS recognition — October 7, 2026

The product details header now observes the shared cart state and displays its
quantity badge, including 99+ and RTL placement. The bottom purchase area shows
how many units of the displayed product are already in the cart. Add to Cart
and Buy Now are disabled while an add request is pending.

The user supplied a Messages screenshot showing digits-only SMS. The generic
Ghoncha send endpoint now receives an ASCII message identifying the six digits
as a Sawdagar verification code, with its five-minute expiry. It fits one SMS.
Native iOS oneTimeCode and Android sms-otp input hints are retained. The new
wording supports recognition; iOS controls whether the keyboard offers a code.
No SMS-reading permission or account-security change was introduced.

Four backend tests passed, including supplier signup, purpose/expiry/attempt
limits and one-use recovery. Changed native files parsed successfully and the
signed Release build succeeded. The updated app was installed on the USB iPhone
12 Pro Max and cold launched into product 1187. Its screenshot showed a cart
badge of 2, with product photo and purchase controls rendered; the process was
running. Physical Add to Cart interaction and a fresh SMS keyboard suggestion
still need user confirmation.

Source commit: `1e8a5142`. Restore branch:
`backup/before-cart-otp-autofill-2026-10-07` at `c8d38453`.
Production CI deployed `1e8a5142` successfully. The active source contains the
new SMS wording; API readiness, website home and admin login returned HTTP 200.
CI created a database restore backup before deployment. No additional paid OTP
was sent. User permission for a fresh physical SMS suggestion test is pending.
The device test provisioning expires October 13, 2026 at 12:54 Kabul.
