import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import type { LayoutParams, LayoutStats, ValidationResult, FishtailType, AnnotationPosition } from '../types/layout';
import { DEFAULT_PARAMS } from '../types/layout';
import { calculateLayoutStats } from '../utils/calculation';
import { validateLayoutParams } from '../utils/validation';
import { saveToLocalStorage, loadFromLocalStorage } from '../utils/export';

export const useLayoutStore = defineStore('layout', () => {
  const savedParams = loadFromLocalStorage();
  const params = ref<LayoutParams>(savedParams || { ...DEFAULT_PARAMS });

  const validation = ref<ValidationResult>({ valid: true, errors: [] });

  const stats = computed<LayoutStats>(() => {
    return calculateLayoutStats(params.value);
  });

  const isValid = computed(() => validation.value.valid);
  const errors = computed(() => validation.value.errors);

  function updateParam<K extends keyof LayoutParams>(key: K, value: LayoutParams[K]): void {
    const oldValue = params.value[key];
    params.value[key] = value;

    const result = validateLayoutParams(params.value);
    validation.value = result;

    if (!result.valid) {
      params.value[key] = oldValue;
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

  function updateAllParams(newParams: LayoutParams): void {
    const result = validateLayoutParams(newParams);
    if (result.valid) {
      params.value = { ...newParams };
      validation.value = result;
      saveToLocalStorage(params.value);
    } else {
      validation.value = result;
    }
  }

  function resetParams(): void {
    params.value = { ...DEFAULT_PARAMS };
    validation.value = { valid: true, errors: [] };
    saveToLocalStorage(params.value);
  }

  function setPaperSize(width: number, height: number): void {
    updateParam('paperWidth', width);
    updateParam('paperHeight', height);
  }

  function setMargins(top: number, bottom: number, left: number, right: number): void {
    const tempParams = { ...params.value, marginTop: top, marginBottom: bottom, marginLeft: left, marginRight: right };
    const result = validateLayoutParams(tempParams);
    if (result.valid) {
      params.value = tempParams;
      validation.value = result;
      saveToLocalStorage(params.value);
    } else {
      validation.value = result;
    }
  }

  function setGrid(columns: number, rows: number): void {
    updateParam('columnCount', columns);
    updateParam('rowCount', rows);
  }

  function setLineStyle(thickness: number, color: string): void {
    updateParam('lineThickness', thickness);
    updateParam('lineColor', color);
  }

  function setFishtailStyle(style: FishtailType): void {
    updateParam('fishtailStyle', style);
  }

  function setAnnotation(width: number, position: AnnotationPosition): void {
    updateParam('annotationWidth', width);
    updateParam('annotationPosition', position);
  }

  function validate(): ValidationResult {
    validation.value = validateLayoutParams(params.value);
    return validation.value;
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
    updateParam,
    forceUpdateParam,
    updateAllParams,
    resetParams,
    setPaperSize,
    setMargins,
    setGrid,
    setLineStyle,
    setFishtailStyle,
    setAnnotation,
    validate,
  };
});
