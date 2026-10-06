# Native build configuration plugins

`with-shared-bundle-inputs.cjs` keeps Android production bundle caching aware of `packages/*/src`, package manifests, and shared game source/generated assets. Expo prebuild applies it idempotently to `app/build.gradle`; generated Android projects remain disposable. Import configuration helpers through the app’s direct Expo dependency.

The mobile configuration test pins this hook. Installed-artifact tests must still confirm current UI and workers; a successful source test or Metro development session cannot prove an incremental release bundle contains shared changes.

`with-live-font-scale.cjs` adds `fontScale` to the main Android activity's handled configuration changes. It preserves the existing flags and keeps navigation and transient input mounted when system text size changes. Its Kotlin callback forwards to React Native, then posts a refresh after Android updates configuration resources. It refreshes the existing DeviceInfo module so `useWindowDimensions` observes the new scale and requests measurement of the mounted React root, preserving route and input while text reflows. Both modern and legacy React hosts use the app's direct React Native dependency; the plugin itself imports helpers through direct Expo.

The hook is idempotent and rejects an unsupported activity template or a separate custom configuration callback rather than replacing it. When updating Expo or React Native, verify the generated manifest and callback, compile a fresh release APK, and test a live font change with a populated search/form. Expo Go cannot validate this generated activity. `mobile-config.test.ts` exercises the actual Expo mods, flag preservation, repeat application, imports and failure guards; native coverage includes this plugin.
