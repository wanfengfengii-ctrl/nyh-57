<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useComparisonStore } from '../stores/useComparisonStore';
import { useLayoutStore } from '../stores/useLayoutStore';
import { useMessage, useDialog } from 'naive-ui';
import {
  NButton,
  NDrawer,
  NDrawerContent,
  NTabs,
  NTabPane,
  NSelect,
  NCheckbox,
  NTag,
  NList,
  NListItem,
  NSpace,
  NInput,
  NBadge,
  NCard,
  NGrid,
  NGridItem,
  NStatistic,
  NDivider,
  NEmpty,
  NScrollbar,
  NDropdown,
  NModal,
  NForm,
  NFormItem,
  NInputNumber,
  NRadio,
  NRadioGroup,
  NSwitch,
  NDatePicker,
  NPagination,
  NTooltip,
} from 'naive-ui';
import {
  CloseOutline,
  AddOutline,
  RemoveOutline,
  TrashOutline,
  DownloadOutline,
  AlertCircleOutline,
  CheckmarkCircleOutline,
  InformationCircleOutline,
  WarningOutline,
  FileTrayFullOutline,
  GitCompareOutline,
  EyeOutline,
  EyeOffOutline,
  ChevronDownOutline,
  ChevronUpOutline,
  SaveOutline,
  ArrowUndoOutline,
  ArchiveOutline,
  SettingsOutline,
  LocateOutline,
  CopyOutline,
  PlayOutline,
  PauseOutline,
  FolderOutline,
  FolderOpenOutline,
  CheckmarkDoneOutline,
  SearchOutline,
  FilterOutline,
} from '@vicons/ionicons5';
import type { SavedScheme } from '../types/layout';
import type {
  DiffCategory,
  DiffSeverity,
  ReportExportOptions,
  SortField,
  SortOrder,
  ReportTemplate,
  CustomAuditRule,
  CustomRuleField,
  CustomRuleOperator,
  DiffItem,
  IssueStatus,
  SchemeReviewStatus,
  ArchiveItemType,
} from '../types/comparison';
import {
  DIFF_CATEGORY_LABELS,
  AUDIT_ISSUE_TYPE_LABELS,
  MAX_COMPARE_SCHEMES,
  SORT_FIELD_LABELS,
  SORT_ORDER_LABELS,
  REPORT_TEMPLATES,
  CUSTOM_RULE_FIELD_LABELS,
  CUSTOM_RULE_OPERATOR_LABELS,
  ARCHIVE_TYPE_LABELS,
  SEVERITY_ORDER,
  ISSUE_STATUS_LABELS,
  SCHEME_REVIEW_STATUS_LABELS,
  SCHEME_REVIEW_STATUS_COLORS,
  GROUP_COLORS,
} from '../types/comparison';

const comparisonStore = useComparisonStore();
const layoutStore = useLayoutStore();
const message = useMessage();
const dialog = useDialog();

const searchQuery = ref('');

const categoryOptions = [
  { label: '全部分类', value: 'all' },
  ...Object.entries(DIFF_CATEGORY_LABELS).map(([value, label]) => ({
    label,
    value,
  })),
];

const auditFilterOptions = [
  { label: '全部问题', value: 'all' },
  { label: '仅错误', value: 'error' },
  { label: '仅警告', value: 'warning' },
  { label: '仅提示', value: 'info' },
];

const sortFieldOptions = Object.entries(SORT_FIELD_LABELS).map(([value, label]) => ({
  label,
  value,
}));

type TagType = 'default' | 'error' | 'info' | 'success' | 'warning' | 'primary';

const severityColors: Record<DiffSeverity, TagType> = {
  error: 'error',
  warning: 'warning',
  info: 'info',
  success: 'success',
};

const severityIcons: Record<DiffSeverity, any> = {
  error: AlertCircleOutline,
  warning: WarningOutline,
  info: InformationCircleOutline,
  success: CheckmarkCircleOutline,
};

const severityFilterOptions: { label: string; value: DiffSeverity; type: TagType }[] = [
  { label: '错误', value: 'error', type: 'error' },
  { label: '警告', value: 'warning', type: 'warning' },
  { label: '提示', value: 'info', type: 'info' },
  { label: '正常', value: 'success', type: 'success' },
];

function handleToggleScheme(schemeId: string): void {
  if (!comparisonStore.isSelected(schemeId) && comparisonStore.isMaxReached) {
    message.warning(`最多只能对比 ${MAX_COMPARE_SCHEMES} 套方案`);
    return;
  }
  comparisonStore.toggleScheme(schemeId);
}

function handleApplyScheme(scheme: SavedScheme): void {
  dialog.warning({
    title: '确认应用方案',
    content: `应用方案「${scheme.name}」将覆盖当前参数，是否继续？`,
    positiveText: '确定应用',
    negativeText: '取消',
    onPositiveClick: () => {
      const ok = layoutStore.loadScheme(scheme.id);
      if (ok) {
        message.success('方案已应用');
        comparisonStore.closePanel();
      }
    },
  });
}

function handleClearAll(): void {
  dialog.warning({
    title: '确认清空',
    content: '将清空所有已选方案，是否继续？',
    positiveText: '确定清空',
    negativeText: '取消',
    onPositiveClick: () => {
      comparisonStore.clearAll();
      message.info('已清空选择');
    },
  });
}

function handleExportReport(format: 'json' | 'csv' | 'txt'): void {
  if (!comparisonStore.comparisonResult || !comparisonStore.auditResult) {
    message.warning('请先选择至少两套方案进行对比');
    return;
  }
  comparisonStore.exportReportWithCurrentTemplate(format);
  message.success('报告导出成功');
}

const batchExportOptions = [
  { label: '批量导出 JSON', key: 'json' },
  { label: '批量导出 SVG', key: 'svg' },
  { label: '批量导出 PNG (300DPI)', key: 'png-300' },
  { label: '批量导出 PNG (96DPI)', key: 'png-96' },
];

async function handleBatchExport(key: string): Promise<void> {
  if (comparisonStore.selectedSchemes.length === 0) {
    message.warning('请先选择方案');
    return;
  }

  let format: 'json' | 'svg' | 'png' = 'json';
  let dpi = 300;

  switch (key) {
    case 'json':
      format = 'json';
      break;
    case 'svg':
      format = 'svg';
      break;
    case 'png-300':
      format = 'png';
      dpi = 300;
      break;
    case 'png-96':
      format = 'png';
      dpi = 96;
      break;
    default:
      return;
  }

  const schemeCount = comparisonStore.selectedSchemes.length;
  dialog.warning({
    title: '确认批量导出',
    content: `将导出 ${schemeCount} 套方案的 ${format.toUpperCase()} 文件，是否继续？`,
    positiveText: '确定导出',
    negativeText: '取消',
    onPositiveClick: async () => {
      message.loading(`正在导出 ${schemeCount} 个文件...`, { duration: 2000 });
      await comparisonStore.batchExport(format, dpi);
      message.success(`已导出 ${schemeCount} 个文件，记录已归档`);
    },
  });
}

function handleClose(): void {
  comparisonStore.closePanel();
}

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleString('zh-CN');
}

function handleSortFieldChange(field: SortField): void {
  comparisonStore.setSortField(field);
}

function handleToggleSortOrder(): void {
  comparisonStore.toggleSortOrder();
}

function handleToggleSeverity(severity: DiffSeverity): void {
  comparisonStore.toggleSeverityFilter(severity);
}

function handleClearSeverityFilter(): void {
  comparisonStore.clearSeverityFilter();
}

function handleNavigateToIssue(issue: any): void {
  comparisonStore.navigateToIssue(issue.id, issue.schemeId, issue.field, issue.category);
  const scheme = comparisonStore.selectedSchemes.find(s => s.id === issue.schemeId);
  if (scheme) {
    const ok = layoutStore.loadScheme(scheme.id);
    if (ok) {
      message.info(`已定位到方案「${scheme.name}」的 ${issue.fieldLabel}`);
      comparisonStore.setActiveTab('comparison');
    }
  }
}

const showSnapshotDialog = ref(false);
const snapshotName = ref('');
const snapshotDescription = ref('');

function handleSaveSnapshot(): void {
  if (comparisonStore.selectedSchemes.length === 0) {
    message.warning('请先选择至少一套方案');
    return;
  }
  snapshotName.value = `快照_${new Date().toLocaleString('zh-CN')}`;
  snapshotDescription.value = '';
  showSnapshotDialog.value = true;
}

function confirmSaveSnapshot(): void {
  if (!snapshotName.value.trim()) {
    message.warning('请输入快照名称');
    return;
  }
  const result = comparisonStore.saveCurrentSnapshot(
    snapshotName.value.trim(),
    snapshotDescription.value.trim() || undefined
  );
  if (result) {
    message.success('快照保存成功');
    showSnapshotDialog.value = false;
  } else {
    message.error('快照保存失败');
  }
}

function handleRestoreSnapshot(snapshotId: string): void {
  dialog.warning({
    title: '确认恢复快照',
    content: '恢复快照将覆盖当前的选择和筛选设置，是否继续？',
    positiveText: '确定恢复',
    negativeText: '取消',
    onPositiveClick: () => {
      const ok = comparisonStore.restoreSnapshot(snapshotId);
      if (ok) {
        message.success('快照已恢复');
      } else {
        message.error('快照恢复失败');
      }
    },
  });
}

function handleDeleteSnapshot(snapshotId: string): void {
  dialog.warning({
    title: '确认删除',
    content: '删除后将无法恢复，是否继续？',
    positiveText: '确定删除',
    negativeText: '取消',
    onPositiveClick: () => {
      const ok = comparisonStore.deleteSnapshot(snapshotId);
      if (ok) {
        message.success('快照已删除');
      }
    },
  });
}

function handleArchiveComparison(): void {
  if (!comparisonStore.comparisonResult) {
    message.warning('请先选择至少两套方案进行对比');
    return;
  }
  const result = comparisonStore.archiveComparisonResult();
  if (result) {
    message.success('对比结果已归档');
  }
}

function handleArchiveAudit(): void {
  if (!comparisonStore.auditResult) {
    message.warning('请先选择方案进行审校');
    return;
  }
  const result = comparisonStore.archiveAuditResult();
  if (result) {
    message.success('审校报告已归档');
  }
}

function handleDeleteArchive(recordId: string): void {
  dialog.warning({
    title: '确认删除',
    content: '删除归档记录后将无法恢复，是否继续？',
    positiveText: '确定删除',
    negativeText: '取消',
    onPositiveClick: () => {
      const ok = comparisonStore.deleteArchiveRecord(recordId);
      if (ok) {
        message.success('归档记录已删除');
      }
    },
  });
}

const showRuleDialog = ref(false);
const editingRule = ref<CustomAuditRule | null>(null);
const isNewRule = ref(false);

const ruleForm = ref({
  name: '',
  description: '',
  field: 'paperWidth' as CustomRuleField,
  operator: 'gt' as CustomRuleOperator,
  value: 0,
  value2: 0,
  severity: 'warning' as DiffSeverity,
  category: 'paper' as DiffCategory,
  suggestion: '',
  enabled: true,
});

const customRuleFieldOptions = Object.entries(CUSTOM_RULE_FIELD_LABELS).map(([value, label]) => ({
  label,
  value,
}));

const customRuleOperatorOptions = Object.entries(CUSTOM_RULE_OPERATOR_LABELS).map(([value, label]) => ({
  label,
  value,
}));

const customRuleCategoryOptions = Object.entries(DIFF_CATEGORY_LABELS).map(([value, label]) => ({
  label,
  value,
}));

function handleAddRule(): void {
  isNewRule.value = true;
  editingRule.value = null;
  ruleForm.value = {
    name: '',
    description: '',
    field: 'paperWidth',
    operator: 'gt',
    value: 0,
    value2: 0,
    severity: 'warning',
    category: 'paper',
    suggestion: '',
    enabled: true,
  };
  showRuleDialog.value = true;
}

function handleEditRule(rule: CustomAuditRule): void {
  isNewRule.value = false;
  editingRule.value = rule;
  ruleForm.value = {
    name: rule.name,
    description: rule.description,
    field: rule.field,
    operator: rule.operator,
    value: rule.value,
    value2: rule.value2 || 0,
    severity: rule.severity,
    category: rule.category,
    suggestion: rule.suggestion || '',
    enabled: rule.enabled,
  };
  showRuleDialog.value = true;
}

function handleSaveRule(): void {
  if (!ruleForm.value.name.trim()) {
    message.warning('请输入规则名称');
    return;
  }

  if (isNewRule.value) {
    const result = comparisonStore.addCustomRule({
      name: ruleForm.value.name.trim(),
      description: ruleForm.value.description.trim(),
      field: ruleForm.value.field,
      operator: ruleForm.value.operator,
      value: ruleForm.value.value,
      value2: ruleForm.value.operator === 'between' ? ruleForm.value.value2 : undefined,
      severity: ruleForm.value.severity,
      category: ruleForm.value.category,
      suggestion: ruleForm.value.suggestion.trim() || undefined,
      enabled: ruleForm.value.enabled,
    });
    if (result) {
      message.success('规则添加成功');
      showRuleDialog.value = false;
    } else {
      message.error('规则添加失败');
    }
  } else if (editingRule.value) {
    const ok = comparisonStore.updateCustomRule(editingRule.value.id, {
      name: ruleForm.value.name.trim(),
      description: ruleForm.value.description.trim(),
      field: ruleForm.value.field,
      operator: ruleForm.value.operator,
      value: ruleForm.value.value,
      value2: ruleForm.value.operator === 'between' ? ruleForm.value.value2 : undefined,
      severity: ruleForm.value.severity,
      category: ruleForm.value.category,
      suggestion: ruleForm.value.suggestion.trim() || undefined,
      enabled: ruleForm.value.enabled,
    });
    if (ok) {
      message.success('规则更新成功');
      showRuleDialog.value = false;
    } else {
      message.error('规则更新失败');
    }
  }
}

function handleDeleteRule(ruleId: string): void {
  dialog.warning({
    title: '确认删除',
    content: '删除自定义规则后将无法恢复，是否继续？',
    positiveText: '确定删除',
    negativeText: '取消',
    onPositiveClick: () => {
      const ok = comparisonStore.deleteCustomRule(ruleId);
      if (ok) {
        message.success('规则已删除');
      }
    },
  });
}

function handleToggleRule(ruleId: string): void {
  comparisonStore.toggleCustomRule(ruleId);
}

function handleTemplateChange(templateId: ReportTemplate): void {
  comparisonStore.setSelectedReportTemplate(templateId);
}

function isSeveritySelected(severity: DiffSeverity): boolean {
  return comparisonStore.severityFilter.includes(severity);
}

const showGroupDialog = ref(false);
const newGroupName = ref('');
const newGroupDesc = ref('');
const newGroupColor = ref(GROUP_COLORS[0]);

const showAssignGroupDialog = ref(false);
const assignGroupSchemeId = ref<string | null>(null);

const showReviewDialog = ref(false);
const reviewSchemeId = ref<string | null>(null);
const reviewForm = ref({
  status: 'approved' as SchemeReviewStatus,
  reviewer: '',
  comment: '',
});

const issueStatusFilterOptions: { label: string; value: IssueStatus | 'all' }[] = [
  { label: '全部状态', value: 'all' },
  { label: '待处理', value: 'open' },
  { label: '已解决', value: 'resolved' },
  { label: '已忽略', value: 'ignored' },
];

const archiveTypeFilterOptions = [
  { label: '全部类型', value: 'all' },
  ...Object.entries(ARCHIVE_TYPE_LABELS).map(([value, label]) => ({
    label,
    value,
  })),
];

const groupOptions = computed(() => [
  { label: '全部分组', value: 'all' },
  ...comparisonStore.schemeGroups.map(g => ({
    label: `${g.name} (${g.schemeIds.length})`,
    value: g.id,
  })),
]);

const filteredSchemesByGroup = computed(() => {
  return comparisonStore.groupedSchemes;
});

const searchedSchemes = computed(() => {
  const schemes = filteredSchemesByGroup.value;
  if (!searchQuery.value.trim()) return schemes;
  const query = searchQuery.value.toLowerCase();
  return schemes.filter(s =>
    s.name.toLowerCase().includes(query)
  );
});

function handleCreateGroup(): void {
  if (!newGroupName.value.trim()) {
    message.warning('请输入分组名称');
    return;
  }
  const result = comparisonStore.createGroup(
    newGroupName.value.trim(),
    newGroupDesc.value.trim() || undefined,
    newGroupColor.value
  );
  if (result) {
    message.success('分组创建成功');
    showGroupDialog.value = false;
    newGroupName.value = '';
    newGroupDesc.value = '';
    newGroupColor.value = GROUP_COLORS[0];
  } else {
    message.error('分组创建失败');
  }
}

function handleDeleteGroup(groupId: string): void {
  dialog.warning({
    title: '确认删除',
    content: '删除分组不会删除方案，是否继续？',
    positiveText: '确定删除',
    negativeText: '取消',
    onPositiveClick: () => {
      const ok = comparisonStore.removeGroup(groupId);
      if (ok) {
        message.success('分组已删除');
      }
    },
  });
}

function handleSelectGroup(groupId: string | 'all'): void {
  comparisonStore.setActiveGroup(groupId);
}

function handleSelectAllInGroup(groupId: string): void {
  comparisonStore.selectAllSchemesInGroup(groupId);
  message.info('已选中分组内方案');
}

function handleAssignGroup(schemeId: string): void {
  assignGroupSchemeId.value = schemeId;
  showAssignGroupDialog.value = true;
}

function handleAddToGroup(groupId: string): void {
  if (!assignGroupSchemeId.value) return;
  const ok = comparisonStore.addSchemeToGroup(groupId, assignGroupSchemeId.value);
  if (ok) {
    message.success('已添加到分组');
    showAssignGroupDialog.value = false;
  } else {
    message.warning('该方案已在分组中');
  }
}

function handleRemoveFromGroup(groupId: string, schemeId: string): void {
  const ok = comparisonStore.removeSchemeFromGroup(groupId, schemeId);
  if (ok) {
    message.success('已从分组移除');
  }
}

function handleIssueStatusChange(issueId: string, status: IssueStatus): void {
  comparisonStore.setIssueStatus(issueId, status);
  message.success(`问题已标记为${ISSUE_STATUS_LABELS[status]}`);
}

function handleIssueStatusFilterChange(filter: IssueStatus | 'all'): void {
  comparisonStore.setIssueStatusFilter(filter);
}

function handleReviewScheme(schemeId: string): void {
  reviewSchemeId.value = schemeId;
  const currentStatus = comparisonStore.getSchemeReviewStatus(schemeId);
  reviewForm.value = {
    status: currentStatus,
    reviewer: '',
    comment: '',
  };
  showReviewDialog.value = true;
}

function handleSaveReview(): void {
  if (!reviewSchemeId.value) return;
  comparisonStore.setSchemeReviewStatus(
    reviewSchemeId.value,
    reviewForm.value.status,
    reviewForm.value.reviewer.trim() || undefined,
    reviewForm.value.comment.trim() || undefined
  );
  message.success('审核状态已更新');
  showReviewDialog.value = false;
}

function handleArchiveSearch(query: string): void {
  comparisonStore.setArchiveFilter({ searchQuery: query });
}

function handleArchiveTypeFilter(type: ArchiveItemType | 'all'): void {
  comparisonStore.setArchiveFilter({ type });
}

function handleArchiveDateRangeChange(range: [number, number] | null): void {
  if (range) {
    comparisonStore.setArchiveFilter({
      dateRange: { start: range[0], end: range[1] },
    });
  } else {
    comparisonStore.setArchiveFilter({
      dateRange: { start: null, end: null },
    });
  }
}

function handleResetArchiveFilter(): void {
  comparisonStore.resetArchiveFilter();
}

function getSchemeGroupNames(schemeId: string): string[] {
  return comparisonStore.schemeGroups
    .filter(g => g.schemeIds.includes(schemeId))
    .map(g => g.name);
}
</script>

<template>
  <n-drawer
    :show="comparisonStore.showPanel"
    :width="960"
    placement="right"
    @update:show="(v: boolean) => { if (!v) comparisonStore.closePanel(); }"
  >
    <n-drawer-content title="版式对比审校增强版" :native-scrollbar="false">
      <template #header-extra>
        <n-button quaternary size="small" @click="handleClose">
          <template #icon>
            <close-outline />
          </template>
        </n-button>
      </template>

      <div class="comparison-drawer">
        <div class="scheme-selector">
          <div class="selector-header">
            <div class="selector-title">
              <file-tray-full-outline class="title-icon" />
              <span>选择对比方案</span>
              <n-tag size="small" type="info">
                {{ comparisonStore.selectedSchemeIds.length }}/{{ MAX_COMPARE_SCHEMES }}
              </n-tag>
            </div>
            <div class="selector-actions">
              <n-input
                v-model:value="searchQuery"
                placeholder="搜索方案..."
                size="small"
                clearable
                style="width: 160px"
              />
              <n-button size="small" quaternary @click="showGroupDialog = true">
                <template #icon>
                  <add-outline />
                </template>
                新建分组
              </n-button>
              <n-button
                v-if="comparisonStore.selectedSchemeIds.length > 0"
                size="small"
                quaternary
                @click="handleClearAll"
              >
                <template #icon>
                  <trash-outline />
                </template>
                清空
              </n-button>
            </div>
          </div>

          <div class="group-filter-bar">
            <n-select
              :value="comparisonStore.activeGroupId"
              :options="groupOptions"
              size="small"
              style="width: 160px"
              @update:value="handleSelectGroup"
            />
            <div v-if="comparisonStore.activeGroupId !== 'all'" class="group-actions">
              <n-button size="tiny" type="primary" quaternary @click="handleSelectAllInGroup(comparisonStore.activeGroupId)">
                全选此分组
              </n-button>
              <n-button size="tiny" type="error" quaternary @click="handleDeleteGroup(comparisonStore.activeGroupId)">
                删除分组
              </n-button>
            </div>
          </div>

          <div v-if="comparisonStore.schemeGroups.length > 0" class="group-tabs">
            <n-space size="small">
              <n-tag
                :type="comparisonStore.activeGroupId === 'all' ? 'primary' : 'default'"
                class="group-tab"
                @click="handleSelectGroup('all')"
              >
                全部
              </n-tag>
              <n-tag
                v-for="group in comparisonStore.schemeGroups"
                :key="group.id"
                :type="comparisonStore.activeGroupId === group.id ? 'primary' : 'default'"
                :color="comparisonStore.activeGroupId === group.id ? { color: group.color || '#C41E3A', textColor: '#fff' } : undefined"
                class="group-tab"
                @click="handleSelectGroup(group.id)"
              >
                {{ group.name }} ({{ group.schemeIds.length }})
              </n-tag>
            </n-space>
          </div>

          <div class="scheme-list">
            <n-scrollbar>
              <n-list hoverable clickable>
                <n-list-item
                  v-for="scheme in searchedSchemes"
                  :key="scheme.id"
                  :class="{ selected: comparisonStore.isSelected(scheme.id) }"
                  @click="handleToggleScheme(scheme.id)"
                >
                  <template #prefix>
                    <n-checkbox :checked="comparisonStore.isSelected(scheme.id)" />
                  </template>
                  <div class="scheme-item">
                    <div class="scheme-name-row">
                      <span class="scheme-name">{{ scheme.name }}</span>
                      <n-tag
                        size="tiny"
                        :color="{ color: SCHEME_REVIEW_STATUS_COLORS[comparisonStore.getSchemeReviewStatus(scheme.id)], textColor: '#fff' }"
                        class="review-badge"
                      >
                        {{ SCHEME_REVIEW_STATUS_LABELS[comparisonStore.getSchemeReviewStatus(scheme.id)] }}
                      </n-tag>
                    </div>
                    <div class="scheme-meta">
                      {{ scheme.params.paperWidth }}×{{ scheme.params.paperHeight }}mm ·
                      {{ scheme.params.columnCount }}栏×{{ scheme.params.rowCount }}行
                    </div>
                    <div v-if="getSchemeGroupNames(scheme.id).length > 0" class="scheme-groups">
                      <n-tag
                        v-for="gName in getSchemeGroupNames(scheme.id)"
                        :key="gName"
                        size="tiny"
                        type="info"
                      >
                        {{ gName }}
                      </n-tag>
                    </div>
                  </div>
                  <template #suffix>
                    <n-space :size="4">
                      <n-button
                        size="tiny"
                        quaternary
                        @click.stop="handleAssignGroup(scheme.id)"
                      >
                        <template #icon>
                          <folder-outline />
                        </template>
                      </n-button>
                      <n-button
                        size="tiny"
                        quaternary
                        @click.stop="handleReviewScheme(scheme.id)"
                      >
                        <template #icon>
                          <checkmark-done-outline />
                        </template>
                      </n-button>
                      <n-button
                        size="tiny"
                        type="primary"
                        quaternary
                        @click.stop="handleApplyScheme(scheme)"
                      >
                        应用
                      </n-button>
                    </n-space>
                  </template>
                </n-list-item>
              </n-list>
              <n-empty
                v-if="searchedSchemes.length === 0"
                description="暂无方案，请先保存方案"
                size="small"
              />
            </n-scrollbar>
          </div>
        </div>

        <div class="comparison-content">
          <n-tabs
            :value="comparisonStore.activeTab"
            @update:value="(v: any) => comparisonStore.setActiveTab(v)"
            type="line"
          >
            <n-tab-pane name="comparison" tab="参数对比">
              <template #tab>
                <n-badge
                  :value="comparisonStore.comparisonResult?.summary.diffCount || 0"
                  :max="99"
                  :show-zero="false"
                  type="warning"
                >
                  <git-compare-outline class="tab-icon" />
                  参数对比
                </n-badge>
              </template>

              <div class="tab-toolbar">
                <div class="toolbar-left">
                  <n-select
                    v-model:value="comparisonStore.filterCategory"
                    :options="categoryOptions"
                    size="small"
                    style="width: 140px"
                    @update:value="(v: any) => comparisonStore.setFilterCategory(v)"
                  />
                  <n-button
                    size="small"
                    :type="comparisonStore.showOnlyDiffs ? 'primary' : 'default'"
                    @click="comparisonStore.setShowOnlyDiffs(!comparisonStore.showOnlyDiffs)"
                  >
                    <template #icon>
                      <component :is="comparisonStore.showOnlyDiffs ? EyeOutline : EyeOffOutline" />
                    </template>
                    {{ comparisonStore.showOnlyDiffs ? '仅看差异' : '显示全部' }}
                  </n-button>
                </div>
                <div class="toolbar-right">
                  <n-space>
                    <span class="toolbar-label">排序:</span>
                    <n-select
                      :value="comparisonStore.sortConfig.field"
                      :options="sortFieldOptions"
                      size="small"
                      style="width: 120px"
                      @update:value="(v: any) => handleSortFieldChange(v)"
                    />
                    <n-button size="small" @click="handleToggleSortOrder">
                      <template #icon>
                        <component :is="comparisonStore.sortConfig.order === 'asc' ? ChevronUpOutline : ChevronDownOutline" />
                      </template>
                      {{ SORT_ORDER_LABELS[comparisonStore.sortConfig.order] }}
                    </n-button>
                  </n-space>
                </div>
              </div>

              <div class="severity-filter-bar">
                <span class="filter-label">严重程度:</span>
                <n-space size="small">
                  <n-tag
                    v-for="opt in severityFilterOptions"
                    :key="opt.value"
                    :type="isSeveritySelected(opt.value) ? opt.type : 'default'"
                    :bordered="true"
                    class="severity-tag"
                    @click="handleToggleSeverity(opt.value)"
                  >
                    {{ opt.label }}
                  </n-tag>
                  <n-button
                    v-if="comparisonStore.severityFilter.length > 0"
                    size="tiny"
                    text
                    @click="handleClearSeverityFilter"
                  >
                    清除筛选
                  </n-button>
                </n-space>
              </div>

              <div class="comparison-table-wrapper">
                <n-scrollbar x-scrollable>
                  <table v-if="comparisonStore.comparisonResult" class="comparison-table">
                    <thead>
                      <tr>
                        <th class="col-category">分类</th>
                        <th class="col-label">参数</th>
                        <th
                          v-for="scheme in comparisonStore.comparisonResult.schemes"
                          :key="scheme.schemeId"
                          class="col-value"
                        >
                          {{ scheme.schemeName }}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <template v-for="item in comparisonStore.filteredDiffItems" :key="item.key">
                        <tr :class="{ 'has-diff': item.hasDiff }">
                          <td class="col-category">
                            <n-tag size="small" :type="item.hasDiff ? 'warning' : 'default'">
                              {{ DIFF_CATEGORY_LABELS[item.category] }}
                            </n-tag>
                          </td>
                          <td class="col-label">
                            <div class="label-with-severity">
                              <span>{{ item.label }}</span>
                              <n-tag size="tiny" :type="severityColors[item.severity]" class="severity-badge">
                                {{ item.severity }}
                              </n-tag>
                            </div>
                          </td>
                          <td
                            v-for="(value, idx) in item.values"
                            :key="idx"
                            class="col-value"
                            :class="{ 'diff-cell': item.hasDiff }"
                          >
                            <span class="value-text">{{ value }}</span>
                          </td>
                        </tr>
                      </template>
                    </tbody>
                  </table>
                  <n-empty
                    v-else
                    description="请至少选择两套方案进行对比"
                    size="large"
                  />
                </n-scrollbar>
              </div>

              <div class="tab-footer">
                <n-space>
                  <n-button size="small" type="primary" @click="handleSaveSnapshot">
                    <template #icon>
                      <save-outline />
                    </template>
                    保存快照
                  </n-button>
                  <n-button size="small" @click="handleArchiveComparison">
                    <template #icon>
                      <archive-outline />
                    </template>
                    归档对比
                  </n-button>
                </n-space>
                <span class="diff-stat">
                  差异项:
                  <strong>{{ comparisonStore.comparisonResult?.summary.diffCount || 0 }}</strong>
                </span>
              </div>
            </n-tab-pane>

            <n-tab-pane name="audit" tab="批量审校">
              <template #tab>
                <n-badge
                  :value="comparisonStore.auditResult?.summary.totalIssues || 0"
                  :max="99"
                  :show-zero="false"
                  type="error"
                >
                  <alert-circle-outline class="tab-icon" />
                  批量审校
                </n-badge>
              </template>

              <div class="tab-toolbar">
                <div class="toolbar-left">
                  <n-select
                    v-model:value="comparisonStore.auditFilter"
                    :options="auditFilterOptions"
                    size="small"
                    style="width: 120px"
                    @update:value="(v: any) => comparisonStore.setAuditFilter(v)"
                  />
                  <n-select
                    :value="comparisonStore.issueStatusFilter"
                    :options="issueStatusFilterOptions"
                    size="small"
                    style="width: 120px"
                    @update:value="(v: any) => handleIssueStatusFilterChange(v)"
                  />
                </div>
                <div class="toolbar-right">
                  <n-space>
                    <span class="audit-stat error">
                      错误: <strong>{{ comparisonStore.auditResult?.summary.errorCount || 0 }}</strong>
                    </span>
                    <span class="audit-stat warning">
                      警告: <strong>{{ comparisonStore.auditResult?.summary.warningCount || 0 }}</strong>
                    </span>
                    <span class="audit-stat info">
                      提示: <strong>{{ comparisonStore.auditResult?.summary.infoCount || 0 }}</strong>
                    </span>
                  </n-space>
                </div>
              </div>

              <div v-if="comparisonStore.auditResult" class="audit-summary">
                <n-grid :cols="4" :x-gap="12" :y-gap="12">
                  <n-grid-item>
                    <n-card size="small">
                      <n-statistic
                        label="方案总数"
                        :value="comparisonStore.auditResult.summary.totalSchemes"
                      />
                    </n-card>
                  </n-grid-item>
                  <n-grid-item>
                    <n-card size="small">
                      <n-statistic
                        label="通过方案"
                        :value="comparisonStore.auditResult.summary.passCount"
                        value-style="color: #18a058"
                      />
                    </n-card>
                  </n-grid-item>
                  <n-grid-item>
                    <n-card size="small">
                      <n-statistic
                        label="问题总数"
                        :value="comparisonStore.auditResult.summary.totalIssues"
                        value-style="color: #d03050"
                      />
                    </n-card>
                  </n-grid-item>
                  <n-grid-item>
                    <n-card size="small">
                      <n-statistic
                        label="严重错误"
                        :value="comparisonStore.auditResult.summary.errorCount"
                        value-style="color: #d03050"
                      />
                    </n-card>
                  </n-grid-item>
                </n-grid>

                <div class="conclusions">
                  <div class="conclusions-title">审校结论</div>
                  <ul>
                    <li v-for="(conclusion, idx) in comparisonStore.auditResult.conclusions" :key="idx">
                      {{ conclusion }}
                    </li>
                  </ul>
                </div>
              </div>

              <div class="audit-issues-wrapper">
                <n-scrollbar>
                  <div v-if="comparisonStore.filteredAuditIssuesWithStatus.length > 0" class="audit-issues">
                    <div
                      v-for="issue in comparisonStore.filteredAuditIssuesWithStatus"
                      :key="issue.id"
                      class="audit-issue-item"
                      :class="[`severity-${issue.severity}`, `status-${issue.trackingStatus}`]"
                    >
                      <div class="issue-header">
                        <n-tag :type="severityColors[issue.severity as DiffSeverity]" size="small">
                          {{ AUDIT_ISSUE_TYPE_LABELS[issue.type] }}
                        </n-tag>
                        <n-tag
                          size="tiny"
                          :type="issue.trackingStatus === 'resolved' ? 'success' : issue.trackingStatus === 'ignored' ? 'default' : 'warning'"
                          class="tracking-badge"
                        >
                          {{ ISSUE_STATUS_LABELS[issue.trackingStatus] }}
                        </n-tag>
                        <span class="issue-scheme">{{ issue.schemeName }}</span>
                        <span class="issue-field">{{ issue.fieldLabel }}</span>
                        <span v-if="issue.value" class="issue-value">{{ issue.value }}</span>
                        <div class="issue-actions">
                          <n-button size="tiny" type="primary" quaternary @click="handleNavigateToIssue(issue)">
                            <template #icon>
                              <locate-outline />
                            </template>
                            定位
                          </n-button>
                          <n-dropdown
                            trigger="click"
                            :options="[
                              { label: '标记待处理', key: 'open' },
                              { label: '标记已解决', key: 'resolved' },
                              { label: '标记已忽略', key: 'ignored' },
                            ]"
                            @select="(key: string) => handleIssueStatusChange(issue.id, key as IssueStatus)"
                          >
                            <n-button size="tiny" quaternary>
                              <template #icon>
                                <checkmark-done-outline />
                              </template>
                              状态
                            </n-button>
                          </n-dropdown>
                        </div>
                      </div>
                      <div class="issue-message">{{ issue.message }}</div>
                      <div v-if="issue.suggestion" class="issue-suggestion">
                        <span class="suggestion-label">建议：</span>
                        {{ issue.suggestion }}
                      </div>
                      <div v-if="issue.trackingNote" class="issue-tracking-note">
                        <span class="tracking-note-label">备注：</span>
                        {{ issue.trackingNote }}
                      </div>
                    </div>
                  </div>
                  <n-empty
                    v-else-if="comparisonStore.selectedSchemes.length > 0"
                    description="未发现问题"
                    size="small"
                  />
                  <n-empty
                    v-else
                    description="请先选择方案进行审校"
                    size="large"
                  />
                </n-scrollbar>
              </div>

              <div class="tab-footer">
                <n-button size="small" @click="handleArchiveAudit">
                  <template #icon>
                    <archive-outline />
                  </template>
                  归档审校
                </n-button>
              </div>
            </n-tab-pane>

            <n-tab-pane name="report" tab="导出报告">
              <template #tab>
                <download-outline class="tab-icon" />
                导出报告
              </template>

              <div class="report-section">
                <div class="section-title">报告模板</div>
                <div class="template-list">
                  <div
                    v-for="template in REPORT_TEMPLATES"
                    :key="template.id"
                    class="template-item"
                    :class="{ active: comparisonStore.selectedReportTemplate === template.id }"
                    @click="handleTemplateChange(template.id)"
                  >
                    <div class="template-name">{{ template.name }}</div>
                    <div class="template-desc">{{ template.description }}</div>
                  </div>
                </div>
              </div>

              <n-divider />

              <div class="report-section">
                <div class="section-title">审校报告导出</div>
                <p class="section-desc">
                  使用「{{ comparisonStore.currentReportTemplate.name }}」导出包含参数差异、审校问题的报告
                </p>
                <n-space>
                  <n-button type="primary" @click="handleExportReport('json')">
                    <template #icon>
                      <download-outline />
                    </template>
                    导出 JSON 报告
                  </n-button>
                  <n-button @click="handleExportReport('csv')">
                    <template #icon>
                      <download-outline />
                    </template>
                    导出 CSV 报告
                  </n-button>
                  <n-button @click="handleExportReport('txt')">
                    <template #icon>
                      <download-outline />
                    </template>
                    导出 TXT 报告
                  </n-button>
                </n-space>
              </div>

              <n-divider />

              <div class="report-section">
                <div class="section-title">批量导出方案</div>
                <p class="section-desc">
                  批量导出当前选中的所有方案文件（JSON/SVG/PNG）
                </p>
                <n-dropdown
                  trigger="click"
                  :options="batchExportOptions"
                  @select="handleBatchExport"
                >
                  <n-button type="primary">
                    <template #icon>
                      <download-outline />
                    </template>
                    <span style="display: inline-flex; align-items: center; gap: 4px;">
                      批量导出方案
                      <chevron-down-outline style="font-size: 16px" />
                    </span>
                  </n-button>
                </n-dropdown>
                <p v-if="comparisonStore.selectedSchemes.length > 0" class="export-hint">
                  将导出 {{ comparisonStore.selectedSchemes.length }} 套方案，导出记录自动归档
                </p>
              </div>
            </n-tab-pane>

            <n-tab-pane name="snapshot" tab="对比快照">
              <template #tab>
                <save-outline class="tab-icon" />
                对比快照
              </template>

              <div class="snapshot-section">
                <div class="section-header">
                  <div class="section-title">快照管理</div>
                  <n-button size="small" type="primary" @click="handleSaveSnapshot">
                    <template #icon>
                      <add-outline />
                    </template>
                    保存当前状态
                  </n-button>
                </div>
                <p class="section-desc">
                  保存当前的方案选择、筛选条件和排序设置，方便日后快速恢复
                </p>

                <div v-if="comparisonStore.snapshots.length > 0" class="snapshot-list">
                  <n-scrollbar>
                    <n-list hoverable>
                      <n-list-item
                        v-for="snapshot in comparisonStore.snapshots"
                        :key="snapshot.id"
                        class="snapshot-item"
                      >
                        <div class="snapshot-info">
                          <div class="snapshot-name">{{ snapshot.name }}</div>
                          <div class="snapshot-meta">
                            <span>{{ formatTimestamp(snapshot.createdAt) }}</span>
                            <span class="snapshot-schemes">
                              {{ snapshot.selectedSchemeIds.length }} 套方案
                            </span>
                          </div>
                          <div v-if="snapshot.description" class="snapshot-desc">
                            {{ snapshot.description }}
                          </div>
                        </div>
                        <div class="snapshot-actions">
                          <n-button size="tiny" type="primary" quaternary @click="handleRestoreSnapshot(snapshot.id)">
                            <template #icon>
                              <arrow-undo-outline />
                            </template>
                            恢复
                          </n-button>
                          <n-button size="tiny" type="error" quaternary @click="handleDeleteSnapshot(snapshot.id)">
                            <template #icon>
                              <trash-outline />
                            </template>
                            删除
                          </n-button>
                        </div>
                      </n-list-item>
                    </n-list>
                  </n-scrollbar>
                </div>
                <n-empty v-else description="暂无快照，保存当前对比状态以创建快照" />
              </div>
            </n-tab-pane>

            <n-tab-pane name="archive" tab="统一归档">
              <template #tab>
                <archive-outline class="tab-icon" />
                统一归档
              </template>

              <div class="archive-section">
                <div class="section-header">
                  <div class="section-title">归档记录</div>
                </div>

                <div class="archive-search-bar">
                  <n-input
                    :value="comparisonStore.archiveFilter.searchQuery"
                    placeholder="搜索归档记录..."
                    size="small"
                    clearable
                    @update:value="handleArchiveSearch"
                  >
                    <template #prefix>
                      <search-outline />
                    </template>
                  </n-input>
                  <n-select
                    :value="comparisonStore.archiveFilter.type"
                    :options="archiveTypeFilterOptions"
                    size="small"
                    style="width: 130px; flex-shrink: 0"
                    @update:value="handleArchiveTypeFilter"
                  />
                  <n-date-picker
                    type="daterange"
                    size="small"
                    clearable
                    placeholder="选择日期范围"
                    style="width: 240px; flex-shrink: 0"
                    @update:value="handleArchiveDateRangeChange"
                  />
                  <n-button size="small" quaternary @click="handleResetArchiveFilter">
                    <template #icon>
                      <filter-outline />
                    </template>
                    重置
                  </n-button>
                </div>

                <div class="archive-stats">
                  <n-grid :cols="5" :x-gap="8" :y-gap="8">
                    <n-grid-item>
                      <n-statistic label="总记录" :value="comparisonStore.archiveStats.totalRecords" />
                    </n-grid-item>
                    <n-grid-item>
                      <n-statistic label="对比结果" :value="comparisonStore.archiveStats.comparisonCount" />
                    </n-grid-item>
                    <n-grid-item>
                      <n-statistic label="审校报告" :value="comparisonStore.archiveStats.auditCount" />
                    </n-grid-item>
                    <n-grid-item>
                      <n-statistic label="导出记录" :value="comparisonStore.archiveStats.exportCount" />
                    </n-grid-item>
                    <n-grid-item>
                      <n-statistic label="涉及方案" :value="comparisonStore.archiveStats.totalSchemes" />
                    </n-grid-item>
                  </n-grid>
                </div>

                <div v-if="comparisonStore.filteredArchiveRecords.length > 0" class="archive-list">
                  <n-scrollbar>
                    <n-list hoverable>
                      <n-list-item
                        v-for="record in comparisonStore.filteredArchiveRecords"
                        :key="record.id"
                        class="archive-item"
                      >
                        <div class="archive-info">
                          <div class="archive-header">
                            <n-tag size="small" type="info">
                              {{ ARCHIVE_TYPE_LABELS[record.type] }}
                            </n-tag>
                            <span class="archive-name">{{ record.name }}</span>
                          </div>
                          <div class="archive-meta">
                            <span>{{ formatTimestamp(record.createdAt) }}</span>
                            <span class="archive-schemes">
                              {{ record.schemeCount }} 套方案
                            </span>
                          </div>
                          <div v-if="record.description" class="archive-desc">
                            {{ record.description }}
                          </div>
                          <div v-if="record.schemeNames && record.schemeNames.length > 0" class="archive-scheme-names">
                            <n-tag
                              v-for="name in record.schemeNames.slice(0, 3)"
                              :key="name"
                              size="tiny"
                              type="default"
                            >
                              {{ name }}
                            </n-tag>
                            <n-tag v-if="record.schemeNames.length > 3" size="tiny">
                              +{{ record.schemeNames.length - 3 }}
                            </n-tag>
                          </div>
                        </div>
                        <div class="archive-actions">
                          <n-button size="tiny" type="error" quaternary @click="handleDeleteArchive(record.id)">
                            <template #icon>
                              <trash-outline />
                            </template>
                            删除
                          </n-button>
                        </div>
                      </n-list-item>
                    </n-list>
                  </n-scrollbar>
                </div>
                <n-empty v-else description="暂无匹配的归档记录" />
              </div>
            </n-tab-pane>

            <n-tab-pane name="rules" tab="审校规则">
              <template #tab>
                <settings-outline class="tab-icon" />
                自定义规则
              </template>

              <div class="rules-section">
                <div class="section-header">
                  <div class="section-title">自定义审校规则</div>
                  <n-button size="small" type="primary" @click="handleAddRule">
                    <template #icon>
                      <add-outline />
                    </template>
                    添加规则
                  </n-button>
                </div>
                <p class="section-desc">
                  定义自己的审校规则，系统将根据规则自动检查方案参数
                </p>

                <div v-if="comparisonStore.customRules.length > 0" class="rules-list">
                  <n-scrollbar>
                    <n-list hoverable>
                      <n-list-item
                        v-for="rule in comparisonStore.customRules"
                        :key="rule.id"
                        class="rule-item"
                        :class="{ disabled: !rule.enabled }"
                      >
                        <div class="rule-header">
                          <n-switch
                            :value="rule.enabled"
                            size="small"
                            @update:value="() => handleToggleRule(rule.id)"
                          />
                          <span class="rule-name">{{ rule.name }}</span>
                          <n-tag size="small" :type="severityColors[rule.severity]">
                            {{ rule.severity }}
                          </n-tag>
                        </div>
                        <div class="rule-desc">
                          {{ CUSTOM_RULE_FIELD_LABELS[rule.field] }}
                          {{ CUSTOM_RULE_OPERATOR_LABELS[rule.operator] }}
                          {{ rule.operator === 'between' && rule.value2 !== undefined 
                            ? `${rule.value} ~ ${rule.value2}` 
                            : rule.value }}
                        </div>
                        <div v-if="rule.description" class="rule-note">
                          {{ rule.description }}
                        </div>
                        <div class="rule-actions">
                          <n-button size="tiny" quaternary @click="handleEditRule(rule)">
                            <template #icon>
                              <settings-outline />
                            </template>
                            编辑
                          </n-button>
                          <n-button size="tiny" type="error" quaternary @click="handleDeleteRule(rule.id)">
                            <template #icon>
                              <trash-outline />
                            </template>
                            删除
                          </n-button>
                        </div>
                      </n-list-item>
                    </n-list>
                  </n-scrollbar>
                </div>
                <n-empty v-else description="暂无自定义规则，点击添加创建您的第一条规则" />
              </div>
            </n-tab-pane>
          </n-tabs>
        </div>
      </div>
    </n-drawer-content>

    <n-modal
      v-model:show="showSnapshotDialog"
      preset="dialog"
      title="保存快照"
      positive-text="保存"
      negative-text="取消"
      @positive-click="confirmSaveSnapshot"
    >
      <n-form>
        <n-form-item label="快照名称" required>
          <n-input v-model:value="snapshotName" placeholder="请输入快照名称" />
        </n-form-item>
        <n-form-item label="描述">
          <n-input
            v-model:value="snapshotDescription"
            type="textarea"
            placeholder="可选：添加快照描述"
            :autosize="{ minRows: 2, maxRows: 4 }"
          />
        </n-form-item>
      </n-form>
    </n-modal>

    <n-modal
      v-model:show="showRuleDialog"
      preset="dialog"
      :title="isNewRule ? '添加规则' : '编辑规则'"
      positive-text="保存"
      negative-text="取消"
      @positive-click="handleSaveRule"
      style="width: 500px"
    >
      <n-form>
        <n-form-item label="规则名称" required>
          <n-input v-model:value="ruleForm.name" placeholder="请输入规则名称" />
        </n-form-item>
        <n-form-item label="规则描述">
          <n-input
            v-model:value="ruleForm.description"
            type="textarea"
            placeholder="可选：添加规则描述"
            :autosize="{ minRows: 2, maxRows: 3 }"
          />
        </n-form-item>
        <n-form-item label="检查字段" required>
          <n-select
            v-model:value="ruleForm.field"
            :options="customRuleFieldOptions"
          />
        </n-form-item>
        <n-form-item label="比较条件" required>
          <n-select
            v-model:value="ruleForm.operator"
            :options="customRuleOperatorOptions"
          />
        </n-form-item>
        <n-form-item label="阈值" required>
          <n-input-number v-model:value="ruleForm.value" style="width: 100%" />
        </n-form-item>
        <n-form-item v-if="ruleForm.operator === 'between'" label="上限值" required>
          <n-input-number v-model:value="ruleForm.value2" style="width: 100%" />
        </n-form-item>
        <n-form-item label="严重程度" required>
          <n-radio-group v-model:value="ruleForm.severity">
            <n-radio value="error">错误</n-radio>
            <n-radio value="warning">警告</n-radio>
            <n-radio value="info">提示</n-radio>
          </n-radio-group>
        </n-form-item>
        <n-form-item label="所属分类" required>
          <n-select
            v-model:value="ruleForm.category"
            :options="customRuleCategoryOptions"
          />
        </n-form-item>
        <n-form-item label="改进建议">
          <n-input
            v-model:value="ruleForm.suggestion"
            type="textarea"
            placeholder="可选：添加改进建议"
            :autosize="{ minRows: 2, maxRows: 3 }"
          />
        </n-form-item>
        <n-form-item label="启用状态">
          <n-switch v-model:value="ruleForm.enabled" />
        </n-form-item>
      </n-form>
    </n-modal>

    <n-modal
      v-model:show="showGroupDialog"
      preset="dialog"
      title="新建方案分组"
      positive-text="创建"
      negative-text="取消"
      @positive-click="handleCreateGroup"
    >
      <n-form>
        <n-form-item label="分组名称" required>
          <n-input v-model:value="newGroupName" placeholder="请输入分组名称" />
        </n-form-item>
        <n-form-item label="分组描述">
          <n-input
            v-model:value="newGroupDesc"
            type="textarea"
            placeholder="可选：添加分组描述"
            :autosize="{ minRows: 2, maxRows: 3 }"
          />
        </n-form-item>
        <n-form-item label="分组颜色">
          <n-space>
            <div
              v-for="color in GROUP_COLORS"
              :key="color"
              class="color-option"
              :class="{ active: newGroupColor === color }"
              :style="{ background: color }"
              @click="newGroupColor = color"
            />
          </n-space>
        </n-form-item>
      </n-form>
    </n-modal>

    <n-modal
      v-model:show="showAssignGroupDialog"
      preset="dialog"
      title="分配到分组"
      positive-text="确定"
      negative-text="取消"
      :show-icon="false"
    >
      <div class="assign-group-list">
        <n-empty v-if="comparisonStore.schemeGroups.length === 0" description="暂无分组，请先创建分组" />
        <div
          v-for="group in comparisonStore.schemeGroups"
          :key="group.id"
          class="assign-group-item"
          @click="handleAddToGroup(group.id)"
        >
          <div class="assign-group-color" :style="{ background: group.color || '#8B7355' }" />
          <div class="assign-group-info">
            <div class="assign-group-name">{{ group.name }}</div>
            <div class="assign-group-count">{{ group.schemeIds.length }} 套方案</div>
          </div>
        </div>
      </div>
    </n-modal>

    <n-modal
      v-model:show="showReviewDialog"
      preset="dialog"
      title="方案审核"
      positive-text="保存"
      negative-text="取消"
      @positive-click="handleSaveReview"
    >
      <n-form>
        <n-form-item label="审核状态" required>
          <n-radio-group v-model:value="reviewForm.status">
            <n-radio value="pending">待审核</n-radio>
            <n-radio value="in_review">审核中</n-radio>
            <n-radio value="approved">已通过</n-radio>
            <n-radio value="rejected">已驳回</n-radio>
          </n-radio-group>
        </n-form-item>
        <n-form-item label="审核人">
          <n-input v-model:value="reviewForm.reviewer" placeholder="可选：输入审核人" />
        </n-form-item>
        <n-form-item label="审核意见">
          <n-input
            v-model:value="reviewForm.comment"
            type="textarea"
            placeholder="可选：输入审核意见"
            :autosize="{ minRows: 2, maxRows: 4 }"
          />
        </n-form-item>
      </n-form>
    </n-modal>
  </n-drawer>
</template>

<style scoped>
.comparison-drawer {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 16px;
}

.scheme-selector {
  flex-shrink: 0;
  background: #FAF5EB;
  border: 1px solid #E8DFCC;
  border-radius: 8px;
  padding: 12px;
}

.selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.selector-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #3D2914;
  font-size: 14px;
}

.title-icon {
  font-size: 18px;
  color: #8B7355;
}

.selector-actions {
  display: flex;
  gap: 8px;
}

.scheme-list {
  max-height: 180px;
}

:deep(.n-list-item) {
  padding: 8px 12px !important;
}

.scheme-item {
  flex: 1;
  min-width: 0;
}

.scheme-name {
  font-size: 13px;
  font-weight: 500;
  color: #3D2914;
  margin-bottom: 2px;
}

.scheme-meta {
  font-size: 11px;
  color: #8B7355;
}

:deep(.n-list-item.selected) {
  background: rgba(196, 30, 58, 0.08) !important;
  border-left: 3px solid #C41E3A;
}

.comparison-content {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

:deep(.n-tabs) {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

:deep(.n-tabs-content) {
  flex: 1;
  overflow: hidden;
}

:deep(.n-tab-pane) {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.tab-icon {
  font-size: 16px;
  margin-right: 4px;
}

.tab-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #E8DFCC;
  margin-bottom: 12px;
}

.toolbar-left {
  display: flex;
  gap: 8px;
  align-items: center;
}

.toolbar-right {
  display: flex;
  align-items: center;
}

.toolbar-label {
  font-size: 13px;
  color: #8B7355;
}

.severity-filter-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 12px;
  border-bottom: 1px solid #E8DFCC;
  margin-bottom: 12px;
}

.filter-label {
  font-size: 13px;
  color: #8B7355;
}

.severity-tag {
  cursor: pointer;
  transition: all 0.2s;
}

.severity-tag:hover {
  opacity: 0.8;
}

.diff-stat {
  font-size: 13px;
  color: #8B7355;
}

.diff-stat strong {
  color: #C41E3A;
  font-size: 15px;
  margin-left: 4px;
}

.comparison-table-wrapper {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.comparison-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.comparison-table th {
  background: #F5EFE0;
  color: #3D2914;
  font-weight: 600;
  padding: 10px 12px;
  text-align: left;
  border-bottom: 2px solid #D4C4A8;
  position: sticky;
  top: 0;
  z-index: 1;
  white-space: nowrap;
}

.comparison-table td {
  padding: 8px 12px;
  border-bottom: 1px solid #E8DFCC;
  color: #5D4037;
}

.comparison-table tr:hover td {
  background: #FAF5EB;
}

.comparison-table tr.has-diff td {
  background: rgba(255, 193, 7, 0.08);
}

.comparison-table tr.has-diff:hover td {
  background: rgba(255, 193, 7, 0.15);
}

.col-category {
  width: 80px;
}

.col-label {
  width: 120px;
  font-weight: 500;
  color: #3D2914 !important;
}

.label-with-severity {
  display: flex;
  align-items: center;
  gap: 6px;
}

.severity-badge {
  font-size: 10px;
  height: 16px;
  line-height: 16px;
  padding: 0 4px;
}

.col-value {
  min-width: 140px;
  font-family: 'Source Code Pro', monospace;
}

.diff-cell .value-text {
  color: #D48806;
  font-weight: 500;
}

.tab-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #E8DFCC;
  margin-top: 12px;
  flex-shrink: 0;
}

.audit-summary {
  margin-bottom: 16px;
}

.conclusions {
  margin-top: 16px;
  background: #F0F7EB;
  border: 1px solid #B8D4A0;
  border-radius: 6px;
  padding: 12px 16px;
}

.conclusions-title {
  font-weight: 600;
  color: #3D6B2E;
  margin-bottom: 8px;
  font-size: 13px;
}

.conclusions ul {
  margin: 0;
  padding-left: 20px;
  color: #4A6B3D;
  font-size: 13px;
}

.conclusions li {
  margin-bottom: 4px;
}

.audit-issues-wrapper {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.audit-issues {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.audit-issue-item {
  border: 1px solid #E8DFCC;
  border-radius: 6px;
  padding: 12px;
  background: #FAF5EB;
}

.audit-issue-item.severity-error {
  border-color: #F5B8B8;
  background: #FFF0F0;
}

.audit-issue-item.severity-warning {
  border-color: #FFE0A8;
  background: #FFF9EB;
}

.audit-issue-item.severity-info {
  border-color: #B8D8F0;
  background: #F0F7FF;
}

.issue-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}

.issue-scheme {
  font-weight: 600;
  color: #3D2914;
  font-size: 13px;
}

.issue-field {
  color: #8B7355;
  font-size: 12px;
}

.issue-value {
  font-family: 'Source Code Pro', monospace;
  font-size: 12px;
  color: #5D4037;
  background: rgba(0, 0, 0, 0.05);
  padding: 2px 6px;
  border-radius: 3px;
}

.issue-actions {
  margin-left: auto;
}

.issue-message {
  color: #5D4037;
  font-size: 13px;
  line-height: 1.5;
}

.issue-suggestion {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #E8DFCC;
  color: #8B7355;
  font-size: 12px;
}

.suggestion-label {
  font-weight: 600;
  color: #6B8E23;
}

.audit-stat {
  font-size: 12px;
  color: #8B7355;
}

.audit-stat strong {
  font-size: 14px;
  margin-left: 4px;
}

.audit-stat.error strong {
  color: #D03050;
}

.audit-stat.warning strong {
  color: #D48806;
}

.audit-stat.info strong {
  color: #2080F0;
}

.report-section {
  padding: 16px 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #3D2914;
  margin-bottom: 8px;
}

.section-desc {
  font-size: 13px;
  color: #8B7355;
  margin-bottom: 12px;
}

.export-hint {
  margin-top: 10px;
  font-size: 12px;
  color: #8B7355;
}

.template-list {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.template-item {
  padding: 12px;
  border: 2px solid #E8DFCC;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  background: #FAF5EB;
}

.template-item:hover {
  border-color: #D4C4A8;
  background: #F5EFE0;
}

.template-item.active {
  border-color: #C41E3A;
  background: rgba(196, 30, 58, 0.05);
}

.template-name {
  font-weight: 600;
  color: #3D2914;
  font-size: 14px;
  margin-bottom: 4px;
}

.template-desc {
  font-size: 12px;
  color: #8B7355;
  line-height: 1.4;
}

.snapshot-section,
.archive-section,
.rules-section {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.snapshot-list,
.archive-list,
.rules-list {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.snapshot-item,
.archive-item,
.rule-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 12px !important;
  border-bottom: 1px solid #E8DFCC;
}

.snapshot-info,
.archive-info,
.rule-item > div:not(.rule-actions) {
  flex: 1;
  min-width: 0;
}

.snapshot-name,
.archive-name,
.rule-name {
  font-weight: 600;
  color: #3D2914;
  font-size: 14px;
  margin-bottom: 4px;
}

.snapshot-meta,
.archive-meta,
.rule-desc {
  font-size: 12px;
  color: #8B7355;
  display: flex;
  gap: 12px;
  margin-bottom: 4px;
}

.snapshot-schemes,
.archive-schemes {
  color: #C41E3A;
}

.snapshot-desc,
.archive-desc,
.rule-note {
  font-size: 12px;
  color: #8B7355;
  margin-bottom: 6px;
}

.archive-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.archive-scheme-names {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}

.snapshot-actions,
.archive-actions,
.rule-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.archive-stats {
  margin-bottom: 16px;
  padding: 12px;
  background: #FAF5EB;
  border-radius: 8px;
  border: 1px solid #E8DFCC;
}

.rule-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.rule-item.disabled {
  opacity: 0.5;
}

:deep(.n-statistic-label) {
  font-size: 12px !important;
}

:deep(.n-statistic-value) {
  font-size: 20px !important;
}

.group-filter-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.group-actions {
  display: flex;
  gap: 4px;
}

.group-tabs {
  margin-bottom: 8px;
  overflow-x: auto;
}

.group-tab {
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s;
}

.group-tab:hover {
  opacity: 0.8;
}

.scheme-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.review-badge {
  font-size: 10px;
  line-height: 1;
  flex-shrink: 0;
}

.scheme-groups {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}

.tracking-badge {
  flex-shrink: 0;
}

.audit-issue-item.status-resolved {
  opacity: 0.7;
}

.audit-issue-item.status-ignored {
  opacity: 0.4;
}

.issue-tracking-note {
  margin-top: 6px;
  padding-top: 6px;
  border-top: 1px dashed #B8D4A0;
  color: #4A6B3D;
  font-size: 12px;
}

.tracking-note-label {
  font-weight: 600;
}

.archive-search-bar {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #E8DFCC;
}

.color-option {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.color-option:hover {
  transform: scale(1.2);
}

.color-option.active {
  border-color: #3D2914;
  box-shadow: 0 0 0 2px #FAF5EB, 0 0 0 4px #3D2914;
}

.assign-group-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
}

.assign-group-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid #E8DFCC;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  background: #FAF5EB;
}

.assign-group-item:hover {
  border-color: #C41E3A;
  background: rgba(196, 30, 58, 0.05);
}

.assign-group-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  flex-shrink: 0;
}

.assign-group-info {
  flex: 1;
}

.assign-group-name {
  font-weight: 600;
  color: #3D2914;
  font-size: 14px;
}

.assign-group-count {
  font-size: 12px;
  color: #8B7355;
}
</style>
