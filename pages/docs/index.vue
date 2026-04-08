<template>
  <div class="docs-page">

    <!-- 좌측 패널 -->
    <aside class="docs-panel">
      <div class="panel-section">
        <p class="panel-label">컬렉션</p>

        <ul class="folder-list">
          <!-- 전체 보기 -->
          <li
            class="folder-item"
            :class="{ active: selectedFolderId === null }"
            @click="selectedFolderId = null"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M3 7a2 2 0 012-2h3l2 2h9a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/>
            </svg>
            <span>전체</span>
          </li>

          <li
            v-for="folder in folders"
            :key="folder.id"
            class="folder-item"
            :class="{ active: selectedFolderId === folder.id }"
            @click="selectedFolderId = folder.id"
            @contextmenu.prevent="confirmDeleteFolder(folder)"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
              <path d="M3 7a2 2 0 012-2h3l2 2h9a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V7z"/>
            </svg>
            <span>{{ folder.name }}</span>
          </li>
        </ul>

        <!-- 새 컬렉션 -->
        <div v-if="addingFolder" class="new-folder-input">
          <input
            ref="folderInputRef"
            v-model="newFolderName"
            placeholder="컬렉션 이름"
            maxlength="30"
            @keydown.enter="createFolder"
            @keydown.esc="addingFolder = false"
            @blur="createFolder"
          />
        </div>
        <button v-else class="btn-new-folder" @click="startAddFolder">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          새 컬렉션
        </button>
      </div>

      <!-- 스토리지 (표시 전용) -->
      <div class="storage-section">
        <p class="panel-label">스토리지</p>
        <div class="storage-bar-wrap">
          <div class="storage-bar"><div class="storage-fill" :style="{ width: storagePercent + '%' }" /></div>
          <p class="storage-label">{{ docCount }}개 문서</p>
        </div>
      </div>
    </aside>

    <!-- 메인 콘텐츠 -->
    <div class="docs-main">

      <!-- 헤더 -->
      <div class="docs-header">
        <div>
          <h1>문서함</h1>
          <p>가족 공유 문서를 안전하게 보관하세요.</p>
        </div>
        <button class="btn-new-doc" @click="openCreate()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          새 문서
        </button>
      </div>

      <!-- 로딩 -->
      <div v-if="loading" class="state-empty">불러오는 중...</div>

      <template v-else>
        <!-- 상단 고정 문서 -->
        <section v-if="pinnedDocs.length" class="docs-section">
          <h2 class="section-title">
            <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
              <path d="M16 3H8a1 1 0 00-1 1v7l-2 3v1h6v5l1 1 1-1v-5h6v-1l-2-3V4a1 1 0 00-1-1z"/>
            </svg>
            상단 고정
          </h2>
          <div class="pinned-grid">
            <div
              v-for="doc in pinnedDocs"
              :key="doc.id"
              class="pinned-card"
              @click="openEdit(doc)"
            >
              <div class="pinned-card-top">
                <svg class="doc-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                <button class="btn-pin active" :title="'고정 해제'" @click.stop="togglePin(doc)">
                  <svg viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
                    <path d="M16 3H8a1 1 0 00-1 1v7l-2 3v1h6v5l1 1 1-1v-5h6v-1l-2-3V4a1 1 0 00-1-1z"/>
                  </svg>
                </button>
              </div>
              <p class="pinned-title">{{ doc.title }}</p>
              <p class="pinned-meta">
                <span v-if="doc.folder_name" class="pinned-folder">{{ doc.folder_name }}</span>
                <span>{{ formatDate(doc.updated_at) }}</span>
              </p>
            </div>
          </div>
        </section>

        <!-- 최근 파일 -->
        <section class="docs-section">
          <h2 class="section-title">최근 파일</h2>

          <div v-if="recentDocs.length === 0" class="state-empty">
            {{ selectedFolderId ? '이 컬렉션에 문서가 없습니다.' : '아직 문서가 없습니다.' }}
          </div>

          <table v-else class="docs-table">
            <thead>
              <tr>
                <th>이름 & 미리보기</th>
                <th>컬렉션</th>
                <th>날짜</th>
                <th>액션</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="doc in recentDocs"
                :key="doc.id"
                class="doc-row"
                @click="openEdit(doc)"
              >
                <td class="td-name">
                  <div class="doc-thumb">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                    </svg>
                  </div>
                  <div>
                    <p class="doc-title">{{ doc.title }}</p>
                    <p class="doc-preview">{{ previewContent(doc.content) }}</p>
                  </div>
                </td>
                <td>
                  <span v-if="doc.folder_name" class="folder-badge">{{ doc.folder_name }}</span>
                  <span v-else class="folder-none">—</span>
                </td>
                <td class="td-date">{{ formatDate(doc.updated_at) }}</td>
                <td class="td-actions" @click.stop>
                  <button class="action-btn" :class="{ pinned: doc.is_pinned }" :title="doc.is_pinned ? '고정 해제' : '상단 고정'" @click="togglePin(doc)">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="15" height="15">
                      <path d="M16 3H8a1 1 0 00-1 1v7l-2 3v1h6v5l1 1 1-1v-5h6v-1l-2-3V4a1 1 0 00-1-1z"/>
                    </svg>
                  </button>
                  <button class="action-btn danger" title="삭제" @click="deleteDoc(doc)">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6l-1 14H6L5 6"/>
                      <path d="M10 11v6M14 11v6"/>
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </section>
      </template>
    </div>

    <!-- 문서 모달 -->
    <DocsDocumentModal
      v-if="modalOpen"
      :doc="editingDoc"
      :folders="folders"
      :default-folder-id="selectedFolderId ?? undefined"
      @close="modalOpen = false"
      @saved="onDocSaved"
      @deleted="onDocDeleted"
    />

  </div>
</template>

<script setup lang="ts">
import type { DocItem, DocFolder } from '~/components/docs/DocumentModal.vue'

// ── 상태 ──
const folders       = ref<DocFolder[]>([])
const allDocs       = ref<DocItem[]>([])
const loading       = ref(true)
const selectedFolderId = ref<string | null>(null)
const modalOpen     = ref(false)
const editingDoc    = ref<DocItem | null>(null)

// ── 폴더 추가 ──
const addingFolder  = ref(false)
const newFolderName = ref('')
const folderInputRef = ref<HTMLInputElement | null>(null)

// ── 계산 ──
const filteredDocs = computed(() =>
  selectedFolderId.value
    ? allDocs.value.filter(d => d.folder_id === selectedFolderId.value)
    : allDocs.value,
)
const pinnedDocs  = computed(() => filteredDocs.value.filter(d => d.is_pinned))
const recentDocs  = computed(() => filteredDocs.value.filter(d => !d.is_pinned))
const docCount    = computed(() => allDocs.value.length)
const storagePercent = computed(() => Math.min(docCount.value * 2, 100)) // 표시용

// ── 초기 로드 ──
onMounted(async () => {
  await Promise.all([fetchFolders(), fetchDocs()])
  loading.value = false
})

async function fetchFolders() {
  try { folders.value = await $fetch<DocFolder[]>('/api/folders') } catch {}
}

async function fetchDocs() {
  try { allDocs.value = await $fetch<DocItem[]>('/api/documents') } catch {}
}

// ── 컬렉션 생성 ──
function startAddFolder() {
  addingFolder.value = true
  newFolderName.value = ''
  nextTick(() => folderInputRef.value?.focus())
}

async function createFolder() {
  const name = newFolderName.value.trim()
  addingFolder.value = false
  if (!name) return
  try {
    const folder = await $fetch<DocFolder>('/api/folders', { method: 'POST', body: { name } })
    folders.value.push(folder)
  } catch (e: any) {
    alert(e?.data?.message ?? '컬렉션 생성 실패')
  }
}

async function confirmDeleteFolder(folder: DocFolder) {
  if (!confirm(`"${folder.name}" 컬렉션을 삭제할까요?\n문서는 삭제되지 않습니다.`)) return
  try {
    await $fetch(`/api/folders/${folder.id}`, { method: 'DELETE' })
    folders.value = folders.value.filter(f => f.id !== folder.id)
    // 해당 폴더의 문서들 folder_id 초기화
    allDocs.value = allDocs.value.map(d =>
      d.folder_id === folder.id ? { ...d, folder_id: null, folder_name: null } : d,
    )
    if (selectedFolderId.value === folder.id) selectedFolderId.value = null
  } catch {
    alert('컬렉션 삭제 실패')
  }
}

// ── 문서 모달 ──
function openCreate() {
  editingDoc.value = null
  modalOpen.value = true
}

function openEdit(doc: DocItem) {
  editingDoc.value = doc
  modalOpen.value = true
}

function onDocSaved(doc: DocItem) {
  const idx = allDocs.value.findIndex(d => d.id === doc.id)
  if (idx !== -1) allDocs.value[idx] = doc
  else allDocs.value.unshift(doc)
}

function onDocDeleted(id: string) {
  allDocs.value = allDocs.value.filter(d => d.id !== id)
}

// ── 핀 토글 ──
async function togglePin(doc: DocItem) {
  try {
    const { is_pinned } = await $fetch<{ is_pinned: boolean }>(
      `/api/documents/${doc.id}/pin`, { method: 'PATCH' },
    )
    const target = allDocs.value.find(d => d.id === doc.id)
    if (target) target.is_pinned = is_pinned
  } catch {}
}

// ── 삭제 ──
async function deleteDoc(doc: DocItem) {
  if (!confirm(`"${doc.title}" 문서를 삭제할까요?`)) return
  try {
    await $fetch(`/api/documents/${doc.id}`, { method: 'DELETE' })
    allDocs.value = allDocs.value.filter(d => d.id !== doc.id)
  } catch {
    alert('삭제에 실패했습니다.')
  }
}

// ── 유틸 ──
function formatDate(iso: string) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' })
}

function previewContent(content: string) {
  if (!content) return '내용 없음'
  return content.length > 60 ? content.slice(0, 60) + '...' : content
}
</script>

<style scoped lang="scss">
.docs-page {
  display: flex;
  gap: 20px;
  height: calc(100vh - 60px - 56px);
  min-height: 0;
}

/* ── 좌측 패널 ── */
.docs-panel {
  width: 210px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.panel-section {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 16px 12px;
  flex: 1;
  overflow-y: auto;
}

.panel-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--color-text-muted);
  margin: 0 0 10px 6px;
}

.folder-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-bottom: 8px;
}

.folder-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 13px;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: background 0.12s, color 0.12s;

  svg { width: 15px; height: 15px; flex-shrink: 0; }
  span { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

  &:hover { background: var(--color-bg-hover); color: var(--color-text); }
  &.active { background: #eef0fd; color: var(--color-primary); font-weight: 600; }
}

.new-folder-input input {
  width: 100%;
  height: 32px;
  padding: 0 10px;
  border: 1.5px solid var(--color-primary);
  border-radius: 6px;
  font-size: 13px;
  background: var(--color-bg);
  color: var(--color-text);
  outline: none;
  box-sizing: border-box;
}

.btn-new-folder {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 7px 10px;
  font-size: 12px;
  color: var(--color-text-muted);
  background: none;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  width: 100%;
  transition: background 0.12s, color 0.12s;

  svg { width: 13px; height: 13px; }
  &:hover { background: var(--color-bg-hover); color: var(--color-text); }
}

/* 스토리지 */
.storage-section {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 14px 14px 16px;
}

.storage-bar-wrap { display: flex; flex-direction: column; gap: 8px; }

.storage-bar {
  height: 6px;
  background: var(--color-border);
  border-radius: 3px;
  overflow: hidden;
}

.storage-fill {
  height: 100%;
  background: var(--color-primary);
  border-radius: 3px;
  transition: width 0.4s;
}

.storage-label { font-size: 11px; color: var(--color-text-muted); margin: 0; }

/* ── 메인 ── */
.docs-main {
  flex: 1;
  min-width: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.docs-header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  h1 { font-size: 22px; font-weight: 800; color: var(--color-text); margin: 0 0 4px; }
  p  { font-size: 13px; color: var(--color-text-muted); margin: 0; }
}

.btn-new-doc {
  display: flex;
  align-items: center;
  gap: 6px;
  height: 38px;
  padding: 0 18px;
  background: var(--color-primary);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s;

  svg { width: 16px; height: 16px; }
  &:hover { background: var(--color-primary-hover); }
}

/* ── 섹션 ── */
.docs-section { display: flex; flex-direction: column; gap: 12px; }

.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--color-text-muted);
  margin: 0;
  svg { color: #f0a500; }
}

/* ── 고정 카드 그리드 ── */
.pinned-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.pinned-card {
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 16px;
  cursor: pointer;
  transition: border-color 0.15s, box-shadow 0.15s;

  &:hover { border-color: var(--color-primary); box-shadow: 0 2px 12px rgba(71,99,228,0.08); }
}

.pinned-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.doc-icon {
  width: 24px; height: 24px;
  color: var(--color-primary);
}

.btn-pin {
  width: 24px; height: 24px;
  display: flex; align-items: center; justify-content: center;
  background: none; border: none; cursor: pointer;
  color: var(--color-text-muted); border-radius: 4px;
  transition: color 0.12s;

  &.active { color: #f0a500; }
  &:hover { color: #f0a500; }
}

.pinned-title {
  font-size: 14px; font-weight: 600;
  color: var(--color-text); margin: 0 0 6px;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

.pinned-meta {
  display: flex; gap: 6px; align-items: center;
  font-size: 11px; color: var(--color-text-muted); margin: 0;
}

.pinned-folder {
  background: var(--color-bg-hover);
  border-radius: 4px; padding: 1px 6px;
  color: var(--color-text-sub); font-weight: 500;
}

/* ── 테이블 ── */
.docs-table {
  width: 100%;
  border-collapse: collapse;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  overflow: hidden;

  th {
    font-size: 11px; font-weight: 700; text-transform: uppercase;
    letter-spacing: 0.5px; color: var(--color-text-muted);
    padding: 11px 16px; text-align: left;
    background: var(--color-bg-hover);
    border-bottom: 1px solid var(--color-border);
  }
}

.doc-row {
  cursor: pointer;
  transition: background 0.1s;
  border-bottom: 1px solid var(--color-border);

  &:last-child { border-bottom: none; }
  &:hover { background: var(--color-bg-hover); }

  td { padding: 12px 16px; vertical-align: middle; }
}

.td-name {
  display: flex;
  align-items: center;
  gap: 12px;
}

.doc-thumb {
  width: 40px; height: 40px; border-radius: 8px;
  background: #f0f3ff;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  svg { width: 20px; height: 20px; color: var(--color-primary); }
}

.doc-title {
  font-size: 14px; font-weight: 600;
  color: var(--color-text); margin: 0 0 2px;
}

.doc-preview {
  font-size: 12px; color: var(--color-text-muted); margin: 0;
}

.folder-badge {
  display: inline-block;
  font-size: 12px; font-weight: 500;
  background: var(--color-bg-hover);
  color: var(--color-text-sub);
  padding: 3px 10px; border-radius: 20px;
  border: 1px solid var(--color-border);
}

.folder-none { color: var(--color-text-placeholder); font-size: 13px; }

.td-date { font-size: 12px; color: var(--color-text-muted); white-space: nowrap; }

.td-actions { white-space: nowrap; }

.action-btn {
  width: 30px; height: 30px;
  display: inline-flex; align-items: center; justify-content: center;
  background: none; border: none; cursor: pointer;
  color: var(--color-text-muted); border-radius: 6px;
  transition: background 0.12s, color 0.12s;

  &:hover { background: var(--color-bg-hover); color: var(--color-text); }
  &.pinned { color: #f0a500; }
  &.danger:hover { background: #fff0f0; color: var(--color-danger); }
}

.state-empty {
  font-size: 14px; color: var(--color-text-muted);
  padding: 40px 0; text-align: center;
}
</style>
