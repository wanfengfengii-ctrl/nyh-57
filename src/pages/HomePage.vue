<script setup lang="ts">
import HeaderBar from '@/components/HeaderBar.vue';
import ControlPanel from '@/components/ControlPanel.vue';
import LayoutPreview from '@/components/LayoutPreview.vue';
import StatisticsPanel from '@/components/StatisticsPanel.vue';
</script>

<template>
  <div class="app-container">
    <HeaderBar />
    <div class="main-content">
      <aside class="left-panel">
        <ControlPanel />
      </aside>
      <main class="center-panel">
        <LayoutPreview />
      </main>
      <aside class="right-panel">
        <StatisticsPanel />
      </aside>
    </div>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #F0EBE0;
}

.main-content {
  flex: 1;
  display: grid;
  grid-template-columns: 320px 1fr 320px;
  gap: 16px;
  padding: 16px;
  overflow: hidden;
}

.left-panel,
.right-panel {
  height: 100%;
  overflow: hidden;
}

.center-panel {
  height: 100%;
  overflow: hidden;
}

@media (max-width: 1400px) {
  .main-content {
    grid-template-columns: 280px 1fr 280px;
  }
}

@media (max-width: 1200px) {
  .main-content {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto;
    overflow-y: auto;
  }

  .left-panel,
  .center-panel,
  .right-panel {
    height: auto;
    min-height: 500px;
  }

  .center-panel {
    order: -1;
  }
}
</style>
