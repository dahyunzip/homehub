<template>
  <div class="home">
    <!-- Main content -->
    <div class="home-main">
      <div class="greeting">
        <h1>반갑습니다, {{ authStore.user?.name ?? '사용자' }}님</h1>
        <p>오늘도 좋은 하루 되세요!</p>
      </div>

      <!-- 오늘의 일정 -->
      <div class="card schedule-card">
        <div class="card-header">
          <span class="card-title">오늘의 일정</span>
          <NuxtLink to="/calendar" class="link-more">캘린더 더 보기 →</NuxtLink>
        </div>
        <div v-if="pendingEvents" class="skeleton-list">
          <div v-for="i in 2" :key="i" class="skeleton-event" />
        </div>
        <div v-else-if="todayEvents.length === 0" class="empty-state">
          오늘 예정된 일정이 없습니다.
        </div>
        <div v-else class="event-list">
          <div v-for="ev in todayEvents" :key="ev.id" class="event-item">
            <div class="event-time-col">
              <span class="time-num">{{ formatTimeNum(ev.start_date) }}</span>
              <span class="time-ampm">{{ formatTimeAmpm(ev.start_date) }}</span>
            </div>
            <div class="event-body">
              <div class="event-title">{{ ev.title }}</div>
              <div v-if="ev.memo" class="event-memo">{{ ev.memo }}</div>
            </div>
            <div v-if="ev.is_repeat" class="event-tag">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <polyline points="1 4 1 10 7 10" />
                <polyline points="23 20 23 14 17 14" />
                <path d="M20.49 9A9 9 0 005.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 013.51 15" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- 문서함 -->
      <div class="docs-section">
        <div class="section-heading">문서함</div>
        <div class="docs-grid">
          <NuxtLink
            v-for="doc in recentDocs"
            :key="doc.id"
            to="/docs"
            class="doc-card"
          >
            <div class="doc-icon" :class="docColorClass(doc.title)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
            </div>
            <div class="doc-name">{{ doc.title }}</div>
            <div class="doc-meta">{{ docExtBadge(doc.title) }}{{ doc.folder_name ? ' · ' + doc.folder_name : '' }}</div>
          </NuxtLink>
          <NuxtLink to="/docs" class="doc-card doc-upload">
            <div class="doc-icon upload-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
            </div>
            <div class="doc-name">파일 등록</div>
            <div class="doc-meta">Upload files</div>
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Right panel -->
    <div class="home-side">
      <!-- D-Day 카드 -->
      <div class="dday-card">
        <div class="dday-label">다가오는 일정</div>
        <template v-if="nextEvent">
          <div class="dday-number">D-{{ daysUntil(nextEvent.start_date) }}</div>
          <div class="dday-name">{{ nextEvent.title }}</div>
        </template>
        <template v-else>
          <div class="dday-number dday-none">없음</div>
          <div class="dday-name">다가오는 일정이 없습니다</div>
        </template>
        <div class="dday-deco" aria-hidden="true">✈</div>
      </div>

      <!-- 공지사항 -->
      <div class="card notices-card">
        <div class="card-header">
          <span class="card-title">공지사항</span>
          <NuxtLink to="/board" class="link-more">더 보기 →</NuxtLink>
        </div>
        <div v-if="pendingPosts" class="skeleton-list">
          <div v-for="i in 3" :key="i" class="skeleton-notice" />
        </div>
        <div v-else-if="recentPosts.length === 0" class="empty-state">
          게시된 공지가 없습니다.
        </div>
        <div v-else class="notice-list">
          <div v-for="post in recentPosts" :key="post.id" class="notice-item">
            <div class="notice-content">{{ truncate(post.content, 40) }}</div>
            <div class="notice-meta">
              POSTED BY {{ post.creator_name }} · {{ timeAgo(post.created_at) }}
            </div>
          </div>
        </div>

        <div class="quick-post">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
            <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
          <input
            v-model="quickContent"
            placeholder="빠른 공지 작성하기"
            :disabled="submitting"
            @keydown.enter="submitQuickPost"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

const authStore = useAuthStore()

// ── 날짜 헬퍼 ──────────────────────────────────────────
function localDateStr(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const today = new Date()
const todayStr = localDateStr(today)
const future = new Date(today)
future.setDate(future.getDate() + 60)
const futureStr = localDateStr(future)
const tomorrow = new Date(today)
tomorrow.setDate(tomorrow.getDate() + 1)
const tomorrowStr = localDateStr(tomorrow)

// ── 데이터 fetch ───────────────────────────────────────
const { data: eventsData, pending: pendingEvents } = await useFetch<any[]>('/api/events', {
  query: { startDate: todayStr, endDate: futureStr },
})

const { data: docsData } = await useFetch<any[]>('/api/documents')
const { data: postsData, pending: pendingPosts } = await useFetch<any[]>('/api/posts')

// ── computed ───────────────────────────────────────────
const todayEvents = computed(() =>
  (eventsData.value ?? []).filter((e) => e.start_date?.slice(0, 10) === todayStr),
)

const nextEvent = computed(() => {
  const upcoming = (eventsData.value ?? []).filter(
    (e) => e.start_date?.slice(0, 10) >= tomorrowStr,
  )
  return upcoming[0] ?? null
})

const recentDocs = computed(() => (docsData.value ?? []).slice(0, 4))

const recentPosts = computed(() => (postsData.value ?? []).slice(0, 5))

// ── 빠른 공지 ──────────────────────────────────────────
const quickContent = ref('')
const submitting = ref(false)

async function submitQuickPost() {
  const content = quickContent.value.trim()
  if (!content || submitting.value) return
  submitting.value = true
  try {
    await $fetch('/api/posts', { method: 'POST', body: { content } })
    quickContent.value = ''
    await refreshNuxtData()
  } finally {
    submitting.value = false
  }
}

// ── 포맷 헬퍼 ──────────────────────────────────────────
function formatTimeNum(dateStr: string): string {
  if (!dateStr || dateStr.length === 10) return '종일'
  const d = new Date(dateStr)
  let h = d.getHours() % 12 || 12
  const m = String(d.getMinutes()).padStart(2, '0')
  return `${String(h).padStart(2, '0')}:${m}`
}

function formatTimeAmpm(dateStr: string): string {
  if (!dateStr || dateStr.length === 10) return ''
  const d = new Date(dateStr)
  return d.getHours() < 12 ? 'AM' : 'PM'
}

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr.slice(0, 10))
  const now = new Date(todayStr)
  return Math.round((target.getTime() - now.getTime()) / 86400000)
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days === 1) return 'Yesterday'
  return `${days}d ago`
}

function truncate(str: string, len: number): string {
  return str.length > len ? str.slice(0, len) + '…' : str
}

const EXT_COLORS: Record<string, string> = {
  pdf: 'doc-blue',
  doc: 'doc-amber',
  docx: 'doc-amber',
  xls: 'doc-green',
  xlsx: 'doc-green',
  ppt: 'doc-red',
  pptx: 'doc-red',
}

function docExt(title: string): string {
  return title.split('.').pop()?.toLowerCase() ?? ''
}

function docColorClass(title: string): string {
  return EXT_COLORS[docExt(title)] ?? 'doc-gray'
}

function docExtBadge(title: string): string {
  const ext = docExt(title)
  return ext ? ext.toUpperCase() : 'FILE'
}
</script>

<style scoped lang="scss">
.home {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

/* ── Main ─────────────────────────────────────────────── */
.home-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.greeting {
  h1 {
    font-size: 24px;
    font-weight: 700;
    color: var(--color-text);
    line-height: 1.2;
  }
  p {
    margin-top: 4px;
    font-size: 14px;
    color: var(--color-text-muted);
  }
}

/* ── Cards ────────────────────────────────────────────── */
.card {
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: 14px;
  padding: 20px 22px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
}

.link-more {
  font-size: 12px;
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 500;
  &:hover { opacity: 0.75; }
}

/* ── Today's events ───────────────────────────────────── */
.schedule-card {
  .event-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .event-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px 14px;
    border-radius: 10px;
    background: var(--color-bg);
    transition: background 0.12s;

    &:hover { background: var(--color-bg-hover); }
  }

  .event-time-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    min-width: 48px;
    background: #fff;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    padding: 6px 8px;
  }

  .time-num {
    font-size: 13px;
    font-weight: 700;
    color: var(--color-text);
    line-height: 1.1;
  }

  .time-ampm {
    font-size: 10px;
    font-weight: 600;
    color: var(--color-text-muted);
    text-transform: uppercase;
  }

  .event-body {
    flex: 1;
    min-width: 0;
  }

  .event-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--color-text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .event-memo {
    font-size: 12px;
    color: var(--color-text-muted);
    margin-top: 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .event-tag {
    svg {
      width: 16px;
      height: 16px;
      color: var(--color-text-muted);
    }
  }
}

/* ── Documents ────────────────────────────────────────── */
.docs-section {
  .section-heading {
    font-size: 15px;
    font-weight: 600;
    color: var(--color-text);
    margin-bottom: 12px;
  }
}

.docs-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.doc-card {
  background: #fff;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 16px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-decoration: none;
  transition: box-shadow 0.15s, transform 0.15s;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.07);
    transform: translateY(-1px);
  }
}

.doc-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;

  svg { width: 20px; height: 20px; }

  &.doc-blue  { background: #dbeafe; color: #2563eb; }
  &.doc-amber { background: #fef3c7; color: #d97706; }
  &.doc-green { background: #d1fae5; color: #059669; }
  &.doc-red   { background: #fee2e2; color: #dc2626; }
  &.doc-gray  { background: #f3f4f6; color: #6b7280; }
  &.upload-icon { background: #f3f4f6; color: #9ca3af; }
}

.doc-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.doc-meta {
  font-size: 11px;
  color: var(--color-text-muted);
}

/* ── Right panel ──────────────────────────────────────── */
.home-side {
  width: 260px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ── D-day card ───────────────────────────────────────── */
.dday-card {
  position: relative;
  background: linear-gradient(135deg, #f5c37a 0%, #e8a44a 100%);
  border-radius: 14px;
  padding: 22px 20px;
  overflow: hidden;
  color: #fff;
}

.dday-label {
  font-size: 12px;
  font-weight: 600;
  opacity: 0.85;
  letter-spacing: 0.3px;
}

.dday-number {
  font-size: 44px;
  font-weight: 800;
  line-height: 1.1;
  margin-top: 6px;

  &.dday-none {
    font-size: 28px;
    margin-top: 10px;
  }
}

.dday-name {
  font-size: 13px;
  font-weight: 500;
  opacity: 0.9;
  margin-top: 4px;
}

.dday-deco {
  position: absolute;
  right: 16px;
  bottom: 10px;
  font-size: 44px;
  opacity: 0.2;
  transform: rotate(-20deg);
  pointer-events: none;
}

/* ── Notices card ─────────────────────────────────────── */
.notices-card {
  .notice-list {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  .notice-item {
    padding: 10px 0;
    border-left: 3px solid var(--color-primary);
    padding-left: 12px;
    margin-bottom: 8px;

    &:last-child { margin-bottom: 0; }
  }

  .notice-content {
    font-size: 13px;
    font-weight: 500;
    color: var(--color-text);
    line-height: 1.4;
  }

  .notice-meta {
    font-size: 11px;
    color: var(--color-text-muted);
    margin-top: 3px;
    font-weight: 600;
    letter-spacing: 0.2px;
  }
}

.quick-post {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 10px 12px;
  background: var(--color-bg);
  border-radius: 8px;
  border: 1px solid var(--color-border);

  svg {
    width: 14px;
    height: 14px;
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

/* ── Skeleton / empty ─────────────────────────────────── */
.empty-state {
  font-size: 13px;
  color: var(--color-text-muted);
  text-align: center;
  padding: 20px 0;
}

.skeleton-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-event,
.skeleton-notice {
  height: 54px;
  border-radius: 10px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}

.skeleton-notice { height: 44px; }

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ── 다크모드 ─────────────────────────────────────────── */
[data-theme="dark"] {
  .card,
  .doc-card { background: var(--color-bg-card); }

  .event-item { background: var(--color-bg-card); }
  .event-time-col { background: var(--color-bg); border-color: var(--color-border); }

  .skeleton-event,
  .skeleton-notice {
    background: linear-gradient(90deg, #2a3040 25%, #323b50 50%, #2a3040 75%);
    background-size: 200% 100%;
  }
}
</style>
