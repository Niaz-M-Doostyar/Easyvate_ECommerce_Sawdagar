# App Store release 4.0 (5) — October 7, 2026

Application: Sawdagar, App Store ID `6763734260`.
Production bundle: `com.nabat.sawdagar.online.shoping`; team: `UFSF57GHNA`.
Source at archive time: `321632b8`, including the latest cart quantity,
product-sharing preview and OTP guidance changes.

The signed archive/export succeeded. Codesign validation passed; the final
entitlements contain both Sawdagar App Links domains and `get-task-allow=false`.
Apple validated the IPA with no errors and accepted its upload. Build ID:
`1fcd7a5d-744c-48c1-94f7-bb3e8f06aa38`. Processing reached VALID and the build was
selected for the existing 4.0 App Store version.

Five genuine screenshots were captured on each of iPhone 17 Pro Max (1320×2868)
and iPad Pro 13-inch (2064×2752): Home, Shop, Product, Discovery and Categories.
Loading captures were discarded and recaptured after product images appeared.
JPEGs preserve the original dimensions and have no alpha channel. Both device sets completed Apple processing: five screenshots each, all COMPLETE.

Description, promotional text, keywords and release notes were updated for the
customer shopping app. Marketing/support links now use `sawdagar.com`.
The previous privacy link pointed to the old domain's About page. The app's
existing privacy text is reproduced verbatim in `website/public/privacy-policy.html`;
its public deployment and listing link update remain pending.

No App Review submission or public release has been performed. The listing
remains in PREPARE_FOR_SUBMISSION. API keys and signing secrets are not in Git.

Local artifacts:
- `mobile-app/build/releases/Sawdagar-4.0-build5.ipa`
- `mobile-app/build/releases/appstore-4.0/Sawdagar-4.0-AppStore-screenshots.zip`
- `mobile-app/build/releases/appstore-4.0/previous-listing/`: all 20 former
  screenshot files and previous metadata snapshots.

Restore the editable listing from those snapshots and files if needed. The
previous production build remains in App Store Connect; no signing certificate
or existing provisioning profile was revoked. The new profile expires with the
existing distribution certificate in April 2027. Reproduction script:
`mobile-app/scripts/build-appstore-release.sh`; choose a new unused build number
for another upload. Its signing parameters do not change the development
project's physical-iPhone bundle ID.
