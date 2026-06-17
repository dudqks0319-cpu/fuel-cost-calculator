# Security Gate

Date: 2026-06-17
Security Owner: Orchestrator

## Checklist

- Secrets: no hardcoded API keys, Apple credentials, GitHub tokens, EAS tokens, or private keys.
- AuthN/AuthZ: not applicable. The app has no login, account, or privileged server action.
- Input/Output: numeric inputs are sanitized in UI handlers and rendered by React Native text components.
- Dependencies: package lock is present; `npm audit` is part of the release harness and must show no critical or high vulnerabilities.
- Data Handling: only calculation inputs and UI choices are stored locally through AsyncStorage.
- Abuse Controls: not applicable for a local-only calculator with no network API, sessions, payments, or user-generated public content.
- Tests: calculator, formatter, chart, vehicle data, fuel price, EV mode, compare copy, and purchase feature tests exist.
- Residual Risk: moderate/low transitive development-tool advisories may remain until Expo/React Native upstreams publish compatible fixes. App Store Connect account state, Apple agreements, real-device TestFlight behavior, and final App Review approval remain external gates owned by the account holder.

## Release Command

```bash
npm run release:local
```

For iOS submission readiness after the App Store Connect app record exists:

```bash
STORE_PRIVACY_POLICY_URL=https://dudqks0319-cpu.github.io/fuel-cost-calculator/privacy.html \
STORE_SUPPORT_URL=https://dudqks0319-cpu.github.io/fuel-cost-calculator/support.html \
ASC_APP_ID=<app-store-connect-apple-id> \
npm run release:ios
```
