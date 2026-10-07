#!/bin/bash
set -euo pipefail
# Build with the installed distribution identity/profile; upload separately.
project_root="$(cd "$(dirname "$0")/../.." && pwd)"
release_version="${SAWDAGAR_IOS_VERSION:-4.0}"
release_build="${SAWDAGAR_IOS_BUILD:-5}"
release_profile="${SAWDAGAR_IOS_PROFILE:-7b5b82f3-82f5-490f-8fd2-ce7ebde9f6f4}"
release_dir="$project_root/mobile-app/build/releases/ios-${release_version}-build${release_build}"
mkdir -p "$release_dir"
xcodebuild -workspace "$project_root/mobile-app/ios/SawdagarNativeScaffold.xcworkspace" \
 -scheme SawdagarNativeScaffold -configuration Release -destination 'generic/platform=iOS' \
 -archivePath "$release_dir/Sawdagar.xcarchive" \
 MARKETING_VERSION="$release_version" CURRENT_PROJECT_VERSION="$release_build" \
 PRODUCT_BUNDLE_IDENTIFIER=com.nabat.sawdagar.online.shoping DEVELOPMENT_TEAM=UFSF57GHNA \
 CODE_SIGN_ENTITLEMENTS=SawdagarNativeScaffold/SawdagarNativeScaffold.entitlements \
 CODE_SIGN_STYLE=Manual CODE_SIGN_IDENTITY='Apple Distribution' \
 PROVISIONING_PROFILE_SPECIFIER="$release_profile" archive
python3 - "$release_dir/ExportOptions.plist" "$release_profile" <<'PY'
import plistlib,sys
with open(sys.argv[1],'wb') as f:
 plistlib.dump({'method':'app-store-connect','destination':'export','signingStyle':'manual',
 'signingCertificate':'Apple Distribution','teamID':'UFSF57GHNA',
 'provisioningProfiles':{'com.nabat.sawdagar.online.shoping':sys.argv[2]},
 'manageAppVersionAndBuildNumber':False,'stripSwiftSymbols':True,'uploadSymbols':True},f)
PY
xcodebuild -exportArchive -archivePath "$release_dir/Sawdagar.xcarchive" \
 -exportPath "$release_dir/export" -exportOptionsPlist "$release_dir/ExportOptions.plist"
