import type { LayoutParams, LayoutStats } from '../types/layout';

const EPSILON = 1e-8;

function roundNum(value: number, decimals: number = 6): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

export function calculateLayoutStats(params: LayoutParams): LayoutStats {
  const paperArea = roundNum(params.paperWidth * params.paperHeight);

  const printWidth = roundNum(params.paperWidth - params.marginLeft - params.marginRight);
  const printHeight = roundNum(params.paperHeight - params.marginTop - params.marginBottom);
  const printArea = roundNum(printWidth * printHeight);

  const annotationTotalWidth = params.annotationPosition === 'both'
    ? params.annotationWidth * 2
    : params.annotationPosition === 'none'
      ? 0
      : params.annotationWidth;

  const annotationArea = roundNum(annotationTotalWidth * printHeight);

  const bodyWidth = roundNum(printWidth - annotationTotalWidth);
  const columnWidth = roundNum(bodyWidth / params.columnCount);
  const rowHeight = roundNum(printHeight / params.rowCount);

  const bodyArea = roundNum(bodyWidth * printHeight);

  const verticalLineCount = params.columnCount + 1;
  const horizontalLineCount = params.rowCount + 1;
  const t = params.lineThickness;

  const verticalLineArea = roundNum(verticalLineCount * t * printHeight);
  const horizontalLineArea = roundNum(horizontalLineCount * t * bodyWidth);
  const overlapArea = roundNum(verticalLineCount * horizontalLineCount * t * t);
  const lineAreaRaw = roundNum(verticalLineArea + horizontalLineArea - overlapArea);

  const lineArea = Math.min(lineAreaRaw, bodyArea);
  const writingArea = roundNum(bodyArea - lineArea);

  const computedSum = roundNum(writingArea + annotationArea + lineArea);
  const diff = roundNum(Math.abs(computedSum - printArea));
  const isMatch = diff < EPSILON;

  let finalWritingArea = writingArea;
  let finalLineArea = lineArea;

  if (!isMatch && printArea > 0) {
    const adjustment = roundNum(printArea - annotationArea);
    const ratioWriting = writingArea / (writingArea + lineArea || 1);
    finalWritingArea = roundNum(adjustment * ratioWriting);
    finalLineArea = roundNum(adjustment - finalWritingArea);
  }

  const verifiedSum = roundNum(finalWritingArea + annotationArea + finalLineArea);
  const verifiedDiff = roundNum(Math.abs(verifiedSum - printArea));
  const verifiedIsMatch = verifiedDiff < EPSILON;

  const annotationRatio = printArea > 0 ? roundNum((annotationArea / printArea) * 100, 4) : 0;
  const lineRatio = printArea > 0 ? roundNum((finalLineArea / printArea) * 100, 4) : 0;
  const writingRatio = printArea > 0 ? roundNum((finalWritingArea / printArea) * 100, 4) : 0;

  return {
    paperArea,
    printArea,
    writingArea: Math.max(0, finalWritingArea),
    annotationArea,
    lineArea: Math.max(0, finalLineArea),
    annotationRatio,
    lineRatio,
    writingRatio,
    printWidth,
    printHeight,
    columnWidth,
    rowHeight,
    areaSumCheck: {
      sum: roundNum(finalWritingArea + annotationArea + finalLineArea),
      diff: roundNum(Math.abs(roundNum(finalWritingArea + annotationArea + finalLineArea) - printArea)),
      isMatch: verifiedIsMatch,
    },
  };
}

export function formatArea(area: number): string {
  if (area >= 10000) {
    return `${(area / 100).toFixed(4)} cm²`;
  }
  return `${area.toFixed(4)} mm²`;
}

export function formatAreaCompact(area: number): string {
  if (area >= 10000) {
    return `${(area / 100).toFixed(2)} cm²`;
  }
  return `${area.toFixed(2)} mm²`;
}

export function formatRatio(ratio: number): string {
  return `${ratio.toFixed(2)}%`;
}

export function mmToPx(mm: number, dpi = 96): number {
  return (mm * dpi) / 25.4;
}

export function pxToMm(px: number, dpi = 96): number {
  return (px * 25.4) / dpi;
}

export function computePrintWidthFromMargins(params: LayoutParams): number {
  return roundNum(params.paperWidth - params.marginLeft - params.marginRight);
}

export function computePrintHeightFromMargins(params: LayoutParams): number {
  return roundNum(params.paperHeight - params.marginTop - params.marginBottom);
}

export function computeMarginsFromPrintSize(
  paperWidth: number,
  paperHeight: number,
  printWidth: number,
  printHeight: number,
  centerHorizontally: boolean = true,
  centerVertically: boolean = true
): { marginTop: number; marginBottom: number; marginLeft: number; marginRight: number } {
  const horizontalRemainder = Math.max(0, paperWidth - printWidth);
  const verticalRemainder = Math.max(0, paperHeight - printHeight);

  let marginLeft: number;
  let marginRight: number;
  if (centerHorizontally) {
    const half = horizontalRemainder / 2;
    marginLeft = roundNum(half);
    marginRight = roundNum(horizontalRemainder - marginLeft);
  } else {
    marginLeft = roundNum(horizontalRemainder);
    marginRight = 0;
  }

  let marginTop: number;
  let marginBottom: number;
  if (centerVertically) {
    const half = verticalRemainder / 2;
    marginTop = roundNum(half);
    marginBottom = roundNum(verticalRemainder - marginTop);
  } else {
    marginTop = roundNum(verticalRemainder);
    marginBottom = 0;
  }

  return { marginTop, marginBottom, marginLeft, marginRight };
}
