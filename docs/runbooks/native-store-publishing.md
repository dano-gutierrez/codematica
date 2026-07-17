# Native Store Publishing Runbook

Last verified: 2026-07-17

This runbook covers the account setup and release steps needed to publish Codematica to Google Play and the Apple App Store using Expo EAS.

## Cost Reality

There is no fully free public-store path.

- Expo EAS has a free plan with limited monthly Android/iOS builds and app-store submit support.
- Google Play Console requires a one-time developer registration fee of US$25.
- Apple App Store publishing requires Apple Developer Program membership, currently US$99 per membership year in the United States. Apple offers fee waivers only for qualifying nonprofit, educational, and government entities.
- A free Apple developer account is useful for tools and local development, but it does not unlock App Store distribution.

Lowest-cost path for now:

1. Keep web on Vercel Hobby.
2. Keep Supabase optional/free until durable production data requires a plan review.
3. Use the Expo EAS free plan while build volume is low.
4. Pay the Google Play Console registration fee when Android public/internal Play testing is needed.
5. Delay Apple Developer Program enrollment until TestFlight/App Store distribution is needed.

## Before Creating Store Accounts

Decide these values first because changing them later can create store-record or signing friction:

```bash
EXPO_APP_NAME=Codematica
EXPO_APP_SLUG=codematica
EXPO_APP_SCHEME=codematica
EXPO_APP_IDENTIFIER=com.codematica.app
EXPO_APP_VERSION=0.1.0
EXPO_IOS_BUILD_NUMBER=1
EXPO_ANDROID_VERSION_CODE=1
EXPO_OWNER=your-expo-account
EAS_PROJECT_ID=your-eas-project-id
```

Use one final reverse-DNS identifier for both platforms. `com.codematica.app` is the current default; confirm it before creating Play Console and App Store Connect app records.

Prepare these release assets and policies:

- Public support email.
- Public support URL.
- Public privacy policy URL. This is required for Apple privacy metadata and for Google Play Data safety, even if the app collects little or no user data.
- App name, subtitle/short description, full description, keywords, category, and age-rating answers.
- Phone screenshots for both stores. Tablet screenshots can wait unless tablet support becomes a release goal.
- Data inventory for Supabase Auth/progress, local progress storage, crash diagnostics, analytics if added later, and third-party SDKs.
- Reviewer test account if login is required to inspect any app functionality.

## Repo Release Prep

Run these checks before creating store builds:

```bash
npm install
npm run content:check
npm run typecheck
npm run lint
npm test
npm run test:mobile
npm run mobile:doctor
npm run build
```

Confirm the public Expo config:

```bash
cd apps/mobile
npx expo config --type public
```

Never commit local store credentials. Keep Play service-account JSON and Apple API keys out of git; `apps/mobile/credentials/` is ignored for local copies.

## Expo EAS Setup

1. Create or sign in to an Expo account.
2. From the repo root:

```bash
npm run mobile:eas:login
npm run mobile:eas:init
```

3. Copy the EAS project id into `.env` as `EAS_PROJECT_ID`.
4. Configure signing credentials when the store accounts are ready:

```bash
npm run mobile:credentials:android
npm run mobile:credentials:ios
```

For the first Android upload, let Google Play App Signing manage the app signing key and let EAS manage the upload key unless there is a strong reason to bring your own key.

For iOS, let EAS manage the distribution certificate and provisioning profile unless the Apple team already has a signing process.

## Google Play Console Account

Official starting point: https://support.google.com/googleplay/android-developer/answer/6112435

1. Create or choose the Google Account that should own the developer account.
2. Enable two-step verification on that Google Account.
3. Go to Play Console and start developer account registration.
4. Accept the Google Play Developer Distribution Agreement.
5. Pay the US$25 one-time registration fee.
6. Choose account type:
   - Personal: fastest for an individual, but new personal accounts must satisfy Google Play’s closed testing requirement before production access.
   - Organization: better for a durable product/company. Requires organization verification; Google states organization accounts must have a D-U-N-S number unless a specific government exception applies.
7. Complete identity verification and contact verification.
8. Save the transaction id and account owner email in a private password manager.

For new personal developer accounts, plan for Google’s production-access gate: run a closed test with at least 12 opted-in testers for at least 14 continuous days, then apply for production access in Play Console.

## Google Play App Record

Official app setup guide: https://support.google.com/googleplay/android-developer/answer/9859152

1. In Play Console, click Create app.
2. Enter:
   - App name: `Codematica`
   - Default language: choose the primary launch language.
   - App or game: App.
   - Free or paid: Free for the current product.
3. Complete the dashboard setup tasks:
   - Main store listing: short description, full description, app icon, feature graphic, screenshots.
   - Store settings: app category, tags, contact details, external marketing.
   - App content: privacy policy, Data safety, ads declaration, content rating, target audience, app access instructions, government apps declaration, and any required policy questionnaires.
   - Pricing and availability: launch countries/regions.
4. Use internal testing first, then closed testing, then production.
5. Use Play App Signing for the first app bundle upload.

Google Play Data safety note: Google says every published app needs a Data safety form, including apps on closed, open, or production testing tracks. Apps exclusively active on internal testing are exempt from showing Data safety, but complete the form before broader testing/release.

## Android EAS Build And Submit

Build the app bundle:

```bash
npm run mobile:build:android
```

Submit the latest Android production build:

```bash
npm run mobile:submit:android
```

The repo’s EAS submit profile targets the Play internal track first. If EAS Submit is not connected yet, configure a Google service-account JSON key following Expo’s Android submit guide, then store it in EAS credentials or as a private local credential.

After submission:

1. Open Play Console.
2. Confirm the artifact appears on the internal track.
3. Add testers and verify install/update behavior.
4. For a new personal account, run the required closed test before requesting production access.
5. Promote to closed/open testing or production from Play Console when metadata, policy forms, and testing are ready.

## Apple Developer Program Account

Official membership comparison: https://developer.apple.com/support/compare-memberships/

1. Create or choose the Apple Account that should own the developer membership.
2. Enable two-factor authentication.
3. Register as a free Apple developer if needed for tools access.
4. Enroll in the Apple Developer Program when TestFlight/App Store distribution is needed.
5. Choose enrollment type:
   - Individual: fastest for one person, but the seller/developer name is the legal personal name.
   - Organization: better for a durable company/product. Requires the organization to be a legal entity and to provide a D-U-N-S Number. Apple says D-U-N-S lookup/request is free through Dun & Bradstreet, but it can take several business days.
6. Pay the Apple Developer Program fee unless eligible for Apple’s fee waiver.
7. After approval, sign in to App Store Connect and accept any pending agreements in the Business section.

## Apple Bundle ID And App Store Connect Record

Official App Store Connect app record guide: https://developer.apple.com/help/app-store-connect/create-an-app-record/add-a-new-app/

1. In the Apple Developer account, create an explicit App ID / Bundle ID matching `EXPO_APP_IDENTIFIER`, currently `com.codematica.app`.
2. In App Store Connect, open Apps and click `+` > New App.
3. Enter:
   - Platform: iOS.
   - Name: `Codematica`.
   - Primary language: choose the primary launch language.
   - Bundle ID: the explicit bundle id from step 1.
   - SKU: use a stable internal value such as `codematica-ios`.
   - User access: full access unless limiting this app to specific App Store Connect users.
4. Complete app information:
   - Category: likely Education.
   - Age rating.
   - Pricing and availability.
   - Support URL.
   - Privacy policy URL.
   - App privacy details.
   - Screenshots and promotional text.
   - Review notes and demo credentials if any signed-in surface is required for review.

Apple requires a privacy policy URL for iOS apps and requires App Store Connect privacy disclosures for App Store distribution.

## iOS EAS Build And Submit

Configure credentials:

```bash
npm run mobile:credentials:ios
```

Build iOS:

```bash
npm run mobile:build:ios
```

Submit the latest iOS production build:

```bash
npm run mobile:submit:ios
```

EAS Submit uploads the `.ipa` to App Store Connect. It does not publish the app to the public App Store by itself.

After submission:

1. Wait for App Store Connect processing.
2. Add the build to TestFlight.
3. Add internal testers first.
4. Resolve any export compliance, encryption, privacy, or metadata prompts.
5. Select the processed build on the app version.
6. Submit the app version for App Review.
7. After approval, release manually, automatically, or in phases according to the release option selected in App Store Connect.

## Store Metadata Checklist

Minimum first-launch metadata:

- App name: Codematica.
- Subtitle/short description.
- Full description.
- Keywords where applicable.
- Category: Education unless product positioning changes.
- Support URL.
- Privacy policy URL.
- Marketing URL if available.
- App icon and feature graphic/store artwork.
- Screenshots for required phone sizes.
- Age rating / content rating questionnaire.
- Data safety / app privacy questionnaire.
- App access instructions and demo credentials if login is needed.
- Release notes.

Data currently expected for privacy forms:

- Anonymous browsing content is bundled locally.
- Signed-out progress is stored locally on device/browser.
- Signed-in Auth/progress uses Supabase when public env vars are configured.
- The app should not claim “no data collected” if Auth/progress is enabled in production.
- Re-check every third-party SDK before submission, including Supabase, Expo modules, WebView, and any future analytics/crash reporting.

## First Release Sequence

1. Confirm `EXPO_APP_IDENTIFIER`.
2. Publish or draft a privacy policy URL.
3. Create Expo/EAS project.
4. Create Google Play Console account and app.
5. Create Apple Developer Program membership and App Store Connect app, if iOS is in scope now.
6. Configure EAS Android/iOS credentials.
7. Run validation commands.
8. Build preview builds for device testing.
9. Build production Android/iOS artifacts.
10. Submit Android to Play internal testing and iOS to TestFlight.
11. Complete metadata and privacy forms in both dashboards.
12. Run tester install checks.
13. Move Android through required closed testing if using a new personal Play account.
14. Submit iOS for App Review.
15. Promote Android to production when Play Console allows production access.

## References

- Google Play Console getting started: https://support.google.com/googleplay/android-developer/answer/6112435
- Google Play required account information: https://support.google.com/googleplay/android-developer/answer/13628312
- Google Play account type requirements: https://support.google.com/googleplay/android-developer/answer/13634885
- Google Play personal account testing requirements: https://support.google.com/googleplay/android-developer/answer/14151465
- Google Play app setup: https://support.google.com/googleplay/android-developer/answer/9859152
- Google Play Data safety: https://support.google.com/googleplay/android-developer/answer/10787469
- Google Play release rollout: https://support.google.com/googleplay/android-developer/answer/9859348
- Apple membership comparison: https://developer.apple.com/support/compare-memberships/
- Apple Developer Program enrollment: https://developer.apple.com/programs/enroll/
- Free Apple developer registration: https://developer.apple.com/register/
- Apple D-U-N-S guidance: https://developer.apple.com/help/account/membership/D-U-N-S/
- App Store Connect overview: https://developer.apple.com/app-store-connect/
- App Store Connect new app record: https://developer.apple.com/help/app-store-connect/create-an-app-record/add-a-new-app/
- App Store publishing overview: https://developer.apple.com/help/app-store-connect/manage-your-apps-availability/overview-of-publishing-your-app-on-the-app-store/
- Apple app privacy: https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy/
- Expo EAS plans: https://docs.expo.dev/billing/plans/
- Expo EAS pricing: https://expo.dev/pricing
- Expo EAS Submit: https://docs.expo.dev/submit/introduction/
- Expo Android submit: https://docs.expo.dev/submit/android/
- Expo iOS submit: https://docs.expo.dev/submit/ios/
