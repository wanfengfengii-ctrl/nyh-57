import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import type {
  LayoutParams,
  LayoutStats,
  ValidationResult,
  FishtailType,
  AnnotationPosition,
  PaperPreset,
  SavedScheme,
  HistoryRecord,
  ExportOptions,
  ExportFormat,
} from '../types/layout';
import { DEFAULT_PARAMS, PAPER_PRESETS, MARGIN_LINK_MODES } from '../types/layout';
import type { MarginLinkMode } from '../types/layout';
import { calculateLayoutStats, computeMarginsFromPrintSize } from '../utils/calculation';
import { validateLayoutParams, validateSingleParam, validatePrintSize } from '../utils/validation';
import {
  saveToLocalStorage,
  loadFromLocalStorage,
  exportWithFormat,
  loadSchemes,
  addScheme,
  updateScheme,
  deleteScheme,
  renameScheme,
  loadHistory,
  addHistoryRecord,
  clearHistory,
  deleteHistoryRecord,
  getExportFormats,
} from '../utils/export';

export const useLayoutStore = defineStore('layout', () => {
  const savedParams = loadFromLocalStorage();
  const params = ref<LayoutParams>(savedParams || { ...DEFAULT_PARAMS });

  const validation = ref<ValidationResult>({ valid: true, errors: [], warnings: undefined });

  const marginLinkMode = ref<MarginLinkMode>('symmetrical');

  const schemes = ref<SavedScheme[]>(loadSchemes());
  const history = ref<HistoryRecord[]>(loadHistory());

  const stats = computed<LayoutStats>(() => {
    return calculateLayoutStats(params.value);
  });

  const isValid = computed(() => validation.value.valid);
  const errors = computed(() => validation.value.errors);
  const warnings = computed(() => validation.value.warnings || []);

  const currentPresetId = computed<string | null>(() => {
    const p = params.value;
    const match = PAPER_PRESETS.find(
      preset =>
        preset.id !== 'custom' &&
        preset.paperWidth === p.paperWidth &&
        preset.paperHeight === p.paperHeight &&
        preset.marginTop === p.marginTop &&
        preset.marginBottom === p.marginBottom &&
        preset.marginLeft === p.marginLeft &&
        preset.marginRight === p.marginRight &&
        preset.columnCount === p.columnCount &&
        preset.rowCount === p.rowCount
    );
    return match ? match.id : null;
  });

  function refreshSchemes(): void {
    schemes.value = loadSchemes();
  }

  function refreshHistory(): void {
    history.value = loadHistory();
  }

  function pushHistory(action: HistoryRecord['action'], description?: string): void {
    const record = addHistoryRecord(params.value, action, description);
    if (record) {
      history.value = loadHistory();
    }
  }

  function updateParam<K extends keyof LayoutParams>(key: K, value: LayoutParams[K]): void {
    const oldValue = params.value[key];

    if (typeof value === 'number' && typeof oldValue === 'number' && Math.abs(value - oldValue) < 1e-10) {
      return;
    }

    if (marginLinkMode.value !== 'none' && typeof value === 'number') {
      const mode = marginLinkMode.value;
      if (key === 'marginTop' || key === 'marginBottom') {
        if (mode === 'link-all' || mode === 'link-vertical' || mode === 'symmetrical') {
          const target = key === 'marginTop' ? ('marginBottom' as const) : ('marginTop' as const);
          params.value[target] = value as LayoutParams[typeof target];
        }
      }
      if (key === 'marginLeft' || key === 'marginRight') {
        if (mode === 'link-all' || mode === 'link-horizontal' || mode === 'symmetrical') {
          const target = key === 'marginLeft' ? ('marginRight' as const) : ('marginLeft' as const);
          params.value[target] = value as LayoutParams[typeof target];
        }
      }
      if (key === 'marginTop' && mode === 'link-all') {
        params.value.marginLeft = value as LayoutParams['marginLeft'];
        params.value.marginRight = value as LayoutParams['marginRight'];
      }
    }

    params.value[key] = value;

    const result = validateLayoutParams(params.value);
    validation.value = result;

    if (!result.valid) {
      params.value[key] = oldValue;
      if (marginLinkMode.value !== 'none') {
        const original = savedParams || DEFAULT_PARAMS;
        params.value.marginTop = original.marginTop;
        params.value.marginBottom = original.marginBottom;
        params.value.marginLeft = original.marginLeft;
        params.value.marginRight = original.marginRight;
      }
      validation.value = validateLayoutParams(params.value);
    } else {
      saveToLocalStorage(params.value);
    }
  }

  function forceUpdateParam<K extends keyof LayoutParams>(key: K, value: LayoutParams[K]): void {
    params.value[key] = value;
    validation.value = validateLayoutParams(params.value);
    if (validation.value.valid) {
      saveToLocalStorage(params.value);
    }
  }

  function updateAllParams(newParams: LayoutParams, recordAction: boolean = true): void {
    const result = validateLayoutParams(newParams);
    if (result.valid) {
      params.value = { ...newParams };
      validation.value = result;
      saveToLocalStorage(params.value);
      if (recordAction) {
        pushHistory('update', '批量更新参数');
      }
    } else {
      validation.value = result;
    }
  }

  function resetParams(): void {
    params.value = { ...DEFAULT_PARAMS };
    validation.value = { valid: true, errors: [], warnings: undefined };
    saveToLocalStorage(params.value);
    pushHistory('reset', '重置为默认参数');
  }

  function setPaperSize(width: number, height: number): void {
    const tempParams = { ...params.value, paperWidth: width, paperHeight: height };
    const result = validateLayoutParams(tempParams);
    if (result.valid) {
      params.value = tempParams;
      validation.value = result;
      saveToLocalStorage(params.value);
      pushHistory('update', `纸张尺寸: ${width}×${height}mm`);
    } else {
      validation.value = result;
    }
  }

  function setMargins(top: number, bottom: number, left: number, right: number): void {
    const tempParams = {
      ...params.value,
      marginTop: top,
      marginBottom: bottom,
      marginLeft: left,
      marginRight: right,
    };
    const result = validateLayoutParams(tempParams);
    if (result.valid) {
      params.value = tempParams;
      validation.value = result;
      saveToLocalStorage(params.value);
      pushHistory('update', `边距: 上${top}/下${bottom}/左${left}/右${right}`);
    } else {
      validation.value = result;
    }
  }

  function setPrintSize(
    printWidth: number,
    printHeight: number,
    centerHorizontally: boolean = true,
    centerVertically: boolean = true
  ): void {
    const check = validatePrintSize(params.value.paperWidth, params.value.paperHeight, printWidth, printHeight);
    if (!check.valid) {
      validation.value = {
        valid: false,
        errors: [check.error || '版心尺寸无效'],
      };
      return;
    }

    const margins = computeMarginsFromPrintSize(
      params.value.paperWidth,
      params.value.paperHeight,
      printWidth,
      printHeight,
      centerHorizontally,
      centerVertically
    );

    setMargins(margins.marginTop, margins.marginBottom, margins.marginLeft, margins.marginRight);
  }

  function applyPaperPreset(preset: PaperPreset): void {
    const newParams: LayoutParams = {
      ...params.value,
      paperWidth: preset.paperWidth,
      paperHeight: preset.paperHeight,
      marginTop: preset.marginTop,
      marginBottom: preset.marginBottom,
      marginLeft: preset.marginLeft,
      marginRight: preset.marginRight,
      columnCount: preset.columnCount,
      rowCount: preset.rowCount,
    };
    const result = validateLayoutParams(newParams);
    if (result.valid) {
      params.value = newParams;
      validation.value = result;
      saveToLocalStorage(params.value);
      pushHistory('preset', `应用预设: ${preset.label}`);
    } else {
      validation.value = result;
    }
  }

  function setGrid(columns: number, rows: number): void {
    const tempParams = { ...params.value, columnCount: columns, rowCount: rows };
    const result = validateLayoutParams(tempParams);
    if (result.valid) {
      params.value = tempParams;
      validation.value = result;
      saveToLocalStorage(params.value);
      pushHistory('update', `网格: ${columns}栏×${rows}行`);
    } else {
      validation.value = result;
    }
  }

  function setLineStyle(thickness: number, color: string): void {
    const tempParams = { ...params.value, lineThickness: thickness, lineColor: color };
    const result = validateLayoutParams(tempParams);
    if (result.valid) {
      params.value = tempParams;
      validation.value = result;
      saveToLocalStorage(params.value);
    } else {
      validation.value = result;
    }
  }

  function setFishtailStyle(style: FishtailType): void {
    updateParam('fishtailStyle', style);
  }

  function setAnnotation(width: number, position: AnnotationPosition): void {
    const tempParams = { ...params.value, annotationWidth: width, annotationPosition: position };
    const result = validateLayoutParams(tempParams);
    if (result.valid) {
      params.value = tempParams;
      validation.value = result;
      saveToLocalStorage(params.value);
      pushHistory('update', `批注区: ${position} ${width}mm`);
    } else {
      validation.value = result;
    }
  }

  function setMarginLinkMode(mode: MarginLinkMode): void {
    marginLinkMode.value = mode;
  }

  function validate(): ValidationResult {
    validation.value = validateLayoutParams(params.value);
    return validation.value;
  }

  function validateSingle<K extends keyof LayoutParams>(key: K, value: LayoutParams[K]): string | null {
    return validateSingleParam(key, value as number | string, params.value);
  }

  async function exportData(options: ExportOptions): Promise<boolean> {
    if (!isValid.value) {
      validation.value = validateLayoutParams(params.value);
      return false;
    }
    try {
      await exportWithFormat(params.value, options);
      return true;
    } catch (e) {
      console.error('导出失败:', e);
      return false;
    }
  }

  function saveCurrentAsScheme(name: string): SavedScheme | null {
    const result = addScheme(name, params.value);
    if (result) {
      schemes.value = loadSchemes();
      pushHistory('update', `保存方案: ${name}`);
    }
    return result;
  }

  function loadScheme(id: string): boolean {
    const scheme = schemes.value.find(s => s.id === id);
    if (!scheme) return false;
    updateAllParams(scheme.params, false);
    pushHistory('update', `加载方案: ${scheme.name}`);
    return true;
  }

  function updateCurrentScheme(id: string): boolean {
    const ok = updateScheme(id, params.value);
    if (ok) {
      schemes.value = loadSchemes();
    }
    return ok;
  }

  function removeScheme(id: string): boolean {
    const ok = deleteScheme(id);
    if (ok) {
      schemes.value = loadSchemes();
    }
    return ok;
  }

  function renameExistingScheme(id: string, newName: string): boolean {
    const ok = renameScheme(id, newName);
    if (ok) {
      schemes.value = loadSchemes();
    }
    return ok;
  }

  function applyHistoryRecord(id: string): boolean {
    const record = history.value.find(h => h.id === id);
    if (!record) return false;
    updateAllParams(record.params, false);
    return true;
  }

  function removeHistoryRecord(id: string): boolean {
    const ok = deleteHistoryRecord(id);
    if (ok) {
      history.value = loadHistory();
    }
    return ok;
  }

  function clearAllHistory(): void {
    clearHistory();
    history.value = [];
  }

  watch(
    params,
    () => {
      validation.value = validateLayoutParams(params.value);
    },
    { deep: true }
  );

  return {
    params,
    stats,
    validation,
    isValid,
    errors,
    warnings,
    marginLinkMode,
    schemes,
    history,
    currentPresetId,
    refreshSchemes,
    refreshHistory,
    updateParam,
    forceUpdateParam,
    updateAllParams,
    resetParams,
    setPaperSize,
    setMargins,
    setPrintSize,
    applyPaperPreset,
    setGrid,
    setLineStyle,
    setFishtailStyle,
    setAnnotation,
    setMarginLinkMode,
    validate,
    validateSingle,
    exportData,
    saveCurrentAsScheme,
    loadScheme,
    updateCurrentScheme,
    removeScheme,
    renameExistingScheme,
    applyHistoryRecord,
    removeHistoryRecord,
    clearAllHistory,
    getExportFormats,
  };
});
