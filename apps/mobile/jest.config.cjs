const path = require("node:path");

const repositoryRoot = path.resolve(__dirname, "../..");

module.exports = {
  preset: path.dirname(require.resolve("jest-expo/package.json")),
  rootDir: "../..",
  roots: ["<rootDir>/apps/mobile/src", "<rootDir>/packages/ui/src"],
  setupFilesAfterEnv: ["<rootDir>/apps/mobile/src/test/setup.ts"],
  testMatch: ["<rootDir>/apps/mobile/src/**/*.test.ts", "<rootDir>/apps/mobile/src/**/*.test.tsx"],
  collectCoverageFrom: [
    "apps/mobile/src/lib/**/*.{ts,tsx}",
    "packages/ui/src/screens.tsx",
    "!apps/mobile/src/generated/**",
  ],
  forceCoverageMatch: ["<rootDir>/packages/ui/src/screens.tsx"],
  coverageDirectory: "<rootDir>/coverage/mobile",
  coverageProvider: "v8",
  coverageReporters: ["text", "text-summary", "html", "lcov", "json"],
  reporters: process.env.CI
    ? ["default", ["jest-junit", { outputDirectory: path.join(repositoryRoot, "test-results/mobile-jest"), outputName: "junit.xml" }]]
    : ["default"],
  coverageThreshold: {
    global: { lines: 70, statements: 70, functions: 70, branches: 60 },
    [path.join(repositoryRoot, "apps/mobile/src/lib/")]: { lines: 80, statements: 80, functions: 80, branches: 70 },
    [path.join(repositoryRoot, "packages/ui/src/screens.tsx")]: { lines: 70, statements: 70, functions: 70, branches: 60 },
  },
  moduleNameMapper: {
    "^@codematica/core$": "<rootDir>/packages/core/src/index.ts",
    "^@codematica/core/(.*)$": "<rootDir>/packages/core/src/$1",
    "^@codematica/ui$": "<rootDir>/packages/ui/src/index.ts",
  },
  transformIgnorePatterns: [
    "node_modules/(?!((jest-)?react-native|@react-native|expo(nent)?|expo-modules-core|@expo(nent)?/.*|expo-router|react-native-markdown-display|react-native-webview)/)"
  ]
};
