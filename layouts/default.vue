<template>
  <div class="app-layout">
    <CommonSidebar />
    <div class="app-main">
      <CommonHeader />
      <main class="app-content">
        <slot />
      </main>
    </div>
  </div>
</template>

<style lang="scss">
.app-layout {
  display: flex;
  min-height: 100vh;
  background: var(--color-bg);
}

.app-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

.app-content {
  flex: 1;
  overflow-y: auto;
  padding: 28px 32px;
  background: #f8f9fb;
}
</style>
