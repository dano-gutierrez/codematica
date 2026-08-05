# Native Store Publishing Runbook

Last verified: 2026-08-05

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
- Phone screenshots for both stores. The current Expo config sets `ios.supportsTablet: true`, so prepare the required iPad screenshots as well; otherwise set tablet support to `false` and test that product decision before creating the store release.
- Data inventory for Supabase Auth/progress, local progress storage, crash diagnostics, analytics if added later, and third-party SDKs.
- Reviewer test account if login is required to inspect any app functionality.

If subscriptions are in scope for the release, also decide these RevenueCat/product values before creating store products:

```bash
REVENUECAT_ENTITLEMENT_ID=all_access
REVENUECAT_OFFERING_ID=default
CODEMATICA_MONTHLY_PRODUCT_ID=codematica_all_access_monthly
CODEMATICA_ANNUAL_PRODUCT_ID=codematica_all_access_annual
CODEMATICA_GOOGLE_SUBSCRIPTION_ID=codematica_all_access
CODEMATICA_GOOGLE_MONTHLY_BASE_PLAN_ID=monthly
CODEMATICA_GOOGLE_ANNUAL_BASE_PLAN_ID=annual
CODEMATICA_MONTHLY_INTRO_OFFER_ID=monthly_intro_099_first_month
```

Use stable product ids. Renaming products after Apple, Google, Stripe, and RevenueCat are connected creates avoidable reconciliation and support work.

## Repo Release Prep

Run these checks before creating store builds:

```bash
npm install
npm run content:check
npm run typecheck
npm run lint
npm run test:coverage
npm run test:mobile:coverage
npm run mobile:doctor
npm run build
npm run e2e:web:release
```

Start the disposable local Supabase stack, replay migrations, and run `npm run test:db` before a release candidate. The database lane must not target a hosted project or use production credentials.

Before pushing a `v*` tag, run `npm run test:release`. After the tag is pushed, wait for both release systems:

- GitHub `Release Candidate Regression`: quality, coverage, clean database replay/pgTAP, and complete Playwright regression.
- EAS `Native Release Regression`: credential-free Android APK and iOS simulator builds followed by every Maestro flow on both platforms.

A release candidate is promotable only when both systems are green. Their coverage, JUnit, Playwright traces/screenshots/videos, EAS builds, and Maestro recordings are the failure evidence. Neither workflow submits a store build or publishes a release.

For native smoke on a pull request, apply the `mobile-e2e` label. It builds the Android E2E APK and runs the Maestro smoke set; it does not require store signing credentials.

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

## RevenueCat Subscription Setup

RevenueCat is the planned cross-platform entitlement authority for Codematica subscriptions. Set it up after the Apple, Google, and Stripe account shells exist, but before wiring production paywalls in the apps.

Official starting points:

- RevenueCat Expo SDK: https://www.revenuecat.com/docs/getting-started/installation/expo
- RevenueCat store connections: https://www.revenuecat.com/docs/projects/connect-a-store
- RevenueCat Stripe Billing: https://www.revenuecat.com/docs/web/integrations/stripe
- RevenueCat webhooks: https://www.revenuecat.com/docs/integrations/webhooks

Create the RevenueCat project:

1. Create or sign in to the RevenueCat account that should own Codematica billing.
2. Create a project named `Codematica`.
3. Add iOS, Android, and Web apps.
4. Use Supabase `auth.users.id` as the RevenueCat App User ID in app code and backend reconciliation.
5. Create entitlement `all_access`.
6. Create offering `default`.
7. Create packages `monthly` and `annual`.
8. Keep separate development/test-store and production API keys. Store public SDK keys in EAS/Vercel env vars, not in source files.

Connect Apple App Store to RevenueCat:

1. Create the App Store Connect app and subscription products first.
2. In RevenueCat, add the iOS app with bundle id `com.codematica.app`.
3. Add the App Store app shared secret if required for the chosen StoreKit/receipt-validation path.
4. Create and upload the in-app purchase key required by current RevenueCat StoreKit 2 transaction processing.
5. Create and upload an App Store Connect API key with sufficient access so RevenueCat can fetch products and read subscription state.
6. Import or map Apple products:
   - `codematica_all_access_monthly`
   - `codematica_all_access_annual`
7. Attach both products to entitlement `all_access` and offering `default`.

Connect Google Play to RevenueCat:

1. Upload an internal Android build to Play Console if subscription product setup is blocked until an artifact exists.
2. Create the Google Play subscription and base plans in Play Console.
3. Create Google Play service credentials for RevenueCat and upload the JSON key in the Android app settings in RevenueCat.
4. Configure Google real-time developer notifications if required by RevenueCat setup checks.
5. Import or map Google products:
   - Subscription id: `codematica_all_access`
   - Base plan ids: `monthly`, `annual`
   - Intro offer id: `monthly_intro_099_first_month`
6. Attach the monthly and annual purchase options to entitlement `all_access` and offering `default`.

Connect Stripe Billing to RevenueCat for web:

1. Create or activate the Stripe account and complete business, bank, tax, and identity onboarding.
2. Create product `Codematica All Access`.
3. Create recurring monthly and annual prices for US launch.
4. Configure the first-month `$0.99` introductory path for the monthly package.
5. Configure Stripe Customer Portal for subscription management.
6. Connect Stripe to RevenueCat from RevenueCat account settings or project billing settings.
7. Import Stripe products/prices into RevenueCat and map them to the same `all_access` entitlement and `default` offering.
8. Add production payment domains before using Apple Pay or Google Pay in web checkout.

Configure RevenueCat webhooks:

1. Add a webhook endpoint such as `https://<web-origin>/api/subscription/revenuecat/webhook`.
2. Store the webhook authorization token/signing secret in Vercel server env vars only.
3. Handle webhook events idempotently in the app backend and persist raw events for audit/debugging.
4. Use webhook-confirmed entitlement state for server-side content access. Do not grant durable access only because a client says checkout succeeded.

RevenueCat launch checks:

- The RevenueCat dashboard shows all three platform apps connected.
- Each platform product maps to `all_access`.
- The default offering returns monthly and annual packages in sandbox/test builds.
- Apple sandbox purchase, Google license-test purchase, and Stripe test-mode purchase all activate the same Supabase user id.
- Restore purchases refreshes entitlement on iOS and Android.
- A canceled/refunded/expired test subscription removes protected content access after the provider state changes.
- The web backend can still deny private content when RevenueCat or Supabase is unavailable instead of failing open.

## Supabase Auth And Progress Setup

Codematica must remain usable without login, but production store builds should have Auth configured before publishing any release that advertises cross-device progress sync.

Use one Supabase project per production environment. Before enabling login in a public build:

1. Apply all migrations in `supabase/migrations/`, including the Auth/progress tables and RLS policies.
2. Confirm anonymous browsing still works without Supabase env vars.
3. Enable only anon-safe public keys in client runtimes. Never expose `SUPABASE_SERVICE_ROLE_KEY` in web, native, Vercel client env, or EAS client env.
4. Create at least one reviewer test account if a store reviewer needs to inspect signed-in progress sync.

Configure Supabase Auth URL settings:

```bash
WEB_ORIGIN=https://your-production-web-domain.example
SUPABASE_PROJECT_REF=your-project-ref
SUPABASE_AUTH_CALLBACK=https://$SUPABASE_PROJECT_REF.supabase.co/auth/v1/callback
NATIVE_AUTH_REDIRECT=codematica://auth/callback
```

In Supabase Dashboard > Authentication > URL Configuration:

1. Set Site URL to the production web origin, for example `$WEB_ORIGIN`.
2. Add web callback redirects:
   - `$WEB_ORIGIN/auth/callback`
   - `http://127.0.0.1:3100/auth/callback` for local web development
   - `http://localhost:3100/auth/callback` only if localhost is used locally
3. Add native callback redirects:
   - `$NATIVE_AUTH_REDIRECT`
   - `codematica://**` only while validating all native email/OAuth callback variants; prefer exact production redirect URLs once the final paths are known.

Configure web runtime env in Vercel and local `.env`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_or_anon_safe_key
NEXT_PUBLIC_AUTH_APPLE_ENABLED=false
```

Set `NEXT_PUBLIC_AUTH_APPLE_ENABLED=true` only after the Apple provider works end to end in Supabase and the Apple Developer account.

Configure native runtime env before EAS builds:

```bash
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_or_anon_safe_key
EXPO_PUBLIC_AUTH_APPLE_ENABLED=false
```

`EXPO_PUBLIC_*` values are bundled into the native JavaScript runtime, so treat them as public. If storing them in EAS environment variables, use plain text or sensitive visibility, not secret visibility, and make sure the build profile uses the intended EAS environment. OAuth deep links require a development build or standalone build with the final `EXPO_APP_SCHEME`; Expo Go is not a reliable test target for the store OAuth path.

Configure email/password:

1. Enable Email in Supabase Auth providers.
2. Configure a production SMTP provider before public launch. Supabase's default test email sender is not appropriate for production traffic or store-review reliability.
3. Confirm sign-up confirmation links redirect to the web callback and native callback as expected.

Configure Google sign-in:

1. In Google Cloud Console, create an OAuth client for a Web application.
2. Add authorized JavaScript origins for the production web origin and any local development origins that will be used.
3. Add the Supabase project callback URL as an authorized redirect URI: `$SUPABASE_AUTH_CALLBACK`.
4. Copy the Google Client ID and Client Secret into Supabase Dashboard > Authentication > Providers > Google.
5. Test Google sign-in from web and from an installed native development build.

Configure Apple sign-in only after Apple Developer Program enrollment:

1. Use the final `EXPO_APP_IDENTIFIER` as the Apple App ID / Bundle ID and enable the Sign in with Apple capability.
2. Create a Services ID for the web/OAuth flow, for example `com.codematica.app.web`, attached to the app.
3. In the Services ID Website URLs, use the Supabase project domain and callback URL:
   - Domain: `your-project-ref.supabase.co`
   - Redirect URL: `$SUPABASE_AUTH_CALLBACK`
4. Create and securely store the Apple signing key `.p8` file, Key ID, and Team ID.
5. Add the Services ID, Team ID, Key ID, and generated client secret to Supabase Dashboard > Authentication > Providers > Apple. If multiple client IDs are configured, keep the Services ID first so the web OAuth flow works.
6. Create a recurring reminder to rotate the Apple OAuth client secret every 6 months. Missing this rotation breaks Apple OAuth sign-in.
7. After validation, set `NEXT_PUBLIC_AUTH_APPLE_ENABLED=true` for web. For native store builds, either configure Apple successfully before release or gate/remove the native Apple button before submission.

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

For subscription releases, also complete Play Console monetization setup before public review:

1. Create subscription `codematica_all_access`.
2. Add auto-renewing base plan `monthly` priced at US `$9.99/month`.
3. Add auto-renewing base plan `annual` priced at US `$79.99/year`.
4. Add offer `monthly_intro_099_first_month` for eligible new subscribers at US `$0.99` for the first monthly billing period.
5. Limit initial paid availability to the United States unless the subscription feature doc changes launch regions.
6. Add license testers and verify the primary tester account on the Android device before purchase testing.

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

For subscription releases, also complete App Store Connect monetization setup before review:

1. Accept paid-app agreements and complete banking/tax forms.
2. Create subscription group `Codematica All Access`.
3. Create monthly auto-renewable subscription `codematica_all_access_monthly` priced at US `$9.99/month`.
4. Create annual auto-renewable subscription `codematica_all_access_annual` priced at US `$79.99/year`.
5. Configure the monthly introductory offer at US `$0.99` for the first billing period in the United States.
6. Add subscription review metadata and screenshot if App Store Connect requires it.
7. Include a reviewer account or instructions that can exercise the paywall, purchase, restore, and subscribed-content states.

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
3. Apply Supabase migrations and configure Auth URL settings.
4. Configure email/password, Google, and Apple providers as needed for the release.
5. Create Expo/EAS project.
6. Create Google Play Console account and app.
7. Create Apple Developer Program membership and App Store Connect app, if iOS is in scope now.
8. Configure EAS Android/iOS credentials.
9. Run validation commands.
10. Build preview builds for device testing.
11. Test Auth and signed-in progress sync on web and native preview builds.
12. Build production Android/iOS artifacts.
13. Submit Android to Play internal testing and iOS to TestFlight.
14. Complete metadata and privacy forms in both dashboards.
15. Run tester install checks.
16. Move Android through required closed testing if using a new personal Play account.
17. Submit iOS for App Review.
18. Promote Android to production when Play Console allows production access.

## References

- Supabase Auth redirect URLs: https://supabase.com/docs/guides/auth/redirect-urls
- Supabase native mobile deep linking: https://supabase.com/docs/guides/auth/native-mobile-deep-linking
- Supabase Google Auth: https://supabase.com/docs/guides/auth/social-login/auth-google
- Supabase Apple Auth: https://supabase.com/docs/guides/auth/social-login/auth-apple
- Expo EAS environment variables: https://docs.expo.dev/eas/environment-variables/
- Expo deep linking: https://docs.expo.dev/linking/into-your-app/
- Expo authentication guide: https://docs.expo.dev/guides/authentication/
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
