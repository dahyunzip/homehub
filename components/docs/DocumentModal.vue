<template>
  <Teleport to="body">
    <div class="modal-backdrop" @click.self="$emit('close')">
      <div class="modal">

        <div class="modal-header">
          <h3>{{ isEdit ? '문서 수정' : '새 문서' }}</h3>
          <button class="btn-close" @click="$emit('close')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div class="modal-body">
          <!-- 제목 -->
          <div class="field">
            <label>제목 <span class="required">*</span></label>
            <input v-model="form.title" type="text" placeholder="문서 제목 입력" maxlength="100" :class="{ error: errors.title }" />
            <p v-if="errors.title" class="field-error">{{ errors.title }}</p>
          </div>

          <!-- 컬렉션 + 상단고정 -->
          <div class="field-row">
            <div class="field">
              <label>컬렉션</label>
              <select v-model="form.folder_id">
                <option value="">없음</option>
                <option v-for="f in folders" :key="f.id" :value="f.id">{{ f.name }}</option>
              </select>
            </div>
            <div class="field pin-field">
              <label>상단 고정</label>
              <button class="toggle" :class="{ on: form.is_pinned }" @click="form.is_pinned = !form.is_pinned">
                <span class="toggle-knob" />
              </button>
            </div>
          </div>

          <!-- 내용 -->
          <div class="field">
            <label>내용</label>
            <textarea v-model="form.content" placeholder="문서 내용을 입력하세요" rows="8" />
          </div>

          <!-- 첨부파일 -->
          <div class="field">
            <label>첨부파일</label>

            <!-- 기존 첨부파일 (수정 모드) -->
            <div v-if="existingAttachments.length" class="attach-list">
              <div v-for="att in existingAttachments" :key="att.id" class="attach-item">
                <div class="attach-icon" :class="attColorClass(att.mime_type)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                </div>
                <div class="attach-info">
                  <a :href="att.url ?? undefined" target="_blank" class="attach-name">{{ att.name }}</a>
                  <span class="attach-size">{{ formatSize(att.size) }}</span>
                </div>
                <button class="attach-del" @click="deleteExisting(att.id)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- 새로 추가할 파일 목록 -->
            <div v-if="pendingFiles.length" class="attach-list">
              <div v-for="(f, i) in pendingFiles" :key="i" class="attach-item pending">
                <div class="attach-icon doc-gray">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                    <polyline points="14 2 14 8 20 8"/>
                  </svg>
                </div>
                <div class="attach-info">
                  <span class="attach-name">{{ f.name }}</span>
                  <span class="attach-size">{{ formatSize(f.size) }}</span>
                </div>
                <button class="attach-del" @click="pendingFiles.splice(i, 1)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M18 6L6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- 드롭 존 -->
            <div
              class="attach-zone"
              :class="{ dragging: isDragging }"
              @dragover.prevent="isDragging = true"
              @dragleave="isDragging = false"
              @drop.prevent="onDrop"
              @click="fileInput?.click()"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <p>파일을 드래그하거나 <span>클릭해서 선택</span></p>
              <p class="attach-hint">최대 10MB · PDF, 이미지, 문서 등</p>
            </div>
            <input ref="fileInput" type="file" multiple class="file-input-hidden" @change="onFileSelect" />
            <p v-if="errors.attach" class="field-error">{{ errors.attach }}</p>
          </div>
        </div>

        <div class="modal-footer">
          <button v-if="isEdit" class="btn-delete" @click="handleDelete">삭제</button>
          <div class="footer-right">
            <button class="btn-cancel" @click="$emit('close')">취소</button>
            <button class="btn-save" :disabled="saving" @click="handleSave">
              {{ saving ? '저장 중...' : '저장' }}
            </button>
          </div>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
export interface DocFolder { id: string; name: string }
export interface DocItem {
  id: string
  title: string
  content: string
  is_pinned: boolean
  folder_id: string | null
  folder_name: string | null
  creator_name: string | null
  updated_at: string
  created_at: string
}

interface Attachment {
  id: string
  name: string
  size: number
  mime_type: string
  storage_path: string
  url: string | null
}

const props = defineProps<{
  doc?: DocItem | null
  folders: DocFolder[]
  defaultFolderId?: string
}>()

const emit = defineEmits<{
  close: []
  saved: [doc: DocItem]
  deleted: [id: string]
}>()

const isEdit = computed(() => !!props.doc)
const saving = ref(false)
const isDragging = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const form = reactive({
  title:     props.doc?.title     ?? '',
  content:   props.doc?.content   ?? '',
  folder_id: props.doc?.folder_id ?? props.defaultFolderId ?? '',
  is_pinned: props.doc?.is_pinned ?? false,
})

const errors = reactive({ title: '', attach: '' })
const pendingFiles = ref<File[]>([])
const existingAttachments = ref<Attachment[]>([])

// 수정 모드일 때 기존 첨부파일 로드
if (isEdit.value && props.doc) {
  const { data } = await useFetch<Attachment[]>(`/api/documents/${props.doc.id}/attachments`)
  if (data.value) existingAttachments.value = data.value
}

function validate() {
  errors.title = form.title.trim() ? '' : '제목을 입력해주세요.'
  return !errors.title
}

function addFiles(files: FileList | File[]) {
  errors.attach = ''
  const MAX = 10 * 1024 * 1024
  for (const f of Array.from(files)) {
    if (f.size > MAX) {
      errors.attach = `"${f.name}" 파일이 10MB를 초과합니다.`
      continue
    }
    if (!pendingFiles.value.find((p) => p.name === f.name && p.size === f.size)) {
      pendingFiles.value.push(f)
    }
  }
}

function onDrop(e: DragEvent) {
  isDragging.value = false
  if (e.dataTransfer?.files) addFiles(e.dataTransfer.files)
}

function onFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  if (input.files) addFiles(input.files)
  input.value = ''
}

async function deleteExisting(aid: string) {
  if (!props.doc) return
  try {
    await $fetch(`/api/documents/${props.doc.id}/attachments/${aid}`, { method: 'DELETE' })
    existingAttachments.value = existingAttachments.value.filter((a) => a.id !== aid)
  } catch {
    alert('첨부파일 삭제에 실패했습니다.')
  }
}

async function handleSave() {
  if (!validate()) return
  saving.value = true
  errors.attach = ''
  try {
    const body = {
      title:     form.title.trim(),
      content:   form.content,
      folder_id: form.folder_id || null,
      is_pinned: form.is_pinned,
    }

    const doc = isEdit.value
      ? await $fetch<DocItem>(`/api/documents/${props.doc!.id}`, { method: 'PUT',  body })
      : await $fetch<DocItem>('/api/documents',                  { method: 'POST', body })

    // 파일 업로드
    for (const file of pendingFiles.value) {
      const fd = new FormData()
      fd.append('file', file)
      try {
        await $fetch(`/api/documents/${doc.id}/attachments`, { method: 'POST', body: fd })
      } catch {
        errors.attach = `"${file.name}" 업로드에 실패했습니다.`
      }
    }

    emit('saved', doc)
    emit('close')
  } catch (e: any) {
    alert(e?.data?.message ?? '저장에 실패했습니다.')
  } finally {
    saving.value = false
  }
}

async function handleDelete() {
  if (!props.doc) return
  if (!confirm('이 문서를 삭제할까요? 첨부파일도 함께 삭제됩니다.')) return
  try {
    await $fetch(`/api/documents/${props.doc.id}`, { method: 'DELETE' })
    emit('deleted', props.doc.id)
    emit('close')
  } catch {
    alert('삭제에 실패했습니다.')
  }
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

const MIME_COLORS: Record<string, string> = {
  'application/pdf': 'doc-blue',
  'image/': 'doc-green',
  'application/vnd.openxmlformats-officedocument.wordprocessingml': 'doc-amber',
  'application/msword': 'doc-amber',
  'application/vnd.openxmlformats-officedocument.spreadsheetml': 'doc-green',
  'application/vnd.ms-excel': 'doc-green',
  'application/vnd.openxmlformats-officedocument.presentationml': 'doc-red',
  'application/vnd.ms-powerpoint': 'doc-red',
}

function attColorClass(mime: string): string {
  for (const [prefix, cls] of Object.entries(MIME_COLORS)) {
    if (mime.startsWith(prefix)) return cls
  }
  return 'doc-gray'
}

onMounted(() => {
  const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') emit('close') }
  window.addEventListener('keydown', handler)
  onUnmounted(() => window.removeEventListener('keydown', handler))
})
</script>

<style scoped lang="scss">
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: var(--color-bg);
  border-radius: 14px;
  width: 600px;
  max-width: calc(100vw - 32px);
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0,0,0,0.15);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 0;
  flex-shrink: 0;
  h3 { font-size: 17px; font-weight: 700; color: var(--color-text); }
}

.btn-close {
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
  background: none; border: none; border-radius: 8px; cursor: pointer;
  color: var(--color-text-muted); transition: background 0.12s;
  svg { width: 18px; height: 18px; }
  &:hover { background: var(--color-bg-hover); }
}

.modal-body {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
}

.field-row {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 12px;
  align-items: end;
}

.pin-field { display: flex; flex-direction: column; gap: 6px; }

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;

  label {
    font-size: 13px; font-weight: 600; color: var(--color-text-sub);
    display: flex; align-items: center; gap: 8px;
    .required { color: var(--color-danger); }
  }

  input, select, textarea {
    padding: 0 12px;
    height: var(--form-height);
    border: 1px solid var(--color-border);
    border-radius: var(--form-radius);
    font-size: var(--form-font-size);
    color: var(--color-text);
    background: var(--color-bg);
    outline: none;
    font-family: inherit;
    transition: border-color 0.15s;
    &:focus { border-color: var(--color-primary); }
    &.error { border-color: var(--color-danger); }
  }

  textarea { height: auto; padding: 10px 12px; resize: vertical; line-height: 1.6; }
  select { cursor: pointer; }
  .field-error { font-size: 12px; color: var(--color-danger); }
}

.toggle {
  width: 42px; height: 24px;
  border-radius: 12px; border: none;
  background: var(--color-border);
  cursor: pointer; padding: 3px;
  transition: background 0.2s;
  position: relative;
  &.on { background: var(--color-primary); }
}
.toggle-knob {
  display: block; width: 18px; height: 18px;
  border-radius: 50%; background: #fff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  transition: transform 0.2s;
  position: absolute; top: 3px; left: 3px;
  .on & { transform: translateX(18px); }
}

/* 첨부파일 목록 */
.attach-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 8px;
}

.attach-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: var(--color-bg);
  border: 1px solid var(--color-border);
  border-radius: 8px;

  &.pending { opacity: 0.7; }
}

.attach-icon {
  width: 32px; height: 32px;
  border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
  svg { width: 16px; height: 16px; }

  &.doc-blue  { background: #dbeafe; color: #2563eb; }
  &.doc-amber { background: #fef3c7; color: #d97706; }
  &.doc-green { background: #d1fae5; color: #059669; }
  &.doc-red   { background: #fee2e2; color: #dc2626; }
  &.doc-gray  { background: #f3f4f6; color: #6b7280; }
}

.attach-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.attach-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text);
  text-decoration: none;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  &:hover { text-decoration: underline; }
}

.attach-size {
  font-size: 11px;
  color: var(--color-text-muted);
}

.attach-del {
  width: 24px; height: 24px;
  display: flex; align-items: center; justify-content: center;
  background: none; border: none; border-radius: 4px;
  cursor: pointer; color: var(--color-text-muted);
  flex-shrink: 0;
  svg { width: 14px; height: 14px; }
  &:hover { background: #fee2e2; color: var(--color-danger); }
}

/* 드롭 존 */
.attach-zone {
  border: 1.5px dashed var(--color-border);
  border-radius: 8px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;

  &:hover, &.dragging {
    border-color: var(--color-primary);
    background: #f0f2fe;
  }

  svg { width: 28px; height: 28px; }

  p { font-size: 13px; margin: 0;
    span { color: var(--color-primary); font-weight: 500; }
  }
  .attach-hint { font-size: 11px; color: var(--color-text-placeholder); }
}

.file-input-hidden { display: none; }

/* 푸터 */
.modal-footer {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 24px;
  border-top: 1px solid var(--color-border);
  background: var(--color-bg-hover);
  flex-shrink: 0;
  border-radius: 0 0 14px 14px;
}

.footer-right { display: flex; gap: 8px; margin-left: auto; }

.btn-delete {
  height: 36px; padding: 0 16px;
  background: none; color: var(--color-danger);
  font-size: 14px; font-weight: 500;
  border: 1px solid var(--color-danger);
  border-radius: var(--form-radius); cursor: pointer;
  transition: background 0.12s;
  &:hover { background: #fff0f0; }
}

.btn-cancel {
  height: 36px; padding: 0 16px;
  background: none; color: var(--color-text-muted);
  font-size: 14px; border: 1px solid var(--color-border);
  border-radius: var(--form-radius); cursor: pointer;
  transition: background 0.12s;
  &:hover { background: var(--color-bg-hover); }
}

.btn-save {
  height: 36px; padding: 0 20px;
  background: var(--color-primary); color: #fff;
  font-size: 14px; font-weight: 600;
  border: none; border-radius: var(--form-radius); cursor: pointer;
  transition: background 0.12s;
  &:hover:not(:disabled) { background: var(--color-primary-hover); }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
}
</style>
