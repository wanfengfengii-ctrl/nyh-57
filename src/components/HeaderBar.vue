<script setup lang="ts">
import { ref } from 'vue';
import { useLayoutStore } from '../stores/useLayoutStore';
import { exportToFile, importFromFile } from '../utils/export';
import { useMessage, useDialog } from 'naive-ui';
import { DownloadOutline, CloudUploadOutline, RefreshOutline, BookOutline } from '@vicons/ionicons5';
import type { LayoutParams } from '../types/layout';

const store = useLayoutStore();
const message = useMessage();
const dialog = useDialog();

const fileInputRef = ref<HTMLInputElement | null>(null);
const showExportDialog = ref(false);
const exportName = ref('');

function handleExport(): void {
  exportName.value = `版式方案_${new Date().toLocaleString('zh-CN').replace(/[/:]/g, '-')}`;
  showExportDialog.value = true;
}

function confirmExport(): void {
  if (!store.isValid) {
    message.warning('当前参数存在错误，请先修正后再导出');
    return;
  }
  exportToFile(store.params, exportName.value || undefined);
  message.success('方案导出成功');
  showExportDialog.value = false;
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
      <button class="header-btn" @click="handleReset">
        <RefreshOutline class="btn-icon" />
        <span>重置</span>
      </button>
      <button class="header-btn" @click="handleImportClick">
        <CloudUploadOutline class="btn-icon" />
        <span>导入方案</span>
      </button>
      <button class="header-btn primary" @click="handleExport">
        <DownloadOutline class="btn-icon" />
        <span>导出方案</span>
      </button>
    </div>

    <input
      ref="fileInputRef"
      type="file"
      accept=".json"
      style="display: none"
      @change="handleFileChange"
    />

    <n-modal v-model:show="showExportDialog" preset="dialog" title="导出方案" positive-text="导出" negative-text="取消" @positive-click="confirmExport">
      <div class="export-dialog-content">
        <div class="form-item">
          <label class="form-label">方案名称</label>
          <input
            v-model="exportName"
            type="text"
            class="form-input"
            placeholder="请输入方案名称"
          />
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
}

.header-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border: 1px solid rgba(245, 239, 224, 0.3);
  border-radius: 8px;
  background: rgba(245, 239, 224, 0.1);
  color: #F5EFE0;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
}

.header-btn:hover {
  background: rgba(245, 239, 224, 0.2);
  border-color: rgba(245, 239, 224, 0.5);
  transform: translateY(-1px);
}

.header-btn:active {
  transform: translateY(0);
}

.header-btn.primary {
  background: linear-gradient(135deg, #C41E3A 0%, #8B0000 100%);
  border-color: #C41E3A;
  box-shadow: 0 4px 12px rgba(196, 30, 58, 0.3);
}

.header-btn.primary:hover {
  background: linear-gradient(135deg, #D32F4A 0%, #A00000 100%);
  box-shadow: 0 6px 16px rgba(196, 30, 58, 0.4);
}

.btn-icon {
  width: 18px;
  height: 18px;
}

.export-dialog-content {
  padding: 16px 0;
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

.form-input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid #D4C4A8;
  border-radius: 6px;
  font-size: 14px;
  color: #3D2914;
  background: #FAF5EB;
  transition: border-color 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: #C41E3A;
  background: #fff;
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
</style>
