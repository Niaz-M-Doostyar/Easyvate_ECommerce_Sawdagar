# Sawdagar Mobile Native

This app is the bare React Native version of the Sawdagar mobile client. It keeps the native shopping flows in-app and exposes the full website and admin surfaces through secure in-app portals while those areas are migrated screen by screen.

## Run

```bash
npm install
npm run pods
npm run ios
```

For Android:

```bash
npm install
npm run android
```

## Notes

- Expo has been removed from the runtime entrypoints and package manifest.
- The app uses the Sawdagar logo palette for the new mobile shell.
- Website and admin portal screens receive the mobile auth token through injected local storage and cookie setup so authenticated flows can continue inside the native shell.
