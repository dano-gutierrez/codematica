const { withAppBuildGradle } = require("expo/config-plugins");
const marker = "// Codematica shared bundle inputs";
function sharedBundleInputs(contents) {
  if (contents.includes(marker)) return contents;
  return `${contents}\n${marker}
// Metro watches these folders; Gradle must also invalidate its cached JS bundle.
tasks.matching { it.name.startsWith("createBundle") && it.name.endsWith("JsAndAssets") }.configureEach {
    inputs.files(fileTree(dir: new File(rootProject.projectDir, "../../../packages"), includes: ["*/src/**", "*/package.json"]))
    inputs.files(fileTree(dir: new File(rootProject.projectDir, "../../../assets/game"), includes: ["source/**", "generated/**"]))
}
`;
}
module.exports = (config) =>
  withAppBuildGradle(config, (mod) => {
    if (mod.modResults.language !== "groovy")
      throw new Error(
        "Shared bundle input hook requires Groovy app/build.gradle",
      );
    mod.modResults.contents = sharedBundleInputs(mod.modResults.contents);
    return mod;
  });
module.exports.sharedBundleInputs = sharedBundleInputs;
