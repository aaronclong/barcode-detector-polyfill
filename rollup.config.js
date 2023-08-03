import esbuild from "rollup-plugin-esbuild";

export default {
  input: "src/index.ts",
  output: [
    {
      file: "dist/index.cjs",
      format: "cjs",
      sourcemap: true,
    },
    {
      file: "dist/index.mjs",
      format: "es",
      sourcemap: true,
    },
  ],
  plugins: [esbuild()],
  external: ["@zxing/library", "@zxing/browser"],
};
