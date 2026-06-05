import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypescript,
  globalIgnores([
    ".next/**",
    "node_modules/**",
    "apps/holded-mcp/**",
    "out/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // setState in useEffect is correct for hydration (localStorage) and route-sync patterns
      "react-hooks/set-state-in-effect": "warn",
      // Date.now() / getTime() are acceptable in server components and expiry calculations
      "react-hooks/purity": "warn",
    },
  },
]);
