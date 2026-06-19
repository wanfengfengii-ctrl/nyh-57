export type FishtailType = 'none' | 'single' | 'double' | 'triple' | 'flowery';

export type AnnotationPosition = 'none' | 'left' | 'right' | 'both';

export type MarginLinkMode = 'none' | 'link-all' | 'link-vertical' | 'link-horizontal' | 'symmetrical';

export interface LayoutParams {
  paperWidth: number;
  paperHeight: number;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  columnCount: number;
  rowCount: number;
  lineThickness: number;
  lineColor: string;
  fishtailStyle: FishtailType;
  annotationWidth: number;
  annotationPosition: AnnotationPosition;
}

export interface PaperPreset {
  id: string;
  label: string;
  paperWidth: number;
  paperHeight: number;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  columnCount: number;
  rowCount: number;
  description?: string;
}

export interface LayoutStats {
  paperArea: number;
  printArea: number;
  writingArea: number;
  annotationArea: number;
  lineArea: number;
  annotationRatio: number;
  lineRatio: number;
  writingRatio: number;
  printWidth: number;
  printHeight: number;
  columnWidth: number;
  rowHeight: number;
  areaSumCheck: {
    sum: number;
    diff: number;
    isMatch: boolean;
  };
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface LayoutExport {
  version: string;
  name: string;
  createdAt: string;
  params: LayoutParams;
}

export interface SavedScheme {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  params: LayoutParams;
}

export interface HistoryRecord {
  id: string;
  timestamp: number;
  params: LayoutParams;
  action: 'create' | 'update' | 'import' | 'reset' | 'preset';
  description?: string;
}

export type ExportFormat = 'json' | 'svg' | 'png';

export interface ExportOptions {
  format: ExportFormat;
  name?: string;
  dpi?: number;
  includeDimensions?: boolean;
}

export const FISHTAIL_OPTIONS: { label: string; value: FishtailType }[] = [
  { label: '无鱼尾', value: 'none' },
  { label: '单鱼尾', value: 'single' },
  { label: '双鱼尾', value: 'double' },
  { label: '三鱼尾', value: 'triple' },
  { label: '花鱼尾', value: 'flowery' },
];

export const ANNOTATION_POSITION_OPTIONS: { label: string; value: AnnotationPosition }[] = [
  { label: '无批注区', value: 'none' },
  { label: '左侧', value: 'left' },
  { label: '右侧', value: 'right' },
  { label: '双侧', value: 'both' },
];

export const MARGIN_LINK_MODES: { label: string; value: MarginLinkMode }[] = [
  { label: '独立设置', value: 'none' },
  { label: '四边联动', value: 'link-all' },
  { label: '上下联动', value: 'link-vertical' },
  { label: '左右联动', value: 'link-horizontal' },
  { label: '上下对称+左右对称', value: 'symmetrical' },
];

export const PAPER_PRESETS: PaperPreset[] = [
  {
    id: 'a4',
    label: 'A4 (210×297mm)',
    paperWidth: 210,
    paperHeight: 297,
    marginTop: 25,
    marginBottom: 25,
    marginLeft: 25,
    marginRight: 25,
    columnCount: 9,
    rowCount: 20,
    description: '标准A4纸张，现代办公常用尺寸',
  },
  {
    id: 'a5',
    label: 'A5 (148×210mm)',
    paperWidth: 148,
    paperHeight: 210,
    marginTop: 18,
    marginBottom: 18,
    marginLeft: 18,
    marginRight: 18,
    columnCount: 7,
    rowCount: 16,
    description: '标准A5纸张，小型书籍开本',
  },
  {
    id: 'b5',
    label: 'B5 (176×250mm)',
    paperWidth: 176,
    paperHeight: 250,
    marginTop: 22,
    marginBottom: 22,
    marginLeft: 22,
    marginRight: 22,
    columnCount: 8,
    rowCount: 18,
    description: '标准B5纸张，中型书籍常用',
  },
  {
    id: '16kai',
    label: '16开 (185×260mm)',
    paperWidth: 185,
    paperHeight: 260,
    marginTop: 24,
    marginBottom: 24,
    marginLeft: 20,
    marginRight: 20,
    columnCount: 9,
    rowCount: 19,
    description: '传统16开，国内书籍常用开本',
  },
  {
    id: '32kai',
    label: '32开 (130×185mm)',
    paperWidth: 130,
    paperHeight: 185,
    marginTop: 16,
    marginBottom: 16,
    marginLeft: 14,
    marginRight: 14,
    columnCount: 6,
    rowCount: 14,
    description: '传统32开，小型便携开本',
  },
  {
    id: 'guji-large',
    label: '古籍大本 (200×300mm)',
    paperWidth: 200,
    paperHeight: 300,
    marginTop: 30,
    marginBottom: 30,
    marginLeft: 28,
    marginRight: 28,
    columnCount: 10,
    rowCount: 22,
    description: '仿宋代浙本风格，大型刻本尺寸',
  },
  {
    id: 'guji-small',
    label: '古籍小本 (150×220mm)',
    paperWidth: 150,
    paperHeight: 220,
    marginTop: 22,
    marginBottom: 22,
    marginLeft: 20,
    marginRight: 20,
    columnCount: 7,
    rowCount: 16,
    description: '仿明代巾箱本风格，小型便携',
  },
  {
    id: 'guji-wuying',
    label: '武英殿版 (190×285mm)',
    paperWidth: 190,
    paperHeight: 285,
    marginTop: 35,
    marginBottom: 25,
    marginLeft: 25,
    marginRight: 25,
    columnCount: 9,
    rowCount: 20,
    description: '清代武英殿刻本风格，天头宽大',
  },
  {
    id: 'jinling',
    label: '金陵本 (185×275mm)',
    paperWidth: 185,
    paperHeight: 275,
    marginTop: 28,
    marginBottom: 22,
    marginLeft: 22,
    marginRight: 22,
    columnCount: 9,
    rowCount: 19,
    description: '明代金陵刻本，版框紧凑',
  },
  {
    id: 'custom',
    label: '自定义',
    paperWidth: 210,
    paperHeight: 297,
    marginTop: 25,
    marginBottom: 25,
    marginLeft: 25,
    marginRight: 25,
    columnCount: 9,
    rowCount: 20,
    description: '自定义纸张参数',
  },
];

export const DEFAULT_PARAMS: LayoutParams = {
  paperWidth: 210,
  paperHeight: 297,
  marginTop: 25,
  marginBottom: 25,
  marginLeft: 25,
  marginRight: 25,
  columnCount: 9,
  rowCount: 20,
  lineThickness: 0.3,
  lineColor: '#C41E3A',
  fishtailStyle: 'single',
  annotationWidth: 20,
  annotationPosition: 'right',
};

export const EXPORT_VERSION = '1.1.0';
export const STORAGE_KEY = 'zhusilan_layout_params';
export const SCHEMES_STORAGE_KEY = 'zhusilan_saved_schemes';
export const HISTORY_STORAGE_KEY = 'zhusilan_history';
export const MAX_HISTORY_RECORDS = 50;
export const MAX_SAVED_SCHEMES = 100;
