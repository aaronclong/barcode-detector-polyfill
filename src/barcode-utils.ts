/**
 * This code was originally copied from here:
 *   https://github.com/zxing-js/browser/blob/d4c22f735f5304b16f2f3d9497a8c82683f5cf68/src/common/HTMLCanvasElementLuminanceSource.ts#L19-L42
 *
 * @param imageBuffer
 * @param width
 * @param height
 * @returns
 */
export function toGrayscaleBuffer(
  imageBuffer: Uint8ClampedArray,
  width: number,
  height: number
): Uint8ClampedArray {
  const grayscaleBuffer = new Uint8ClampedArray(width * height);
  for (let i = 0, j = 0, length = imageBuffer.length; i < length; i += 4, j++) {
    let gray;
    const alpha = imageBuffer[i + 3];
    // The color of fully-transparent pixels is irrelevant. They are often, technically, fully-transparent
    // black (0 alpha, and then 0 RGB). They are often used, of course as the "white" area in a
    // barcode image. Force any such pixel to be white:
    if (alpha === 0) {
      gray = 0xff;
    } else {
      const pixelR = imageBuffer[i];
      const pixelG = imageBuffer[i + 1];
      const pixelB = imageBuffer[i + 2];
      // .299R + 0.587G + 0.114B (YUV/YIQ for PAL and NTSC),
      // (306*R) >> 10 is approximately equal to R*0.299, and so on.
      // 0x200 >> 10 is 0.5, it implements rounding.
      // tslint:disable-next-line:no-bitwise
      gray = (306 * pixelR + 601 * pixelG + 117 * pixelB + 0x200) >> 10;
    }
    grayscaleBuffer[j] = gray;
  }
  return grayscaleBuffer;
}
