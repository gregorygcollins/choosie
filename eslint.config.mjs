import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig({
  extends: [
    ...(nextVitals.extends ? (Array.isArray(nextVitals.extends) ? nextVitals.extends : [nextVitals.extends]) : []),
    ...(nextTs.extends ? (Array.isArray(nextTs.extends) ? nextTs.extends : [nextTs.extends]) : []),
  ],
  ignores: [
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ],
});
