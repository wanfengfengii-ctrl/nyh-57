<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useLayoutStore } from '../stores/useLayoutStore';
import { FISHTAIL_OPTIONS, ANNOTATION_POSITION_OPTIONS, PAPER_PRESETS, MARGIN_LINK_MODES } from '../types/layout';
import type { FishtailType, AnnotationPosition, PaperPreset, MarginLinkMode } from '../types/layout';
import { NForm, NFormItem, NInputNumber, NSelect, NCollapse, NCollapseItem, NSlider, NColorPicker } from 'naive-ui';

const store = useLayoutStore();
const paperExpanded = ref(['paper', 'print', 'margin', 'grid', 'line', 'fishtail', 'annotation']);

const lineColorPresets = [
  { label: '朱红 (传统)', value: '#C41E3A' },
  { label: '墨黑', value: '#1A1A1A' },
  { label: '藏蓝', value: '#2E4A62' },
  { label: '石绿', value: '#2E624A' },
  { label: '赭石', value: '#8B4513' },
];

const localPrintWidth = ref(store.stats.printWidth);
const localPrintHeight = ref(store.stats.printHeight);
watch(
  () => store.stats.printWidth,
  (v) => { localPrintWidth.value = v; }
);
watch(
  () => store.stats.printHeight,
  (v) => { localPrintHeight.value = v; }
);

const fieldErrors = ref<Record<string, string | null>>({});

function validateField<K extends keyof typeof store.params>(key: K, value: any): string | null {
  const err = store.validateSingle(key, value);
  fieldErrors.value[key] = err;
  return err;
}

function clearFieldError(key: string): void {
  fieldErrors.value[key] = null;
}

function hasError(key: string): boolean {
  return !!fieldErrors.value[key];
}

function getError(key: string): string | null {
  return fieldErrors.value[key] || null;
}

const printWidthMax = computed(() => store.params.paperWidth - 2);
const printHeightMax = computed(() => store.params.paperHeight - 2);

function validatePrintWidth(): boolean {
  const val = localPrintWidth.value;
  if (val < 5) {
    fieldErrors.value.printWidth = '版心宽度最小为5mm';
    return false;
  }
  if (val > printWidthMax.value) {
    fieldErrors.value.printWidth = `版心宽度最大为${printWidthMax.value}mm（纸张宽度-2）`;
    return false;
  }
  fieldErrors.value.printWidth = null;
  return true;
}

function validatePrintHeight(): boolean {
  const val = localPrintHeight.value;
  if (val < 5) {
    fieldErrors.value.printHeight = '版心高度最小为5mm';
    return false;
  }
  if (val > printHeightMax.value) {
    fieldErrors.value.printHeight = `版心高度最大为${printHeightMax.value}mm（纸张高度-2）`;
    return false;
  }
  fieldErrors.value.printHeight = null;
  return true;
}

function handlePrintWidthBlur(): void {
  if (validatePrintWidth() && validatePrintHeight()) {
    store.setPrintSize(localPrintWidth.value, localPrintHeight.value, true, true);
  }
}

function handlePrintHeightBlur(): void {
  if (validatePrintWidth() && validatePrintHeight()) {
    store.setPrintSize(localPrintWidth.value, localPrintHeight.value, true, true);
  }
}

function handlePrintWidthKeydown(e: KeyboardEvent): void {
  if (e.key === 'Enter') {
    handlePrintWidthBlur();
  }
}

function handlePrintHeightKeydown(e: KeyboardEvent): void {
  if (e.key === 'Enter') {
    handlePrintHeightBlur();
  }
}

function handlePaperPresetChange(value: PaperPreset | null): void {
  if (value) {
    store.applyPaperPreset(value);
  }
}

function handleNumberChange<K extends keyof typeof store.params>(
  key: K,
  value: number | null
): void {
  if (value !== null) {
    const err = validateField(key, value);
    if (!err) {
      store.updateParam(key, value as typeof store.params[K]);
    }
  }
}

function handleIntegerChange<K extends keyof typeof store.params>(
  key: K,
  value: number | null
): void {
  if (value !== null && Number.isInteger(value)) {
    const err = validateField(key, value);
    if (!err) {
      store.updateParam(key, value as typeof store.params[K]);
    }
  }
}

function handleFishtailChange(value: string): void {
  store.setFishtailStyle(value as FishtailType);
}

function handleAnnotationPositionChange(value: string): void {
  store.updateParam('annotationPosition', value as AnnotationPosition);
}

function handleColorChange(value: string): void {
  store.updateParam('lineColor', value);
}

function handleSliderChange<K extends keyof typeof store.params>(
  key: K,
  value: number
): void {
  store.updateParam(key, value as typeof store.params[K]);
}

function handleMarginLinkModeChange(value: MarginLinkMode): void {
  store.setMarginLinkMode(value);
}
</script>

<template>
  <div class="control-panel">
    <n-collapse v-model:expanded-names="paperExpanded" :default-expanded-names="['paper', 'print', 'margin', 'grid', 'line', 'fishtail', 'annotation']">
      <n-collapse-item title="纸张尺寸" name="paper">
        <n-form label-placement="top" label-width="auto">
          <n-form-item label="预设尺寸">
            <n-select
              :value="store.currentPresetId"
              :options="PAPER_PRESETS.filter(p => p.id !== 'custom').map(p => ({ label: p.label, value: p })) as any"
              @update:value="handlePaperPresetChange"
              placeholder="选择预设尺寸"
              clearable
            />
          </n-form-item>
          <div class="input-row">
            <n-form-item label="宽度 (mm)" class="flex-1">
              <n-input-number
                :value="store.params.paperWidth"
                :min="10"
                :max="1000"
                :step="1"
                :class="{ 'input-error': hasError('paperWidth') }"
                @update:value="(v) => handleNumberChange('paperWidth', v)"
                @focus="clearFieldError('paperWidth')"
                style="width: 100%"
              />
              <div v-if="hasError('paperWidth')" class="error-message">{{ getError('paperWidth') }}</div>
            </n-form-item>
            <n-form-item label="高度 (mm)" class="flex-1">
              <n-input-number
                :value="store.params.paperHeight"
                :min="10"
                :max="1000"
                :step="1"
                :class="{ 'input-error': hasError('paperHeight') }"
                @update:value="(v) => handleNumberChange('paperHeight', v)"
                @focus="clearFieldError('paperHeight')"
                style="width: 100%"
              />
              <div v-if="hasError('paperHeight')" class="error-message">{{ getError('paperHeight') }}</div>
            </n-form-item>
          </div>
        </n-form>
      </n-collapse-item>

      <n-collapse-item title="版心尺寸" name="print">
        <n-form label-placement="top" label-width="auto">
          <div class="info-box info-hint">
            <span class="info-label">当前纸张:</span>
            <span class="info-value">{{ store.params.paperWidth }} × {{ store.params.paperHeight }} mm</span>
          </div>
          <div class="hint-text">修改版心尺寸后，边距将自动调整使版心居中</div>
          <div class="input-row">
            <n-form-item label="版心宽度 (mm)" class="flex-1">
              <n-input-number
                v-model:value="localPrintWidth"
                :min="5"
                :max="printWidthMax"
                :step="0.5"
                :class="{ 'input-error': hasError('printWidth') }"
                @blur="handlePrintWidthBlur"
                @keydown="handlePrintWidthKeydown"
                @focus="clearFieldError('printWidth')"
                style="width: 100%"
              />
              <div v-if="hasError('printWidth')" class="error-message">{{ getError('printWidth') }}</div>
            </n-form-item>
            <n-form-item label="版心高度 (mm)" class="flex-1">
              <n-input-number
                v-model:value="localPrintHeight"
                :min="5"
                :max="printHeightMax"
                :step="0.5"
                :class="{ 'input-error': hasError('printHeight') }"
                @blur="handlePrintHeightBlur"
                @keydown="handlePrintHeightKeydown"
                @focus="clearFieldError('printHeight')"
                style="width: 100%"
              />
              <div v-if="hasError('printHeight')" class="error-message">{{ getError('printHeight') }}</div>
            </n-form-item>
          </div>
        </n-form>
      </n-collapse-item>

      <n-collapse-item title="版心边距" name="margin">
        <n-form label-placement="top" label-width="auto">
          <n-form-item label="联动模式">
            <n-select
              :value="store.marginLinkMode"
              :options="MARGIN_LINK_MODES"
              @update:value="handleMarginLinkModeChange"
            />
          </n-form-item>
          <div class="input-row">
            <n-form-item label="上边距 (mm)" class="flex-1">
              <n-input-number
                :value="store.params.marginTop"
                :min="1"
                :max="200"
                :step="0.5"
                :class="{ 'input-error': hasError('marginTop') }"
                @update:value="(v) => handleNumberChange('marginTop', v)"
                @focus="clearFieldError('marginTop')"
                style="width: 100%"
              />
              <div v-if="hasError('marginTop')" class="error-message">{{ getError('marginTop') }}</div>
            </n-form-item>
            <n-form-item label="下边距 (mm)" class="flex-1">
              <n-input-number
                :value="store.params.marginBottom"
                :min="1"
                :max="200"
                :step="0.5"
                :class="{ 'input-error': hasError('marginBottom') }"
                @update:value="(v) => handleNumberChange('marginBottom', v)"
                @focus="clearFieldError('marginBottom')"
                style="width: 100%"
              />
              <div v-if="hasError('marginBottom')" class="error-message">{{ getError('marginBottom') }}</div>
            </n-form-item>
          </div>
          <div class="input-row">
            <n-form-item label="左边距 (mm)" class="flex-1">
              <n-input-number
                :value="store.params.marginLeft"
                :min="1"
                :max="200"
                :step="0.5"
                :class="{ 'input-error': hasError('marginLeft') }"
                @update:value="(v) => handleNumberChange('marginLeft', v)"
                @focus="clearFieldError('marginLeft')"
                style="width: 100%"
              />
              <div v-if="hasError('marginLeft')" class="error-message">{{ getError('marginLeft') }}</div>
            </n-form-item>
            <n-form-item label="右边距 (mm)" class="flex-1">
              <n-input-number
                :value="store.params.marginRight"
                :min="1"
                :max="200"
                :step="0.5"
                :class="{ 'input-error': hasError('marginRight') }"
                @update:value="(v) => handleNumberChange('marginRight', v)"
                @focus="clearFieldError('marginRight')"
                style="width: 100%"
              />
              <div v-if="hasError('marginRight')" class="error-message">{{ getError('marginRight') }}</div>
            </n-form-item>
          </div>
          <div class="info-box">
            <span class="info-label">当前版心:</span>
            <span class="info-value">{{ store.stats.printWidth.toFixed(1) }} × {{ store.stats.printHeight.toFixed(1) }} mm</span>
          </div>
        </n-form>
      </n-collapse-item>

      <n-collapse-item title="栏数行数" name="grid">
        <n-form label-placement="top" label-width="auto">
          <div class="input-row">
            <n-form-item label="栏数" class="flex-1">
              <n-input-number
                :value="store.params.columnCount"
                :min="1"
                :max="50"
                :step="1"
                :class="{ 'input-error': hasError('columnCount') }"
                @update:value="(v) => handleIntegerChange('columnCount', v)"
                @focus="clearFieldError('columnCount')"
                style="width: 100%"
              />
              <div v-if="hasError('columnCount')" class="error-message">{{ getError('columnCount') }}</div>
            </n-form-item>
            <n-form-item label="行数" class="flex-1">
              <n-input-number
                :value="store.params.rowCount"
                :min="1"
                :max="100"
                :step="1"
                :class="{ 'input-error': hasError('rowCount') }"
                @update:value="(v) => handleIntegerChange('rowCount', v)"
                @focus="clearFieldError('rowCount')"
                style="width: 100%"
              />
              <div v-if="hasError('rowCount')" class="error-message">{{ getError('rowCount') }}</div>
            </n-form-item>
          </div>
          <div class="info-box">
            <span class="info-label">每栏尺寸:</span>
            <span class="info-value">{{ store.stats.columnWidth.toFixed(2) }} × {{ store.stats.rowHeight.toFixed(2) }} mm</span>
          </div>
        </n-form>
      </n-collapse-item>

      <n-collapse-item title="栏线样式" name="line">
        <n-form label-placement="top" label-width="auto">
          <n-form-item label="栏线粗细 (mm)">
            <n-slider
              :value="store.params.lineThickness"
              :min="0.1"
              :max="2"
              :step="0.05"
              :marks="{ 0.1: '0.1', 0.5: '0.5', 1: '1.0', 1.5: '1.5', 2: '2.0' }"
              @update:value="(v) => handleSliderChange('lineThickness', v)"
            />
            <div class="slider-value">{{ store.params.lineThickness.toFixed(2) }} mm</div>
          </n-form-item>
          <n-form-item label="栏线颜色">
            <div class="color-preset-row">
              <div
                v-for="preset in lineColorPresets"
                :key="preset.value"
                class="color-preset"
                :class="{ active: store.params.lineColor === preset.value }"
                :style="{ backgroundColor: preset.value }"
                :title="preset.label"
                @click="handleColorChange(preset.value)"
              />
            </div>
            <div class="color-picker-wrapper">
              <n-color-picker
                :value="store.params.lineColor"
                @update:value="handleColorChange"
                show-alpha
              />
              <span class="color-value">{{ store.params.lineColor }}</span>
            </div>
          </n-form-item>
        </n-form>
      </n-collapse-item>

      <n-collapse-item title="鱼尾样式" name="fishtail">
        <n-form label-placement="top" label-width="auto">
          <n-form-item label="鱼尾类型">
            <n-select
              :value="store.params.fishtailStyle"
              :options="FISHTAIL_OPTIONS"
              @update:value="handleFishtailChange"
            />
          </n-form-item>
          <div class="fishtail-preview">
            <svg width="120" height="60" viewBox="0 0 120 60" class="fishtail-svg">
              <path
                v-if="store.params.fishtailStyle === 'single'"
                d="M 40 30 Q 40 15 60 5 Q 80 15 80 30 Q 80 45 60 55 Q 40 45 40 30 M 50 30 L 70 30"
                :fill="store.params.lineColor"
              />
              <path
                v-else-if="store.params.fishtailStyle === 'double'"
                d="M 40 30 Q 40 15 60 5 Q 80 15 80 30 Q 80 45 60 55 Q 40 45 40 30 M 50 20 L 70 20 M 50 40 L 70 40"
                :fill="store.params.lineColor"
              />
              <path
                v-else-if="store.params.fishtailStyle === 'triple'"
                d="M 40 30 Q 40 15 60 5 Q 80 15 80 30 Q 80 45 60 55 Q 40 45 40 30 M 50 15 L 70 15 M 50 30 L 70 30 M 50 45 L 70 45"
                :fill="store.params.lineColor"
              />
              <path
                v-else-if="store.params.fishtailStyle === 'flowery'"
                d="M 40 30 Q 40 15 60 5 Q 80 15 80 30 Q 80 45 60 55 Q 40 45 40 30 M 50 22 C 45 24 45 28 50 30 C 45 32 45 36 50 38 M 70 22 C 75 24 75 28 70 30 C 75 32 75 36 70 38"
                :fill="store.params.lineColor"
              />
              <text
                v-else
                x="60"
                y="35"
                text-anchor="middle"
                fill="#999"
                font-size="12"
              >
                无鱼尾
              </text>
            </svg>
          </div>
        </n-form>
      </n-collapse-item>

      <n-collapse-item title="批注区域" name="annotation">
        <n-form label-placement="top" label-width="auto">
          <n-form-item label="批注区位置">
            <n-select
              :value="store.params.annotationPosition"
              :options="ANNOTATION_POSITION_OPTIONS"
              @update:value="handleAnnotationPositionChange"
            />
          </n-form-item>
          <n-form-item label="批注区宽度 (mm)">
            <n-slider
              :value="store.params.annotationWidth"
              :min="0"
              :max="50"
              :step="1"
              :marks="{ 0: '0', 10: '10', 20: '20', 30: '30', 40: '40', 50: '50' }"
              @update:value="(v) => handleSliderChange('annotationWidth', v)"
            />
            <div class="slider-value">{{ store.params.annotationWidth }} mm</div>
          </n-form-item>
          <div class="info-box">
            <span class="info-label">总批注宽度:</span>
            <span class="info-value">
              {{ store.params.annotationPosition === 'both' ? store.params.annotationWidth * 2 : store.params.annotationWidth }} mm
            </span>
          </div>
        </n-form>
      </n-collapse-item>
    </n-collapse>
  </div>
</template>

<style scoped>
.control-panel {
  height: 100%;
  overflow-y: auto;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
}

.input-row {
  display: flex;
  gap: 12px;
}

.flex-1 {
  flex: 1;
}

.info-box {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, #F5EFE0 0%, #FAF5EB 100%);
  border-radius: 6px;
  border: 1px solid #E8DFCC;
  margin-top: 8px;
}

.info-hint {
  margin-top: 0;
  margin-bottom: 8px;
}

.hint-text {
  font-size: 12px;
  color: #8B7355;
  margin-bottom: 12px;
  padding: 0 4px;
}

.info-label {
  font-size: 13px;
  color: #6B5B4F;
  font-weight: 500;
}

.info-value {
  font-size: 14px;
  color: #3D2914;
  font-weight: 600;
  font-family: 'Source Code Pro', monospace;
}

.slider-value {
  text-align: center;
  font-size: 13px;
  color: #3D2914;
  font-weight: 500;
  margin-top: 4px;
  font-family: 'Source Code Pro', monospace;
}

.color-preset-row {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.color-preset {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.color-preset:hover {
  transform: scale(1.1);
}

.color-preset.active {
  border-color: #3D2914;
  box-shadow: 0 0 0 2px rgba(61, 41, 20, 0.2);
}

.color-picker-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.color-value {
  font-size: 13px;
  color: #666;
  font-family: 'Source Code Pro', monospace;
}

.fishtail-preview {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
  background: #FAF5EB;
  border-radius: 6px;
  margin-top: 8px;
}

.fishtail-svg {
  display: block;
}

.error-message {
  font-size: 12px;
  color: #d03050;
  margin-top: 4px;
  line-height: 1.4;
}

:deep(.input-error .n-input-number) {
  border-color: #d03050 !important;
}

:deep(.input-error .n-input-number:hover) {
  border-color: #d03050 !important;
}

:deep(.input-error .n-input-number:focus) {
  border-color: #d03050 !important;
  box-shadow: 0 0 0 2px rgba(208, 48, 80, 0.1);
}

:deep(.n-collapse-item__header) {
  font-weight: 600;
  color: #3D2914;
}

:deep(.n-collapse-item__content) {
  padding-top: 8px;
}
</style>
