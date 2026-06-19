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

export type SortField = 'label' | 'category' | 'severity' | 'hasDiff';
export type SortOrder = 'asc' | 'desc';

export interface SortConfig {
  field: SortField;
  order: SortOrder;
}

export type ReportTemplate = 'standard' | 'detailed' | 'brief' | 'custom';

export interface ReportTemplateConfig {
  id: ReportTemplate;
  name: string;
  description: string;
  includeSummary: boolean;
  includeDetails: boolean;
  includeSchemes: boolean;
  includeConclusions: boolean;
  includeIssues: boolean;
  includeDiffItems: boolean;
}

export type CustomRuleOperator = 'gt' | 'lt' | 'eq' | 'neq' | 'gte' | 'lte' | 'between';

export type CustomRuleField =
  | 'paperWidth'
  | 'paperHeight'
  | 'marginTop'
  | 'marginBottom'
  | 'marginLeft'
  | 'marginRight'
  | 'columnCount'
  | 'rowCount'
  | 'lineThickness'
  | 'annotationWidth'
  | 'writingRatio'
  | 'annotationRatio'
  | 'lineRatio'
  | 'printArea'
  | 'paperArea';

export interface CustomAuditRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  field: CustomRuleField;
  operator: CustomRuleOperator;
  value: number;
  value2?: number;
  severity: DiffSeverity;
  category: DiffCategory;
  suggestion?: string;
}

export interface ComparisonSnapshot {
  id: string;
  name: string;
  createdAt: number;
  description?: string;
  selectedSchemeIds: string[];
  filterCategory: DiffCategory | 'all';
  showOnlyDiffs: boolean;
  auditFilter: 'all' | 'error' | 'warning' | 'info';
  sortConfig: SortConfig;
  severityFilter: DiffSeverity[];
  customRules?: CustomAuditRule[];
}

export type ArchiveItemType = 'comparison' | 'audit' | 'export' | 'snapshot';

export interface ArchiveRecord {
  id: string;
  name: string;
  type: ArchiveItemType;
  createdAt: number;
  description?: string;
  schemeCount: number;
  schemeNames: string[];
  data: Record<string, any>;
  tags?: string[];
}

export interface ArchiveStats {
  totalRecords: number;
  comparisonCount: number;
  auditCount: number;
  exportCount: number;
  snapshotCount: number;
  totalSchemes: number;
}

export interface AuditIssueNavigation {
  issueId: string;
  schemeId: string;
  field: string;
  category: DiffCategory;
}

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
export const SNAPSHOT_STORAGE_KEY = 'zhusilan_comparison_snapshots';
export const ARCHIVE_STORAGE_KEY = 'zhusilan_archive_records';
export const CUSTOM_RULES_STORAGE_KEY = 'zhusilan_custom_audit_rules';

export const MAX_SNAPSHOTS = 20;
export const MAX_ARCHIVE_RECORDS = 50;
export const MAX_CUSTOM_RULES = 20;

export const SORT_FIELD_LABELS: Record<SortField, string> = {
  label: '参数名称',
  category: '分类',
  severity: '严重程度',
  hasDiff: '差异状态',
};

export const SORT_ORDER_LABELS: Record<SortOrder, string> = {
  asc: '升序',
  desc: '降序',
};

export const SEVERITY_ORDER: Record<DiffSeverity, number> = {
  error: 3,
  warning: 2,
  info: 1,
  success: 0,
};

export const REPORT_TEMPLATES: ReportTemplateConfig[] = [
  {
    id: 'standard',
    name: '标准模板',
    description: '包含摘要、差异项和审校问题，适合日常使用',
    includeSummary: true,
    includeDetails: true,
    includeSchemes: false,
    includeConclusions: true,
    includeIssues: true,
    includeDiffItems: true,
  },
  {
    id: 'detailed',
    name: '详细模板',
    description: '包含完整的方案详情、所有差异项和审校问题',
    includeSummary: true,
    includeDetails: true,
    includeSchemes: true,
    includeConclusions: true,
    includeIssues: true,
    includeDiffItems: true,
  },
  {
    id: 'brief',
    name: '精简模板',
    description: '仅包含统计摘要和结论，适合快速预览',
    includeSummary: true,
    includeDetails: false,
    includeSchemes: false,
    includeConclusions: true,
    includeIssues: false,
    includeDiffItems: false,
  },
  {
    id: 'custom',
    name: '自定义模板',
    description: '根据需要选择包含的内容',
    includeSummary: true,
    includeDetails: true,
    includeSchemes: true,
    includeConclusions: true,
    includeIssues: true,
    includeDiffItems: true,
  },
];

export const CUSTOM_RULE_FIELD_LABELS: Record<CustomRuleField, string> = {
  paperWidth: '纸张宽度',
  paperHeight: '纸张高度',
  marginTop: '上边距',
  marginBottom: '下边距',
  marginLeft: '左边距',
  marginRight: '右边距',
  columnCount: '栏数',
  rowCount: '行数',
  lineThickness: '栏线粗细',
  annotationWidth: '批注区宽度',
  writingRatio: '书写占比',
  annotationRatio: '批注占比',
  lineRatio: '栏线占比',
  printArea: '版心面积',
  paperArea: '纸张面积',
};

export const CUSTOM_RULE_OPERATOR_LABELS: Record<CustomRuleOperator, string> = {
  gt: '大于',
  lt: '小于',
  eq: '等于',
  neq: '不等于',
  gte: '大于等于',
  lte: '小于等于',
  between: '介于之间',
};

export type IssueStatus = 'open' | 'resolved' | 'ignored';

export interface IssueTracking {
  issueId: string;
  status: IssueStatus;
  resolvedAt?: number;
  resolvedBy?: string;
  note?: string;
}

export type SchemeReviewStatus = 'pending' | 'approved' | 'rejected' | 'in_review';

export interface SchemeReview {
  schemeId: string;
  status: SchemeReviewStatus;
  reviewer?: string;
  reviewedAt?: number;
  comment?: string;
}

export interface SchemeGroup {
  id: string;
  name: string;
  description?: string;
  schemeIds: string[];
  createdAt: number;
  updatedAt: number;
  color?: string;
}

export interface ArchiveFilter {
  type: ArchiveItemType | 'all';
  searchQuery: string;
  dateRange: { start: number | null; end: number | null };
}

export const GROUP_STORAGE_KEY = 'zhusilan_scheme_groups';
export const ISSUE_TRACKING_STORAGE_KEY = 'zhusilan_issue_tracking';
export const SCHEME_REVIEW_STORAGE_KEY = 'zhusilan_scheme_review';
export const MAX_GROUPS = 20;

export const ISSUE_STATUS_LABELS: Record<IssueStatus, string> = {
  open: '待处理',
  resolved: '已解决',
  ignored: '已忽略',
};

export const SCHEME_REVIEW_STATUS_LABELS: Record<SchemeReviewStatus, string> = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已驳回',
  in_review: '审核中',
};

export const SCHEME_REVIEW_STATUS_COLORS: Record<SchemeReviewStatus, string> = {
  pending: '#8B7355',
  approved: '#18a058',
  rejected: '#d03050',
  in_review: '#2080f0',
};

export const GROUP_COLORS = [
  '#C41E3A', '#2080F0', '#18a058', '#D48806', '#8B4513',
  '#6B4C9A', '#2E624A', '#2E4A62', '#B8860B', '#556B2F',
];

export const ARCHIVE_TYPE_LABELS: Record<ArchiveItemType, string> = {
  comparison: '对比结果',
  audit: '审校报告',
  export: '导出记录',
  snapshot: '对比快照',
};
