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
} from '@vicons/ionicons5';
import type { SavedScheme } from '../types/layout';
import type { DiffCategory, DiffSeverity, ReportExportOptions } from '../types/comparison';
import {
  DIFF_CATEGORY_LABELS,
  AUDIT_ISSUE_TYPE_LABELS,
  MAX_COMPARE_SCHEMES,
} from '../types/comparison';

const comparisonStore = useComparisonStore();
const layoutStore = useLayoutStore();
const message = useMessage();
const dialog = useDialog();

const searchQuery = ref('');

const filteredAllSchemes = computed(() => {
  if (!searchQuery.value.trim()) return comparisonStore.allSchemes;
  const query = searchQuery.value.toLowerCase();
  return comparisonStore.allSchemes.filter(s =>
    s.name.toLowerCase().includes(query)
  );
});

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
  const options: ReportExportOptions = {
    format,
    includeDetails: true,
    includeSchemes: true,
  };
  comparisonStore.exportComparisonReport(options);
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
      message.success(`已导出 ${schemeCount} 个文件`);
    },
  });
}

function handleClose(): void {
  comparisonStore.closePanel();
}

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleString('zh-CN');
}
</script>

<template>
  <n-drawer
    :show="comparisonStore.showPanel"
    :width="960"
    placement="right"
    @update:show="(v: boolean) => { if (!v) comparisonStore.closePanel(); }"
  >
    <n-drawer-content title="版式对比与批量审校" :native-scrollbar="false">
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
                style="width: 200px"
              />
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

          <div class="scheme-list">
            <n-scrollbar>
              <n-list hoverable clickable>
                <n-list-item
                  v-for="scheme in filteredAllSchemes"
                  :key="scheme.id"
                  :class="{ selected: comparisonStore.isSelected(scheme.id) }"
                  @click="handleToggleScheme(scheme.id)"
                >
                  <template #prefix>
                    <n-checkbox :checked="comparisonStore.isSelected(scheme.id)" />
                  </template>
                  <div class="scheme-item">
                    <div class="scheme-name">{{ scheme.name }}</div>
                    <div class="scheme-meta">
                      {{ scheme.params.paperWidth }}×{{ scheme.params.paperHeight }}mm ·
                      {{ scheme.params.columnCount }}栏×{{ scheme.params.rowCount }}行
                    </div>
                  </div>
                  <template #suffix>
                    <n-button
                      size="tiny"
                      type="primary"
                      quaternary
                      @click.stop="handleApplyScheme(scheme)"
                    >
                      应用
                    </n-button>
                  </template>
                </n-list-item>
              </n-list>
              <n-empty
                v-if="filteredAllSchemes.length === 0"
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
                  <span class="diff-stat">
                    差异项:
                    <strong>{{ comparisonStore.comparisonResult?.summary.diffCount || 0 }}</strong>
                  </span>
                </div>
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
                          <td class="col-label">{{ item.label }}</td>
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
                    style="width: 140px"
                    @update:value="(v: any) => comparisonStore.setAuditFilter(v)"
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
                  <div v-if="comparisonStore.filteredAuditIssues.length > 0" class="audit-issues">
                    <div
                      v-for="issue in comparisonStore.filteredAuditIssues"
                      :key="issue.id"
                      class="audit-issue-item"
                      :class="`severity-${issue.severity}`"
                    >
                      <div class="issue-header">
                        <n-tag :type="severityColors[issue.severity as DiffSeverity]" size="small">
                          {{ AUDIT_ISSUE_TYPE_LABELS[issue.type] }}
                        </n-tag>
                        <span class="issue-scheme">{{ issue.schemeName }}</span>
                        <span class="issue-field">{{ issue.fieldLabel }}</span>
                        <span v-if="issue.value" class="issue-value">{{ issue.value }}</span>
                      </div>
                      <div class="issue-message">{{ issue.message }}</div>
                      <div v-if="issue.suggestion" class="issue-suggestion">
                        <span class="suggestion-label">建议：</span>
                        {{ issue.suggestion }}
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
            </n-tab-pane>

            <n-tab-pane name="report" tab="导出报告">
              <template #tab>
                <download-outline class="tab-icon" />
                导出报告
              </template>

              <div class="report-section">
                <div class="section-title">审校报告导出</div>
                <p class="section-desc">
                  导出包含参数差异、审校问题、方案详情的完整审校报告
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
                  将导出 {{ comparisonStore.selectedSchemes.length }} 套方案
                </p>
              </div>
            </n-tab-pane>
          </n-tabs>
        </div>
      </div>
    </n-drawer-content>
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

.col-value {
  min-width: 140px;
  font-family: 'Source Code Pro', monospace;
}

.diff-cell .value-text {
  color: #D48806;
  font-weight: 500;
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
</style>
