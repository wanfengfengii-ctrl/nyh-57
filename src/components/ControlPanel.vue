<script setup lang="ts">
import { ref } from 'vue';
import { useLayoutStore } from '../stores/useLayoutStore';
import { FISHTAIL_OPTIONS, ANNOTATION_POSITION_OPTIONS } from '../types/layout';
import type { FishtailType, AnnotationPosition } from '../types/layout';
import { NForm, NFormItem, NInputNumber, NSelect, NCollapse, NCollapseItem, NSlider, NColorPicker, NInputGroupLabel } from 'naive-ui';

const store = useLayoutStore();
const paperExpanded = ref(['paper', 'margin', 'grid', 'line', 'fishtail', 'annotation']);

const paperPresets = [
  { label: 'A4 (210×297mm)', value: { width: 210, height: 297 } },
  { label: 'A5 (148×210mm)', value: { width: 148, height: 210 } },
  { label: 'B5 (176×250mm)', value: { width: 176, height: 250 } },
  { label: '16开 (185×260mm)', value: { width: 185, height: 260 } },
  { label: '32开 (130×185mm)', value: { width: 130, height: 185 } },
  { label: '古籍大本 (200×300mm)', value: { width: 200, height: 300 } },
  { label: '古籍小本 (150×220mm)', value: { width: 150, height: 220 } },
];

const lineColorPresets = [
  { label: '朱红 (传统)', value: '#C41E3A' },
  { label: '墨黑', value: '#1A1A1A' },
  { label: '藏蓝', value: '#2E4A62' },
  { label: '石绿', value: '#2E624A' },
  { label: '赭石', value: '#8B4513' },
];

function handlePaperPresetChange(value: { width: number; height: number } | null): void {
  if (value) {
    store.setPaperSize(value.width, value.height);
  }
}

function handleNumberChange<K extends keyof typeof store.params>(
  key: K,
  value: number | null
): void {
  if (value !== null) {
    store.updateParam(key, value as typeof store.params[K]);
  }
}

function handleIntegerChange<K extends keyof typeof store.params>(
  key: K,
  value: number | null
): void {
  if (value !== null && Number.isInteger(value)) {
    store.updateParam(key, value as typeof store.params[K]);
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
</script>

<template>
  <div class="control-panel">
    <n-collapse v-model:expanded-names="paperExpanded" :default-expanded-names="['paper', 'margin', 'grid', 'line', 'fishtail', 'annotation']">
      <n-collapse-item title="纸张尺寸" name="paper">
        <n-form label-placement="top" label-width="auto">
          <n-form-item label="预设尺寸">
            <n-select
              :options="paperPresets.map(p => ({ label: p.label, value: p.value })) as any"
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
                @update:value="(v) => handleNumberChange('paperWidth', v)"
                style="width: 100%"
              />
            </n-form-item>
            <n-form-item label="高度 (mm)" class="flex-1">
              <n-input-number
                :value="store.params.paperHeight"
                :min="10"
                :max="1000"
                :step="1"
                @update:value="(v) => handleNumberChange('paperHeight', v)"
                style="width: 100%"
              />
            </n-form-item>
          </div>
        </n-form>
      </n-collapse-item>

      <n-collapse-item title="版心边距" name="margin">
        <n-form label-placement="top" label-width="auto">
          <div class="input-row">
            <n-form-item label="上边距 (mm)" class="flex-1">
              <n-input-number
                :value="store.params.marginTop"
                :min="1"
                :max="200"
                :step="0.5"
                @update:value="(v) => handleNumberChange('marginTop', v)"
                style="width: 100%"
              />
            </n-form-item>
            <n-form-item label="下边距 (mm)" class="flex-1">
              <n-input-number
                :value="store.params.marginBottom"
                :min="1"
                :max="200"
                :step="0.5"
                @update:value="(v) => handleNumberChange('marginBottom', v)"
                style="width: 100%"
              />
            </n-form-item>
          </div>
          <div class="input-row">
            <n-form-item label="左边距 (mm)" class="flex-1">
              <n-input-number
                :value="store.params.marginLeft"
                :min="1"
                :max="200"
                :step="0.5"
                @update:value="(v) => handleNumberChange('marginLeft', v)"
                style="width: 100%"
              />
            </n-form-item>
            <n-form-item label="右边距 (mm)" class="flex-1">
              <n-input-number
                :value="store.params.marginRight"
                :min="1"
                :max="200"
                :step="0.5"
                @update:value="(v) => handleNumberChange('marginRight', v)"
                style="width: 100%"
              />
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
                @update:value="(v) => handleIntegerChange('columnCount', v)"
                style="width: 100%"
              />
            </n-form-item>
            <n-form-item label="行数" class="flex-1">
              <n-input-number
                :value="store.params.rowCount"
                :min="1"
                :max="100"
                :step="1"
                @update:value="(v) => handleIntegerChange('rowCount', v)"
                style="width: 100%"
              />
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

:deep(.n-collapse-item__header) {
  font-weight: 600;
  color: #3D2914;
}

:deep(.n-collapse-item__content) {
  padding-top: 8px;
}
</style>
