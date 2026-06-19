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
  SortConfig,
  CustomAuditRule,
  ComparisonSnapshot,
  ArchiveRecord,
  ArchiveStats,
  ArchiveItemType,
  ReportTemplateConfig,
  SchemeGroup,
  IssueTracking,
  IssueStatus,
  SchemeReview,
  SchemeReviewStatus,
  ArchiveFilter,
} from '../types/comparison';
import {
  DIFF_CATEGORY_LABELS,
  AUDIT_ISSUE_TYPE_LABELS,
  SEVERITY_ORDER,
  SNAPSHOT_STORAGE_KEY,
  ARCHIVE_STORAGE_KEY,
  CUSTOM_RULES_STORAGE_KEY,
  MAX_SNAPSHOTS,
  MAX_ARCHIVE_RECORDS,
  MAX_CUSTOM_RULES,
  CUSTOM_RULE_FIELD_LABELS,
  CUSTOM_RULE_OPERATOR_LABELS,
  GROUP_STORAGE_KEY,
  ISSUE_TRACKING_STORAGE_KEY,
  SCHEME_REVIEW_STORAGE_KEY,
  MAX_GROUPS,
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

export function generateReportCsv(
  schemes: SavedScheme[],
  comparison: ComparisonResult,
  audit: AuditResult
): string {
  const lines: string[] = [];

  lines.push('【方案详情】');
  const schemeHeaders = [
    '序号', '方案名称', '创建时间', '更新时间',
    '纸张宽度(mm)', '纸张高度(mm)',
    '上边距(mm)', '下边距(mm)', '左边距(mm)', '右边距(mm)',
    '栏数', '行数',
    '栏线粗细(mm)', '栏线颜色',
    '鱼尾样式',
    '批注区位置', '批注区宽度(mm)',
  ];
  lines.push(schemeHeaders.join(','));

  for (let i = 0; i < schemes.length; i++) {
    const s = schemes[i];
    const line = [
      String(i + 1),
      `"${s.name.replace(/"/g, '""')}"`,
      `"${new Date(s.createdAt).toLocaleString('zh-CN')}"`,
      `"${new Date(s.updatedAt).toLocaleString('zh-CN')}"`,
      String(s.params.paperWidth),
      String(s.params.paperHeight),
      String(s.params.marginTop),
      String(s.params.marginBottom),
      String(s.params.marginLeft),
      String(s.params.marginRight),
      String(s.params.columnCount),
      String(s.params.rowCount),
      String(s.params.lineThickness),
      s.params.lineColor,
      `"${fishtailLabelMap[s.params.fishtailStyle] || s.params.fishtailStyle}"`,
      `"${annotationPositionLabelMap[s.params.annotationPosition] || s.params.annotationPosition}"`,
      String(s.params.annotationWidth),
    ];
    lines.push(line.join(','));
  }

  lines.push('');
  lines.push('【参数对比差异】');
  const diffHeaders = ['分类', '参数项', ...comparison.schemes.map(s => s.schemeName.replace(/"/g, '""'))];
  lines.push(diffHeaders.map(h => `"${h}"`).join(','));

  for (const item of comparison.diffItems) {
    if (item.hasDiff) {
      const line = [
        `"${DIFF_CATEGORY_LABELS[item.category]}"`,
        `"${item.label}"`,
        ...item.values.map(v => `"${v.replace(/"/g, '""')}"`),
      ];
      lines.push(line.join(','));
    }
  }

  lines.push('');
  lines.push('【审校问题】');
  const auditHeaders = ['方案名称', '问题类型', '严重程度', '分类', '字段', '值', '问题描述', '建议'];
  lines.push(auditHeaders.join(','));

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
      content = generateReportCsv(schemes, comparison, audit);
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

export function sortDiffItems(items: DiffItem[], config: SortConfig): DiffItem[] {
  const sorted = [...items];
  sorted.sort((a, b) => {
    let comparison = 0;
    switch (config.field) {
      case 'label':
        comparison = a.label.localeCompare(b.label, 'zh-CN');
        break;
      case 'category':
        comparison = DIFF_CATEGORY_LABELS[a.category].localeCompare(DIFF_CATEGORY_LABELS[b.category], 'zh-CN');
        break;
      case 'severity':
        comparison = SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity];
        break;
      case 'hasDiff':
        comparison = (b.hasDiff ? 1 : 0) - (a.hasDiff ? 1 : 0);
        break;
    }
    return config.order === 'asc' ? comparison : -comparison;
  });
  return sorted;
}

export function filterDiffItemsBySeverity(
  items: DiffItem[],
  severities: DiffSeverity[]
): DiffItem[] {
  if (severities.length === 0) return items;
  return items.filter(item => severities.includes(item.severity));
}

export function applyCustomRules(
  scheme: SavedScheme,
  rules: CustomAuditRule[]
): AuditIssue[] {
  const issues: AuditIssue[] = [];
  const stats = calculateLayoutStats(scheme.params);

  for (const rule of rules) {
    if (!rule.enabled) continue;

    let fieldValue: number | undefined;

    const paramValue = (scheme.params as Record<string, any>)[rule.field];
    if (paramValue !== undefined && typeof paramValue === 'number') {
      fieldValue = paramValue;
    } else {
      const statValue = (stats as Record<string, any>)[rule.field];
      if (statValue !== undefined && typeof statValue === 'number') {
        fieldValue = statValue;
      }
    }

    if (fieldValue === undefined) continue;

    let matched = false;
    switch (rule.operator) {
      case 'gt':
        matched = fieldValue > rule.value;
        break;
      case 'lt':
        matched = fieldValue < rule.value;
        break;
      case 'eq':
        matched = Math.abs(fieldValue - rule.value) < 0.001;
        break;
      case 'neq':
        matched = Math.abs(fieldValue - rule.value) >= 0.001;
        break;
      case 'gte':
        matched = fieldValue >= rule.value;
        break;
      case 'lte':
        matched = fieldValue <= rule.value;
        break;
      case 'between':
        if (rule.value2 !== undefined) {
          matched = fieldValue >= rule.value && fieldValue <= rule.value2;
        }
        break;
    }

    if (matched) {
      const fieldLabel = CUSTOM_RULE_FIELD_LABELS[rule.field] || rule.field;
      const operatorLabel = CUSTOM_RULE_OPERATOR_LABELS[rule.operator] || rule.operator;
      const valueText = rule.operator === 'between' && rule.value2 !== undefined
        ? `${rule.value} ~ ${rule.value2}`
        : String(rule.value);

      issues.push({
        id: `custom_${rule.id}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: 'best_practice',
        severity: rule.severity,
        schemeId: scheme.id,
        schemeName: scheme.name,
        category: rule.category,
        field: rule.field,
        fieldLabel,
        value: String(fieldValue),
        message: `自定义规则「${rule.name}」：${fieldLabel}(${fieldValue}) ${operatorLabel} ${valueText}`,
        suggestion: rule.suggestion,
      });
    }
  }

  return issues;
}

export function loadCustomRules(): CustomAuditRule[] {
  try {
    const saved = localStorage.getItem(CUSTOM_RULES_STORAGE_KEY);
    if (!saved) return [];
    const rules = JSON.parse(saved) as CustomAuditRule[];
    return Array.isArray(rules) ? rules : [];
  } catch (e) {
    console.warn('加载自定义审校规则失败:', e);
    return [];
  }
}

export function saveCustomRules(rules: CustomAuditRule[]): void {
  try {
    localStorage.setItem(CUSTOM_RULES_STORAGE_KEY, JSON.stringify(rules));
  } catch (e) {
    console.warn('保存自定义审校规则失败:', e);
  }
}

export function createCustomRule(
  rule: Omit<CustomAuditRule, 'id'>
): CustomAuditRule {
  return {
    ...rule,
    id: `rule_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  };
}

export function addCustomRule(rule: Omit<CustomAuditRule, 'id'>): CustomAuditRule | null {
  const rules = loadCustomRules();
  if (rules.length >= MAX_CUSTOM_RULES) {
    console.warn(`自定义规则数量已达上限 (${MAX_CUSTOM_RULES})`);
    return null;
  }
  const newRule = createCustomRule(rule);
  rules.push(newRule);
  saveCustomRules(rules);
  return newRule;
}

export function updateCustomRule(id: string, updates: Partial<CustomAuditRule>): boolean {
  const rules = loadCustomRules();
  const index = rules.findIndex(r => r.id === id);
  if (index === -1) return false;
  rules[index] = { ...rules[index], ...updates };
  saveCustomRules(rules);
  return true;
}

export function deleteCustomRule(id: string): boolean {
  const rules = loadCustomRules();
  const filtered = rules.filter(r => r.id !== id);
  if (filtered.length === rules.length) return false;
  saveCustomRules(filtered);
  return true;
}

export function loadSnapshots(): ComparisonSnapshot[] {
  try {
    const saved = localStorage.getItem(SNAPSHOT_STORAGE_KEY);
    if (!saved) return [];
    const snapshots = JSON.parse(saved) as ComparisonSnapshot[];
    return Array.isArray(snapshots) ? snapshots : [];
  } catch (e) {
    console.warn('加载对比快照失败:', e);
    return [];
  }
}

export function saveSnapshots(snapshots: ComparisonSnapshot[]): void {
  try {
    localStorage.setItem(SNAPSHOT_STORAGE_KEY, JSON.stringify(snapshots));
  } catch (e) {
    console.warn('保存对比快照失败:', e);
  }
}

export function createSnapshot(
  data: Omit<ComparisonSnapshot, 'id' | 'createdAt'>
): ComparisonSnapshot {
  return {
    ...data,
    id: `snap_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
  };
}

export function addSnapshot(
  data: Omit<ComparisonSnapshot, 'id' | 'createdAt'>
): ComparisonSnapshot | null {
  const snapshots = loadSnapshots();
  if (snapshots.length >= MAX_SNAPSHOTS) {
    snapshots.pop();
  }
  const snapshot = createSnapshot(data);
  snapshots.unshift(snapshot);
  saveSnapshots(snapshots);
  return snapshot;
}

export function deleteSnapshot(id: string): boolean {
  const snapshots = loadSnapshots();
  const filtered = snapshots.filter(s => s.id !== id);
  if (filtered.length === snapshots.length) return false;
  saveSnapshots(filtered);
  return true;
}

export function updateSnapshot(id: string, updates: Partial<ComparisonSnapshot>): boolean {
  const snapshots = loadSnapshots();
  const index = snapshots.findIndex(s => s.id === id);
  if (index === -1) return false;
  snapshots[index] = { ...snapshots[index], ...updates };
  saveSnapshots(snapshots);
  return true;
}

export function loadArchiveRecords(): ArchiveRecord[] {
  try {
    const saved = localStorage.getItem(ARCHIVE_STORAGE_KEY);
    if (!saved) return [];
    const records = JSON.parse(saved) as ArchiveRecord[];
    return Array.isArray(records) ? records : [];
  } catch (e) {
    console.warn('加载归档记录失败:', e);
    return [];
  }
}

export function saveArchiveRecords(records: ArchiveRecord[]): void {
  try {
    localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.warn('保存归档记录失败:', e);
  }
}

export function createArchiveRecord(
  data: Omit<ArchiveRecord, 'id' | 'createdAt'>
): ArchiveRecord {
  return {
    ...data,
    id: `arch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    createdAt: Date.now(),
  };
}

export function addArchiveRecord(
  data: Omit<ArchiveRecord, 'id' | 'createdAt'>
): ArchiveRecord | null {
  const records = loadArchiveRecords();
  if (records.length >= MAX_ARCHIVE_RECORDS) {
    records.pop();
  }
  const record = createArchiveRecord(data);
  records.unshift(record);
  saveArchiveRecords(records);
  return record;
}

export function deleteArchiveRecord(id: string): boolean {
  const records = loadArchiveRecords();
  const filtered = records.filter(r => r.id !== id);
  if (filtered.length === records.length) return false;
  saveArchiveRecords(filtered);
  return true;
}

export function getArchiveStats(): ArchiveStats {
  const records = loadArchiveRecords();
  const stats: ArchiveStats = {
    totalRecords: records.length,
    comparisonCount: 0,
    auditCount: 0,
    exportCount: 0,
    snapshotCount: 0,
    totalSchemes: 0,
  };

  const schemeSet = new Set<string>();
  for (const record of records) {
    switch (record.type) {
      case 'comparison':
        stats.comparisonCount++;
        break;
      case 'audit':
        stats.auditCount++;
        break;
      case 'export':
        stats.exportCount++;
        break;
      case 'snapshot':
        stats.snapshotCount++;
        break;
    }
    record.schemeNames.forEach(name => schemeSet.add(name));
  }
  stats.totalSchemes = schemeSet.size;

  return stats;
}

export function generateReportWithTemplate(
  schemes: SavedScheme[],
  comparison: ComparisonResult,
  audit: AuditResult,
  template: ReportTemplateConfig,
  format: 'json' | 'csv' | 'txt'
): string {
  switch (format) {
    case 'json':
      return generateReportJsonWithTemplate(schemes, comparison, audit, template);
    case 'csv':
      return generateReportCsvWithTemplate(schemes, comparison, audit, template);
    case 'txt':
    default:
      return generateReportTxtWithTemplate(schemes, comparison, audit, template);
  }
}

function generateReportJsonWithTemplate(
  schemes: SavedScheme[],
  comparison: ComparisonResult,
  audit: AuditResult,
  template: ReportTemplateConfig
): string {
  const report: Record<string, any> = {
    title: '版式对比与审校报告',
    template: template.name,
    generatedAt: new Date().toISOString(),
    generatedAtLocal: new Date().toLocaleString('zh-CN'),
    schemeCount: schemes.length,
  };

  if (template.includeSummary) {
    report.summary = {
      comparison: comparison.summary,
      audit: audit.summary,
    };
  }

  if (template.includeConclusions) {
    report.conclusions = audit.conclusions;
  }

  if (template.includeDiffItems && template.includeDetails) {
    report.differences = comparison.diffItems.filter(d => d.hasDiff).map(d => ({
      key: d.key,
      label: d.label,
      category: DIFF_CATEGORY_LABELS[d.category] || d.category,
      values: d.values,
      severity: d.severity,
    }));
  }

  if (template.includeIssues && template.includeDetails) {
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

  if (template.includeSchemes) {
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

function generateReportCsvWithTemplate(
  schemes: SavedScheme[],
  comparison: ComparisonResult,
  audit: AuditResult,
  template: ReportTemplateConfig
): string {
  const lines: string[] = [];

  lines.push(`报告模板: ${template.name}`);
  lines.push(`生成时间: ${new Date().toLocaleString('zh-CN')}`);
  lines.push('');

  if (template.includeSchemes) {
    lines.push('【方案详情】');
    const schemeHeaders = [
      '序号', '方案名称', '创建时间', '更新时间',
      '纸张宽度(mm)', '纸张高度(mm)',
      '上边距(mm)', '下边距(mm)', '左边距(mm)', '右边距(mm)',
      '栏数', '行数',
      '栏线粗细(mm)', '栏线颜色',
      '鱼尾样式',
      '批注区位置', '批注区宽度(mm)',
    ];
    lines.push(schemeHeaders.join(','));

    for (let i = 0; i < schemes.length; i++) {
      const s = schemes[i];
      const line = [
        String(i + 1),
        `"${s.name.replace(/"/g, '""')}"`,
        `"${new Date(s.createdAt).toLocaleString('zh-CN')}"`,
        `"${new Date(s.updatedAt).toLocaleString('zh-CN')}"`,
        String(s.params.paperWidth),
        String(s.params.paperHeight),
        String(s.params.marginTop),
        String(s.params.marginBottom),
        String(s.params.marginLeft),
        String(s.params.marginRight),
        String(s.params.columnCount),
        String(s.params.rowCount),
        String(s.params.lineThickness),
        s.params.lineColor,
        `"${fishtailLabelMap[s.params.fishtailStyle] || s.params.fishtailStyle}"`,
        `"${annotationPositionLabelMap[s.params.annotationPosition] || s.params.annotationPosition}"`,
        String(s.params.annotationWidth),
      ];
      lines.push(line.join(','));
    }
    lines.push('');
  }

  if (template.includeDiffItems && template.includeDetails) {
    lines.push('【参数对比差异】');
    const diffHeaders = ['分类', '参数项', ...comparison.schemes.map(s => s.schemeName.replace(/"/g, '""'))];
    lines.push(diffHeaders.map(h => `"${h}"`).join(','));

    for (const item of comparison.diffItems) {
      if (item.hasDiff) {
        const line = [
          `"${DIFF_CATEGORY_LABELS[item.category]}"`,
          `"${item.label}"`,
          ...item.values.map(v => `"${v.replace(/"/g, '""')}"`),
        ];
        lines.push(line.join(','));
      }
    }
    lines.push('');
  }

  if (template.includeIssues && template.includeDetails) {
    lines.push('【审校问题】');
    const auditHeaders = ['方案名称', '问题类型', '严重程度', '分类', '字段', '值', '问题描述', '建议'];
    lines.push(auditHeaders.join(','));

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
    lines.push('');
  }

  if (template.includeConclusions) {
    lines.push('【审校结论】');
    for (const conclusion of audit.conclusions) {
      lines.push(`"${conclusion.replace(/"/g, '""')}"`);
    }
  }

  return '\uFEFF' + lines.join('\n');
}

function generateReportTxtWithTemplate(
  schemes: SavedScheme[],
  comparison: ComparisonResult,
  audit: AuditResult,
  template: ReportTemplateConfig
): string {
  const lines: string[] = [];

  lines.push('='.repeat(60));
  lines.push('古籍朱丝栏版式 - 对比与审校报告');
  lines.push(`模板: ${template.name}`);
  lines.push('='.repeat(60));
  lines.push(`生成时间: ${new Date().toLocaleString('zh-CN')}`);
  lines.push(`方案数量: ${schemes.length} 套`);
  lines.push('');

  if (template.includeSummary) {
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
  }

  if (template.includeConclusions) {
    lines.push('【审校结论】');
    lines.push('-'.repeat(40));
    for (const conclusion of audit.conclusions) {
      lines.push(`  • ${conclusion}`);
    }
    lines.push('');
  }

  if (template.includeSchemes) {
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
  }

  if (template.includeDiffItems && template.includeDetails) {
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
  }

  if (template.includeIssues && template.includeDetails) {
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
  }

  lines.push('');
  lines.push('='.repeat(60));
  lines.push('报告结束');
  lines.push('='.repeat(60));

  return lines.join('\n');
}

export function exportReportWithTemplate(
  schemes: SavedScheme[],
  comparison: ComparisonResult,
  audit: AuditResult,
  template: ReportTemplateConfig,
  format: 'json' | 'csv' | 'txt',
  name?: string
): void {
  const content = generateReportWithTemplate(schemes, comparison, audit, template, format);

  const mimeTypeMap: Record<string, string> = {
    json: 'application/json;charset=utf-8',
    csv: 'text/csv;charset=utf-8',
    txt: 'text/plain;charset=utf-8',
  };

  const mimeType = mimeTypeMap[format] || 'text/plain;charset=utf-8';
  const fileName = name || `版式审校报告_${template.name}_${new Date().toLocaleString('zh-CN').replace(/[/:]/g, '-')}`;

  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName.replace(/[\\/:*?"<>|]/g, '_')}.${format}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function loadGroups(): SchemeGroup[] {
  try {
    const saved = localStorage.getItem(GROUP_STORAGE_KEY);
    if (!saved) return [];
    const groups = JSON.parse(saved) as SchemeGroup[];
    return Array.isArray(groups) ? groups : [];
  } catch (e) {
    console.warn('加载方案分组失败:', e);
    return [];
  }
}

export function saveGroups(groups: SchemeGroup[]): void {
  try {
    localStorage.setItem(GROUP_STORAGE_KEY, JSON.stringify(groups));
  } catch (e) {
    console.warn('保存方案分组失败:', e);
  }
}

export function addGroup(name: string, description?: string, color?: string): SchemeGroup | null {
  const groups = loadGroups();
  if (groups.length >= MAX_GROUPS) {
    console.warn(`分组数量已达上限 (${MAX_GROUPS})`);
    return null;
  }
  const group: SchemeGroup = {
    id: `grp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    name,
    description,
    schemeIds: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    color,
  };
  groups.unshift(group);
  saveGroups(groups);
  return group;
}

export function updateGroup(id: string, updates: Partial<SchemeGroup>): boolean {
  const groups = loadGroups();
  const index = groups.findIndex(g => g.id === id);
  if (index === -1) return false;
  groups[index] = { ...groups[index], ...updates, updatedAt: Date.now() };
  saveGroups(groups);
  return true;
}

export function deleteGroup(id: string): boolean {
  const groups = loadGroups();
  const filtered = groups.filter(g => g.id !== id);
  if (filtered.length === groups.length) return false;
  saveGroups(filtered);
  return true;
}

export function addSchemeToGroup(groupId: string, schemeId: string): boolean {
  const groups = loadGroups();
  const group = groups.find(g => g.id === groupId);
  if (!group) return false;
  if (group.schemeIds.includes(schemeId)) return false;
  group.schemeIds.push(schemeId);
  group.updatedAt = Date.now();
  saveGroups(groups);
  return true;
}

export function removeSchemeFromGroup(groupId: string, schemeId: string): boolean {
  const groups = loadGroups();
  const group = groups.find(g => g.id === groupId);
  if (!group) return false;
  const idx = group.schemeIds.indexOf(schemeId);
  if (idx === -1) return false;
  group.schemeIds.splice(idx, 1);
  group.updatedAt = Date.now();
  saveGroups(groups);
  return true;
}

export function loadIssueTrackings(): IssueTracking[] {
  try {
    const saved = localStorage.getItem(ISSUE_TRACKING_STORAGE_KEY);
    if (!saved) return [];
    const trackings = JSON.parse(saved) as IssueTracking[];
    return Array.isArray(trackings) ? trackings : [];
  } catch (e) {
    console.warn('加载问题追踪失败:', e);
    return [];
  }
}

export function saveIssueTrackings(trackings: IssueTracking[]): void {
  try {
    localStorage.setItem(ISSUE_TRACKING_STORAGE_KEY, JSON.stringify(trackings));
  } catch (e) {
    console.warn('保存问题追踪失败:', e);
  }
}

export function updateIssueTracking(issueId: string, status: IssueStatus, note?: string): IssueTracking | null {
  const trackings = loadIssueTrackings();
  const existing = trackings.find(t => t.issueId === issueId);
  if (existing) {
    existing.status = status;
    if (note !== undefined) existing.note = note;
    if (status === 'resolved') existing.resolvedAt = Date.now();
    saveIssueTrackings(trackings);
    return existing;
  }
  const tracking: IssueTracking = {
    issueId,
    status,
    note,
    resolvedAt: status === 'resolved' ? Date.now() : undefined,
  };
  trackings.push(tracking);
  saveIssueTrackings(trackings);
  return tracking;
}

export function getIssueTracking(issueId: string): IssueTracking | null {
  const trackings = loadIssueTrackings();
  return trackings.find(t => t.issueId === issueId) || null;
}

export function loadSchemeReviews(): SchemeReview[] {
  try {
    const saved = localStorage.getItem(SCHEME_REVIEW_STORAGE_KEY);
    if (!saved) return [];
    const reviews = JSON.parse(saved) as SchemeReview[];
    return Array.isArray(reviews) ? reviews : [];
  } catch (e) {
    console.warn('加载方案审核状态失败:', e);
    return [];
  }
}

export function saveSchemeReviews(reviews: SchemeReview[]): void {
  try {
    localStorage.setItem(SCHEME_REVIEW_STORAGE_KEY, JSON.stringify(reviews));
  } catch (e) {
    console.warn('保存方案审核状态失败:', e);
  }
}

export function updateSchemeReview(schemeId: string, status: SchemeReviewStatus, reviewer?: string, comment?: string): SchemeReview | null {
  const reviews = loadSchemeReviews();
  const existing = reviews.find(r => r.schemeId === schemeId);
  if (existing) {
    existing.status = status;
    if (reviewer !== undefined) existing.reviewer = reviewer;
    if (comment !== undefined) existing.comment = comment;
    existing.reviewedAt = Date.now();
    saveSchemeReviews(reviews);
    return existing;
  }
  const review: SchemeReview = {
    schemeId,
    status,
    reviewer,
    comment,
    reviewedAt: Date.now(),
  };
  reviews.push(review);
  saveSchemeReviews(reviews);
  return review;
}

export function getSchemeReview(schemeId: string): SchemeReview | null {
  const reviews = loadSchemeReviews();
  return reviews.find(r => r.schemeId === schemeId) || null;
}

export function filterArchiveRecords(records: ArchiveRecord[], filter: ArchiveFilter): ArchiveRecord[] {
  let filtered = [...records];

  if (filter.type !== 'all') {
    filtered = filtered.filter(r => r.type === filter.type);
  }

  if (filter.searchQuery.trim()) {
    const query = filter.searchQuery.toLowerCase();
    filtered = filtered.filter(r =>
      r.name.toLowerCase().includes(query) ||
      (r.description && r.description.toLowerCase().includes(query)) ||
      r.schemeNames.some(name => name.toLowerCase().includes(query))
    );
  }

  if (filter.dateRange.start !== null) {
    filtered = filtered.filter(r => r.createdAt >= filter.dateRange.start!);
  }

  if (filter.dateRange.end !== null) {
    filtered = filtered.filter(r => r.createdAt <= filter.dateRange.end!);
  }

  return filtered;
}
