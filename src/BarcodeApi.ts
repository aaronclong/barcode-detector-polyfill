/**
 * This interface is to implement barcode API as specified here:
 * https://developer.mozilla.org/en-US/docs/Web/API/BarcodeDetector
 */

export type BarcodeFormat =
  | "aztec"
  | "code_128"
  | "code_39"
  | "code_93"
  | "codabar"
  | "data_matrix"
  | "ean_13"
  | "ean_8"
  | "itf"
  | "pdf417"
  | "qr_code"
  | "upc_a"
  | "upc_e"
  | "unknown";

export interface IBarcodeOptions {
  formats: BarcodeFormat[];
}

export interface DetectedBarcode {
  boundingBox: DOMRectReadOnly;
  cornerPoints: { x: number; y: number }[];
  format: string;
  rawValue: string;
}

export interface IBarcodeDetector {
  detect(): Promise<DetectedBarcode>;
}

export abstract class BarcodeDetectorAbs implements IBarcodeDetector {
  public constructor(options?: IBarcodeOptions) {}
  public abstract detect(): Promise<DetectedBarcode>;

  public static getSupportedFormats(): Promise<BarcodeFormat[]> {
    return Promise.resolve(["unknown"]);
  }
}
