import type { LayoutParams, ValidationResult } from '../types/layout';

export function validateLayoutParams(params: LayoutParams): ValidationResult {
  const errors: string[] = [];

  if (params.paperWidth <= 0) {
    errors.push('纸张宽度必须大于 0');
  }
  if (params.paperHeight <= 0) {
    errors.push('纸张高度必须大于 0');
  }

  if (params.marginTop <= 0) {
    errors.push('上边距必须大于 0');
  }
  if (params.marginBottom <= 0) {
    errors.push('下边距必须大于 0');
  }
  if (params.marginLeft <= 0) {
    errors.push('左边距必须大于 0');
  }
  if (params.marginRight <= 0) {
    errors.push('右边距必须大于 0');
  }

  const printWidth = params.paperWidth - params.marginLeft - params.marginRight;
  const printHeight = params.paperHeight - params.marginTop - params.marginBottom;

  if (printWidth <= 0) {
    errors.push('左右边距之和不能大于等于纸张宽度，版心宽度必须大于 0');
  }
  if (printHeight <= 0) {
    errors.push('上下边距之和不能大于等于纸张高度，版心高度必须大于 0');
  }

  if (!Number.isInteger(params.columnCount) || params.columnCount <= 0) {
    errors.push('栏数必须为正整数');
  }
  if (!Number.isInteger(params.rowCount) || params.rowCount <= 0) {
    errors.push('行数必须为正整数');
  }

  if (params.lineThickness <= 0) {
    errors.push('栏线粗细必须大于 0');
  }

  const annotationTotalWidth = params.annotationPosition === 'both'
    ? params.annotationWidth * 2
    : params.annotationWidth;

  if (params.annotationWidth < 0) {
    errors.push('批注区宽度不能为负数');
  }

  const availableWidth = printWidth - annotationTotalWidth;
  if (availableWidth <= 0) {
    errors.push('批注区宽度过大，挤占了正文区域，请减小批注区宽度或调整边距');
  }

  const columnWidth = availableWidth / params.columnCount;
  if (columnWidth <= params.lineThickness * 2) {
    errors.push('栏数过多或栏线过粗，导致栏宽小于栏线总粗细');
  }

  const rowHeight = printHeight / params.rowCount;
  if (rowHeight <= params.lineThickness * 2) {
    errors.push('行数过多或栏线过粗，导致行高小于栏线总粗细');
  }

  return {
    valid: errors.length === 0,
    errors,
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

  const relatedErrors = result.errors.filter(err => {
    const keyMap: Record<string, string[]> = {
      paperWidth: ['纸张宽度', '版心宽度'],
      paperHeight: ['纸张高度', '版心高度'],
      marginTop: ['上边距', '版心高度'],
      marginBottom: ['下边距', '版心高度'],
      marginLeft: ['左边距', '版心宽度'],
      marginRight: ['右边距', '版心宽度'],
      columnCount: ['栏数', '栏宽'],
      rowCount: ['行数', '行高'],
      lineThickness: ['栏线粗细', '栏宽', '行高'],
      annotationWidth: ['批注区宽度', '正文区域', '批注区'],
      annotationPosition: ['批注区', '正文区域'],
    };
    const keywords = keyMap[key] || [];
    return keywords.some(kw => err.includes(kw));
  });

  return relatedErrors[0] || null;
}
