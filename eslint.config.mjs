import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  // 특정 파일 패턴에만 다른 규칙 적용
  {
    files: [
      "app/**/*.ts",
      "app/**/*.tsx",
      "lib/**/*.ts",
      "lib/**/*.tsx",
      "supabase/**/*.ts",
      "supabase/**/*.tsx"
    ],
    rules: {
      "@typescript-eslint/no-unused-vars": "off", // 특정 폴더에서는 경고만,
      "@typescript-eslint/no-explicit-any": "off", // 특정 폴더에서는 경고만,
    },
  },
];

export default eslintConfig;
