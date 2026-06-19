export type FishtailType = 'none' | 'single' | 'double' | 'triple' | 'flowery';

export type AnnotationPosition = 'left' | 'right' | 'both';

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
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface LayoutExport {
  version: string;
  name: string;
  createdAt: string;
  params: LayoutParams;
}

export const FISHTAIL_OPTIONS: { label: string; value: FishtailType }[] = [
  { label: '无鱼尾', value: 'none' },
  { label: '单鱼尾', value: 'single' },
  { label: '双鱼尾', value: 'double' },
  { label: '三鱼尾', value: 'triple' },
  { label: '花鱼尾', value: 'flowery' },
];

export const ANNOTATION_POSITION_OPTIONS: { label: string; value: AnnotationPosition }[] = [
  { label: '左侧', value: 'left' },
  { label: '右侧', value: 'right' },
  { label: '双侧', value: 'both' },
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

export const EXPORT_VERSION = '1.0.0';
