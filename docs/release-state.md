# Current Release State

Updated: 2026-06-18

## Local Code State

- Branch: `appstore-free-release`
- Latest release-prep commit: see `git log --oneline -3`
- App name: 기름값 계산기
- Version: `1.0.0`
- iOS bundle ID: `com.jyb1126.fccalc`
- iOS build number: `1`
- Android package: `com.jyb1126.fuelcostcalculator`
- Android version code: `1`
- EAS project ID: `8dad0ba0-7cb4-46e1-ae81-e96f67faf1e3`

## External State

- GitHub Pages privacy URL: `https://dudqks0319-cpu.github.io/fuel-cost-calculator/privacy.html` returned 200 on 2026-06-18
- GitHub Pages support URL: `https://dudqks0319-cpu.github.io/fuel-cost-calculator/support.html` returned 200 on 2026-06-18
- Apple Developer Bundle ID: `com.jyb1126.fccalc` registered on 2026-06-18
- App Store Connect app record: created on 2026-06-18, status `iOS 1.0 제출 준비 중`
- App Store Connect Apple ID / `ASC_APP_ID`: `6781709284`
- EAS iOS build ID: pending
- EAS submit ID: pending
- TestFlight state: pending
- Real-device result: pending
- Google Play app record: out of scope for the current iOS-free release pass
- Dependency audit: `npm run release:ios` reported no critical, high, moderate, or low vulnerabilities on 2026-06-18.

## Verification

- `npm run release:local`: passed on 2026-06-17
- `npm run lint`: passed with 2 pre-existing style warnings in `scripts/convert-vehicles.ts`
- `npx expo export --platform web`: passed on 2026-06-17
- Local static export HTTP check: `http://127.0.0.1:4173` returned 200 and exported HTML title is `기름값 계산기`
- GitHub Pages workflow run `27697000088`: passed on 2026-06-17

## Next Action

1. Run `npm run release:ios` with `ASC_APP_ID=6781709284`.
2. Build iOS with EAS production profile.
3. Submit the EAS build to TestFlight.
4. Install from TestFlight on a real iPhone and record launch evidence.
5. Complete App Store metadata, free pricing confirmation, and final App Review submission manually in App Store Connect.
