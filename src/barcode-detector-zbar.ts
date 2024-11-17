import {
  ZBarScanner,
  scanRGBABuffer,
  ZBarSymbol,
  ZBarSymbolType,
  getDefaultScanner,
} from "@undecaf/zbar-wasm";
import {
  BarcodeDetectorAbs,
  IBarcodeOptions,
  BarcodeFormat,
  DetectedBarcode,
} from "./barcode-api.js";
import {
  blobToImage,
  calcBoundingBox,
  canvasToImageData,
} from "./barcode-utils.js";

type ZBarBarcodeFormat =
  | BarcodeFormat
  // | "aztec"
  | "code_39"
  | "code_128"
  // | "data_matrix"
  | "ean_8"
  | "ean_13"
  | "itf"
  | "pdf417"
  | "qr_code"
  | "upc_a"
  | "upc_e";

const mapFormat = new Map<ZBarBarcodeFormat, ZBarSymbolType>([
  // ["aztec", ZBarSymbolType.ZBAR_],
  ["code_39", ZBarSymbolType.ZBAR_CODE39],
  ["code_128", ZBarSymbolType.ZBAR_CODE128],
  // ["data_matrix", ZBarSymbolType.ZBAR],
  // ["data_matrix", ZBarSymbolType.ZBAR_DATABAR_EXP],
  ["ean_8", ZBarSymbolType.ZBAR_EAN8],
  ["ean_13", ZBarSymbolType.ZBAR_EAN13],
  ["itf", ZBarSymbolType.ZBAR_I25],
  ["pdf417", ZBarSymbolType.ZBAR_PDF417],
  ["qr_code", ZBarSymbolType.ZBAR_QRCODE],
  ["upc_a", ZBarSymbolType.ZBAR_UPCA],
  ["upc_e", ZBarSymbolType.ZBAR_UPCE],
]);

const mapFormatInv = new Map<ZBarSymbolType, ZBarBarcodeFormat>(
  Array.from(mapFormat).map(([key, val]) => [val, key])
);

const allSupportedFormats: ZBarBarcodeFormat[] = Array.from(mapFormat.keys());

// https://developer.mozilla.org/en-US/docs/Web/API/Encoding_API/Encodings
export type Encoding =
  | "utf-8"
  | "ibm866"
  | "iso-8859-2"
  | "iso-8859-3"
  | "iso-8859-4"
  | "iso-8859-5"
  | "iso-8859-6"
  | "iso-8859-7"
  | "iso-8859-8"
  | "iso-8859-8i"
  | "iso-8859-10"
  | "iso-8859-13"
  | "iso-8859-14"
  | "iso-8859-15"
  | "iso-8859-16"
  | "koi8-r"
  | "koi8-u"
  | "macintosh"
  | "windows-874"
  | "windows-1250"
  | "windows-1251"
  | "windows-1252"
  | "windows-1253"
  | "windows-1254"
  | "windows-1255"
  | "windows-1256"
  | "windows-1257"
  | "windows-1258"
  | "x-mac-cyrillic"
  | "gbk"
  | "gb18030"
  | "hz-gb-2312"
  | "big5"
  | "euc-jp"
  | "iso-2022-jp"
  | "shift-jis"
  | "euc-kr"
  | "iso-2022-kr"
  | "utf-16be"
  | "utf-16le"
  | "x-user-defined"
  | "replacement";

export interface ZbarBarcodeOptions extends IBarcodeOptions<ZBarBarcodeFormat> {
  scannerResolver: () => Promise<ZBarScanner>;
  encoding?: Encoding;
}

export class BarcodeDetectorZBar extends BarcodeDetectorAbs<ZBarBarcodeFormat> {
  private readonly scannerResolver: () => Promise<ZBarScanner>;
  private scanner: ZBarScanner | undefined;
  private encoding: Encoding;
  private offScreenCanvas: OffscreenCanvas | undefined;

  // private reader: BrowserMultiFormatReader;
  constructor(options?: ZbarBarcodeOptions) {
    super();

    this.encoding = options?.encoding ?? "utf-8";

    // SPEC: A series of BarcodeFormats to search for in the subsequent detect() calls. If not present then the UA SHOULD
    // search for all supported formats.
    const formats = options?.formats ?? allSupportedFormats;

    // SPEC: If barcodeDetectorOptions.formats is present and empty, then throw a new TypeError.
    // SPEC: If barcodeDetectorOptions.formats is present and contains unknown, then throw a new TypeError.
    if (formats.length === 0 || formats.includes("unknown")) {
      throw new TypeError(""); // TODO pick message
    }

    this.scannerResolver = options?.scannerResolver ?? getDefaultScanner;
  }

  private readonly getScanner = async (): Promise<ZBarScanner> => {
    if (!this.scanner) {
      const scanner = await this.scannerResolver();
      this.scanner = scanner;
    }
    return this.scanner;
  };

  public static getSupportedFormats(): Promise<ZBarBarcodeFormat[]> {
    return Promise.resolve([...allSupportedFormats]);
  }

  public detect = async (
    image: ImageBitmapSource
  ): Promise<DetectedBarcode[]> => {
    const scannerPending = this.getScanner();
    const imagePending = this.toImageData(image);
    const [scanner, imageData] = await Promise.all([
      scannerPending,
      imagePending,
    ]);

    if (!imageData) {
      return [];
    }

    const detectedBarcodes: DetectedBarcode[] = [];
    try {
      const result = await scanRGBABuffer(
        imageData.data,
        imageData.width,
        imageData.height,
        scanner
      );

      for (const r of result) {
        const detectedBarcode = BarcodeDetectorZBar.toBarcodeDetectorResult(
          r,
          this.encoding
        );
        detectedBarcodes.push(detectedBarcode);
      }
    } catch (_error) {
      //not found or not supported image source
      // TODO: add logger here
    }
    return Promise.resolve(detectedBarcodes);
  };

  private readonly toImageData = (
    source: ImageBitmapSource
  ): Promise<ImageData | undefined> => {
    if (source instanceof ImageData) {
      return Promise.resolve(source as ImageData);
    } else if (source instanceof Blob) {
      return blobToImage(source, this.offScreenCanvas!);
    } else if (source instanceof CanvasRenderingContext2D) {
      const result = source.getImageData(
        0,
        0,
        source.canvas.width,
        source.canvas.height
      );
      return Promise.resolve(result);
    } else {
      return Promise.resolve(canvasToImageData(source as OffscreenCanvas));
    }
  };

  /**
   * Converts a ZBar {@link ZBarSymbol} to a {@link DetectedBarcode}.
   */
  private static toBarcodeDetectorResult(
    symbol: ZBarSymbol,
    encoding: Encoding
  ): DetectedBarcode {
    // Determine a bounding box that contains all points
    const bounds = {
      minX: Infinity,
      maxX: -Infinity,
      minY: Infinity,
      maxY: -Infinity,
    };

    symbol.points.forEach((point) => {
      bounds.minX = Math.min(bounds.minX, point.x);
      bounds.maxX = Math.max(bounds.maxX, point.x);
      bounds.minY = Math.min(bounds.minY, point.y);
      bounds.maxY = Math.max(bounds.maxY, point.y);
    });

    const [boundingBox, cornerPoints] = calcBoundingBox(
      { min: bounds.minX, max: bounds.maxX },
      { min: bounds.minY, max: bounds.maxY }
    );

    const barcode: DetectedBarcode = {
      format: mapFormatInv.get(symbol.type) ?? "unknown",
      rawValue: symbol.decode(encoding),
      boundingBox,
      cornerPoints,
      // TODO: add more properties
      orientation: symbol.orientation as number,
      quality: symbol.quality,

      // boundingBox: DOMRectReadOnly.fromRect({
      //   x: bounds.minX,
      //   y: bounds.minY,
      //   width: bounds.maxX - bounds.minX,
      //   height: bounds.maxY - bounds.minY,
      // }),

      // cornerPoints: [
      //   { x: bounds.minX, y: bounds.minY },
      //   { x: bounds.maxX, y: bounds.minY },
      //   { x: bounds.maxX, y: bounds.maxY },
      //   { x: bounds.minX, y: bounds.maxY },
      // ],
    };

    return barcode;
  }

  // private static defaultScanner(): Promise<ZBarScanner> {
  // }

  // private decodeImage(image: ImageBitmapSource): ZXResult {
  //   if (image instanceof HTMLCanvasElement) {
  //     return this.reader.decodeFromCanvas(image);
  //   } else if (image instanceof ImageData) {
  //     const source = new RGBLuminanceSource(
  //       toGrayscaleBuffer(image.data, image.width, image.height),
  //       image.width,
  //       image.height
  //     );
  //     const binarizer = new HybridBinarizer(source);
  //     const bitmap = new BinaryBitmap(binarizer);
  //     return this.reader.decodeBitmap(bitmap);
  //   } else if (image instanceof Blob) {
  //     throw new Error("Blob is currently not supported");
  //   }

  //   throw new Error("Cannot parse image provided");
  // }

  // private static wrapResult(result: ZXResult): DetectedBarcode {
  //   //set initial values
  //   const points = result.getResultPoints();
  //   let minX = points[0].getX();
  //   let minY = points[0].getY();
  //   let maxX = points[0].getX();
  //   let maxY = points[0].getY();

  //   points.forEach((point) => {
  //     const x = point.getX();
  //     const y = point.getY();
  //     minX = Math.min(x, minX);
  //     minY = Math.min(y, minY);
  //     maxX = Math.max(x, maxX);
  //     maxY = Math.max(y, maxY);
  //   });

  //   const boundingBox = new DOMRectReadOnly(
  //     minX,
  //     minY,
  //     maxX - minX,
  //     maxY - minY
  //   );

  //   const p1 = { x: boundingBox.left, y: boundingBox.top };
  //   const p2 = { x: boundingBox.right, y: boundingBox.top };
  //   const p3 = { x: boundingBox.right, y: boundingBox.bottom };
  //   const p4 = { x: boundingBox.left, y: boundingBox.bottom };

  //   const cornerPoints = [p1, p2, p3, p4];

  //   const barcodeFormat =
  //     mapFormatInv.get(result.getBarcodeFormat()) ?? "unknown";

  //   return {
  //     boundingBox: boundingBox,
  //     rawValue: result.getText(),
  //     format: barcodeFormat,
  //     cornerPoints: cornerPoints,
  //   };
  // }
}
