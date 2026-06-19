<script setup lang="ts">
import { computed } from 'vue';
import { useLayoutStore } from '../stores/useLayoutStore';
import { formatArea, formatRatio } from '../utils/calculation';
import { NCard, NProgress, NStatistic } from 'naive-ui';

const store = useLayoutStore();

const paperAreaDisplay = computed(() => formatArea(store.stats.paperArea));
const printAreaDisplay = computed(() => formatArea(store.stats.printArea));
const writingAreaDisplay = computed(() => formatArea(store.stats.writingArea));
const annotationAreaDisplay = computed(() => formatArea(store.stats.annotationArea));
const lineAreaDisplay = computed(() => formatArea(store.stats.lineArea));

const annotationRatioDisplay = computed(() => formatRatio(store.stats.annotationRatio));
const lineRatioDisplay = computed(() => formatRatio(store.stats.lineRatio));
const writingRatio = computed(() => store.stats.writingRatio);
const writingRatioDisplay = computed(() => formatRatio(store.stats.writingRatio));

const totalCells = computed(() => store.params.columnCount * store.params.rowCount);
const cellCountDisplay = computed(() => `${store.params.columnCount} × ${store.params.rowCount} = ${totalCells.value} 格`);
</script>

<template>
  <div class="statistics-panel">
    <div class="panel-header">
      <h3 class="panel-title">面积统计</h3>
      <span class="panel-subtitle">实时计算各区域占比</span>
    </div>

    <div class="stats-cards">
      <n-card class="stat-card" size="small">
        <template #header>
          <span class="card-header">纸张总面积</span>
        </template>
        <n-statistic :value="paperAreaDisplay" />
      </n-card>

      <n-card class="stat-card" size="small">
        <template #header>
          <span class="card-header">版心面积</span>
        </template>
        <n-statistic :value="printAreaDisplay" />
      </n-card>
    </div>

    <n-card class="detail-card" size="small">
      <template #header>
        <span class="card-header">区域分布</span>
      </template>

      <div class="distribution-section">
        <div class="distribution-item">
          <div class="item-header">
            <span class="item-label writing">
              <span class="color-dot writing-dot"></span>
              可用书写区域
            </span>
            <span class="item-value">{{ writingAreaDisplay }}</span>
          </div>
          <div class="progress-wrapper">
            <n-progress
              type="line"
              :percentage="Math.round(writingRatio)"
              :show-indicator="false"
              color="#8B4513"
              :stroke-width="12"
              rail-color="#F5EFE0"
            />
            <span class="progress-label">{{ writingRatioDisplay }}</span>
          </div>
        </div>

        <div class="distribution-item">
          <div class="item-header">
            <span class="item-label annotation">
              <span class="color-dot annotation-dot"></span>
              批注区域
            </span>
            <span class="item-value">{{ annotationAreaDisplay }}</span>
          </div>
          <div class="progress-wrapper">
            <n-progress
              type="line"
              :percentage="Math.round(store.stats.annotationRatio)"
              :show-indicator="false"
              color="#2E4A62"
              :stroke-width="12"
              rail-color="#F5EFE0"
            />
            <span class="progress-label">{{ annotationRatioDisplay }}</span>
          </div>
        </div>

        <div class="distribution-item">
          <div class="item-header">
            <span class="item-label line">
              <span class="color-dot line-dot" :style="{ backgroundColor: store.params.lineColor }"></span>
              栏线占比
            </span>
            <span class="item-value">{{ lineAreaDisplay }}</span>
          </div>
          <div class="progress-wrapper">
            <n-progress
              type="line"
              :percentage="Math.round(store.stats.lineRatio)"
              :show-indicator="false"
              :color="store.params.lineColor"
              :stroke-width="12"
              rail-color="#F5EFE0"
            />
            <span class="progress-label">{{ lineRatioDisplay }}</span>
          </div>
        </div>
      </div>

      <div class="visual-pie">
        <svg width="160" height="160" viewBox="0 0 160 160">
          <circle
            cx="80"
            cy="80"
            r="60"
            fill="none"
            stroke="#F5EFE0"
            stroke-width="30"
          />
          <circle
            cx="80"
            cy="80"
            r="60"
            fill="none"
            stroke="#8B4513"
            stroke-width="30"
            :stroke-dasharray="`${writingRatio * 3.77} 377`"
            stroke-dashoffset="0"
            transform="rotate(-90 80 80)"
          />
          <circle
            cx="80"
            cy="80"
            r="60"
            fill="none"
            stroke="#2E4A62"
            stroke-width="30"
            :stroke-dasharray="`${store.stats.annotationRatio * 3.77} 377`"
            :stroke-dashoffset="`-${writingRatio * 3.77}`"
            transform="rotate(-90 80 80)"
          />
          <circle
            cx="80"
            cy="80"
            r="60"
            fill="none"
            :stroke="store.params.lineColor"
            stroke-width="30"
            :stroke-dasharray="`${store.stats.lineRatio * 3.77} 377`"
            :stroke-dashoffset="`-${(writingRatio + store.stats.annotationRatio) * 3.77}`"
            transform="rotate(-90 80 80)"
          />
          <text x="80" y="75" text-anchor="middle" class="pie-center-label">版心</text>
          <text x="80" y="95" text-anchor="middle" class="pie-center-value">{{ printAreaDisplay }}</text>
        </svg>
        <div class="pie-legend">
          <div class="legend-item">
            <span class="legend-dot" style="background: #8B4513;"></span>
            <span>书写区</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot" style="background: #2E4A62;"></span>
            <span>批注区</span>
          </div>
          <div class="legend-item">
            <span class="legend-dot" :style="{ background: store.params.lineColor }"></span>
            <span>栏线</span>
          </div>
        </div>
      </div>
    </n-card>

    <n-card class="detail-card" size="small">
      <template #header>
        <span class="card-header">版式参数</span>
      </template>
      <div class="param-grid">
        <div class="param-item">
          <span class="param-label">纸张尺寸</span>
          <span class="param-value">{{ store.params.paperWidth }} × {{ store.params.paperHeight }} mm</span>
        </div>
        <div class="param-item">
          <span class="param-label">版心尺寸</span>
          <span class="param-value">{{ store.stats.printWidth.toFixed(1) }} × {{ store.stats.printHeight.toFixed(1) }} mm</span>
        </div>
        <div class="param-item">
          <span class="param-label">边距 (上/下/左/右)</span>
          <span class="param-value">{{ store.params.marginTop }} / {{ store.params.marginBottom }} / {{ store.params.marginLeft }} / {{ store.params.marginRight }} mm</span>
        </div>
        <div class="param-item">
          <span class="param-label">栏数 × 行数</span>
          <span class="param-value">{{ cellCountDisplay }}</span>
        </div>
        <div class="param-item">
          <span class="param-label">每栏尺寸</span>
          <span class="param-value">{{ store.stats.columnWidth.toFixed(2) }} × {{ store.stats.rowHeight.toFixed(2) }} mm</span>
        </div>
        <div class="param-item">
          <span class="param-label">栏线粗细</span>
          <span class="param-value">{{ store.params.lineThickness.toFixed(2) }} mm</span>
        </div>
        <div class="param-item">
          <span class="param-label">鱼尾样式</span>
          <span class="param-value">
            {{ {
              none: '无',
              single: '单鱼尾',
              double: '双鱼尾',
              triple: '三鱼尾',
              flowery: '花鱼尾'
            }[store.params.fishtailStyle] }}
          </span>
        </div>
        <div class="param-item">
          <span class="param-label">批注区</span>
          <span class="param-value">
            {{ { left: '左侧', right: '右侧', both: '双侧' }[store.params.annotationPosition] }}
            ({{ store.params.annotationWidth }}mm)
          </span>
        </div>
      </div>
    </n-card>

    <div v-if="store.errors.length > 0" class="error-panel">
      <div class="error-title">⚠️ 参数警告</div>
      <ul class="error-list">
        <li v-for="(error, index) in store.errors" :key="index" class="error-item">
          {{ error }}
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.statistics-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  height: 100%;
  overflow-y: auto;
  padding: 16px;
  background: #fff;
  border-radius: 8px;
}

.panel-header {
  text-align: center;
  padding-bottom: 12px;
  border-bottom: 2px solid #E8DFCC;
}

.panel-title {
  font-size: 18px;
  font-weight: 700;
  color: #3D2914;
  margin: 0 0 4px 0;
  font-family: 'Noto Serif SC', serif;
}

.panel-subtitle {
  font-size: 12px;
  color: #8B7355;
}

.stats-cards {
  display: flex;
  gap: 12px;
}

.stat-card {
  flex: 1;
  background: linear-gradient(135deg, #FAF5EB 0%, #F5EFE0 100%);
  border: 1px solid #E8DFCC;
}

.card-header {
  font-size: 13px;
  font-weight: 600;
  color: #6B5B4F;
}

:deep(.n-statistic .n-statistic-value__content) {
  font-size: 18px;
  font-weight: 700;
  color: #3D2914;
  font-family: 'Source Code Pro', monospace;
}

.detail-card {
  border: 1px solid #E8DFCC;
}

.distribution-section {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.distribution-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 500;
}

.item-label.writing {
  color: #8B4513;
}

.item-label.annotation {
  color: #2E4A62;
}

.item-label.line {
  color: #C41E3A;
}

.color-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}

.writing-dot {
  background: #8B4513;
}

.annotation-dot {
  background: #2E4A62;
}

.line-dot {
  background: #C41E3A;
}

.item-value {
  font-size: 13px;
  font-weight: 600;
  color: #3D2914;
  font-family: 'Source Code Pro', monospace;
}

.progress-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-wrapper > :deep(.n-progress) {
  flex: 1;
}

.progress-label {
  font-size: 12px;
  font-weight: 600;
  color: #6B5B4F;
  min-width: 45px;
  text-align: right;
  font-family: 'Source Code Pro', monospace;
}

.visual-pie {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px dashed #E8DFCC;
}

.pie-center-label {
  font-size: 11px;
  fill: #8B7355;
}

.pie-center-value {
  font-size: 14px;
  font-weight: 700;
  fill: #3D2914;
  font-family: 'Source Code Pro', monospace;
}

.pie-legend {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #6B5B4F;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.param-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.param-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #FAF5EB;
  border-radius: 4px;
  border-left: 3px solid #C41E3A;
}

.param-label {
  font-size: 12px;
  color: #6B5B4F;
  font-weight: 500;
}

.param-value {
  font-size: 13px;
  font-weight: 600;
  color: #3D2914;
  font-family: 'Source Code Pro', monospace;
}

.error-panel {
  background: #FFF5F5;
  border: 1px solid #FFCDD2;
  border-radius: 6px;
  padding: 12px;
}

.error-title {
  font-size: 14px;
  font-weight: 600;
  color: #C62828;
  margin-bottom: 8px;
}

.error-list {
  margin: 0;
  padding-left: 20px;
}

.error-item {
  font-size: 12px;
  color: #C62828;
  line-height: 1.6;
}
</style>
