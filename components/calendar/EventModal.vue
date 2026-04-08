<template>
  <Teleport to="body">
    <div class="modal-backdrop" @click.self="$emit('close')">
      <div class="modal">

        <div class="modal-header">
          <h3>{{ isEdit ? '일정 수정' : '일정 추가' }}</h3>
          <button class="btn-close" @click="$emit('close')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div class="modal-body">
          <div class="field">
            <label>제목 <span class="required">*</span></label>
            <input
              v-model="form.title"
              type="text"
              placeholder="일정 제목 입력"
              :class="{ error: errors.title }"
              @keydown.enter="handleSave"
            />
            <p v-if="errors.title" class="field-error">{{ errors.title }}</p>
          </div>

          <div class="field-row">
            <div class="field">
              <label>시작 날짜 <span class="required">*</span></label>
              <input
                v-model="form.start_date"
                type="date"
                :class="{ error: errors.start_date }"
              />
              <p v-if="errors.start_date" class="field-error">{{ errors.start_date }}</p>
            </div>

            <div class="field">
              <label>종료 날짜</label>
              <input v-model="form.end_date" type="date" :min="form.start_date" />
            </div>
          </div>

          <div class="field">
            <label>메모</label>
            <textarea v-model="form.memo" placeholder="메모를 입력하세요" rows="3" />
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
import { useCalendarStore } from '~/stores/calendar'
import type { CalendarEvent } from '~/stores/calendar'

const props = defineProps<{
  event?: CalendarEvent | null   // 수정 시 전달, 없으면 신규 생성
  defaultDate?: string           // 신규 생성 시 기본 날짜
}>()

const emit = defineEmits<{
  close: []
  saved: []
}>()

const calStore = useCalendarStore()
const isEdit = computed(() => !!props.event)
const saving = ref(false)

const form = reactive({
  title: props.event?.title ?? '',
  memo: props.event?.memo ?? '',
  start_date: props.event?.start_date ?? props.defaultDate ?? '',
  end_date: props.event?.end_date ?? '',
})

const errors = reactive({ title: '', start_date: '' })

function validate() {
  errors.title = form.title.trim() ? '' : '제목을 입력해주세요.'
  errors.start_date = form.start_date ? '' : '날짜를 선택해주세요.'
  return !errors.title && !errors.start_date
}

async function handleSave() {
  if (!validate()) return
  saving.value = true
  try {
    const payload = {
      title: form.title.trim(),
      memo: form.memo.trim(),
      start_date: form.start_date,
      end_date: form.end_date || '',
    }
    if (isEdit.value && props.event) {
      await calStore.updateEvent(props.event.id, payload)
    } else {
      await calStore.createEvent(payload)
    }
    emit('saved')
    emit('close')
  } catch (err: any) {
    alert(err?.data?.message ?? '저장에 실패했습니다.')
  } finally {
    saving.value = false
  }
}

async function handleDelete() {
  if (!props.event) return
  if (!confirm('이 일정을 삭제할까요?')) return
  try {
    await calStore.deleteEvent(props.event.id)
    emit('saved')
    emit('close')
  } catch {
    alert('삭제에 실패했습니다.')
  }
}

// ESC 키로 닫기
onMounted(() => {
  const onKeydown = (e: KeyboardEvent) => { if (e.key === 'Escape') emit('close') }
  window.addEventListener('keydown', onKeydown)
  onUnmounted(() => window.removeEventListener('keydown', onKeydown))
})
</script>

<style scoped lang="scss">
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: #fff;
  border-radius: 14px;
  width: 480px;
  max-width: calc(100vw - 32px);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 0;

  h3 {
    font-size: 17px;
    font-weight: 700;
    color: var(--color-text);
  }
}

.btn-close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  color: var(--color-text-muted);
  transition: background 0.12s;

  svg { width: 18px; height: 18px; }
  &:hover { background: var(--color-bg-hover); }
}

.modal-body {
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;

  label {
    font-size: 13px;
    font-weight: 600;
    color: var(--color-text-sub);
  }

  .required { color: var(--color-danger); }

  input, textarea {
    height: var(--form-height);
    padding: 0 12px;
    font-size: var(--form-font-size);
    border: 1px solid var(--color-border);
    border-radius: var(--form-radius);
    outline: none;
    font-family: inherit;
    transition: border-color 0.15s;

    &:focus { border-color: var(--color-primary); box-shadow: 0 0 0 3px var(--color-focus-ring); }
    &.error { border-color: var(--color-danger); }
  }

  input[type="date"] { cursor: pointer; }

  textarea {
    height: auto;
    padding: 10px 12px;
    resize: none;
    line-height: 1.5;
  }

  .field-error {
    font-size: 12px;
    color: var(--color-danger);
  }
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-top: 1px solid var(--color-border);
  background: #fafafa;
}

.footer-right {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

.btn-delete {
  height: 36px;
  padding: 0 16px;
  background: none;
  color: var(--color-danger);
  font-size: 14px;
  font-weight: 500;
  border: 1px solid var(--color-danger);
  border-radius: var(--form-radius);
  cursor: pointer;
  transition: background 0.12s;
  &:hover { background: #fff0f0; }
}

.btn-cancel {
  height: 36px;
  padding: 0 16px;
  background: none;
  color: var(--color-text-muted);
  font-size: 14px;
  border: 1px solid var(--color-border);
  border-radius: var(--form-radius);
  cursor: pointer;
  transition: background 0.12s;
  &:hover { background: var(--color-bg-hover); }
}

.btn-save {
  height: 36px;
  padding: 0 20px;
  background: var(--color-primary);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  border: none;
  border-radius: var(--form-radius);
  cursor: pointer;
  transition: background 0.12s;
  &:hover:not(:disabled) { background: var(--color-primary-hover); }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
}
</style>
