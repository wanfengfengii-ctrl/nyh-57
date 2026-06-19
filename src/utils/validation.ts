import type { LayoutParams, ValidationResult } from '../types/layout';
import { calculateLayoutStats } from './calculation';

const MIN_PAPER_SIZE = 10;
const MAX_PAPER_SIZE = 2000;
const MIN_MARGIN = 0.5;
const MAX_MARGIN = 500;
const MIN_PRINT_SIZE = 5;
const MAX_LINE_THICKNESS = 10;
const MIN_LINE_THICKNESS = 0.01;
const MAX_ANNOTATION_WIDTH_RATIO = 0.5;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function validateLayoutParams(params: LayoutParams): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!isFiniteNumber(params.paperWidth) || params.paperWidth <= 0) {
    errors.push('纸张宽度必须为大于 0 的有效数字');
  } else if (params.paperWidth < MIN_PAPER_SIZE) {
    warnings.push(`纸张宽度 ${params.paperWidth}mm 偏小，建议不小于 ${MIN_PAPER_SIZE}mm`);
  } else if (params.paperWidth > MAX_PAPER_SIZE) {
    errors.push(`纸张宽度不能超过 ${MAX_PAPER_SIZE}mm，当前为 ${params.paperWidth}mm`);
  }

  if (!isFiniteNumber(params.paperHeight) || params.paperHeight <= 0) {
    errors.push('纸张高度必须为大于 0 的有效数字');
  } else if (params.paperHeight < MIN_PAPER_SIZE) {
    warnings.push(`纸张高度 ${params.paperHeight}mm 偏小，建议不小于 ${MIN_PAPER_SIZE}mm`);
  } else if (params.paperHeight > MAX_PAPER_SIZE) {
    errors.push(`纸张高度不能超过 ${MAX_PAPER_SIZE}mm，当前为 ${params.paperHeight}mm`);
  }

  if (!isFiniteNumber(params.marginTop) || params.marginTop < 0) {
    errors.push('上边距必须为非负有效数字');
  } else if (params.marginTop > MAX_MARGIN) {
    errors.push(`上边距不能超过 ${MAX_MARGIN}mm，当前为 ${params.marginTop}mm`);
  } else if (params.marginTop > 0 && params.marginTop < MIN_MARGIN) {
    warnings.push(`上边距 ${params.marginTop}mm 偏小，建议不小于 ${MIN_MARGIN}mm`);
  }

  if (!isFiniteNumber(params.marginBottom) || params.marginBottom < 0) {
    errors.push('下边距必须为非负有效数字');
  } else if (params.marginBottom > MAX_MARGIN) {
    errors.push(`下边距不能超过 ${MAX_MARGIN}mm，当前为 ${params.marginBottom}mm`);
  } else if (params.marginBottom > 0 && params.marginBottom < MIN_MARGIN) {
    warnings.push(`下边距 ${params.marginBottom}mm 偏小，建议不小于 ${MIN_MARGIN}mm`);
  }

  if (!isFiniteNumber(params.marginLeft) || params.marginLeft < 0) {
    errors.push('左边距必须为非负有效数字');
  } else if (params.marginLeft > MAX_MARGIN) {
    errors.push(`左边距不能超过 ${MAX_MARGIN}mm，当前为 ${params.marginLeft}mm`);
  } else if (params.marginLeft > 0 && params.marginLeft < MIN_MARGIN) {
    warnings.push(`左边距 ${params.marginLeft}mm 偏小，建议不小于 ${MIN_MARGIN}mm`);
  }

  if (!isFiniteNumber(params.marginRight) || params.marginRight < 0) {
    errors.push('右边距必须为非负有效数字');
  } else if (params.marginRight > MAX_MARGIN) {
    errors.push(`右边距不能超过 ${MAX_MARGIN}mm，当前为 ${params.marginRight}mm`);
  } else if (params.marginRight > 0 && params.marginRight < MIN_MARGIN) {
    warnings.push(`右边距 ${params.marginRight}mm 偏小，建议不小于 ${MIN_MARGIN}mm`);
  }

  const printWidth = isFiniteNumber(params.paperWidth) && isFiniteNumber(params.marginLeft) && isFiniteNumber(params.marginRight)
    ? params.paperWidth - params.marginLeft - params.marginRight
    : -1;

  const printHeight = isFiniteNumber(params.paperHeight) && isFiniteNumber(params.marginTop) && isFiniteNumber(params.marginBottom)
    ? params.paperHeight - params.marginTop - params.marginBottom
    : -1;

  if (printWidth <= MIN_PRINT_SIZE) {
    if (printWidth <= 0) {
      errors.push(`版心宽度必须大于 0：纸张宽度(${params.paperWidth}mm) - 左边距(${params.marginLeft}mm) - 右边距(${params.marginRight}mm) = ${printWidth.toFixed(2)}mm`);
    } else {
      errors.push(`版心宽度过小：当前为 ${printWidth.toFixed(2)}mm，需大于 ${MIN_PRINT_SIZE}mm。请减小左右边距或增大纸张宽度`);
    }
  } else if (isFiniteNumber(params.paperWidth) && printWidth > params.paperWidth * 0.95) {
    warnings.push(`边距过小，版心宽度占纸张宽度的 ${((printWidth / params.paperWidth) * 100).toFixed(1)}%，建议保留适当边距`);
  }

  if (printHeight <= MIN_PRINT_SIZE) {
    if (printHeight <= 0) {
      errors.push(`版心高度必须大于 0：纸张高度(${params.paperHeight}mm) - 上边距(${params.marginTop}mm) - 下边距(${params.marginBottom}mm) = ${printHeight.toFixed(2)}mm`);
    } else {
      errors.push(`版心高度过小：当前为 ${printHeight.toFixed(2)}mm，需大于 ${MIN_PRINT_SIZE}mm。请减小上下边距或增大纸张高度`);
    }
  } else if (isFiniteNumber(params.paperHeight) && printHeight > params.paperHeight * 0.95) {
    warnings.push(`边距过小，版心高度占纸张高度的 ${((printHeight / params.paperHeight) * 100).toFixed(1)}%，建议保留适当边距`);
  }

  if (!Number.isInteger(params.columnCount) || params.columnCount <= 0) {
    errors.push('栏数必须为正整数');
  } else if (params.columnCount > 200) {
    errors.push(`栏数过多，当前为 ${params.columnCount}，最大支持 200 栏`);
  }

  if (!Number.isInteger(params.rowCount) || params.rowCount <= 0) {
    errors.push('行数必须为正整数');
  } else if (params.rowCount > 500) {
    errors.push(`行数过多，当前为 ${params.rowCount}，最大支持 500 行`);
  }

  if (!isFiniteNumber(params.lineThickness) || params.lineThickness <= 0) {
    errors.push('栏线粗细必须为大于 0 的有效数字');
  } else if (params.lineThickness < MIN_LINE_THICKNESS) {
    warnings.push(`栏线粗细 ${params.lineThickness}mm 过细，可能无法清晰显示，建议不小于 ${MIN_LINE_THICKNESS}mm`);
  } else if (params.lineThickness > MAX_LINE_THICKNESS) {
    errors.push(`栏线粗细不能超过 ${MAX_LINE_THICKNESS}mm，当前为 ${params.lineThickness}mm`);
  }

  if (!params.lineColor || typeof params.lineColor !== 'string') {
    errors.push('栏线颜色无效');
  } else if (!/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6}|[0-9A-Fa-f]{8})$/.test(params.lineColor)) {
    warnings.push(`栏线颜色格式建议使用十六进制，当前值可能无法正常显示`);
  }

  if (!isFiniteNumber(params.annotationWidth) || params.annotationWidth < 0) {
    errors.push('批注区宽度必须为非负有效数字');
  }

  const validPositions = ['left', 'right', 'both', 'none'];
  if (!validPositions.includes(params.annotationPosition)) {
    errors.push(`批注区位置无效，有效值为：${validPositions.join('、')}`);
  }

  const annotationTotalWidth = params.annotationPosition === 'both'
    ? params.annotationWidth * 2
    : params.annotationPosition === 'none'
      ? 0
      : params.annotationWidth;

  if (printWidth > 0 && annotationTotalWidth > 0) {
    if (annotationTotalWidth >= printWidth) {
      errors.push(`批注区总宽度(${annotationTotalWidth}mm)不能大于等于版心宽度(${printWidth.toFixed(2)}mm)，正文区域将不可用`);
    } else if (annotationTotalWidth > printWidth * MAX_ANNOTATION_WIDTH_RATIO) {
      warnings.push(`批注区占版心宽度的 ${((annotationTotalWidth / printWidth) * 100).toFixed(1)}%，可能挤占正文空间`);
    }
  }

  const availableWidth = printWidth - annotationTotalWidth;
  if (printWidth > 0 && availableWidth <= 0) {
    errors.push(`批注区宽度过大，正文区域宽度为 ${availableWidth.toFixed(2)}mm，请减小批注区宽度或调整边距`);
  }

  if (availableWidth > 0 && isFiniteNumber(params.columnCount) && params.columnCount > 0) {
    const columnWidth = availableWidth / params.columnCount;
    if (isFiniteNumber(params.lineThickness) && columnWidth <= params.lineThickness * 3) {
      errors.push(`栏宽(${columnWidth.toFixed(3)}mm)过小，与栏线粗细(${params.lineThickness}mm)比例失调。请减少栏数、减小栏线粗细或增大版心宽度`);
    } else if (columnWidth < 2) {
      warnings.push(`每栏宽度仅 ${columnWidth.toFixed(2)}mm，可能无法正常书写`);
    }
  }

  if (printHeight > 0 && isFiniteNumber(params.rowCount) && params.rowCount > 0) {
    const rowHeight = printHeight / params.rowCount;
    if (isFiniteNumber(params.lineThickness) && rowHeight <= params.lineThickness * 3) {
      errors.push(`行高(${rowHeight.toFixed(3)}mm)过小，与栏线粗细(${params.lineThickness}mm)比例失调。请减少行数、减小栏线粗细或增大版心高度`);
    } else if (rowHeight < 2) {
      warnings.push(`每行高度仅 ${rowHeight.toFixed(2)}mm，可能无法正常书写`);
    }
  }

  if (errors.length === 0) {
    try {
      const stats = calculateLayoutStats(params);
      if (!stats.areaSumCheck.isMatch && stats.areaSumCheck.diff > 0.01) {
        warnings.push(`面积计算存在微小偏差（${stats.areaSumCheck.diff.toFixed(4)} mm²），已自动校正`);
      }
    } catch {
      // ignore stats calculation errors here
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

export function validateSingleParam(
  key: keyof LayoutParams,
  value: number | string,
  params: LayoutParams
): string | null {
  const tempParams = { ...params, [key]: value };
  const result = validateLayoutParams(tempParams);
  if (result.valid) return null;

  const keyMap: Record<string, string[]> = {
    paperWidth: ['纸张宽度', '版心宽度', '纸张尺寸'],
    paperHeight: ['纸张高度', '版心高度', '纸张尺寸'],
    marginTop: ['上边距', '版心高度', '边距'],
    marginBottom: ['下边距', '版心高度', '边距'],
    marginLeft: ['左边距', '版心宽度', '边距'],
    marginRight: ['右边距', '版心宽度', '边距'],
    columnCount: ['栏数', '栏宽'],
    rowCount: ['行数', '行高'],
    lineThickness: ['栏线粗细', '栏宽', '行高', '栏线'],
    lineColor: ['栏线颜色'],
    fishtailStyle: ['鱼尾'],
    annotationWidth: ['批注区宽度', '正文区域', '批注区', '批注区总宽度'],
    annotationPosition: ['批注区', '正文区域', '批注区位置'],
  };
  const keywords = keyMap[key] || [];
  const relatedErrors = result.errors.filter(err =>
    keywords.some(kw => err.includes(kw))
  );

  return relatedErrors[0] || (result.errors.length > 0 ? result.errors[0] : null);
}

export function validatePrintSize(
  paperWidth: number,
  paperHeight: number,
  printWidth: number,
  printHeight: number
): { valid: boolean; error?: string } {
  if (printWidth <= MIN_PRINT_SIZE) {
    return { valid: false, error: `版心宽度必须大于 ${MIN_PRINT_SIZE}mm` };
  }
  if (printHeight <= MIN_PRINT_SIZE) {
    return { valid: false, error: `版心高度必须大于 ${MIN_PRINT_SIZE}mm` };
  }
  if (printWidth >= paperWidth) {
    return { valid: false, error: `版心宽度(${printWidth}mm)不能大于等于纸张宽度(${paperWidth}mm)` };
  }
  if (printHeight >= paperHeight) {
    return { valid: false, error: `版心高度(${printHeight}mm)不能大于等于纸张高度(${paperHeight}mm)` };
  }
  return { valid: true };
}
