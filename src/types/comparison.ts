import type { LayoutParams, LayoutStats, SavedScheme } from './layout';

export type DiffSeverity = 'info' | 'warning' | 'error' | 'success';

export type DiffCategory =
  | 'paper'
  | 'print'
  | 'margin'
  | 'grid'
  | 'line'
  | 'fishtail'
  | 'annotation'
  | 'area';

export interface DiffItem {
  key: string;
  label: string;
  category: DiffCategory;
  values: string[];
  hasDiff: boolean;
  severity: DiffSeverity;
  description?: string;
}

export interface SchemeCompareInfo {
  schemeId: string;
  schemeName: string;
  params: LayoutParams;
  stats: LayoutStats;
}

export interface ComparisonResult {
  schemes: SchemeCompareInfo[];
  diffItems: DiffItem[];
  summary: ComparisonSummary;
}

export interface ComparisonSummary {
  totalSchemes: number;
  diffCount: number;
  errorCount: number;
  warningCount: number;
  identicalCount: number;
}

export type AuditIssueType =
  | 'param_conflict'
  | 'abnormal_ratio'
  | 'over_limit'
  | 'anomaly'
  | 'best_practice';

export interface AuditIssue {
  id: string;
  type: AuditIssueType;
  severity: DiffSeverity;
  schemeId: string;
  schemeName: string;
  category: DiffCategory;
  field: string;
  fieldLabel: string;
  value: string;
  message: string;
  suggestion?: string;
}

export interface AuditResult {
  issues: AuditIssue[];
  summary: AuditSummary;
  conclusions: string[];
}

export interface AuditSummary {
  totalSchemes: number;
  totalIssues: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  passCount: number;
}

export type ExportReportFormat = 'json' | 'csv' | 'txt';

export interface ReportExportOptions {
  format: ExportReportFormat;
  includeDetails?: boolean;
  includeSchemes?: boolean;
  name?: string;
}

export const DIFF_CATEGORY_LABELS: Record<DiffCategory, string> = {
  paper: '纸张',
  print: '版心',
  margin: '边距',
  grid: '栏行',
  line: '栏线',
  fishtail: '鱼尾',
  annotation: '批注区',
  area: '面积统计',
};

export const AUDIT_ISSUE_TYPE_LABELS: Record<AuditIssueType, string> = {
  param_conflict: '参数冲突',
  abnormal_ratio: '异常比例',
  over_limit: '超限项',
  anomaly: '异常项',
  best_practice: '最佳实践',
};

export const MAX_COMPARE_SCHEMES = 6;
export const COMPARISON_STORAGE_KEY = 'zhusilan_comparison';
