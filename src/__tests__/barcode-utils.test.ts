import { expect, test } from "vitest";
import { calcBoundingBox } from "../barcode-utils.js";

test("calcBoundingBox, happy path", () => {
  const xValues = { min: 1, max: 5 };
  const yValues = { min: 2, max: 6 };
  const [boundingBox, cornerPoints] = calcBoundingBox(xValues, yValues);

  expect(boundingBox.left).toBe(1);
  expect(boundingBox.top).toBe(2);
  expect(boundingBox.width).toBe(4);
  expect(boundingBox.height).toBe(4);

  expect(cornerPoints).toEqual([
    { x: 1, y: 2 },
    { x: 5, y: 2 },
    { x: 5, y: 6 },
    { x: 1, y: 6 },
  ]);
});
