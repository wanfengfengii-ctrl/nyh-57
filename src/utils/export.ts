import type { LayoutParams, LayoutExport, ValidationResult } from '../types/layout';
import { EXPORT_VERSION, DEFAULT_PARAMS } from '../types/layout';
import { validateLayoutParams } from './validation';

const STORAGE_KEY = 'zhusilan_layout_params';

export function exportLayout(params: LayoutParams, name?: string): LayoutExport {
  const exportData: LayoutExport = {
    version: EXPORT_VERSION,
    name: name || `版式方案_${new Date().toLocaleString('zh-CN')}`,
    createdAt: new Date().toISOString(),
    params: { ...params },
  };
  return exportData;
}

export function exportToFile(params: LayoutParams, name?: string): void {
  const exportData = exportLayout(params, name);
  const jsonStr = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${exportData.name.replace(/[\\/:*?"<>|]/g, '_')}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function importLayout(jsonStr: string): { result: ValidationResult; params?: LayoutParams } {
  try {
    const data: LayoutExport = JSON.parse(jsonStr);

    if (!data.version || !data.params) {
      return {
        result: {
          valid: false,
          errors: ['文件格式不正确，缺少必要字段'],
        },
      };
    }

    if (data.version !== EXPORT_VERSION) {
      console.warn(`版本不匹配：文件版本 ${data.version}，当前版本 ${EXPORT_VERSION}`);
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
    };
  } catch (e) {
    return {
      result: {
        valid: false,
        errors: ['JSON 解析失败，请检查文件格式'],
      },
    };
  }
}

export function importFromFile(file: File): Promise<{ result: ValidationResult; params?: LayoutParams }> {
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
          errors: ['文件读取失败'],
        },
      });
    };
    reader.readAsText(file);
  });
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
