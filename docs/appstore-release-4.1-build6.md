# App Store release 4.1 (6) — 11 October 2026

Sawdagar App Store ID: `6763734260`.
Production bundle: `com.nabat.sawdagar.online.shoping`; team: `UFSF57GHNA`.
Version/build: **4.1 / 6**. The previous 4.0 / 5 version is live.

The production archive and export succeeded using the existing distribution
certificate and provisioning profile. System-keychain codesign verification
and Apple archive validation succeeded. The exported Info.plist confirms
version 4.1, build 6, the production bundle ID and
`ITSAppUsesNonExemptEncryption=false`.

Apple accepted the upload with no errors. Delivery UUID:
`e4ffa652-16be-489b-b3c7-92fd96676dbf`.
Processing reached VALID. Build ID `e4ffa652-16be-489b-b3c7-92fd96676dbf`
is selected for the 4.1 App Store version. Final API verification confirms
build 6, `usesNonExemptEncryption=false`, ten COMPLETE screenshots and saved
release notes. The verification record is
`mobile-app/build/releases/appstore-4.1/listing-final-verification.json`.

The new 4.1 App Store version ID is
`05acd7bc-63e5-4c6e-8936-b860358f55f6`. It uses manual release and initially
remains PREPARE_FOR_SUBMISSION. Its existing description, links, screenshots
and review information were inherited from the live 4.0 listing. Five iPhone
and five iPad screenshots are COMPLETE. New release notes describe image
loading, home reopening, complete product search and phone recovery refinements.
They do not claim the unresolved digits-only SMS suggestion issue is fixed.

Local artifacts:
- `mobile-app/build/releases/Sawdagar-4.1-build6.ipa`
- `mobile-app/build/releases/ios-4.1-build6/Sawdagar.xcarchive`
- `mobile-app/build/releases/appstore-4.1/`: Apple upload and validation records,
  previous live localization snapshot and new-version metadata.

IPA SHA-256:
`8260211c0e671a936d9fdb2f536a4efc87247aad471d6c902ebe536c8f7c6e51`.

The app source is revision `0d4cfc19` with release-number changes; all 41 mobile
tests passed. `mobile-app/scripts/build-appstore-release.sh` defaults to 4.1 / 6
and reproduces the production signing parameters. Use a new unused build number
for another upload. Secrets, archives and binaries are outside Git.

Restore source using `backup/before-next-store-release-20261011` at `0d4cfc19`.
The live 4.0 listing and binary were preserved. This task does not submit an
App Review request or publish the new version.
