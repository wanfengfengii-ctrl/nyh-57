import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import type { SavedScheme } from '../types/layout';
import type {
  ComparisonResult,
  AuditResult,
  DiffCategory,
  ReportExportOptions,
} from '../types/comparison';
import {
  MAX_COMPARE_SCHEMES,
  COMPARISON_STORAGE_KEY,
} from '../types/comparison';
import {
  compareSchemes,
  auditSchemes,
  exportReport,
  batchExportSchemes,
} from '../utils/comparison';
import { loadSchemes } from '../utils/export';

function loadSelectedIds(): string[] {
  try {
    const saved = localStorage.getItem(COMPARISON_STORAGE_KEY);
    if (!saved) return [];
    const ids = JSON.parse(saved);
    return Array.isArray(ids) ? ids : [];
  } catch (e) {
    console.warn('加载对比方案失败:', e);
    return [];
  }
}

function saveSelectedIds(ids: string[]): void {
  try {
    localStorage.setItem(COMPARISON_STORAGE_KEY, JSON.stringify(ids));
  } catch (e) {
    console.warn('保存对比方案失败:', e);
  }
}

export const useComparisonStore = defineStore('comparison', () => {
  const selectedSchemeIds = ref<string[]>(loadSelectedIds());
  const showPanel = ref(false);
  const activeTab = ref<'comparison' | 'audit' | 'report'>('comparison');
  const filterCategory = ref<DiffCategory | 'all'>('all');
  const showOnlyDiffs = ref(false);
  const auditFilter = ref<'all' | 'error' | 'warning' | 'info'>('all');

  const allSchemes = ref<SavedScheme[]>(loadSchemes());

  const selectedSchemes = computed<SavedScheme[]>(() => {
    return allSchemes.value.filter(s => selectedSchemeIds.value.includes(s.id));
  });

  const canCompare = computed(() => selectedSchemes.value.length >= 2);

  const isMaxReached = computed(() => selectedSchemeIds.value.length >= MAX_COMPARE_SCHEMES);

  const comparisonResult = computed<ComparisonResult | null>(() => {
    if (selectedSchemes.value.length < 2) return null;
    return compareSchemes(selectedSchemes.value);
  });

  const auditResult = computed<AuditResult | null>(() => {
    if (selectedSchemes.value.length === 0) return null;
    return auditSchemes(selectedSchemes.value);
  });

  const filteredDiffItems = computed(() => {
    if (!comparisonResult.value) return [];
    let items = comparisonResult.value.diffItems;
    if (filterCategory.value !== 'all') {
      items = items.filter(i => i.category === filterCategory.value);
    }
    if (showOnlyDiffs.value) {
      items = items.filter(i => i.hasDiff);
    }
    return items;
  });

  const filteredAuditIssues = computed(() => {
    if (!auditResult.value) return [];
    let issues = auditResult.value.issues;
    if (auditFilter.value !== 'all') {
      issues = issues.filter(i => i.severity === auditFilter.value);
    }
    return issues;
  });

  function refreshSchemes(): void {
    allSchemes.value = loadSchemes();
    const validIds = selectedSchemeIds.value.filter(id =>
      allSchemes.value.some(s => s.id === id)
    );
    if (validIds.length !== selectedSchemeIds.value.length) {
      selectedSchemeIds.value.splice(0, selectedSchemeIds.value.length, ...validIds);
      saveSelectedIds([...validIds]);
    }
  }

  function toggleScheme(schemeId: string): void {
    const idx = selectedSchemeIds.value.indexOf(schemeId);
    if (idx >= 0) {
      selectedSchemeIds.value.splice(idx, 1);
    } else {
      if (selectedSchemeIds.value.length >= MAX_COMPARE_SCHEMES) {
        return;
      }
      selectedSchemeIds.value.push(schemeId);
    }
    saveSelectedIds([...selectedSchemeIds.value]);
  }

  function addScheme(schemeId: string): boolean {
    if (selectedSchemeIds.value.length >= MAX_COMPARE_SCHEMES) return false;
    if (selectedSchemeIds.value.includes(schemeId)) return false;
    selectedSchemeIds.value.push(schemeId);
    saveSelectedIds([...selectedSchemeIds.value]);
    return true;
  }

  function removeScheme(schemeId: string): void {
    const idx = selectedSchemeIds.value.indexOf(schemeId);
    if (idx >= 0) {
      selectedSchemeIds.value.splice(idx, 1);
      saveSelectedIds([...selectedSchemeIds.value]);
    }
  }

  function clearAll(): void {
    selectedSchemeIds.value.splice(0, selectedSchemeIds.value.length);
    saveSelectedIds([]);
  }

  function isSelected(schemeId: string): boolean {
    return selectedSchemeIds.value.includes(schemeId);
  }

  function openPanel(): void {
    showPanel.value = true;
    refreshSchemes();
  }

  function closePanel(): void {
    showPanel.value = false;
  }

  function setActiveTab(tab: 'comparison' | 'audit' | 'report'): void {
    activeTab.value = tab;
  }

  function setFilterCategory(category: DiffCategory | 'all'): void {
    filterCategory.value = category;
  }

  function setShowOnlyDiffs(show: boolean): void {
    showOnlyDiffs.value = show;
  }

  function setAuditFilter(filter: 'all' | 'error' | 'warning' | 'info'): void {
    auditFilter.value = filter;
  }

  function exportComparisonReport(options: ReportExportOptions): void {
    if (!comparisonResult.value || !auditResult.value) return;
    exportReport(selectedSchemes.value, comparisonResult.value, auditResult.value, options);
  }

  async function batchExport(format: 'json' | 'svg' | 'png', dpi?: number): Promise<void> {
    await batchExportSchemes(selectedSchemes.value, format, dpi);
  }

  watch(
    selectedSchemeIds,
    () => {
      saveSelectedIds([...selectedSchemeIds.value]);
    },
    { deep: true }
  );

  return {
    selectedSchemeIds,
    allSchemes,
    selectedSchemes,
    canCompare,
    isMaxReached,
    comparisonResult,
    auditResult,
    filteredDiffItems,
    filteredAuditIssues,
    showPanel,
    activeTab,
    filterCategory,
    showOnlyDiffs,
    auditFilter,
    refreshSchemes,
    toggleScheme,
    addScheme,
    removeScheme,
    clearAll,
    isSelected,
    openPanel,
    closePanel,
    setActiveTab,
    setFilterCategory,
    setShowOnlyDiffs,
    setAuditFilter,
    exportComparisonReport,
    batchExport,
  };
});
