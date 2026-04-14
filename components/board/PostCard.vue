<template>
  <article class="post-card" :class="{ pinned: post.is_pinned }">

    <!-- 고정 배지 -->
    <div v-if="post.is_pinned" class="pin-banner">
      <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
        <path d="M16 3H8a1 1 0 00-1 1v7l-2 3v1h6v5l1 1 1-1v-5h6v-1l-2-3V4a1 1 0 00-1-1z"/>
      </svg>
      고정된 공지
      <span class="pin-time">· {{ timeAgo(post.created_at) }}</span>
    </div>

    <!-- 헤더 -->
    <div class="post-head">
      <div class="author-avatar" :style="{ background: post.creator_color }">
        {{ post.creator_name?.charAt(0)?.toUpperCase() }}
      </div>
      <div class="author-info">
        <span class="author-name">{{ post.creator_name }}</span>
        <span class="post-time">{{ timeAgo(post.created_at) }}</span>
      </div>

      <!-- 내 글이면 수정/삭제 메뉴 -->
      <div v-if="isOwner" class="post-menu">
        <button class="btn-menu" @click.stop="menuOpen = !menuOpen">
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
            <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
          </svg>
        </button>
        <div v-if="menuOpen" class="dropdown">
          <button @click="startEdit">수정</button>
          <button @click="handlePin">{{ post.is_pinned ? '고정 해제' : '상단 고정' }}</button>
          <button class="danger" @click="handleDelete">삭제</button>
        </div>
      </div>
      <div v-else class="post-menu">
        <button class="btn-menu" @click.stop="menuOpen = !menuOpen">
          <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
            <circle cx="5" cy="12" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="19" cy="12" r="2"/>
          </svg>
        </button>
        <div v-if="menuOpen" class="dropdown">
          <button @click="handlePin">{{ post.is_pinned ? '고정 해제' : '상단 고정' }}</button>
        </div>
      </div>
    </div>

    <!-- 본문 (수정 모드) -->
    <div v-if="editing" class="edit-area">
      <textarea v-model="editContent" rows="4" @keydown.esc="editing = false" />
      <div class="edit-actions">
        <button class="btn-cancel" @click="editing = false">취소</button>
        <button class="btn-save" :disabled="saving" @click="submitEdit">저장</button>
      </div>
    </div>

    <!-- 본문 (읽기 모드) -->
    <div v-else class="post-content">
      <p>{{ post.content }}</p>
      <img v-if="post.link_url && isImageUrl(post.link_url)" :src="post.link_url" class="post-image" alt="" />
    </div>

    <!-- 반응 요약 -->
    <div v-if="post.reaction_count > 0" class="reaction-summary">
      <span>❤️</span>
      <span class="reaction-count">{{ post.reaction_count }}</span>
    </div>

    <!-- 액션 바 -->
    <div class="post-actions">
      <button class="action-btn" :class="{ active: post.user_reacted }" @click="handleReact">
        <svg viewBox="0 0 24 24" :fill="post.user_reacted ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" width="16" height="16">
          <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
        </svg>
        좋아요
      </button>
      <button class="action-btn" @click="toggleComments">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
        </svg>
        댓글 {{ post.comment_count > 0 ? post.comment_count : '' }}
      </button>
    </div>

    <!-- 댓글 섹션 -->
    <div v-if="showComments" class="comments-section">
      <div v-if="loadingComments" class="comments-loading">불러오는 중...</div>

      <template v-else>
        <div v-for="comment in comments" :key="comment.id" class="comment-row">
          <div class="comment-avatar" :style="{ background: comment.creator_color }">
            {{ comment.creator_name?.charAt(0)?.toUpperCase() }}
          </div>
          <div class="comment-bubble">
            <span class="comment-author">{{ comment.creator_name }}</span>
            <p class="comment-text">{{ comment.content }}</p>
          </div>
          <button
            v-if="comment.created_by === myId"
            class="btn-del-comment"
            @click="deleteComment(comment.id)"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- 댓글 입력 -->
        <div class="comment-input-row">
          <div class="comment-avatar" :style="{ background: myColor }">{{ myInitial }}</div>
          <div class="comment-input-wrap">
            <input
              v-model="newComment"
              placeholder="댓글 달기..."
              @keydown.enter.prevent="submitComment"
            />
          </div>
        </div>
      </template>
    </div>

  </article>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

export interface Post {
  id: string
  content: string
  link_url: string | null
  is_pinned: boolean
  created_at: string
  created_by: string
  creator_name: string
  creator_color: string
  comment_count: number
  reaction_count: number
  user_reacted: boolean
}

interface Comment {
  id: string
  content: string
  created_at: string
  created_by: string
  creator_name: string
  creator_color: string
}

const props = defineProps<{ post: Post }>()
const emit = defineEmits<{
  updated: [post: Post]
  deleted: [id: string]
}>()

const authStore = useAuthStore()
const myId      = computed(() => authStore.user?.id ?? '')
const myColor   = computed(() => authStore.user?.color ?? '#ccc')
const myInitial = computed(() => authStore.user?.name?.charAt(0)?.toUpperCase() ?? '?')
const isOwner   = computed(() => props.post.created_by === myId.value)

// ── 메뉴 (외부 클릭 시 닫기) ──
const menuOpen = ref(false)

onMounted(() => {
  document.addEventListener('click', () => { menuOpen.value = false })
})
onUnmounted(() => {
  document.removeEventListener('click', () => { menuOpen.value = false })
})

// ── 수정 ──
const editing     = ref(false)
const editContent = ref(props.post.content)
const saving      = ref(false)

function startEdit() {
  editContent.value = props.post.content
  editing.value = true
  menuOpen.value = false
}

async function submitEdit() {
  if (!editContent.value.trim()) return
  saving.value = true
  try {
    const updated = await $fetch<Post>(`/api/posts/${props.post.id}`, {
      method: 'PUT',
      body: { content: editContent.value, link_url: props.post.link_url, is_pinned: props.post.is_pinned },
    })
    emit('updated', updated)
    editing.value = false
  } catch { alert('수정에 실패했습니다.') }
  finally { saving.value = false }
}

// ── 삭제 ──
async function handleDelete() {
  if (!confirm('이 게시글을 삭제할까요?')) return
  menuOpen.value = false
  try {
    await $fetch(`/api/posts/${props.post.id}`, { method: 'DELETE' })
    emit('deleted', props.post.id)
  } catch { alert('삭제에 실패했습니다.') }
}

// ── 핀 ──
async function handlePin() {
  menuOpen.value = false
  try {
    const { is_pinned } = await $fetch<{ is_pinned: boolean }>(`/api/posts/${props.post.id}/pin`, { method: 'PATCH' })
    emit('updated', { ...props.post, is_pinned })
  } catch {}
}

// ── 반응 ──
async function handleReact() {
  try {
    const res = await $fetch<{ user_reacted: boolean; reaction_count: number }>(
      `/api/posts/${props.post.id}/react`, { method: 'POST' },
    )
    emit('updated', { ...props.post, ...res })
  } catch {}
}

// ── 댓글 ──
const showComments    = ref(false)
const loadingComments = ref(false)
const comments        = ref<Comment[]>([])
const newComment      = ref('')

async function toggleComments() {
  showComments.value = !showComments.value
  if (showComments.value && comments.value.length === 0) await loadComments()
}

async function loadComments() {
  loadingComments.value = true
  try { comments.value = await $fetch<Comment[]>(`/api/posts/${props.post.id}/comments`) }
  finally { loadingComments.value = false }
}

async function submitComment() {
  if (!newComment.value.trim()) return
  try {
    const comment = await $fetch<Comment>(`/api/posts/${props.post.id}/comments`, {
      method: 'POST', body: { content: newComment.value },
    })
    comments.value.push(comment)
    emit('updated', { ...props.post, comment_count: props.post.comment_count + 1 })
    newComment.value = ''
  } catch { alert('댓글 등록에 실패했습니다.') }
}

async function deleteComment(cid: string) {
  if (!confirm('댓글을 삭제할까요?')) return
  try {
    await $fetch(`/api/posts/${props.post.id}/comments/${cid}`, { method: 'DELETE' })
    comments.value = comments.value.filter(c => c.id !== cid)
    emit('updated', { ...props.post, comment_count: props.post.comment_count - 1 })
  } catch { alert('삭제에 실패했습니다.') }
}

// ── 유틸 ──
function isImageUrl(url: string) {
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(url)
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1)  return '방금 전'
  if (m < 60) return `${m}분 전`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}시간 전`
  const d = Math.floor(h / 24)
  if (d < 7)  return `${d}일 전`
  return new Date(iso).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })
}
</script>

<style scoped lang="scss">
.post-card {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  overflow: hidden;
  transition: box-shadow 0.15s;

  &.pinned {
    border-color: #f0a500;
    background: linear-gradient(135deg, #fffdf0 0%, var(--color-bg) 60%);
  }
}

/* 고정 배너 */
.pin-banner {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #fff8e0;
  color: #b07c00;
  font-size: 12px;
  font-weight: 600;
  border-bottom: 1px solid #f0e0a0;

  .pin-time { font-weight: 400; color: #b07c0099; }
}

/* 헤더 */
.post-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px 0;
}

.author-avatar {
  width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 700; color: #fff;
}

.author-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.author-name { font-size: 14px; font-weight: 700; color: var(--color-text); }
.post-time   { font-size: 12px; color: var(--color-text-muted); }

/* 메뉴 */
.post-menu { position: relative; }

.btn-menu {
  width: 28px; height: 28px; border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  background: none; border: none; cursor: pointer;
  color: var(--color-text-muted);
  transition: background 0.12s;
  &:hover { background: var(--color-bg-hover); }
}

.dropdown {
  position: absolute; right: 0; top: calc(100% + 4px);
  background: var(--color-bg); border: 1px solid var(--color-border);
  border-radius: 8px; box-shadow: 0 4px 16px rgba(0,0,0,0.1);
  z-index: 100; min-width: 120px; overflow: hidden;

  button {
    display: block; width: 100%; padding: 9px 14px;
    text-align: left; font-size: 13px; background: none; border: none; cursor: pointer;
    color: var(--color-text); transition: background 0.1s;
    &:hover { background: var(--color-bg-hover); }
    &.danger { color: var(--color-danger); }
  }
}

/* 수정 영역 */
.edit-area {
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;

  textarea {
    width: 100%; padding: 10px 12px; border: 1px solid var(--color-border);
    border-radius: 8px; font-size: 14px; resize: vertical;
    font-family: inherit; color: var(--color-text); background: var(--color-bg);
    outline: none; box-sizing: border-box;
    &:focus { border-color: var(--color-primary); }
  }
}

.edit-actions {
  display: flex; justify-content: flex-end; gap: 8px;

  button {
    height: 32px; padding: 0 14px; border-radius: 6px;
    font-size: 13px; cursor: pointer; transition: background 0.12s;
  }
  .btn-cancel {
    background: none; border: 1px solid var(--color-border); color: var(--color-text-muted);
    &:hover { background: var(--color-bg-hover); }
  }
  .btn-save {
    background: var(--color-primary); border: none; color: #fff; font-weight: 600;
    &:hover:not(:disabled) { background: var(--color-primary-hover); }
    &:disabled { opacity: 0.6; cursor: not-allowed; }
  }
}

/* 본문 */
.post-content {
  padding: 12px 16px;

  p { font-size: 14px; color: var(--color-text); line-height: 1.6; margin: 0 0 10px; white-space: pre-wrap; }
}

.post-image {
  width: 100%; border-radius: 8px; object-fit: cover; max-height: 360px; display: block;
}

/* 반응 요약 */
.reaction-summary {
  display: flex; align-items: center; gap: 4px;
  padding: 0 16px 8px;
  font-size: 13px; color: var(--color-text-muted);
}

.reaction-count { font-size: 12px; }

/* 액션 바 */
.post-actions {
  display: flex; gap: 4px;
  padding: 4px 12px 10px;
  border-top: 1px solid var(--color-border);
  margin-top: 4px;
}

.action-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 6px 12px; border-radius: 8px;
  background: none; border: none; cursor: pointer;
  font-size: 13px; color: var(--color-text-muted);
  transition: background 0.12s, color 0.12s;

  &:hover { background: var(--color-bg-hover); color: var(--color-text); }
  &.active { color: #e05c5c; }
}

/* 댓글 */
.comments-section {
  padding: 12px 16px;
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-hover);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.comments-loading { font-size: 13px; color: var(--color-text-muted); text-align: center; padding: 8px; }

.comment-row {
  display: flex; align-items: flex-start; gap: 8px;
}

.comment-avatar {
  width: 28px; height: 28px; border-radius: 50%; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700; color: #fff;
}

.comment-bubble {
  flex: 1;
  background: var(--color-bg);
  border-radius: 0 10px 10px 10px;
  padding: 8px 12px;
  border: 1px solid var(--color-border);
}

.comment-author {
  font-size: 12px; font-weight: 700;
  color: var(--color-text-sub); display: block; margin-bottom: 2px;
}

.comment-text {
  font-size: 13px; color: var(--color-text); margin: 0; line-height: 1.5;
}

.btn-del-comment {
  width: 22px; height: 22px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: none; border: none; cursor: pointer;
  color: var(--color-text-placeholder); border-radius: 4px;
  transition: color 0.12s;
  &:hover { color: var(--color-danger); }
}

.comment-input-row {
  display: flex; align-items: center; gap: 8px;
}

.comment-input-wrap {
  flex: 1;

  input {
    width: 100%; height: 34px; padding: 0 12px;
    border: 1px solid var(--color-border); border-radius: 17px;
    font-size: 13px; background: var(--color-bg); color: var(--color-text);
    outline: none; box-sizing: border-box; transition: border-color 0.15s;
    &:focus { border-color: var(--color-primary); }
    &::placeholder { color: var(--color-text-placeholder); }
  }
}
</style>
