# Native build configuration plugins

`with-shared-bundle-inputs.cjs` keeps Android production bundle caching aware of `packages/*/src`, package manifests, and shared game source/generated assets. Expo prebuild applies it idempotently to `app/build.gradle`; generated Android projects remain disposable. Import configuration helpers through the app’s direct Expo dependency.

The mobile configuration test pins this hook. Installed-artifact tests must still confirm current UI and workers; a successful source test or Metro development session cannot prove an incremental release bundle contains shared changes.
