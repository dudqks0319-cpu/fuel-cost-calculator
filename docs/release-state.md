# Current Release State

Updated: 2026-06-17

## Local Code State

- Branch: `appstore-free-release`
- Latest release-prep commit: pending
- App name: 기름값 계산기
- Version: `1.0.0`
- iOS bundle ID: `com.jyb1126.fuelcostcalculator`
- iOS build number: `1`
- Android package: `com.jyb1126.fuelcostcalculator`
- Android version code: `1`
- EAS project ID: `8dad0ba0-7cb4-46e1-ae81-e96f67faf1e3`

## External State

- GitHub Pages privacy URL: pending publish
- GitHub Pages support URL: pending publish
- App Store Connect app record: pending account login
- App Store Connect Apple ID / `ASC_APP_ID`: pending
- EAS iOS build ID: pending
- EAS submit ID: pending
- TestFlight state: pending
- Real-device result: pending
- Google Play app record: out of scope for the current iOS-free release pass
- Dependency audit: no known critical/high advisories after safe `npm audit fix`; moderate/low transitive development-tool advisories remain pending upstream-compatible fixes.

## Verification

- `npm run release:local`: passed on 2026-06-17
- `npm run lint`: passed with 2 pre-existing style warnings in `scripts/convert-vehicles.ts`
- `npx expo export --platform web`: passed on 2026-06-17
- Local static export HTTP check: `http://127.0.0.1:4173` returned 200 and exported HTML title is `기름값 계산기`

## Next Action

1. Run local release harness.
2. Push docs and release config to `main`.
3. Enable GitHub Pages from `/docs`.
4. Create App Store Connect app record as a free iOS app.
5. Build with EAS and submit to TestFlight.
