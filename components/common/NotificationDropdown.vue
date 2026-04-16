<template>
  <div ref="rootEl" class="notif-wrap">
    <!-- 종 아이콘 버튼 -->
    <button class="icon-btn" @click="toggle">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
      </svg>
      <span v-if="store.unreadCount > 0" class="badge">
        {{ store.unreadCount > 9 ? '9+' : store.unreadCount }}
      </span>
    </button>

    <!-- 드롭다운 패널 -->
    <div v-if="open" class="notif-panel">
      <div class="notif-header">
        <span class="notif-title">알림</span>
        <button v-if="store.unreadCount > 0" class="mark-all-btn" @click="store.markAllRead()">
          모두 읽음
        </button>
      </div>

      <div v-if="store.items.length === 0" class="notif-empty">
        새 알림이 없습니다.
      </div>

      <ul v-else class="notif-list">
        <li
          v-for="n in store.items"
          :key="n.id"
          class="notif-item"
          :class="{ unread: !n.is_read }"
          @click="onClickItem(n.id)"
        >
          <div class="notif-dot" />
          <div class="notif-body">
            <p class="notif-item-title">{{ n.title }}</p>
            <p class="notif-item-body">{{ n.body }}</p>
            <p class="notif-time">{{ timeAgo(n.created_at) }}</p>
          </div>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useNotificationsStore } from '~/stores/notifications'
import { useAuthStore } from '~/stores/auth'

const store = useNotificationsStore()
const authStore = useAuthStore()
const open = ref(false)
const rootEl = ref<HTMLElement | null>(null)

// 로그인 상태일 때 알림 로드
watch(
  () => authStore.isLoggedIn,
  (v) => { if (v) store.fetch() },
  { immediate: true },
)

function toggle() {
  open.value = !open.value
  if (open.value) store.fetch()
}

async function onClickItem(id: string) {
  await store.markRead(id)
}

// 패널 바깥 클릭 시 닫기
function onClickOutside(e: MouseEvent) {
  if (rootEl.value && !rootEl.value.contains(e.target as Node)) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('mousedown', onClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', onClickOutside))

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '방금 전'
  if (mins < 60) return `${mins}분 전`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}시간 전`
  const days = Math.floor(hrs / 24)
  return `${days}일 전`
}
</script>

<style scoped lang="scss">
.notif-wrap {
  position: relative;
}

/* 종 버튼 */
.icon-btn {
  position: relative;
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

.badge {
  position: absolute;
  top: 4px;
  right: 4px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  background: #ef4444;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  pointer-events: none;
}

/* 드롭다운 패널 */
.notif-panel {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 320px;
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.10);
  z-index: 200;
  overflow: hidden;
}

.notif-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 10px;
  border-bottom: 1px solid var(--color-border);
}

.notif-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--color-text);
}

.mark-all-btn {
  font-size: 12px;
  color: var(--color-primary);
  background: none;
  border: none;
  cursor: pointer;
  font-weight: 500;
  padding: 0;

  &:hover { opacity: 0.75; }
}

/* 알림 없음 */
.notif-empty {
  padding: 28px 16px;
  text-align: center;
  font-size: 13px;
  color: var(--color-text-muted);
}

/* 알림 목록 */
.notif-list {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 320px; /* 약 5개 높이 */
  overflow-y: auto;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 4px; }
}

.notif-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.12s;
  border-bottom: 1px solid var(--color-border);

  &:last-child { border-bottom: none; }
  &:hover { background: var(--color-bg-hover); }

  &.unread .notif-dot {
    background: var(--color-primary);
  }

  &:not(.unread) {
    opacity: 0.6;
    .notif-dot { background: var(--color-border); }
  }
}

.notif-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 5px;
  transition: background 0.2s;
}

.notif-body {
  flex: 1;
  min-width: 0;
}

.notif-item-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 2px;
}

.notif-item-body {
  font-size: 12px;
  color: var(--color-text-muted);
  margin: 0 0 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.notif-time {
  font-size: 11px;
  color: var(--color-text-placeholder);
  margin: 0;
}

/* 다크모드 */
[data-theme="dark"] .notif-panel {
  background: var(--color-bg-card);
}
</style>
