import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import type { SavedScheme } from '../types/layout';
import type {
  ComparisonResult,
  AuditResult,
  DiffCategory,
  ReportExportOptions,
  SortConfig,
  SortField,
  SortOrder,
  DiffSeverity,
  ReportTemplate,
  ReportTemplateConfig,
  CustomAuditRule,
  CustomRuleField,
  CustomRuleOperator,
  ComparisonSnapshot,
  ArchiveRecord,
  ArchiveStats,
  ArchiveItemType,
  AuditIssueNavigation,
} from '../types/comparison';
import {
  MAX_COMPARE_SCHEMES,
  COMPARISON_STORAGE_KEY,
  REPORT_TEMPLATES,
} from '../types/comparison';
import {
  compareSchemes,
  auditSchemes,
  exportReport,
  batchExportSchemes,
  sortDiffItems,
  filterDiffItemsBySeverity,
  applyCustomRules,
  loadCustomRules,
  saveCustomRules,
  addCustomRule as addCustomRuleUtil,
  updateCustomRule as updateCustomRuleUtil,
  deleteCustomRule as deleteCustomRuleUtil,
  loadSnapshots,
  addSnapshot as addSnapshotUtil,
  deleteSnapshot as deleteSnapshotUtil,
  updateSnapshot as updateSnapshotUtil,
  loadArchiveRecords,
  addArchiveRecord as addArchiveRecordUtil,
  deleteArchiveRecord as deleteArchiveRecordUtil,
  getArchiveStats,
  exportReportWithTemplate,
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
  const activeTab = ref<'comparison' | 'audit' | 'report' | 'snapshot' | 'archive' | 'rules'>('comparison');
  const filterCategory = ref<DiffCategory | 'all'>('all');
  const showOnlyDiffs = ref(false);
  const auditFilter = ref<'all' | 'error' | 'warning' | 'info'>('all');

  const sortConfig = ref<SortConfig>({
    field: 'category',
    order: 'asc',
  });

  const severityFilter = ref<DiffSeverity[]>([]);

  const selectedReportTemplate = ref<ReportTemplate>('standard');
  const customTemplateConfig = ref<ReportTemplateConfig>({ ...REPORT_TEMPLATES[3] });

  const customRules = ref<CustomAuditRule[]>(loadCustomRules());

  const snapshots = ref<ComparisonSnapshot[]>(loadSnapshots());

  const archiveRecords = ref<ArchiveRecord[]>(loadArchiveRecords());

  const focusedIssue = ref<AuditIssueNavigation | null>(null);

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
    const baseResult = auditSchemes(selectedSchemes.value);
    
    const enabledRules = customRules.value.filter(r => r.enabled);
    if (enabledRules.length > 0) {
      for (const scheme of selectedSchemes.value) {
        const customIssues = applyCustomRules(scheme, enabledRules);
        baseResult.issues.push(...customIssues);
      }
      
      const errorCount = baseResult.issues.filter(i => i.severity === 'error').length;
      const warningCount = baseResult.issues.filter(i => i.severity === 'warning').length;
      const infoCount = baseResult.issues.filter(i => i.severity === 'info').length;
      
      const passCount = selectedSchemes.value.filter(s => {
        const schemeIssues = baseResult.issues.filter(i => i.schemeId === s.id);
        return schemeIssues.filter(i => i.severity === 'error').length === 0;
      }).length;

      baseResult.summary = {
        ...baseResult.summary,
        totalIssues: baseResult.issues.length,
        errorCount,
        warningCount,
        infoCount,
        passCount,
      };

      if (baseResult.conclusions.length > 0) {
        const customRuleCount = enabledRules.length;
        const hasCustomIssues = baseResult.issues.filter(i => i.id.startsWith('custom_')).length;
        if (hasCustomIssues > 0) {
          baseResult.conclusions.push(`自定义规则触发 ${customRuleCount} 条，发现 ${hasCustomIssues} 个问题`);
        }
      }
    }
    
    return baseResult;
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
    
    if (severityFilter.value.length > 0) {
      items = filterDiffItemsBySeverity(items, severityFilter.value);
    }
    
    items = sortDiffItems(items, sortConfig.value);
    
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

  const currentReportTemplate = computed<ReportTemplateConfig>(() => {
    if (selectedReportTemplate.value === 'custom') {
      return customTemplateConfig.value;
    }
    const template = REPORT_TEMPLATES.find(t => t.id === selectedReportTemplate.value);
    return template || REPORT_TEMPLATES[0];
  });

  const archiveStats = computed<ArchiveStats>(() => {
    return getArchiveStats();
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
    refreshSnapshots();
    refreshArchiveRecords();
    refreshCustomRules();
  }

  function closePanel(): void {
    showPanel.value = false;
  }

  function setActiveTab(tab: 'comparison' | 'audit' | 'report' | 'snapshot' | 'archive' | 'rules'): void {
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

  function setSortConfig(field: SortField, order: SortOrder): void {
    sortConfig.value = { field, order };
  }

  function toggleSortOrder(): void {
    sortConfig.value.order = sortConfig.value.order === 'asc' ? 'desc' : 'asc';
  }

  function setSortField(field: SortField): void {
    sortConfig.value.field = field;
  }

  function toggleSeverityFilter(severity: DiffSeverity): void {
    const idx = severityFilter.value.indexOf(severity);
    if (idx >= 0) {
      severityFilter.value.splice(idx, 1);
    } else {
      severityFilter.value.push(severity);
    }
  }

  function clearSeverityFilter(): void {
    severityFilter.value = [];
  }

  function setSelectedReportTemplate(template: ReportTemplate): void {
    selectedReportTemplate.value = template;
  }

  function updateCustomTemplateConfig(config: Partial<ReportTemplateConfig>): void {
    customTemplateConfig.value = { ...customTemplateConfig.value, ...config };
  }

  function refreshCustomRules(): void {
    customRules.value = loadCustomRules();
  }

  function addCustomRule(rule: Omit<CustomAuditRule, 'id'>): CustomAuditRule | null {
    const result = addCustomRuleUtil(rule);
    if (result) {
      customRules.value = loadCustomRules();
    }
    return result;
  }

  function updateCustomRule(id: string, updates: Partial<CustomAuditRule>): boolean {
    const result = updateCustomRuleUtil(id, updates);
    if (result) {
      customRules.value = loadCustomRules();
    }
    return result;
  }

  function deleteCustomRule(id: string): boolean {
    const result = deleteCustomRuleUtil(id);
    if (result) {
      customRules.value = loadCustomRules();
    }
    return result;
  }

  function toggleCustomRule(id: string): void {
    const rule = customRules.value.find(r => r.id === id);
    if (rule) {
      updateCustomRule(id, { enabled: !rule.enabled });
    }
  }

  function refreshSnapshots(): void {
    snapshots.value = loadSnapshots();
  }

  function saveCurrentSnapshot(name: string, description?: string): ComparisonSnapshot | null {
    const snapshotData = {
      name,
      description,
      selectedSchemeIds: [...selectedSchemeIds.value],
      filterCategory: filterCategory.value,
      showOnlyDiffs: showOnlyDiffs.value,
      auditFilter: auditFilter.value,
      sortConfig: { ...sortConfig.value },
      severityFilter: [...severityFilter.value],
      customRules: customRules.value.map(r => ({ ...r })),
    };
    const result = addSnapshotUtil(snapshotData);
    if (result) {
      snapshots.value = loadSnapshots();
    }
    return result;
  }

  function restoreSnapshot(snapshotId: string): boolean {
    const snapshot = snapshots.value.find(s => s.id === snapshotId);
    if (!snapshot) return false;
    
    selectedSchemeIds.value = [...snapshot.selectedSchemeIds];
    filterCategory.value = snapshot.filterCategory;
    showOnlyDiffs.value = snapshot.showOnlyDiffs;
    auditFilter.value = snapshot.auditFilter;
    sortConfig.value = { ...snapshot.sortConfig };
    severityFilter.value = [...snapshot.severityFilter];
    
    if (snapshot.customRules) {
      saveCustomRules(snapshot.customRules);
      customRules.value = [...snapshot.customRules];
    }
    
    saveSelectedIds([...selectedSchemeIds.value]);
    return true;
  }

  function deleteSnapshot(snapshotId: string): boolean {
    const result = deleteSnapshotUtil(snapshotId);
    if (result) {
      snapshots.value = loadSnapshots();
    }
    return result;
  }

  function updateSnapshotName(snapshotId: string, name: string): boolean {
    return updateSnapshotUtil(snapshotId, { name });
  }

  function refreshArchiveRecords(): void {
    archiveRecords.value = loadArchiveRecords();
  }

  function addToArchive(
    type: ArchiveItemType,
    name: string,
    data: Record<string, any>,
    description?: string,
    tags?: string[]
  ): ArchiveRecord | null {
    const recordData = {
      name,
      type,
      description,
      schemeCount: selectedSchemes.value.length,
      schemeNames: selectedSchemes.value.map(s => s.name),
      data,
      tags,
    };
    const result = addArchiveRecordUtil(recordData);
    if (result) {
      archiveRecords.value = loadArchiveRecords();
    }
    return result;
  }

  function archiveComparisonResult(name?: string): ArchiveRecord | null {
    if (!comparisonResult.value || !auditResult.value) return null;
    const archiveName = name || `对比结果_${new Date().toLocaleString('zh-CN')}`;
    return addToArchive(
      'comparison',
      archiveName,
      {
        comparison: JSON.parse(JSON.stringify(comparisonResult.value)),
        audit: JSON.parse(JSON.stringify(auditResult.value)),
        schemes: selectedSchemes.value.map(s => ({ id: s.id, name: s.name, params: s.params })),
      },
      `包含 ${selectedSchemes.value.length} 套方案对比`
    );
  }

  function archiveAuditResult(name?: string): ArchiveRecord | null {
    if (!auditResult.value) return null;
    const archiveName = name || `审校报告_${new Date().toLocaleString('zh-CN')}`;
    return addToArchive(
      'audit',
      archiveName,
      {
        audit: JSON.parse(JSON.stringify(auditResult.value)),
        schemes: selectedSchemes.value.map(s => ({ id: s.id, name: s.name, params: s.params })),
      },
      `包含 ${selectedSchemes.value.length} 套方案审校`
    );
  }

  function archiveExportRecord(format: string, count: number): ArchiveRecord | null {
    const archiveName = `批量导出_${format.toUpperCase()}_${new Date().toLocaleString('zh-CN')}`;
    return addToArchive(
      'export',
      archiveName,
      {
        format,
        count,
        schemes: selectedSchemes.value.map(s => ({ id: s.id, name: s.name })),
      },
      `导出 ${count} 个 ${format.toUpperCase()} 文件`
    );
  }

  function deleteArchiveRecord(recordId: string): boolean {
    const result = deleteArchiveRecordUtil(recordId);
    if (result) {
      archiveRecords.value = loadArchiveRecords();
    }
    return result;
  }

  function navigateToIssue(issueId: string, schemeId: string, field: string, category: DiffCategory): void {
    focusedIssue.value = {
      issueId,
      schemeId,
      field,
      category,
    };
  }

  function clearFocusedIssue(): void {
    focusedIssue.value = null;
  }

  function exportComparisonReport(options: ReportExportOptions): void {
    if (!comparisonResult.value || !auditResult.value) return;
    exportReport(selectedSchemes.value, comparisonResult.value, auditResult.value, options);
  }

  function exportReportWithCurrentTemplate(format: 'json' | 'csv' | 'txt'): void {
    if (!comparisonResult.value || !auditResult.value) return;
    exportReportWithTemplate(
      selectedSchemes.value,
      comparisonResult.value,
      auditResult.value,
      currentReportTemplate.value,
      format
    );
  }

  async function batchExport(format: 'json' | 'svg' | 'png', dpi?: number): Promise<void> {
    await batchExportSchemes(selectedSchemes.value, format, dpi);
    archiveExportRecord(format, selectedSchemes.value.length);
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
    sortConfig,
    severityFilter,
    selectedReportTemplate,
    customTemplateConfig,
    currentReportTemplate,
    customRules,
    snapshots,
    archiveRecords,
    archiveStats,
    focusedIssue,
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
    setSortConfig,
    toggleSortOrder,
    setSortField,
    toggleSeverityFilter,
    clearSeverityFilter,
    setSelectedReportTemplate,
    updateCustomTemplateConfig,
    refreshCustomRules,
    addCustomRule,
    updateCustomRule,
    deleteCustomRule,
    toggleCustomRule,
    refreshSnapshots,
    saveCurrentSnapshot,
    restoreSnapshot,
    deleteSnapshot,
    updateSnapshotName,
    refreshArchiveRecords,
    addToArchive,
    archiveComparisonResult,
    archiveAuditResult,
    archiveExportRecord,
    deleteArchiveRecord,
    navigateToIssue,
    clearFocusedIssue,
    exportComparisonReport,
    exportReportWithCurrentTemplate,
    batchExport,
  };
});
