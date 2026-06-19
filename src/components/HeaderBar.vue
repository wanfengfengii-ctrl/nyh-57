<script setup lang="ts">
import { ref, computed, h, onMounted } from 'vue';
import { useLayoutStore } from '../stores/useLayoutStore';
import { useComparisonStore } from '../stores/useComparisonStore';
import { importFromFile } from '../utils/export';
import ComparisonPanel from './ComparisonPanel.vue';
import {
  useMessage,
  useDialog,
  NButton,
  NDropdown,
  NInput,
  NList,
  NListItem,
  NTag,
  NModal,
  NSpace,
  NThing,
  NBadge,
} from 'naive-ui';
import {
  DownloadOutline,
  CloudUploadOutline,
  RefreshOutline,
  BookOutline,
  SaveOutline,
  ListOutline,
  TimeOutline,
  ChevronDownOutline,
  GitCompareOutline,
} from '@vicons/ionicons5';
import type { LayoutParams, ExportOptions } from '../types/layout';

const store = useLayoutStore();
const comparisonStore = useComparisonStore();
const message = useMessage();
const dialog = useDialog();

onMounted(() => {
  comparisonStore.refreshSchemes();
});

const fileInputRef = ref<HTMLInputElement | null>(null);

const showExportNameDialog = ref(false);
const exportName = ref('');
const pendingExportOptions = ref<ExportOptions | null>(null);

const showSaveSchemeDialog = ref(false);
const newSchemeName = ref('');

const showSchemeManager = ref(false);
const editingSchemeId = ref<string | null>(null);
const editingSchemeName = ref('');

const showHistoryManager = ref(false);

const defaultExportName = computed(() =>
  `版式方案_${new Date().toLocaleString('zh-CN').replace(/[/:]/g, '-')}`
);

const exportDropdownOptions = [
  {
    label: 'JSON 方案文件',
    key: 'json',
  },
  {
    label: 'SVG 矢量图',
    key: 'svg',
  },
  {
    label: 'PNG 高清图 (300DPI)',
    key: 'png-300',
  },
  {
    label: 'PNG 标清图 (96DPI)',
    key: 'png-96',
  },
];

const actionTypeLabels: Record<string, string> = {
  create: '创建',
  update: '更新',
  import: '导入',
  reset: '重置',
  preset: '应用预设',
};

function formatTimestamp(ts: number): string {
  return new Date(ts).toLocaleString('zh-CN');
}

function handleExportSelect(key: string): void {
  if (!store.isValid) {
    message.warning('参数存在错误，请先修正后导出');
    return;
  }
  let options: ExportOptions;
  switch (key) {
    case 'json':
      options = { format: 'json' };
      break;
    case 'svg':
      options = { format: 'svg', includeDimensions: true };
      break;
    case 'png-300':
      options = { format: 'png', dpi: 300, includeDimensions: true };
      break;
    case 'png-96':
      options = { format: 'png', dpi: 96, includeDimensions: true };
      break;
    default:
      return;
  }
  pendingExportOptions.value = options;
  exportName.value = defaultExportName.value;
  showExportNameDialog.value = true;
}

async function confirmExport(): Promise<void> {
  if (!pendingExportOptions.value) return;
  const options: ExportOptions = {
    ...pendingExportOptions.value,
    name: exportName.value || undefined,
  };
  const ok = await store.exportData(options);
  if (ok) {
    message.success('导出成功');
  } else {
    message.error('导出失败');
  }
  showExportNameDialog.value = false;
  pendingExportOptions.value = null;
}

function handleImportClick(): void {
  fileInputRef.value?.click();
}

async function handleFileChange(e: Event): Promise<void> {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;

  const result = await importFromFile(file);

  if (!result.result.valid) {
    dialog.error({
      title: '导入失败',
      content: result.result.errors.join('\n'),
      positiveText: '确定',
    });
    input.value = '';
    return;
  }

  if (result.params) {
    dialog.warning({
      title: '确认导入',
      content: '导入将覆盖当前所有参数设置，是否继续？',
      positiveText: '确定导入',
      negativeText: '取消',
      onPositiveClick: () => {
        store.updateAllParams(result.params as LayoutParams);
        message.success('方案导入成功');
        input.value = '';
      },
      onNegativeClick: () => {
        input.value = '';
      },
      onClose: () => {
        input.value = '';
      },
    });
  }
}

function handleReset(): void {
  dialog.warning({
    title: '确认重置',
    content: '将重置所有参数为默认值，是否继续？',
    positiveText: '确定重置',
    negativeText: '取消',
    onPositiveClick: () => {
      store.resetParams();
      message.success('已重置为默认参数');
    },
  });
}

function openSaveSchemeDialog(): void {
  newSchemeName.value = '';
  showSaveSchemeDialog.value = true;
}

function confirmSaveScheme(): void {
  const name = newSchemeName.value.trim();
  if (!name) {
    message.warning('请输入方案名称');
    return;
  }
  const result = store.saveCurrentAsScheme(name);
  if (result) {
    message.success('方案已保存');
    showSaveSchemeDialog.value = false;
  } else {
    message.error('保存失败');
  }
}

function handleLoadScheme(id: string): void {
  const scheme = store.schemes.find(s => s.id === id);
  dialog.warning({
    title: '确认应用方案',
    content: `应用方案「${scheme?.name}」将覆盖当前参数，是否继续？`,
    positiveText: '确定应用',
    negativeText: '取消',
    onPositiveClick: () => {
      const ok = store.loadScheme(id);
      if (ok) message.success('方案已应用');
    },
  });
}

function handleUpdateScheme(id: string): void {
  const scheme = store.schemes.find(s => s.id === id);
  dialog.warning({
    title: '确认覆盖更新',
    content: `将使用当前参数覆盖方案「${scheme?.name}」，是否继续？`,
    positiveText: '确定覆盖',
    negativeText: '取消',
    onPositiveClick: () => {
      const ok = store.updateCurrentScheme(id);
      if (ok) message.success('方案已更新');
    },
  });
}

function startRenameScheme(id: string, name: string): void {
  editingSchemeId.value = id;
  editingSchemeName.value = name;
}

function confirmRenameScheme(): void {
  if (!editingSchemeId.value) return;
  const newName = editingSchemeName.value.trim();
  if (!newName) {
    message.warning('请输入方案名称');
    return;
  }
  const ok = store.renameExistingScheme(editingSchemeId.value, newName);
  if (ok) {
    message.success('方案已重命名');
  } else {
    message.error('重命名失败');
  }
  editingSchemeId.value = null;
  editingSchemeName.value = '';
}

function cancelRenameScheme(): void {
  editingSchemeId.value = null;
  editingSchemeName.value = '';
}

function handleRemoveScheme(id: string): void {
  const scheme = store.schemes.find(s => s.id === id);
  dialog.warning({
    title: '确认删除方案',
    content: `删除方案「${scheme?.name}」后无法恢复，是否继续？`,
    positiveText: '确定删除',
    negativeText: '取消',
    type: 'error',
    onPositiveClick: () => {
      const ok = store.removeScheme(id);
      if (ok) message.success('方案已删除');
    },
  });
}

function handleApplyHistory(id: string): void {
  const record = store.history.find(h => h.id === id);
  const desc = record?.description || actionTypeLabels[record?.action || ''] || '未知操作';
  dialog.warning({
    title: '确认恢复历史记录',
    content: `恢复至「${desc}」将覆盖当前参数，是否继续？`,
    positiveText: '确定恢复',
    negativeText: '取消',
    onPositiveClick: () => {
      const ok = store.applyHistoryRecord(id);
      if (ok) message.success('已恢复至该记录');
    },
  });
}

function handleRemoveHistory(id: string): void {
  dialog.warning({
    title: '确认删除记录',
    content: '删除该历史记录后无法恢复，是否继续？',
    positiveText: '确定删除',
    negativeText: '取消',
    onPositiveClick: () => {
      const ok = store.removeHistoryRecord(id);
      if (ok) message.success('记录已删除');
    },
  });
}

function handleClearAllHistory(): void {
  dialog.warning({
    title: '确认清空历史记录',
    content: '清空后所有历史记录将无法恢复，是否继续？',
    positiveText: '确定清空',
    negativeText: '取消',
    type: 'error',
    onPositiveClick: () => {
      store.clearAllHistory();
      message.success('历史记录已清空');
    },
  });
}
</script>

<template>
  <header class="header-bar">
    <div class="header-left">
      <div class="logo-icon">
        <BookOutline class="icon" />
      </div>
      <div class="header-text">
        <h1 class="app-title">古籍朱丝栏版式生成器</h1>
        <span class="app-subtitle">传统古籍版式设计工具</span>
      </div>
    </div>

    <div class="header-right">
      <n-button quaternary size="large" @click="handleReset">
        <template #icon>
          <refresh-outline />
        </template>
        重置
      </n-button>

      <n-button quaternary size="large" @click="handleImportClick">
        <template #icon>
          <cloud-upload-outline />
        </template>
        导入方案
      </n-button>

      <n-dropdown
        trigger="click"
        :options="exportDropdownOptions"
        @select="handleExportSelect"
      >
        <n-button type="primary" size="large">
          <template #icon>
            <download-outline />
          </template>
          <span style="display: inline-flex; align-items: center; gap: 2px;">
            导出
            <chevron-down-outline style="font-size: 16px" />
          </span>
        </n-button>
      </n-dropdown>

      <n-button quaternary size="large" @click="openSaveSchemeDialog">
        <template #icon>
          <save-outline />
        </template>
        保存方案
      </n-button>

      <n-button quaternary size="large" @click="showSchemeManager = true">
        <template #icon>
          <list-outline />
        </template>
        方案管理
      </n-button>

      <n-button quaternary size="large" @click="showHistoryManager = true">
        <template #icon>
          <time-outline />
        </template>
        历史记录
      </n-button>

      <n-button type="primary" size="large" @click="comparisonStore.openPanel">
        <template #icon>
          <n-badge
            :value="comparisonStore.selectedSchemeIds.length"
            :max="99"
            :show-zero="false"
            type="warning"
            style="margin-right: 4px"
          >
            <git-compare-outline />
          </n-badge>
        </template>
        对比审校
      </n-button>
    </div>

    <input
      ref="fileInputRef"
      type="file"
      accept=".json"
      style="display: none"
      @change="handleFileChange"
    />

    <n-modal
      v-model:show="showExportNameDialog"
      preset="dialog"
      title="导出方案"
      positive-text="导出"
      negative-text="取消"
      @positive-click="confirmExport"
    >
      <div class="export-dialog-content">
        <div class="form-item">
          <label class="form-label">方案名称</label>
          <n-input v-model:value="exportName" placeholder="请输入方案名称" clearable />
        </div>
        <div class="export-preview">
          <div class="preview-title">参数预览</div>
          <div class="preview-grid">
            <div class="preview-item">
              <span class="preview-label">纸张尺寸</span>
              <span class="preview-value">{{ store.params.paperWidth }} × {{ store.params.paperHeight }} mm</span>
            </div>
            <div class="preview-item">
              <span class="preview-label">版心尺寸</span>
              <span class="preview-value">{{ store.stats.printWidth.toFixed(1) }} × {{ store.stats.printHeight.toFixed(1) }} mm</span>
            </div>
            <div class="preview-item">
              <span class="preview-label">栏数 × 行数</span>
              <span class="preview-value">{{ store.params.columnCount }} × {{ store.params.rowCount }}</span>
            </div>
            <div class="preview-item">
              <span class="preview-label">栏线样式</span>
              <span class="preview-value">{{ store.params.lineThickness.toFixed(2) }}mm / {{ store.params.lineColor }}</span>
            </div>
          </div>
        </div>
      </div>
    </n-modal>

    <n-modal
      v-model:show="showSaveSchemeDialog"
      preset="dialog"
      title="保存方案"
      positive-text="保存"
      negative-text="取消"
      @positive-click="confirmSaveScheme"
    >
      <div class="dialog-content">
        <n-input
          v-model:value="newSchemeName"
          placeholder="请输入方案名称"
          clearable
          @keyup.enter="confirmSaveScheme"
        />
      </div>
    </n-modal>

    <n-modal v-model:show="showSchemeManager" preset="card" title="方案管理" style="width: 720px">
      <div class="manager-content">
        <div v-if="store.schemes.length === 0" class="empty-state">
          暂无保存的方案
        </div>
        <n-list v-else hoverable clickable>
          <n-list-item v-for="scheme in store.schemes" :key="scheme.id">
            <template #prefix>
              <list-outline class="list-icon" />
            </template>
            <div class="list-content">
              <div class="list-title">
                <div v-if="editingSchemeId !== scheme.id" class="scheme-name">
                  {{ scheme.name }}
                </div>
                <n-input
                  v-else
                  v-model:value="editingSchemeName"
                  size="small"
                  @keyup.enter="confirmRenameScheme"
                  @keyup.esc="cancelRenameScheme"
                />
              </div>
              <div class="list-description">
                创建于 {{ formatTimestamp(scheme.createdAt) }} · 更新于 {{ formatTimestamp(scheme.updatedAt) }}
              </div>
            </div>
            <template #suffix>
              <div class="action-buttons">
                <n-button
                  v-if="editingSchemeId !== scheme.id"
                  size="small"
                  type="primary"
                  @click.stop="handleLoadScheme(scheme.id)"
                >
                  应用
                </n-button>
                <n-button
                  v-if="editingSchemeId !== scheme.id"
                  size="small"
                  @click.stop="handleUpdateScheme(scheme.id)"
                >
                  覆盖更新
                </n-button>
                <template v-if="editingSchemeId === scheme.id">
                  <n-button size="small" type="primary" @click.stop="confirmRenameScheme">
                    确定
                  </n-button>
                  <n-button size="small" @click.stop="cancelRenameScheme">
                    取消
                  </n-button>
                </template>
                <n-button
                  v-else
                  size="small"
                  @click.stop="startRenameScheme(scheme.id, scheme.name)"
                >
                  重命名
                </n-button>
                <n-button
                  v-if="editingSchemeId !== scheme.id"
                  size="small"
                  type="error"
                  @click.stop="handleRemoveScheme(scheme.id)"
                >
                  删除
                </n-button>
              </div>
            </template>
          </n-list-item>
        </n-list>
      </div>
    </n-modal>

    <n-modal v-model:show="showHistoryManager" preset="card" title="历史记录" style="width: 760px">
      <template #header-extra>
        <n-button
          v-if="store.history.length > 0"
          size="small"
          type="error"
          quaternary
          @click="handleClearAllHistory"
        >
          清空全部
        </n-button>
      </template>
      <div class="manager-content">
        <div v-if="store.history.length === 0" class="empty-state">
          暂无历史记录
        </div>
        <n-list v-else hoverable clickable>
          <n-list-item v-for="record in store.history" :key="record.id">
            <template #prefix>
              <time-outline class="list-icon" />
            </template>
            <div class="list-content">
              <div class="list-title">
                <div class="history-title">
                  <n-tag size="small" class="action-tag">
                    {{ actionTypeLabels[record.action] || record.action }}
                  </n-tag>
                  <span class="history-desc">{{ record.description || '无描述' }}</span>
                </div>
              </div>
              <div class="list-description">
                {{ formatTimestamp(record.timestamp) }}
              </div>
            </div>
            <template #suffix>
              <div class="action-buttons">
                <n-button size="small" type="primary" @click.stop="handleApplyHistory(record.id)">
                  恢复
                </n-button>
                <n-button size="small" type="error" @click.stop="handleRemoveHistory(record.id)">
                  删除
                </n-button>
              </div>
            </template>
          </n-list-item>
        </n-list>
      </div>
    </n-modal>

    <ComparisonPanel />
  </header>
</template>

<style scoped>
.header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 32px;
  background: linear-gradient(135deg, #3D2914 0%, #5D4037 50%, #3D2914 100%);
  color: #F5EFE0;
  box-shadow: 0 4px 20px rgba(61, 41, 20, 0.3);
  position: relative;
  overflow: hidden;
  gap: 16px;
}

.header-bar::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background:
    repeating-linear-gradient(
      90deg,
      transparent,
      transparent 50px,
      rgba(196, 30, 58, 0.03) 50px,
      rgba(196, 30, 58, 0.03) 51px
    ),
    repeating-linear-gradient(
      0deg,
      transparent,
      transparent 50px,
      rgba(196, 30, 58, 0.03) 50px,
      rgba(196, 30, 58, 0.03) 51px
    );
  pointer-events: none;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
  position: relative;
  z-index: 1;
}

.logo-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #C41E3A 0%, #8B0000 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(196, 30, 58, 0.4);
  flex-shrink: 0;
}

.logo-icon .icon {
  width: 28px;
  height: 28px;
  color: #F5EFE0;
}

.header-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.app-title {
  font-size: 22px;
  font-weight: 700;
  margin: 0;
  font-family: 'Noto Serif SC', serif;
  letter-spacing: 2px;
  background: linear-gradient(135deg, #F5EFE0 0%, #D4C4A8 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  white-space: nowrap;
}

.app-subtitle {
  font-size: 12px;
  color: #BFAE94;
  letter-spacing: 1px;
}

.header-right {
  display: flex;
  gap: 12px;
  position: relative;
  z-index: 1;
  flex-wrap: wrap;
  justify-content: flex-end;
}

:deep(.n-button--quaternary) {
  color: #F5EFE0 !important;
  background: rgba(245, 239, 224, 0.1) !important;
  border: 1px solid rgba(245, 239, 224, 0.3) !important;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
}

:deep(.n-button--quaternary:hover) {
  background: rgba(245, 239, 224, 0.2) !important;
  border-color: rgba(245, 239, 224, 0.5) !important;
  transform: translateY(-1px);
}

:deep(.n-button--quaternary:active) {
  transform: translateY(0);
}

:deep(.n-button--primary-type) {
  background: linear-gradient(135deg, #C41E3A 0%, #8B0000 100%) !important;
  border-color: #C41E3A !important;
  box-shadow: 0 4px 12px rgba(196, 30, 58, 0.3) !important;
}

:deep(.n-button--primary-type:hover) {
  background: linear-gradient(135deg, #D32F4A 0%, #A00000 100%) !important;
  box-shadow: 0 6px 16px rgba(196, 30, 58, 0.4) !important;
}

.export-dialog-content {
  padding: 16px 0;
}

.dialog-content {
  padding: 8px 0;
}

.form-item {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #3D2914;
  margin-bottom: 8px;
}

.export-preview {
  background: #FAF5EB;
  border-radius: 8px;
  padding: 16px;
  border: 1px solid #E8DFCC;
}

.preview-title {
  font-size: 14px;
  font-weight: 600;
  color: #3D2914;
  margin-bottom: 12px;
}

.preview-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.preview-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.preview-label {
  font-size: 12px;
  color: #8B7355;
}

.preview-value {
  font-size: 14px;
  font-weight: 600;
  color: #3D2914;
  font-family: 'Source Code Pro', monospace;
}

.manager-content {
  max-height: 60vh;
  overflow-y: auto;
  padding: 8px 0;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: #999;
  font-size: 15px;
}

.list-icon {
  font-size: 18px;
  color: #8B7355;
}

.list-content {
  flex: 1;
  min-width: 0;
}

.list-title {
  font-size: 14px;
  color: #3D2914;
  margin-bottom: 4px;
}

.list-description {
  font-size: 12px;
  color: #8B7355;
}

.scheme-name {
  font-weight: 600;
  color: #3D2914;
}

.history-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.action-tag {
  flex-shrink: 0;
}

.history-desc {
  font-weight: 500;
  color: #3D2914;
}

.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}
</style>
