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

/**
 * Blog to Image
 * This heavily inspired from
 * https://github.com/undecaf/barcode-detector-polyfill/blob/6dadd54095d83f6448f370d179b57479bd58663e/src/BarcodeDetectorPolyfill.ts#L146-L185
 *
 * @param blob
 * @param canvas
 * @returns
 */
export async function blobToImage(
  blob: Blob,
  canvas: OffscreenCanvas
): Promise<ImageData | undefined> {
  const image = document.createElement("img");
  image.src = URL.createObjectURL(blob);

  try {
    await image.decode();
    const result = canvasToImageData(canvas, image);
    return result;
  } finally {
    URL.revokeObjectURL(image.src);
  }
}

/**
 *
 * @param source
 * @param canvas
 * @returns
 */
export function canvasToImageData(
  canvas: OffscreenCanvas,
  source?: CanvasImageSource
): ImageData | undefined {
  const context = canvas.getContext("2d");
  if (source) {
    context?.drawImage(source, 0, 0);
  }

  return context?.getImageData(0, 0, canvas.width, canvas.height);
}

type MinMax = { min: number; max: number };
type CornerPoint = { x: number; y: number };

export function calcBoundingBox(
  xValues: MinMax,
  yValues: MinMax
): [DOMRectReadOnly, CornerPoint[]] {
  const boundingBox = new DOMRectReadOnly(
    xValues.min,
    yValues.min,
    xValues.max - xValues.min,
    yValues.max - yValues.min
  );

  const p1 = { x: boundingBox.left, y: boundingBox.top };
  const p2 = { x: boundingBox.right, y: boundingBox.top };
  const p3 = { x: boundingBox.right, y: boundingBox.bottom };
  const p4 = { x: boundingBox.left, y: boundingBox.bottom };

  const cornerPoints = [p1, p2, p3, p4];

  return [boundingBox, cornerPoints];
}
