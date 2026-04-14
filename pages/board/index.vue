<template>
  <div class="board-page">

    <!-- ── 피드 영역 ── -->
    <div class="feed">

      <!-- 글쓰기 컴포저 -->
      <div class="composer">
        <div class="composer-avatar" :style="{ background: authStore.user?.color }">
          {{ authStore.user?.name?.charAt(0)?.toUpperCase() }}
        </div>
        <div class="composer-body">
          <div v-if="!composerOpen" class="composer-placeholder" @click="composerOpen = true">
            무슨 생각을 하고 계세요?
          </div>
          <template v-else>
            <textarea
              ref="composerRef"
              v-model="newContent"
              placeholder="무슨 생각을 하고 계세요?"
              rows="3"
              @keydown.esc="composerOpen = false"
            />
            <div class="composer-footer">
              <div class="composer-opts">
                <button class="opt-btn" disabled title="사진 첨부 (Storage 설정 후 이용 가능)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="16" height="16">
                    <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  사진
                </button>
              </div>
              <div class="composer-actions">
                <button class="btn-cancel" @click="composerOpen = false; newContent = ''">취소</button>
                <button class="btn-post" :disabled="!newContent.trim() || posting" @click="submitPost">
                  {{ posting ? '게시 중...' : '게시' }}
                </button>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- 게시글 목록 -->
      <div v-if="loading" class="feed-empty">불러오는 중...</div>

      <template v-else>
        <div v-if="posts.length === 0" class="feed-empty">
          첫 번째 게시글을 작성해보세요.
        </div>
        <BoardPostCard
          v-for="post in posts"
          :key="post.id"
          :post="post"
          @updated="onPostUpdated"
          @deleted="onPostDeleted"
        />
      </template>
    </div>

    <!-- ── 우측 사이드바 ── -->
    <aside class="board-sidebar">

      <!-- 이번 주 일정 -->
      <div class="widget">
        <h3 class="widget-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="14" height="14">
            <rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>
          </svg>
          이번 주 일정
        </h3>
        <div v-if="upcomingEvents.length === 0" class="widget-empty">이번 주 일정이 없습니다.</div>
        <ul v-else class="event-list">
          <li v-for="ev in upcomingEvents" :key="ev.id" class="event-item">
            <div class="event-dot" />
            <div class="event-info">
              <span class="event-title">{{ ev.title }}</span>
              <span class="event-date">{{ formatEventDate(ev.start_date) }}</span>
            </div>
          </li>
        </ul>
        <NuxtLink to="/calendar" class="widget-link">캘린더 보기</NuxtLink>
      </div>

      <!-- 가족 구성원 -->
      <div class="widget">
        <h3 class="widget-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="14" height="14">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
          </svg>
          가족 구성원
        </h3>
        <ul class="member-list">
          <li v-for="m in members" :key="m.id" class="member-item">
            <div class="member-avatar" :style="{ background: m.color }">
              {{ m.name.charAt(0).toUpperCase() }}
            </div>
            <span class="member-name">{{ m.name }}</span>
            <span v-if="m.id === authStore.user?.id" class="member-me">나</span>
          </li>
        </ul>
      </div>

      <!-- 오늘의 질문 -->
      <div class="widget widget-prompt">
        <h3 class="widget-title">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="14" height="14">
            <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          오늘의 질문
        </h3>
        <p class="prompt-text">"{{ dailyPrompt }}"</p>
        <button class="btn-answer" @click="composerOpen = true; newContent = dailyPrompt + '\n\n'">
          답하기
        </button>
      </div>

    </aside>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'
import type { Post } from '~/components/board/PostCard.vue'

const authStore = useAuthStore()

// ── 게시글 ──
const posts   = ref<Post[]>([])
const loading = ref(true)

onMounted(async () => {
  await Promise.all([fetchPosts(), fetchSidebarData()])
  loading.value = false
})

async function fetchPosts() {
  try { posts.value = await $fetch<Post[]>('/api/posts') } catch {}
}

function onPostUpdated(updated: Post) {
  const idx = posts.value.findIndex(p => p.id === updated.id)
  if (idx !== -1) posts.value[idx] = updated
  // 핀 상태 바뀌면 정렬 재적용
  posts.value = [
    ...posts.value.filter(p => p.is_pinned),
    ...posts.value.filter(p => !p.is_pinned),
  ]
}

function onPostDeleted(id: string) {
  posts.value = posts.value.filter(p => p.id !== id)
}

// ── 글쓰기 컴포저 ──
const composerOpen = ref(false)
const composerRef  = ref<HTMLTextAreaElement | null>(null)
const newContent   = ref('')
const posting      = ref(false)

watch(composerOpen, (val) => {
  if (val) nextTick(() => composerRef.value?.focus())
})

async function submitPost() {
  if (!newContent.value.trim()) return
  posting.value = true
  try {
    const post = await $fetch<Post>('/api/posts', {
      method: 'POST',
      body: { content: newContent.value },
    })
    posts.value.unshift(post)
    newContent.value = ''
    composerOpen.value = false
  } catch (e: any) {
    alert(e?.data?.message ?? '게시에 실패했습니다.')
  } finally {
    posting.value = false
  }
}

// ── 사이드바 데이터 ──
interface Member { id: string; name: string; color: string }
interface CalEvent { id: string; title: string; start_date: string }

const members        = ref<Member[]>([])
const upcomingEvents = ref<CalEvent[]>([])

async function fetchSidebarData() {
  const today   = new Date()
  const endDate = new Date(today)
  endDate.setDate(today.getDate() + 7)

  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

  await Promise.all([
    $fetch<Member[]>('/api/members').then(d => { members.value = d }).catch(() => {}),
    $fetch<CalEvent[]>('/api/events', {
      query: { startDate: fmt(today), endDate: fmt(endDate) },
    }).then(d => { upcomingEvents.value = d.slice(0, 5) }).catch(() => {}),
  ])
}

function formatEventDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' })
}

// ── 오늘의 질문 ──
const PROMPTS = [
  '오늘 나를 미소 짓게 한 것은 무엇인가요?',
  '요즘 가장 먹고 싶은 음식은?',
  '지금 가장 보고 싶은 가족은?',
  '이번 주 가장 기억에 남는 순간은?',
  '가족에게 한 마디 한다면?',
  '오늘 하루 어떠셨나요?',
  '요즘 배우고 싶은 것이 있나요?',
]
const dailyPrompt = PROMPTS[new Date().getDay() % PROMPTS.length]
</script>

<style scoped lang="scss">
.board-page {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

/* ── 피드 ── */
.feed {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 컴포저 */
.composer {
  display: flex;
  gap: 12px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 14px 16px;
}

.composer-avatar {
  width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 700; color: #fff;
}

.composer-body { flex: 1; min-width: 0; }

.composer-placeholder {
  height: 36px; line-height: 36px;
  color: var(--color-text-placeholder);
  font-size: 14px; cursor: pointer;
  border-radius: 18px;
  background: var(--color-bg-hover);
  padding: 0 16px;
  transition: background 0.12s;
  &:hover { background: var(--color-bg-active); }
}

.composer-body textarea {
  width: 100%; padding: 10px 0;
  border: none; outline: none; resize: none;
  font-size: 14px; font-family: inherit;
  color: var(--color-text); background: transparent;
  line-height: 1.6; box-sizing: border-box;
}

.composer-footer {
  display: flex; align-items: center; justify-content: space-between;
  padding-top: 10px;
  border-top: 1px solid var(--color-border);
  margin-top: 4px;
}

.composer-opts { display: flex; gap: 4px; }

.opt-btn {
  display: flex; align-items: center; gap: 5px;
  padding: 6px 10px; border-radius: 6px;
  background: none; border: none; cursor: not-allowed;
  font-size: 12px; color: var(--color-text-muted); opacity: 0.5;
}

.composer-actions { display: flex; gap: 8px; }

.btn-cancel {
  height: 32px; padding: 0 14px; border-radius: 6px;
  background: none; border: 1px solid var(--color-border);
  font-size: 13px; color: var(--color-text-muted); cursor: pointer;
  transition: background 0.12s;
  &:hover { background: var(--color-bg-hover); }
}

.btn-post {
  height: 32px; padding: 0 16px; border-radius: 6px;
  background: var(--color-primary); color: #fff;
  font-size: 13px; font-weight: 600; border: none; cursor: pointer;
  transition: background 0.12s;
  &:hover:not(:disabled) { background: var(--color-primary-hover); }
  &:disabled { opacity: 0.5; cursor: not-allowed; }
}

.feed-empty {
  text-align: center; padding: 48px 0;
  font-size: 14px; color: var(--color-text-muted);
}

/* ── 사이드바 ── */
.board-sidebar {
  width: 300px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  position: sticky;
  top: 0;
}

.widget {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 16px;
}

.widget-title {
  display: flex; align-items: center; gap: 6px;
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.6px; color: var(--color-text-muted);
  margin: 0 0 12px;
}

.widget-empty {
  font-size: 13px; color: var(--color-text-muted);
  padding: 4px 0;
}

/* 이번 주 일정 */
.event-list { list-style: none; display: flex; flex-direction: column; gap: 8px; }

.event-item {
  display: flex; align-items: flex-start; gap: 8px;
}

.event-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--color-primary); flex-shrink: 0; margin-top: 5px;
}

.event-info { display: flex; flex-direction: column; gap: 1px; }

.event-title { font-size: 13px; font-weight: 600; color: var(--color-text); }
.event-date  { font-size: 11px; color: var(--color-text-muted); }

.widget-link {
  display: block; margin-top: 10px;
  font-size: 12px; font-weight: 600; color: var(--color-primary);
  text-decoration: none; text-align: right;
  &:hover { opacity: 0.75; }
}

/* 구성원 */
.member-list { list-style: none; display: flex; flex-direction: column; gap: 6px; }

.member-item {
  display: flex; align-items: center; gap: 8px;
}

.member-avatar {
  width: 28px; height: 28px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700; color: #fff; flex-shrink: 0;
}

.member-name { flex: 1; font-size: 13px; color: var(--color-text); }

.member-me {
  font-size: 10px; font-weight: 600;
  color: var(--color-primary);
  border: 1.5px solid var(--color-primary);
  border-radius: 10px; padding: 1px 6px;
}

/* 오늘의 질문 */
.widget-prompt { background: #f5f3ff; border-color: #d8d0f8; }

.prompt-text {
  font-size: 14px; color: #4a3f7a; line-height: 1.6;
  margin: 0 0 12px; font-style: italic;
}

.btn-answer {
  width: 100%; height: 32px;
  background: #7c5cbf; color: #fff;
  border: none; border-radius: 6px;
  font-size: 13px; font-weight: 600; cursor: pointer;
  transition: background 0.12s;
  &:hover { background: #6a4eaa; }
}
</style>
