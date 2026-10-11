# Android release 1.0.8 (16) — 11 October 2026

Artifact: `mobile-app/build/releases/Sawdagar-1.0.8-build16-api36.aab`.
Application ID: `com.ahmadwali.afghan_bazar.afghan_bazar`.
Version name/code: **1.0.8 / 16**. Previous prepared release: 1.0.7 / 15.
Packaged compile/target SDK: **36 (Android 16)**; minimum SDK: 24.

The signed release bundle built with JDK 17. Bundletool 1.18.2 validated it;
its packaged manifest confirms the version and target above and no debuggable
flag. Jarsigner verified the signature. The certificate SHA-256 matches the
previous release:
`05:27:D6:11:BF:EC:35:84:71:E3:29:2A:56:7A:FC:70:18:F3:1F:5F:D4:E7:24:6B:92:15:E1:0D:27:44:8E:63`.

Artifact SHA-256:
`3fbdbc6cd16a6ab0bc9f0cd651b3aaf329bb4f29af824b02d5981cecb7a83a61`.

Includes the latest image previews, lossless final-image delivery, cached home
refresh, complete search traversal and preserved six-box OTP control. The 41
mobile tests passed from the mobile-app working directory. No Play Console
upload was requested or performed. Store keys and binaries remain outside Git.

Restore source before release numbering using
`backup/before-next-store-release-20261011` (revision `0d4cfc19`). A future
Play update or rollback must use a version code higher than any already uploaded.
