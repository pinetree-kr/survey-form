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
    files: ["app/form/**/*.tsx"],
    rules: {
      "@typescript-eslint/no-unused-vars": "warn", // 특정 폴더에서는 경고만
    },
  },
];

export default eslintConfig;
