import type { LayoutParams, LayoutStats } from '../types/layout';

export function calculateLayoutStats(params: LayoutParams): LayoutStats {
  const paperArea = params.paperWidth * params.paperHeight;

  const printWidth = params.paperWidth - params.marginLeft - params.marginRight;
  const printHeight = params.paperHeight - params.marginTop - params.marginBottom;
  const printArea = printWidth * printHeight;

  const annotationTotalWidth = params.annotationPosition === 'both'
    ? params.annotationWidth * 2
    : params.annotationWidth;
  const annotationArea = annotationTotalWidth * printHeight;

  const bodyWidth = printWidth - annotationTotalWidth;
  const columnWidth = bodyWidth / params.columnCount;
  const rowHeight = printHeight / params.rowCount;

  const verticalLineCount = params.columnCount + 1;
  const verticalLineArea = verticalLineCount * params.lineThickness * printHeight;

  const horizontalLineCount = params.rowCount + 1;
  const horizontalLineArea = horizontalLineCount * params.lineThickness * bodyWidth;

  const overlapArea = verticalLineCount * horizontalLineCount * params.lineThickness * params.lineThickness;
  const lineArea = verticalLineArea + horizontalLineArea - overlapArea;

  const bodyArea = bodyWidth * printHeight;
  const writingArea = bodyArea - lineArea;

  const annotationRatio = printArea > 0 ? (annotationArea / printArea) * 100 : 0;
  const lineRatio = printArea > 0 ? (lineArea / printArea) * 100 : 0;
  const writingRatio = printArea > 0 ? (writingArea / printArea) * 100 : 0;

  return {
    paperArea,
    printArea,
    writingArea: Math.max(0, writingArea),
    annotationArea,
    lineArea,
    annotationRatio,
    lineRatio,
    writingRatio,
    printWidth,
    printHeight,
    columnWidth,
    rowHeight,
  };
}

export function formatArea(area: number): string {
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
