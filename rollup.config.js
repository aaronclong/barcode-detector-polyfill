import esbuild from "rollup-plugin-esbuild";
import { dts } from "rollup-plugin-dts";

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
    { file: "dist/index.d.ts", format: "es" },
  ],
  plugins: [esbuild(), dts()],
  external: ["@zxing/library", "@zxing/browser"],
};
