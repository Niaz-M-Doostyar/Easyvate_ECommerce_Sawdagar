# Android release 1.0.7 (15) — October 7, 2026

Bundle: `mobile-app/build/releases/Sawdagar-1.0.7-build15-api36.aab`
Application ID: `com.ahmadwali.afghan_bazar.afghan_bazar`
Version name: `1.0.7`; version code: `15` (production predecessor: `14 / 1.0.6`).
Compile and target API: **36 / Android 16**. Minimum API: 24.

The signed release bundle built successfully with JDK 17. Google bundletool
1.18.2 validation passed. Its actual packaged manifest confirms the version,
package and target API above; it is not debuggable. Embedded JavaScript contains
the latest product cart count, share-preview version and OTP guidance changes.
Jarsigner verified the signature. The existing release certificate matches the
previous local bundle and documented production certificate:
`05:27:D6:11:BF:EC:35:84:71:E3:29:2A:56:7A:FC:70:18:F3:1F:5F:D4:E7:24:6B:92:15:E1:0D:27:44:8E:63`.
Keystore/passwords remain outside Git.

SHA-256: `78d1ecda9620411b95d5bdc0f08f6bff6ce120dda9beeb6f82b6e97111cd25cb`

Upload this AAB to the existing Sawdagar listing. Internal testing can precede
production. The target API warning is addressed in the artifact; Google must
process the production release before confirming the listing is compliant.
See [Google target API requirements](https://support.google.com/googleplay/android-developer/answer/11926878).
No Play Console upload or publication was performed. This check did not run
Android device flows.

A previous local build-14 bundle and build configuration were preserved in
`/private/tmp/Sawdagar-1.0.6-build14-before-release-20261007.aab` and
`/private/tmp/sawdagar-android-app-build14-restore.gradle`. Older app source remains
in Git. A future Play rollback requires a higher unused version code.
