# ScamSignal AI Mobile

Native React Native/Expo client for ScamSignal AI. This is an offline-first app,
not a WebView wrapper. It consumes the shared URL/redaction engine from
`packages/core` and will use the typed client in `packages/api-client` for cloud
enrichment.

## Current vertical slice

- Expo SDK 57 with development builds and Continuous Native Generation.
- Android compile/target SDK 36.
- Provisional package ID `vn.scamsignal.app`; confirm it before the first Play upload.
- Professional Check screen with local privacy notice and deterministic result.
- Demo typosquat runs on-device without opening the URL.
- Android Share Sheet intake for one `text/plain` or `image/*` payload with an
  explicit preview/edit/confirm step. Raw suspicious URLs are never resolved.
- System Photo Picker with an 8 MB JPG/PNG/WebP boundary; no broad media access.
- Deterministic QR scan from a selected local image. Decoded content is shown as
  untrusted data and requires another explicit action before local analysis.
- SMS, call-log, camera, microphone, overlay and broad/all-files permissions are
  explicitly removed from the generated Android manifest.

Incoming share support in Expo SDK 57 is experimental. Manual paste and the
Photo Picker remain available as fallbacks. The generated intent filters and
browser/mobile-web flow have been verified; install-and-share testing on a real
Android device is still required before calling the R1 gate complete.

## Commands

Run from the repository root:

```bash
npm install
npm run lint:mobile
npm run test:mobile
npm run build:mobile
```

The root suite currently contains 75 tests, including mobile intake
normalization, one-time in-memory handoff, local URL analysis and QR selection.

Generate native Android files and start a development build:

```bash
npm run prebuild:android --workspace @scamsignal/mobile -- --clean
npm run android --workspace @scamsignal/mobile -- --device
```

Local Android compilation requires Android Studio/SDK 36, Java 17 and a connected
emulator or USB-debugging device. Alternatively, configure EAS and use the
`development` profile in `eas.json` to produce an installable APK.

Generated `android/` and `ios/` directories remain ignored. Regenerate them from
`app.json` instead of maintaining manual native edits.

## Manual Android smoke checklist

1. Share one URL from Chrome into ScamSignal AI.
2. Confirm the Share Intake screen shows editable text without opening the URL.
3. Cancel once, then repeat and confirm; verify Home receives the text once.
4. Share one local screenshot, confirm it, then scan its QR locally.
5. Verify the decoded value is not inserted until “Dùng nội dung QR để kiểm tra”.
6. Deny/cancel the Photo Picker and confirm paste/local analysis still works.
7. Re-open the app and verify raw shared content was not restored unexpectedly.
