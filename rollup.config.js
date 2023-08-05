import esbuild from "rollup-plugin-esbuild";
import { dts } from "rollup-plugin-dts";
import typescript from "@rollup/plugin-typescript";

export default {
  // https://rollupjs.org/configuration-options/#input
  // https://rollupjs.org/configuration-options/#output-extend
  // https://github.com/rollup/rollup/blob/651e49353eb98bf66e0efd7b27174591a4557880/src/rollup/types.d.ts#L838-L847
  input: ["src/index.ts", "src/BarcodeDetectorZXing.ts"],
  output: [
    {
      dir: "dist",
      format: "cjs",
      // sourcemap: true,
      entryFileNames: (chunk) => {
        return `${chunk.name}.cjs`;
      },
    },
    {
      dir: "dist",
      format: "es",
      // sourcemap: true,
      entryFileNames: (chunk) => {
        return `${chunk.name}.mjs`;
      },
    },
    // {
    //   dir: "dist",
    //   // entryFileNames: (chunk) => {
    //   //   return `${chunk.name}.d.ts`;
    //   // },
    //   format: "es",
    // },
  ],
  plugins: [typescript()],
  external: ["@zxing/library", "@zxing/browser"],
};
