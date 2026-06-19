<script setup lang="ts">
import { computed, ref } from 'vue';
import { useLayoutStore } from '../stores/useLayoutStore';
import type { FishtailType } from '../types/layout';

const store = useLayoutStore();
const scale = ref(1);

const viewBox = computed(() => {
  const { paperWidth, paperHeight } = store.params;
  return `0 0 ${paperWidth} ${paperHeight}`;
});

const printX = computed(() => store.params.marginLeft);
const printY = computed(() => store.params.marginTop);
const printWidth = computed(() => store.stats.printWidth);
const printHeight = computed(() => store.stats.printHeight);

const annotationLeftWidth = computed(() => {
  return store.params.annotationPosition === 'left' || store.params.annotationPosition === 'both'
    ? store.params.annotationWidth
    : 0;
});

const annotationRightWidth = computed(() => {
  return store.params.annotationPosition === 'right' || store.params.annotationPosition === 'both'
    ? store.params.annotationWidth
    : 0;
});

const bodyX = computed(() => printX.value + annotationLeftWidth.value);
const bodyWidth = computed(() => printWidth.value - annotationLeftWidth.value - annotationRightWidth.value);

const columnLines = computed(() => {
  const lines: number[] = [];
  for (let i = 0; i <= store.params.columnCount; i++) {
    lines.push(bodyX.value + i * store.stats.columnWidth);
  }
  return lines;
});

const rowLines = computed(() => {
  const lines: number[] = [];
  for (let i = 0; i <= store.params.rowCount; i++) {
    lines.push(printY.value + i * store.stats.rowHeight);
  }
  return lines;
});

const centerX = computed(() => printX.value + printWidth.value / 2);

function getFishtailPath(style: FishtailType, x: number, y: number, size: number): string {
  const h = size;
  const w = size * 0.8;

  switch (style) {
    case 'single':
      return `M ${x - w / 2} ${y}
              Q ${x - w / 2} ${y - h / 2} ${x} ${y - h}
              Q ${x + w / 2} ${y - h / 2} ${x + w / 2} ${y}
              Q ${x + w / 2} ${y + h / 2} ${x} ${y + h}
              Q ${x - w / 2} ${y + h / 2} ${x - w / 2} ${y}
              M ${x - w / 3} ${y}
              L ${x + w / 3} ${y}`;

    case 'double':
      return `M ${x - w / 2} ${y}
              Q ${x - w / 2} ${y - h / 2} ${x} ${y - h}
              Q ${x + w / 2} ${y - h / 2} ${x + w / 2} ${y}
              Q ${x + w / 2} ${y + h / 2} ${x} ${y + h}
              Q ${x - w / 2} ${y + h / 2} ${x - w / 2} ${y}
              M ${x - w / 3} ${y - h / 3}
              L ${x + w / 3} ${y - h / 3}
              M ${x - w / 3} ${y + h / 3}
              L ${x + w / 3} ${y + h / 3}`;

    case 'triple':
      return `M ${x - w / 2} ${y}
              Q ${x - w / 2} ${y - h / 2} ${x} ${y - h}
              Q ${x + w / 2} ${y - h / 2} ${x + w / 2} ${y}
              Q ${x + w / 2} ${y + h / 2} ${x} ${y + h}
              Q ${x - w / 2} ${y + h / 2} ${x - w / 2} ${y}
              M ${x - w / 3} ${y - h / 2.5}
              L ${x + w / 3} ${y - h / 2.5}
              M ${x - w / 3} ${y}
              L ${x + w / 3} ${y}
              M ${x - w / 3} ${y + h / 2.5}
              L ${x + w / 3} ${y + h / 2.5}`;

    case 'flowery':
      return `M ${x - w / 2} ${y}
              Q ${x - w / 2} ${y - h / 2} ${x} ${y - h}
              Q ${x + w / 2} ${y - h / 2} ${x + w / 2} ${y}
              Q ${x + w / 2} ${y + h / 2} ${x} ${y + h}
              Q ${x - w / 2} ${y + h / 2} ${x - w / 2} ${y}
              M ${x - w / 4} ${y - h / 4}
              C ${x - w / 2} ${y - h / 3} ${x - w / 2} ${y - h / 6} ${x - w / 4} ${y}
              C ${x - w / 2} ${y + h / 6} ${x - w / 2} ${y + h / 3} ${x - w / 4} ${y + h / 4}
              M ${x + w / 4} ${y - h / 4}
              C ${x + w / 2} ${y - h / 3} ${x + w / 2} ${y - h / 6} ${x + w / 4} ${y}
              C ${x + w / 2} ${y + h / 6} ${x + w / 2} ${y + h / 3} ${x + w / 4} ${y + h / 4}`;

    case 'none':
    default:
      return '';
  }
}

const fishtailSize = computed(() => Math.min(printWidth.value * 0.15, store.stats.rowHeight * 1.5));
const topFishtailY = computed(() => printY.value + fishtailSize.value * 0.8);
const bottomFishtailY = computed(() => printY.value + printHeight.value - fishtailSize.value * 0.8);

const showFishtail = computed(() => store.params.fishtailStyle !== 'none');
const fishtailPathTop = computed(() =>
  getFishtailPath(store.params.fishtailStyle, centerX.value, topFishtailY.value, fishtailSize.value)
);
const fishtailPathBottom = computed(() =>
  getFishtailPath(store.params.fishtailStyle, centerX.value, bottomFishtailY.value, fishtailSize.value)
);

function zoomIn(): void {
  scale.value = Math.min(scale.value * 1.2, 5);
}

function zoomOut(): void {
  scale.value = Math.max(scale.value / 1.2, 0.3);
}

function resetZoom(): void {
  scale.value = 1;
}
</script>

<template>
  <div class="layout-preview-container">
    <div class="preview-toolbar">
      <button @click="zoomOut" class="zoom-btn" title="缩小">−</button>
      <span class="zoom-level">{{ Math.round(scale * 100) }}%</span>
      <button @click="zoomIn" class="zoom-btn" title="放大">+</button>
      <button @click="resetZoom" class="zoom-btn reset" title="重置">⟲</button>
    </div>

    <div class="preview-wrapper">
      <div class="svg-container" :style="{ transform: `scale(${scale})` }">
        <svg
          :viewBox="viewBox"
          :width="store.params.paperWidth"
          :height="store.params.paperHeight"
          class="layout-svg"
        >
          <defs>
            <pattern id="paperTexture" patternUnits="userSpaceOnUse" width="4" height="4">
              <rect width="4" height="4" fill="#F5EFE0" />
              <circle cx="1" cy="1" r="0.3" fill="#E8DFCC" opacity="0.5" />
              <circle cx="3" cy="2" r="0.2" fill="#E0D5C0" opacity="0.4" />
            </pattern>
            <filter id="lineBlur" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="0.05" />
            </filter>
          </defs>

          <rect
            :width="store.params.paperWidth"
            :height="store.params.paperHeight"
            fill="url(#paperTexture)"
            stroke="#D4C4A8"
            stroke-width="0.2"
          />

          <g v-if="annotationLeftWidth > 0" class="annotation-area left">
            <rect
              :x="printX"
              :y="printY"
              :width="annotationLeftWidth"
              :height="printHeight"
              fill="#E8F0F5"
              stroke="#2E4A62"
              stroke-width="0.15"
              stroke-dasharray="1,0.5"
              opacity="0.6"
            />
            <text
              :x="printX + annotationLeftWidth / 2"
              :y="printY + printHeight / 2"
              fill="#2E4A62"
              font-size="3"
              text-anchor="middle"
              dominant-baseline="middle"
              transform="rotate(-90, printX + annotationLeftWidth / 2, printY + printHeight / 2)"
            >
              批注区
            </text>
          </g>

          <g v-if="annotationRightWidth > 0" class="annotation-area right">
            <rect
              :x="printX + printWidth - annotationRightWidth"
              :y="printY"
              :width="annotationRightWidth"
              :height="printHeight"
              fill="#E8F0F5"
              stroke="#2E4A62"
              stroke-width="0.15"
              stroke-dasharray="1,0.5"
              opacity="0.6"
            />
            <text
              :x="printX + printWidth - annotationRightWidth / 2"
              :y="printY + printHeight / 2"
              fill="#2E4A62"
              font-size="3"
              text-anchor="middle"
              dominant-baseline="middle"
              transform="rotate(90, printX + printWidth - annotationRightWidth / 2, printY + printHeight / 2)"
            >
              批注区
            </text>
          </g>

          <g class="print-area">
            <rect
              :x="printX"
              :y="printY"
              :width="printWidth"
              :height="printHeight"
              fill="none"
              stroke="#1A1A1A"
              stroke-width="0.2"
            />

            <g class="column-lines">
              <line
                v-for="(x, index) in columnLines"
                :key="'col-' + index"
                :x1="x"
                :y1="printY"
                :x2="x"
                :y2="printY + printHeight"
                :stroke="store.params.lineColor"
                :stroke-width="store.params.lineThickness"
                filter="url(#lineBlur)"
              />
            </g>

            <g class="row-lines">
              <line
                v-for="(y, index) in rowLines"
                :key="'row-' + index"
                :x1="bodyX"
                :y1="y"
                :x2="bodyX + bodyWidth"
                :y2="y"
                :stroke="store.params.lineColor"
                :stroke-width="store.params.lineThickness"
                filter="url(#lineBlur)"
              />
            </g>

            <g v-if="showFishtail" class="fishtail" :fill="store.params.lineColor">
              <path :d="fishtailPathTop" />
              <path :d="fishtailPathBottom" />
            </g>
          </g>

          <g class="dimensions" font-size="2.5" fill="#666">
            <text :x="store.params.paperWidth / 2" :y="printY - 4" text-anchor="middle">
              版心: {{ printWidth.toFixed(1) }} × {{ printHeight.toFixed(1) }} mm
            </text>
            <text :x="store.params.paperWidth / 2" :y="store.params.paperHeight - 2" text-anchor="middle">
              纸张: {{ store.params.paperWidth }} × {{ store.params.paperHeight }} mm
            </text>
            <text :x="2" :y="printY + printHeight / 2" transform="rotate(-90, 2, printY + printHeight / 2)">
              上: {{ store.params.marginTop }}mm
            </text>
            <text
              :x="store.params.paperWidth - 2"
              :y="printY + printHeight / 2"
              transform="rotate(90, store.params.paperWidth - 2, printY + printHeight / 2)"
            >
              下: {{ store.params.marginBottom }}mm
            </text>
          </g>
        </svg>
      </div>
    </div>
  </div>
</template>

<style scoped>
.layout-preview-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
}

.preview-toolbar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 8px 16px;
  background: linear-gradient(135deg, #F5EFE0 0%, #E8DFCC 100%);
  border-bottom: 1px solid #D4C4A8;
}

.zoom-btn {
  width: 32px;
  height: 32px;
  border: 1px solid #D4C4A8;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  font-size: 18px;
  color: #3D2914;
  transition: all 0.2s ease;
}

.zoom-btn:hover {
  background: #C41E3A;
  color: #fff;
  border-color: #C41E3A;
}

.zoom-btn.reset {
  font-size: 14px;
}

.zoom-level {
  font-size: 14px;
  color: #3D2914;
  font-weight: 500;
  min-width: 60px;
  text-align: center;
}

.preview-wrapper {
  flex: 1;
  overflow: auto;
  padding: 40px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  background: repeating-conic-gradient(#e8e8e8 0% 25%, #f5f5f5 0% 50%) 50% / 20px 20px;
}

.svg-container {
  transition: transform 0.2s ease;
  transform-origin: top center;
  filter: drop-shadow(0 8px 24px rgba(0, 0, 0, 0.15));
}

.layout-svg {
  display: block;
}
</style>
