# Store Submission Runbook

## 목표

기름값 계산기를 무료 iOS 앱으로 App Store Connect에 올리고 TestFlight에서 실제 기기 확인 후 심사 제출한다.

## 로컬 준비

1. `npm install`
2. `npm run release:local`
3. GitHub Pages에서 개인정보 처리방침과 지원 URL이 200 응답인지 확인
4. App Store Connect에서 iOS 앱 레코드 생성

## App Store Connect 앱 레코드

- 플랫폼: iOS
- 이름: 기름값 계산기
- 기본 언어: 한국어
- 번들 ID: `com.jyb1126.fuelcostcalculator`
- SKU: `fuel-cost-calculator-ios-20260617`
- 가격: 무료
- 개인정보 처리방침 URL: `https://dudqks0319-cpu.github.io/fuel-cost-calculator/privacy.html`
- 지원 URL: `https://dudqks0319-cpu.github.io/fuel-cost-calculator/support.html`

## iOS 빌드

App Store Connect 앱 레코드 생성 후 `ASC_APP_ID`를 설정한다.

```bash
STORE_PRIVACY_POLICY_URL=https://dudqks0319-cpu.github.io/fuel-cost-calculator/privacy.html \
STORE_SUPPORT_URL=https://dudqks0319-cpu.github.io/fuel-cost-calculator/support.html \
ASC_APP_ID=<app-store-connect-apple-id> \
npm run release:ios
```

그 다음 EAS iOS 빌드를 실행한다.

```bash
eas build -p ios --profile production
```

빌드가 성공하면 App Store Connect에 제출한다.

```bash
eas submit -p ios --latest
```

## TestFlight 확인

- TestFlight 빌드 번호 확인
- 실제 iPhone에 설치
- 앱 실행, 홈 계산, 차량 비교, 전기차 비교, 구매 계산 화면 확인
- 크래시가 있으면 같은 빌드 번호 기준으로 기기 로그를 수집

## 최종 심사 제출 전 중단점

최종 `Submit for Review`, 가격/세금/계약 확인, 계정 비밀번호 입력, Apple 약관 동의는 계정 소유자가 직접 확인한다.
