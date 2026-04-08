<template>
  <header class="header">
    <div class="header-search">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
      <input type="text" placeholder="Search the hearth..." />
    </div>

    <div class="header-actions">
      <button class="icon-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>
      </button>
      <button class="icon-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
      </button>
      <button class="avatar-btn">
        <img v-if="authStore.user?.avatar_url" :src="authStore.user.avatar_url" alt="profile" />
        <span v-else class="avatar-fallback" :style="{ background: authStore.user?.color ?? '#4763e4' }">
          {{ authStore.user?.name?.charAt(0) ?? '?' }}
        </span>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
const authStore = useAuthStore()
</script>

<style scoped lang="scss">
.header {
  height: 60px;
  background: #fff;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  flex-shrink: 0;
}

.header-search {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--color-bg-hover);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 0 14px;
  width: 320px;
  height: 36px;

  svg {
    width: 15px;
    height: 15px;
    color: var(--color-text-muted);
    flex-shrink: 0;
  }

  input {
    flex: 1;
    background: none;
    border: none;
    outline: none;
    font-size: 13px;
    color: var(--color-text);

    &::placeholder { color: var(--color-text-placeholder); }
  }
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.icon-btn {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  color: var(--color-text-muted);
  transition: background 0.15s;

  svg { width: 18px; height: 18px; }

  &:hover { background: var(--color-bg-hover); }
}

.avatar-btn {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  border: none;
  cursor: pointer;
  padding: 0;
  margin-left: 4px;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.avatar-fallback {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
  color: #fff;
}
</style>
