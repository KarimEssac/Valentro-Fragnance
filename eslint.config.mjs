import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "public/uploads/**",
      "_tmp_swc_test/**"
    ]
  },
  ...nextVitals
];

export default eslintConfig;
