import type { LayoutParams, LayoutStats, SavedScheme, FishtailType, AnnotationPosition } from '../types/layout';
import type {
  DiffItem,
  DiffCategory,
  DiffSeverity,
  SchemeCompareInfo,
  ComparisonResult,
  ComparisonSummary,
  AuditIssue,
  AuditIssueType,
  AuditResult,
  AuditSummary,
  ReportExportOptions,
} from '../types/comparison';
import {
  DIFF_CATEGORY_LABELS,
  AUDIT_ISSUE_TYPE_LABELS,
} from '../types/comparison';
import { calculateLayoutStats, formatArea, formatRatio } from './calculation';
import { validateLayoutParams } from './validation';
import { exportWithFormat } from './export';

const fishtailLabelMap: Record<FishtailType, string> = {
  none: '无鱼尾',
  single: '单鱼尾',
  double: '双鱼尾',
  triple: '三鱼尾',
  flowery: '花鱼尾',
};

const annotationPositionLabelMap: Record<AnnotationPosition, string> = {
  none: '无批注区',
  left: '左侧',
  right: '右侧',
  both: '双侧',
};

function getFishtailLabel(style: FishtailType): string {
  return fishtailLabelMap[style] || style;
}

function getAnnotationPositionLabel(pos: AnnotationPosition): string {
  return annotationPositionLabelMap[pos] || pos;
}

function formatNum(value: number, decimals: number = 2): string {
  return value.toFixed(decimals);
}

function allSame(values: string[]): boolean {
  if (values.length <= 1) return true;
  const first = values[0];
  return values.every(v => v === first);
}

export function buildSchemeCompareInfo(scheme: SavedScheme): SchemeCompareInfo {
  return {
    schemeId: scheme.id,
    schemeName: scheme.name,
    params: { ...scheme.params },
    stats: calculateLayoutStats(scheme.params),
  };
}

export function compareSchemes(schemes: SavedScheme[]): ComparisonResult {
  const infos = schemes.map(buildSchemeCompareInfo);
  const diffItems: DiffItem[] = [];

  const paperItems: DiffItem[] = [
    {
      key: 'paperWidth',
      label: '纸张宽度',
      category: 'paper',
      values: infos.map(i => `${formatNum(i.params.paperWidth)} mm`),
      hasDiff: false,
      severity: 'info',
    },
    {
      key: 'paperHeight',
      label: '纸张高度',
      category: 'paper',
      values: infos.map(i => `${formatNum(i.params.paperHeight)} mm`),
      hasDiff: false,
      severity: 'info',
    },
    {
      key: 'paperSize',
      label: '纸张尺寸',
      category: 'paper',
      values: infos.map(i => `${formatNum(i.params.paperWidth)} × ${formatNum(i.params.paperHeight)} mm`),
      hasDiff: false,
      severity: 'info',
    },
    {
      key: 'paperArea',
      label: '纸张面积',
      category: 'paper',
      values: infos.map(i => formatArea(i.stats.paperArea)),
      hasDiff: false,
      severity: 'info',
    },
  ];

  const printItems: DiffItem[] = [
    {
      key: 'printWidth',
      label: '版心宽度',
      category: 'print',
      values: infos.map(i => `${formatNum(i.stats.printWidth)} mm`),
      hasDiff: false,
      severity: 'info',
    },
    {
      key: 'printHeight',
      label: '版心高度',
      category: 'print',
      values: infos.map(i => `${formatNum(i.stats.printHeight)} mm`),
      hasDiff: false,
      severity: 'info',
    },
    {
      key: 'printSize',
      label: '版心尺寸',
      category: 'print',
      values: infos.map(i => `${formatNum(i.stats.printWidth)} × ${formatNum(i.stats.printHeight)} mm`),
      hasDiff: false,
      severity: 'info',
    },
    {
      key: 'printArea',
      label: '版心面积',
      category: 'print',
      values: infos.map(i => formatArea(i.stats.printArea)),
      hasDiff: false,
      severity: 'info',
    },
  ];

  const marginItems: DiffItem[] = [
    {
      key: 'marginTop',
      label: '上边距',
      category: 'margin',
      values: infos.map(i => `${formatNum(i.params.marginTop)} mm`),
      hasDiff: false,
      severity: 'info',
    },
    {
      key: 'marginBottom',
      label: '下边距',
      category: 'margin',
      values: infos.map(i => `${formatNum(i.params.marginBottom)} mm`),
      hasDiff: false,
      severity: 'info',
    },
    {
      key: 'marginLeft',
      label: '左边距',
      category: 'margin',
      values: infos.map(i => `${formatNum(i.params.marginLeft)} mm`),
      hasDiff: false,
      severity: 'info',
    },
    {
      key: 'marginRight',
      label: '右边距',
      category: 'margin',
      values: infos.map(i => `${formatNum(i.params.marginRight)} mm`),
      hasDiff: false,
      severity: 'info',
    },
    {
      key: 'marginSymmetry',
      label: '边距对称性',
      category: 'margin',
      values: infos.map(i => {
        const vSym =
          Math.abs(i.params.marginTop - i.params.marginBottom) < 0.01 &&
          Math.abs(i.params.marginLeft - i.params.marginRight) < 0.01;
        return vSym ? '四边对称' : '非对称';
      }),
      hasDiff: false,
      severity: 'info',
    },
  ];

  const gridItems: DiffItem[] = [
    {
      key: 'columnCount',
      label: '栏数',
      category: 'grid',
      values: infos.map(i => String(i.params.columnCount)),
      hasDiff: false,
      severity: 'info',
    },
    {
      key: 'rowCount',
      label: '行数',
      category: 'grid',
      values: infos.map(i => String(i.params.rowCount)),
      hasDiff: false,
      severity: 'info',
    },
    {
      key: 'gridSize',
      label: '栏×行',
      category: 'grid',
      values: infos.map(i => `${i.params.columnCount} × ${i.params.rowCount}`),
      hasDiff: false,
      severity: 'info',
    },
    {
      key: 'columnWidth',
      label: '每栏宽度',
      category: 'grid',
      values: infos.map(i => `${formatNum(i.stats.columnWidth)} mm`),
      hasDiff: false,
      severity: 'info',
    },
    {
      key: 'rowHeight',
      label: '每行高度',
      category: 'grid',
      values: infos.map(i => `${formatNum(i.stats.rowHeight)} mm`),
      hasDiff: false,
      severity: 'info',
    },
  ];

  const lineItems: DiffItem[] = [
    {
      key: 'lineThickness',
      label: '栏线粗细',
      category: 'line',
      values: infos.map(i => `${formatNum(i.params.lineThickness, 3)} mm`),
      hasDiff: false,
      severity: 'info',
    },
    {
      key: 'lineColor',
      label: '栏线颜色',
      category: 'line',
      values: infos.map(i => i.params.lineColor),
      hasDiff: false,
      severity: 'info',
    },
  ];

  const fishtailItems: DiffItem[] = [
    {
      key: 'fishtailStyle',
      label: '鱼尾样式',
      category: 'fishtail',
      values: infos.map(i => getFishtailLabel(i.params.fishtailStyle)),
      hasDiff: false,
      severity: 'info',
    },
  ];

  const annotationItems: DiffItem[] = [
    {
      key: 'annotationPosition',
      label: '批注区位置',
      category: 'annotation',
      values: infos.map(i => getAnnotationPositionLabel(i.params.annotationPosition)),
      hasDiff: false,
      severity: 'info',
    },
    {
      key: 'annotationWidth',
      label: '批注区宽度',
      category: 'annotation',
      values: infos.map(i => `${formatNum(i.params.annotationWidth)} mm`),
      hasDiff: false,
      severity: 'info',
    },
    {
      key: 'annotationArea',
      label: '批注区面积',
      category: 'annotation',
      values: infos.map(i => formatArea(i.stats.annotationArea)),
      hasDiff: false,
      severity: 'info',
    },
  ];

  const areaItems: DiffItem[] = [
    {
      key: 'writingArea',
      label: '书写面积',
      category: 'area',
      values: infos.map(i => formatArea(i.stats.writingArea)),
      hasDiff: false,
      severity: 'info',
    },
    {
      key: 'writingRatio',
      label: '书写占比',
      category: 'area',
      values: infos.map(i => formatRatio(i.stats.writingRatio)),
      hasDiff: false,
      severity: 'info',
    },
    {
      key: 'annotationRatio',
      label: '批注占比',
      category: 'area',
      values: infos.map(i => formatRatio(i.stats.annotationRatio)),
      hasDiff: false,
      severity: 'info',
    },
    {
      key: 'lineArea',
      label: '栏线面积',
      category: 'area',
      values: infos.map(i => formatArea(i.stats.lineArea)),
      hasDiff: false,
      severity: 'info',
    },
    {
      key: 'lineRatio',
      label: '栏线占比',
      category: 'area',
      values: infos.map(i => formatRatio(i.stats.lineRatio)),
      hasDiff: false,
      severity: 'info',
    },
  ];

  const allItems = [
    ...paperItems,
    ...printItems,
    ...marginItems,
    ...gridItems,
    ...lineItems,
    ...fishtailItems,
    ...annotationItems,
    ...areaItems,
  ];

  for (const item of allItems) {
    item.hasDiff = !allSame(item.values);
    if (item.hasDiff) {
      item.severity = 'warning';
    }
  }

  diffItems.push(...allItems);

  const diffCount = allItems.filter(i => i.hasDiff).length;
  const identicalCount = allItems.filter(i => !i.hasDiff).length;

  const summary: ComparisonSummary = {
    totalSchemes: infos.length,
    diffCount,
    errorCount: 0,
    warningCount: diffCount,
    identicalCount,
  };

  return {
    schemes: infos,
    diffItems,
    summary,
  };
}

function generateIssueId(): string {
  return `issue_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function auditSchemes(schemes: SavedScheme[]): AuditResult {
  const issues: AuditIssue[] = [];

  for (const scheme of schemes) {
    const params = scheme.params;
    const stats = calculateLayoutStats(params);
    const validation = validateLayoutParams(params);

    if (!validation.valid) {
      for (const err of validation.errors) {
        issues.push({
          id: generateIssueId(),
          type: 'over_limit',
          severity: 'error',
          schemeId: scheme.id,
          schemeName: scheme.name,
          category: 'paper',
          field: 'validation',
          fieldLabel: '参数校验',
          value: '',
          message: err,
        });
      }
    }

    if (validation.warnings) {
      for (const warn of validation.warnings) {
        issues.push({
          id: generateIssueId(),
          type: 'best_practice',
          severity: 'warning',
          schemeId: scheme.id,
          schemeName: scheme.name,
          category: 'paper',
          field: 'validation_warn',
          fieldLabel: '最佳实践',
          value: '',
          message: warn,
        });
      }
    }

    if (params.marginTop > 0 && params.marginBottom > 0) {
      const ratio = params.marginTop / Math.max(params.marginBottom, 0.01);
      if (ratio < 0.3 || ratio > 3) {
        issues.push({
          id: generateIssueId(),
          type: 'abnormal_ratio',
          severity: 'warning',
          schemeId: scheme.id,
          schemeName: scheme.name,
          category: 'margin',
          field: 'marginTopBottomRatio',
          fieldLabel: '上下边距比例',
          value: ratio.toFixed(2),
          message: `上下边距比例失调（上${params.marginTop}mm / 下${params.marginBottom}mm），比例过于悬殊`,
          suggestion: '建议调整上下边距，使比例更协调，通常天头略大于地脚较为常见',
        });
      }
    }

    if (params.marginLeft > 0 && params.marginRight > 0) {
      const ratio = params.marginLeft / Math.max(params.marginRight, 0.01);
      if (ratio < 0.3 || ratio > 3) {
        issues.push({
          id: generateIssueId(),
          type: 'abnormal_ratio',
          severity: 'warning',
          schemeId: scheme.id,
          schemeName: scheme.name,
          category: 'margin',
          field: 'marginLeftRightRatio',
          fieldLabel: '左右边距比例',
          value: ratio.toFixed(2),
          message: `左右边距比例失调（左${params.marginLeft}mm / 右${params.marginRight}mm），比例过于悬殊`,
          suggestion: '建议调整左右边距，使比例更协调',
        });
      }
    }

    if (stats.columnWidth > 0 && stats.rowHeight > 0) {
      const aspectRatio = stats.columnWidth / stats.rowHeight;
      if (aspectRatio < 0.3 || aspectRatio > 3) {
        issues.push({
          id: generateIssueId(),
          type: 'abnormal_ratio',
          severity: 'warning',
          schemeId: scheme.id,
          schemeName: scheme.name,
          category: 'grid',
          field: 'cellAspectRatio',
          fieldLabel: '单元格宽高比',
          value: aspectRatio.toFixed(2),
          message: `单元格宽高比异常（${stats.columnWidth.toFixed(2)}mm × ${stats.rowHeight.toFixed(2)}mm），比例过于悬殊`,
          suggestion: '建议调整栏数或行数，使单元格接近方形或竖长方形更符合阅读习惯',
        });
      }
    }

    if (params.lineThickness > 0 && stats.columnWidth > 0) {
      const thicknessToWidthRatio = params.lineThickness / Math.max(stats.columnWidth, 0.01);
      if (thicknessToWidthRatio > 0.1) {
        issues.push({
          id: generateIssueId(),
          type: 'abnormal_ratio',
          severity: 'warning',
          schemeId: scheme.id,
          schemeName: scheme.name,
          category: 'line',
          field: 'lineThicknessRatio',
          fieldLabel: '栏线粗细比例',
          value: `${(thicknessToWidthRatio * 100).toFixed(1)}%`,
          message: `栏线粗细(${params.lineThickness}mm)相对于栏宽(${stats.columnWidth.toFixed(2)}mm)比例过大`,
          suggestion: '建议减小栏线粗细或减少栏数',
        });
      }
    }

    if (params.annotationPosition !== 'none' && params.annotationWidth > 0) {
      const annotationTotalWidth =
        params.annotationPosition === 'both'
          ? params.annotationWidth * 2
          : params.annotationWidth;
      const annotationToPrintRatio = annotationTotalWidth / Math.max(stats.printWidth, 0.01);
      if (annotationToPrintRatio > 0.4) {
        issues.push({
          id: generateIssueId(),
          type: 'abnormal_ratio',
          severity: 'warning',
          schemeId: scheme.id,
          schemeName: scheme.name,
          category: 'annotation',
          field: 'annotationRatio',
          fieldLabel: '批注区占比',
          value: `${(annotationToPrintRatio * 100).toFixed(1)}%`,
          message: `批注区占版心宽度的 ${(annotationToPrintRatio * 100).toFixed(1)}%，可能挤占正文空间`,
          suggestion: '建议减小批注区宽度或调整批注区位置',
        });
      }
    }

    if (params.columnCount > 30) {
      issues.push({
        id: generateIssueId(),
        type: 'over_limit',
        severity: 'info',
        schemeId: scheme.id,
        schemeName: scheme.name,
        category: 'grid',
        field: 'columnCount',
        fieldLabel: '栏数',
        value: String(params.columnCount),
        message: `栏数较多（${params.columnCount}栏），可能影响阅读体验`,
        suggestion: '建议减少栏数以提高可读性',
      });
    }

    if (params.rowCount > 50) {
      issues.push({
        id: generateIssueId(),
        type: 'over_limit',
        severity: 'info',
        schemeId: scheme.id,
        schemeName: scheme.name,
        category: 'grid',
        field: 'rowCount',
        fieldLabel: '行数',
        value: String(params.rowCount),
        message: `行数较多（${params.rowCount}行），可能影响阅读体验`,
        suggestion: '建议减少行数以提高可读性',
      });
    }

    if (params.paperWidth > 500 || params.paperHeight > 500) {
      issues.push({
        id: generateIssueId(),
        type: 'over_limit',
        severity: 'info',
        schemeId: scheme.id,
        schemeName: scheme.name,
        category: 'paper',
        field: 'paperSize',
        fieldLabel: '纸张尺寸',
        value: `${params.paperWidth} × ${params.paperHeight} mm`,
        message: `纸张尺寸较大（${params.paperWidth}×${params.paperHeight}mm），可能不便于印刷或装订`,
        suggestion: '建议使用标准纸张尺寸',
      });
    }
  }

  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;
  const infoCount = issues.filter(i => i.severity === 'info').length;

  const passCount = schemes.filter(s => {
    const schemeIssues = issues.filter(i => i.schemeId === s.id);
    return schemeIssues.filter(i => i.severity === 'error').length === 0;
  }).length;

  const summary: AuditSummary = {
    totalSchemes: schemes.length,
    totalIssues: issues.length,
    errorCount,
    warningCount,
    infoCount,
    passCount,
  };

  const conclusions: string[] = [];

  if (errorCount > 0) {
    conclusions.push(`发现 ${errorCount} 个需要立即处理的严重问题，建议优先修复错误项`);
  }

  if (warningCount > 0) {
    conclusions.push(`发现 ${warningCount} 个警告项，建议逐一复核`);
  }

  if (infoCount > 0) {
    conclusions.push(`发现 ${infoCount} 个提示项，可根据需要关注`);
  }

  if (passCount === schemes.length && errorCount === 0) {
    conclusions.push('所有方案均通过基础校验');
  } else if (passCount > 0) {
    conclusions.push(`${passCount}/${schemes.length} 个方案无严重错误`);
  }

  if (schemes.length >= 2) {
    const comparison = compareSchemes(schemes);
    const diffParams = comparison.diffItems.filter(d => d.hasDiff).length;
    conclusions.push(`方案间存在 ${diffParams} 项参数差异`);
  }

  return {
    issues,
    summary,
    conclusions,
  };
}

export function generateReportJson(
  schemes: SavedScheme[],
  comparison: ComparisonResult,
  audit: AuditResult,
  includeDetails: boolean = true,
  includeSchemes: boolean = true
): string {
  const report: Record<string, any> = {
    title: '版式对比与审校报告',
    generatedAt: new Date().toISOString(),
    generatedAtLocal: new Date().toLocaleString('zh-CN'),
    schemeCount: schemes.length,
    summary: {
      comparison: comparison.summary,
      audit: audit.summary,
    },
    conclusions: audit.conclusions,
  };

  if (includeDetails) {
    report.differences = comparison.diffItems.filter(d => d.hasDiff).map(d => ({
      key: d.key,
      label: d.label,
      category: DIFF_CATEGORY_LABELS[d.category] || d.category,
      values: d.values,
      schemes: comparison.schemes.map((s, idx) => ({
        name: s.schemeName,
        value: d.values[idx],
      })),
    }));

    report.issues = audit.issues.map(i => ({
      type: AUDIT_ISSUE_TYPE_LABELS[i.type] || i.type,
      severity: i.severity,
      scheme: i.schemeName,
      category: DIFF_CATEGORY_LABELS[i.category] || i.category,
      field: i.fieldLabel,
      value: i.value,
      message: i.message,
      suggestion: i.suggestion,
    }));
  }

  if (includeSchemes) {
    report.schemes = schemes.map(s => ({
      id: s.id,
      name: s.name,
      createdAt: new Date(s.createdAt).toLocaleString('zh-CN'),
      updatedAt: new Date(s.updatedAt).toLocaleString('zh-CN'),
      params: s.params,
    }));
  }

  return JSON.stringify(report, null, 2);
}

export function generateReportCsv(schemes: SavedScheme[], audit: AuditResult): string {
  const headers = ['方案名称', '问题类型', '严重程度', '分类', '字段', '值', '问题描述', '建议'];
  const lines: string[] = [headers.join(',')];

  for (const issue of audit.issues) {
    const line = [
      `"${issue.schemeName.replace(/"/g, '""')}"`,
      `"${AUDIT_ISSUE_TYPE_LABELS[issue.type] || issue.type}"`,
      `"${issue.severity}"`,
      `"${DIFF_CATEGORY_LABELS[issue.category] || issue.category}"`,
      `"${issue.fieldLabel}"`,
      `"${issue.value}"`,
      `"${issue.message.replace(/"/g, '""')}"`,
      `"${(issue.suggestion || '').replace(/"/g, '""')}"`,
    ].join(',');
    lines.push(line);
  }

  return '\uFEFF' + lines.join('\n');
}

export function generateReportTxt(
  schemes: SavedScheme[],
  comparison: ComparisonResult,
  audit: AuditResult
): string {
  const lines: string[] = [];

  lines.push('='.repeat(60));
  lines.push('古籍朱丝栏版式 - 对比与审校报告');
  lines.push('='.repeat(60));
  lines.push(`生成时间: ${new Date().toLocaleString('zh-CN')}`);
  lines.push(`方案数量: ${schemes.length} 套`);
  lines.push('');

  lines.push('【审校结论】');
  lines.push('-'.repeat(40));
  for (const conclusion of audit.conclusions) {
    lines.push(`  • ${conclusion}`);
  }
  lines.push('');

  lines.push('【审校统计】');
  lines.push('-'.repeat(40));
  lines.push(`  方案总数: ${audit.summary.totalSchemes}`);
  lines.push(`  问题总数: ${audit.summary.totalIssues}`);
  lines.push(`  错误数: ${audit.summary.errorCount}`);
  lines.push(`  警告数: ${audit.summary.warningCount}`);
  lines.push(`  提示数: ${audit.summary.infoCount}`);
  lines.push(`  通过数: ${audit.summary.passCount}/${audit.summary.totalSchemes}`);
  lines.push('');

  lines.push('【对比统计】');
  lines.push('-'.repeat(40));
  lines.push(`  差异项: ${comparison.summary.diffCount}`);
  lines.push(`  相同项: ${comparison.summary.identicalCount}`);
  lines.push('');

  lines.push('【方案列表】');
  lines.push('-'.repeat(40));
  for (let i = 0; i < schemes.length; i++) {
    const s = schemes[i];
    lines.push(`  ${i + 1}. ${s.name}`);
    lines.push(
      `     纸张: ${s.params.paperWidth}×${s.params.paperHeight}mm | 版心: ${comparison.schemes[i].stats.printWidth.toFixed(
        1
      )}×${comparison.schemes[i].stats.printHeight.toFixed(1)}mm`
    );
    lines.push(
      `     栏行: ${s.params.columnCount}栏×${s.params.rowCount}行 | 鱼尾: ${
        fishtailLabelMap[s.params.fishtailStyle] || s.params.fishtailStyle
      }`
    );
    lines.push('');
  }

  lines.push('【差异详情】');
  lines.push('-'.repeat(40));
  const diffItems = comparison.diffItems.filter(d => d.hasDiff);
  if (diffItems.length === 0) {
    lines.push('  所有方案参数完全一致');
  } else {
    for (const item of diffItems) {
      lines.push(`  [${DIFF_CATEGORY_LABELS[item.category]}] ${item.label}:`);
      for (let i = 0; i < item.values.length; i++) {
        lines.push(`    ${comparison.schemes[i].schemeName}: ${item.values[i]}`);
      }
      lines.push('');
    }
  }

  lines.push('');
  lines.push('【审校问题详情】');
  lines.push('-'.repeat(40));
  if (audit.issues.length === 0) {
    lines.push('  未发现问题');
  } else {
    const groupedByScheme: Record<string, AuditIssue[]> = {};
    for (const issue of audit.issues) {
      if (!groupedByScheme[issue.schemeId]) {
        groupedByScheme[issue.schemeId] = [];
      }
      groupedByScheme[issue.schemeId].push(issue);
    }

    for (const schemeId of Object.keys(groupedByScheme)) {
      const schemeIssues = groupedByScheme[schemeId];
      const schemeName = schemeIssues[0].schemeName;
      lines.push(`\n  方案: ${schemeName}`);
      for (const issue of schemeIssues) {
        const severityIcon = issue.severity === 'error' ? '✗' : issue.severity === 'warning' ? '!' : 'ℹ';
        lines.push(`    [${severityIcon}] ${issue.message}`);
        if (issue.suggestion) {
          lines.push(`       建议: ${issue.suggestion}`);
        }
      }
    }
  }

  lines.push('');
  lines.push('='.repeat(60));
  lines.push('报告结束');
  lines.push('='.repeat(60));

  return lines.join('\n');
}

export function exportReport(
  schemes: SavedScheme[],
  comparison: ComparisonResult,
  audit: AuditResult,
  options: ReportExportOptions
): void {
  const { format, includeDetails = true, includeSchemes = true, name } = options;

  let content: string;
  let mimeType: string;
  let extension: string;

  switch (format) {
    case 'json':
      content = generateReportJson(schemes, comparison, audit, includeDetails, includeSchemes);
      mimeType = 'application/json;charset=utf-8';
      extension = 'json';
      break;
    case 'csv':
      content = generateReportCsv(schemes, audit);
      mimeType = 'text/csv;charset=utf-8';
      extension = 'csv';
      break;
    case 'txt':
    default:
      content = generateReportTxt(schemes, comparison, audit);
      mimeType = 'text/plain;charset=utf-8';
      extension = 'txt';
      break;
  }

  const fileName = name || `版式审校报告_${new Date().toLocaleString('zh-CN').replace(/[/:]/g, '-')}`;

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName.replace(/[\\/:*?"<>|]/g, '_')}.${extension}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function batchExportSchemes(
  schemes: SavedScheme[],
  format: 'json' | 'svg' | 'png',
  dpi?: number
): Promise<void> {
  for (let i = 0; i < schemes.length; i++) {
    const scheme = schemes[i];
    await new Promise<void>(resolve => {
      setTimeout(() => {
        try {
          exportWithFormat(scheme.params, {
            format,
            name: scheme.name,
            dpi: dpi || 300,
            includeDimensions: true,
          });
        } catch (e) {
          console.error(`导出方案 ${scheme.name} 失败:`, e);
        }
        resolve();
      }, i * 500);
    });
  }
}
