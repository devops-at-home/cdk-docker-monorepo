module.exports = {
  roots: ["<rootDir>/lib", "<rootDir>/src"],
  testMatch: ["**/*.test.ts", "**/*.test.js"],
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  globalSetup: "./jest.setup.ts",
};
