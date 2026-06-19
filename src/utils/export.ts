import type {
  LayoutParams,
  LayoutExport,
  ValidationResult,
  FishtailType,
  SavedScheme,
  HistoryRecord,
  ExportOptions,
  ExportFormat,
} from '../types/layout';
import {
  EXPORT_VERSION,
  DEFAULT_PARAMS,
  STORAGE_KEY,
  SCHEMES_STORAGE_KEY,
  HISTORY_STORAGE_KEY,
  MAX_HISTORY_RECORDS,
  MAX_SAVED_SCHEMES,
} from '../types/layout';
import { validateLayoutParams } from './validation';
import { mmToPx } from './calculation';

export { STORAGE_KEY, SCHEMES_STORAGE_KEY, HISTORY_STORAGE_KEY };

export function exportLayout(params: LayoutParams, name?: string): LayoutExport {
  const exportData: LayoutExport = {
    version: EXPORT_VERSION,
    name: name || `版式方案_${new Date().toLocaleString('zh-CN')}`,
    createdAt: new Date().toISOString(),
    params: { ...params },
  };
  return exportData;
}

export function exportToJsonFile(params: LayoutParams, name?: string): void {
  const exportData = exportLayout(params, name);
  const jsonStr = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${exportData.name.replace(/[\\/:*?"<>|]/g, '_')}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function importLayout(jsonStr: string): { result: ValidationResult; params?: LayoutParams; name?: string; createdAt?: string } {
  try {
    const data: LayoutExport = JSON.parse(jsonStr);

    if (!data.version || !data.params) {
      return {
        result: {
          valid: false,
          errors: ['文件格式不正确，缺少必要字段 version 或 params'],
        },
      };
    }

    const requiredKeys: (keyof LayoutParams)[] = [
      'paperWidth', 'paperHeight',
      'marginTop', 'marginBottom', 'marginLeft', 'marginRight',
      'columnCount', 'rowCount',
      'lineThickness', 'lineColor',
      'fishtailStyle',
      'annotationWidth', 'annotationPosition',
    ];

    for (const key of requiredKeys) {
      if (data.params[key] === undefined || data.params[key] === null) {
        return {
          result: {
            valid: false,
            errors: [`缺少参数：${key}`],
          },
        };
      }
    }

    const mergedParams: LayoutParams = {
      ...DEFAULT_PARAMS,
      ...data.params,
    };

    const validation = validateLayoutParams(mergedParams);
    if (!validation.valid) {
      return { result: validation };
    }

    return {
      result: { valid: true, errors: [] },
      params: mergedParams,
      name: data.name,
      createdAt: data.createdAt,
    };
  } catch (e) {
    return {
      result: {
        valid: false,
        errors: ['JSON 解析失败，请检查文件格式是否正确'],
      },
    };
  }
}

export function importFromFile(file: File): Promise<{ result: ValidationResult; params?: LayoutParams; name?: string; createdAt?: string }> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      resolve(importLayout(content));
    };
    reader.onerror = () => {
      resolve({
        result: {
          valid: false,
          errors: ['文件读取失败，请重试'],
        },
      });
    };
    reader.readAsText(file);
  });
}

function getFishtailPath(style: FishtailType, x: number, y: number, size: number): string {
  const h = size;
  const w = size * 0.8;

  switch (style) {
    case 'single':
      return `M ${x - w / 2} ${y}
              Q ${x - w / 2} ${y - h / 2} ${x} ${y - h}
              Q ${x + w / 2} ${y - h / 2} ${x + w / 2} ${y}
              Q ${x + w / 2} ${y + h / 2} ${x} ${y + h}
              Q ${x - w / 2} ${y + h / 2} ${x - w / 2} ${y}
              M ${x - w / 3} ${y}
              L ${x + w / 3} ${y}`;
    case 'double':
      return `M ${x - w / 2} ${y}
              Q ${x - w / 2} ${y - h / 2} ${x} ${y - h}
              Q ${x + w / 2} ${y - h / 2} ${x + w / 2} ${y}
              Q ${x + w / 2} ${y + h / 2} ${x} ${y + h}
              Q ${x - w / 2} ${y + h / 2} ${x - w / 2} ${y}
              M ${x - w / 3} ${y - h / 3}
              L ${x + w / 3} ${y - h / 3}
              M ${x - w / 3} ${y + h / 3}
              L ${x + w / 3} ${y + h / 3}`;
    case 'triple':
      return `M ${x - w / 2} ${y}
              Q ${x - w / 2} ${y - h / 2} ${x} ${y - h}
              Q ${x + w / 2} ${y - h / 2} ${x + w / 2} ${y}
              Q ${x + w / 2} ${y + h / 2} ${x} ${y + h}
              Q ${x - w / 2} ${y + h / 2} ${x - w / 2} ${y}
              M ${x - w / 3} ${y - h / 2.5}
              L ${x + w / 3} ${y - h / 2.5}
              M ${x - w / 3} ${y}
              L ${x + w / 3} ${y}
              M ${x - w / 3} ${y + h / 2.5}
              L ${x + w / 3} ${y + h / 2.5}`;
    case 'flowery':
      return `M ${x - w / 2} ${y}
              Q ${x - w / 2} ${y - h / 2} ${x} ${y - h}
              Q ${x + w / 2} ${y - h / 2} ${x + w / 2} ${y}
              Q ${x + w / 2} ${y + h / 2} ${x} ${y + h}
              Q ${x - w / 2} ${y + h / 2} ${x - w / 2} ${y}
              M ${x - w / 4} ${y - h / 4}
              C ${x - w / 2} ${y - h / 3} ${x - w / 2} ${y - h / 6} ${x - w / 4} ${y}
              C ${x - w / 2} ${y + h / 6} ${x - w / 2} ${y + h / 3} ${x - w / 4} ${y + h / 4}
              M ${x + w / 4} ${y - h / 4}
              C ${x + w / 2} ${y - h / 3} ${x + w / 2} ${y - h / 6} ${x + w / 4} ${y}
              C ${x + w / 2} ${y + h / 6} ${x + w / 2} ${y + h / 3} ${x + w / 4} ${y + h / 4}`;
    case 'none':
    default:
      return '';
  }
}

export function generateSvgContent(params: LayoutParams, includeDimensions: boolean = true): string {
  const {
    paperWidth, paperHeight,
    marginTop, marginBottom, marginLeft, marginRight,
    columnCount, rowCount,
    lineThickness, lineColor,
    fishtailStyle,
    annotationWidth, annotationPosition,
  } = params;

  const printWidth = paperWidth - marginLeft - marginRight;
  const printHeight = paperHeight - marginTop - marginBottom;
  const printX = marginLeft;
  const printY = marginTop;

  const annotationLeftWidth = annotationPosition === 'left' || annotationPosition === 'both' ? annotationWidth : 0;
  const annotationRightWidth = annotationPosition === 'right' || annotationPosition === 'both' ? annotationWidth : 0;

  const bodyX = printX + annotationLeftWidth;
  const bodyWidth = printWidth - annotationLeftWidth - annotationRightWidth;
  const columnWidth = bodyWidth / columnCount;
  const rowHeight = printHeight / rowCount;

  const columnLines: number[] = [];
  for (let i = 0; i <= columnCount; i++) {
    columnLines.push(bodyX + i * columnWidth);
  }

  const rowLines: number[] = [];
  for (let i = 0; i <= rowCount; i++) {
    rowLines.push(printY + i * rowHeight);
  }

  const centerX = printX + printWidth / 2;
  const fishtailSize = Math.min(printWidth * 0.15, rowHeight * 1.5);
  const topFishtailY = printY + fishtailSize * 0.8;
  const bottomFishtailY = printY + printHeight - fishtailSize * 0.8;
  const showFishtail = fishtailStyle !== 'none';
  const fishtailPathTop = showFishtail ? getFishtailPath(fishtailStyle, centerX, topFishtailY, fishtailSize) : '';
  const fishtailPathBottom = showFishtail ? getFishtailPath(fishtailStyle, centerX, bottomFishtailY, fishtailSize) : '';

  const svgParts: string[] = [];

  svgParts.push(`<?xml version="1.0" encoding="UTF-8"?>`);
  svgParts.push(`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${paperWidth} ${paperHeight}" width="${paperWidth}mm" height="${paperHeight}mm">`);

  svgParts.push(`<title>古籍朱丝栏版式 - ${paperWidth}×${paperHeight}mm</title>`);
  svgParts.push(`<desc>生成于 ${new Date().toLocaleString('zh-CN')} | 版心: ${printWidth.toFixed(2)}×${printHeight.toFixed(2)}mm | ${columnCount}栏×${rowCount}行</desc>`);

  svgParts.push(`<defs>`);
  svgParts.push(`  <pattern id="paperTexture" patternUnits="userSpaceOnUse" width="4" height="4">`);
  svgParts.push(`    <rect width="4" height="4" fill="#F5EFE0"/>`);
  svgParts.push(`    <circle cx="1" cy="1" r="0.3" fill="#E8DFCC" opacity="0.5"/>`);
  svgParts.push(`    <circle cx="3" cy="2" r="0.2" fill="#E0D5C0" opacity="0.4"/>`);
  svgParts.push(`  </pattern>`);
  svgParts.push(`  <filter id="lineBlur" x="-50%" y="-50%" width="200%" height="200%">`);
  svgParts.push(`    <feGaussianBlur in="SourceGraphic" stdDeviation="0.05"/>`);
  svgParts.push(`  </filter>`);
  svgParts.push(`</defs>`);

  svgParts.push(`<rect width="${paperWidth}" height="${paperHeight}" fill="url(#paperTexture)" stroke="#D4C4A8" stroke-width="0.2"/>`);

  if (annotationLeftWidth > 0) {
    svgParts.push(`<g class="annotation-area left">`);
    svgParts.push(`  <rect x="${printX}" y="${printY}" width="${annotationLeftWidth}" height="${printHeight}" fill="#E8F0F5" stroke="#2E4A62" stroke-width="0.15" stroke-dasharray="1,0.5" opacity="0.6"/>`);
    svgParts.push(`  <text x="${printX + annotationLeftWidth / 2}" y="${printY + printHeight / 2}" fill="#2E4A62" font-size="3" text-anchor="middle" dominant-baseline="middle" transform="rotate(-90, ${printX + annotationLeftWidth / 2}, ${printY + printHeight / 2})">批注区</text>`);
    svgParts.push(`</g>`);
  }

  if (annotationRightWidth > 0) {
    const arX = printX + printWidth - annotationRightWidth;
    svgParts.push(`<g class="annotation-area right">`);
    svgParts.push(`  <rect x="${arX}" y="${printY}" width="${annotationRightWidth}" height="${printHeight}" fill="#E8F0F5" stroke="#2E4A62" stroke-width="0.15" stroke-dasharray="1,0.5" opacity="0.6"/>`);
    svgParts.push(`  <text x="${arX + annotationRightWidth / 2}" y="${printY + printHeight / 2}" fill="#2E4A62" font-size="3" text-anchor="middle" dominant-baseline="middle" transform="rotate(90, ${arX + annotationRightWidth / 2}, ${printY + printHeight / 2})">批注区</text>`);
    svgParts.push(`</g>`);
  }

  svgParts.push(`<g class="print-area">`);
  svgParts.push(`  <rect x="${printX}" y="${printY}" width="${printWidth}" height="${printHeight}" fill="none" stroke="#1A1A1A" stroke-width="0.2"/>`);

  svgParts.push(`  <g class="column-lines">`);
  columnLines.forEach((x, index) => {
    svgParts.push(`    <line x1="${x}" y1="${printY}" x2="${x}" y2="${printY + printHeight}" stroke="${lineColor}" stroke-width="${lineThickness}" filter="url(#lineBlur)"/>`);
  });
  svgParts.push(`  </g>`);

  svgParts.push(`  <g class="row-lines">`);
  rowLines.forEach((y, index) => {
    svgParts.push(`    <line x1="${bodyX}" y1="${y}" x2="${bodyX + bodyWidth}" y2="${y}" stroke="${lineColor}" stroke-width="${lineThickness}" filter="url(#lineBlur)"/>`);
  });
  svgParts.push(`  </g>`);

  if (showFishtail) {
    svgParts.push(`  <g class="fishtail" fill="${lineColor}">`);
    svgParts.push(`    <path d="${fishtailPathTop}"/>`);
    svgParts.push(`    <path d="${fishtailPathBottom}"/>`);
    svgParts.push(`  </g>`);
  }

  svgParts.push(`</g>`);

  if (includeDimensions) {
    svgParts.push(`<g class="dimensions" font-size="2.5" fill="#666">`);
    svgParts.push(`  <text x="${paperWidth / 2}" y="${printY - 4}" text-anchor="middle">版心: ${printWidth.toFixed(1)} × ${printHeight.toFixed(1)} mm</text>`);
    svgParts.push(`  <text x="${paperWidth / 2}" y="${paperHeight - 2}" text-anchor="middle">纸张: ${paperWidth} × ${paperHeight} mm</text>`);
    svgParts.push(`  <text x="2" y="${printY + printHeight / 2}" transform="rotate(-90, 2, ${printY + printHeight / 2})">上: ${marginTop}mm</text>`);
    svgParts.push(`  <text x="${paperWidth - 2}" y="${printY + printHeight / 2}" transform="rotate(90, ${paperWidth - 2}, ${printY + printHeight / 2})">下: ${marginBottom}mm</text>`);
    svgParts.push(`</g>`);
  }

  svgParts.push(`</svg>`);

  return svgParts.join('\n');
}

export function exportToSvgFile(params: LayoutParams, name?: string, includeDimensions: boolean = true): void {
  const svgContent = generateSvgContent(params, includeDimensions);
  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const fileName = name || `版式_${new Date().toLocaleString('zh-CN').replace(/[/:]/g, '-')}`;

  const link = document.createElement('a');
  link.href = url;
  link.download = `${fileName.replace(/[\\/:*?"<>|]/g, '_')}.svg`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function exportToPngFile(
  params: LayoutParams,
  name?: string,
  dpi: number = 300,
  includeDimensions: boolean = true
): Promise<void> {
  const svgContent = generateSvgContent(params, includeDimensions);
  const { paperWidth, paperHeight } = params;

  const canvasWidth = Math.round(mmToPx(paperWidth, dpi));
  const canvasHeight = Math.round(mmToPx(paperHeight, dpi));

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('无法创建 Canvas 上下文，浏览器可能不支持此功能');
  }

  const svgBlob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  try {
    await new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        ctx.fillStyle = '#F5EFE0';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        ctx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
        URL.revokeObjectURL(url);
        resolve();
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('SVG 渲染失败，请尝试更换参数后重试'));
      };
      img.src = url;
    });

    const fileName = name || `版式_${new Date().toLocaleString('zh-CN').replace(/[/:]/g, '-')}`;

    await new Promise<void>((resolve) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const pngUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = pngUrl;
            link.download = `${fileName.replace(/[\\/:*?"<>|]/g, '_')}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(pngUrl);
          }
          resolve();
        },
        'image/png',
        1.0
      );
    });
  } catch (e) {
    URL.revokeObjectURL(url);
    throw e;
  }
}

export async function exportWithFormat(
  params: LayoutParams,
  options: ExportOptions
): Promise<void> {
  const { format, name, dpi = 300, includeDimensions = true } = options;

  switch (format) {
    case 'json':
      exportToJsonFile(params, name);
      break;
    case 'svg':
      exportToSvgFile(params, name, includeDimensions);
      break;
    case 'png':
      await exportToPngFile(params, name, dpi, includeDimensions);
      break;
    default:
      throw new Error(`不支持的导出格式: ${format}`);
  }
}

export function saveToLocalStorage(params: LayoutParams): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(params));
  } catch (e) {
    console.warn('保存到 LocalStorage 失败:', e);
  }
}

export function loadFromLocalStorage(): LayoutParams | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;

    const params = JSON.parse(saved) as LayoutParams;
    const validation = validateLayoutParams(params);

    if (validation.valid) {
      return params;
    }
    console.warn('本地存储的参数无效:', validation.errors);
    return null;
  } catch (e) {
    console.warn('从 LocalStorage 读取失败:', e);
    return null;
  }
}

export function loadSchemes(): SavedScheme[] {
  try {
    const saved = localStorage.getItem(SCHEMES_STORAGE_KEY);
    if (!saved) return [];
    const schemes = JSON.parse(saved) as SavedScheme[];
    return Array.isArray(schemes) ? schemes : [];
  } catch (e) {
    console.warn('加载方案列表失败:', e);
    return [];
  }
}

export function saveSchemes(schemes: SavedScheme[]): void {
  try {
    localStorage.setItem(SCHEMES_STORAGE_KEY, JSON.stringify(schemes));
  } catch (e) {
    console.warn('保存方案列表失败:', e);
  }
}

export function createScheme(name: string, params: LayoutParams): SavedScheme {
  const now = Date.now();
  return {
    id: `scheme_${now}_${Math.random().toString(36).slice(2, 8)}`,
    name,
    createdAt: now,
    updatedAt: now,
    params: { ...params },
  };
}

export function addScheme(name: string, params: LayoutParams): SavedScheme | null {
  const validation = validateLayoutParams(params);
  if (!validation.valid) {
    console.warn('参数无效，无法保存方案:', validation.errors);
    return null;
  }

  const schemes = loadSchemes();
  if (schemes.length >= MAX_SAVED_SCHEMES) {
    console.warn(`方案数量已达上限 (${MAX_SAVED_SCHEMES})`);
    return null;
  }

  const scheme = createScheme(name, params);
  schemes.unshift(scheme);
  saveSchemes(schemes);
  return scheme;
}

export function updateScheme(id: string, params: LayoutParams): boolean {
  const schemes = loadSchemes();
  const index = schemes.findIndex(s => s.id === id);
  if (index === -1) return false;

  const validation = validateLayoutParams(params);
  if (!validation.valid) {
    console.warn('参数无效，无法更新方案:', validation.errors);
    return false;
  }

  schemes[index] = {
    ...schemes[index],
    params: { ...params },
    updatedAt: Date.now(),
  };
  saveSchemes(schemes);
  return true;
}

export function deleteScheme(id: string): boolean {
  const schemes = loadSchemes();
  const filtered = schemes.filter(s => s.id !== id);
  if (filtered.length === schemes.length) return false;
  saveSchemes(filtered);
  return true;
}

export function renameScheme(id: string, newName: string): boolean {
  const schemes = loadSchemes();
  const index = schemes.findIndex(s => s.id === id);
  if (index === -1) return false;

  schemes[index] = {
    ...schemes[index],
    name: newName,
    updatedAt: Date.now(),
  };
  saveSchemes(schemes);
  return true;
}

export function loadHistory(): HistoryRecord[] {
  try {
    const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!saved) return [];
    const history = JSON.parse(saved) as HistoryRecord[];
    return Array.isArray(history) ? history : [];
  } catch (e) {
    console.warn('加载历史记录失败:', e);
    return [];
  }
}

export function saveHistory(history: HistoryRecord[]): void {
  try {
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
  } catch (e) {
    console.warn('保存历史记录失败:', e);
  }
}

export function createHistoryRecord(
  params: LayoutParams,
  action: HistoryRecord['action'],
  description?: string
): HistoryRecord {
  return {
    id: `hist_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    params: { ...params },
    action,
    description,
  };
}

export function addHistoryRecord(
  params: LayoutParams,
  action: HistoryRecord['action'],
  description?: string
): HistoryRecord | null {
  const validation = validateLayoutParams(params);
  if (!validation.valid) {
    return null;
  }

  const history = loadHistory();
  const record = createHistoryRecord(params, action, description);
  history.unshift(record);

  while (history.length > MAX_HISTORY_RECORDS) {
    history.pop();
  }

  saveHistory(history);
  return record;
}

export function clearHistory(): void {
  saveHistory([]);
}

export function deleteHistoryRecord(id: string): boolean {
  const history = loadHistory();
  const filtered = history.filter(h => h.id !== id);
  if (filtered.length === history.length) return false;
  saveHistory(filtered);
  return true;
}

export function getExportFormats(): { label: string; value: ExportFormat; icon?: string }[] {
  return [
    { label: 'JSON 方案文件', value: 'json' },
    { label: 'SVG 矢量图', value: 'svg' },
    { label: 'PNG 高清图', value: 'png' },
  ];
}
