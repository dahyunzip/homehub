<template>
  <Teleport to="body">
    <div class="modal-backdrop" @click.self="$emit('close')">
      <div class="modal">

        <div class="modal-header">
          <h3>구성원 초대</h3>
          <button class="btn-close" @click="$emit('close')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div class="modal-body">
          <p class="desc">아래 초대 코드를 가족에게 공유하세요.<br/>코드를 입력하면 이 그룹에 참여할 수 있어요.</p>

          <div v-if="loading" class="code-skeleton" />

          <div v-else-if="inviteCode" class="code-box">
            <span class="code-text">{{ inviteCode }}</span>
            <button class="btn-copy" :class="{ copied }" @click="copyCode">
              <svg v-if="!copied" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2"/>
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
              {{ copied ? '복사됨' : '복사' }}
            </button>
          </div>

          <p v-else class="error-msg">초대 코드를 불러오지 못했습니다.</p>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
defineEmits<{ close: [] }>()

const inviteCode = ref<string | null>(null)
const loading = ref(true)
const copied = ref(false)

onMounted(async () => {
  try {
    const data = await $fetch<{ inviteCode: string }>('/api/groups/invite-code')
    inviteCode.value = data.inviteCode
  } catch {
    inviteCode.value = null
  } finally {
    loading.value = false
  }
})

async function copyCode() {
  if (!inviteCode.value || copied.value) return
  await navigator.clipboard.writeText(inviteCode.value)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}

onMounted(() => {
  const onKeydown = (e: KeyboardEvent) => { if (e.key === 'Escape') useNuxtApp().$emit?.('close') }
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
  width: 380px;
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
  padding: 16px 24px 28px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.desc {
  font-size: 13px;
  color: var(--color-text-muted);
  line-height: 1.6;
  margin: 0;
}

.code-skeleton {
  height: 60px;
  border-radius: 10px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.2s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.code-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f5f7ff;
  border: 1.5px solid #e0e4f8;
  border-radius: 10px;
  padding: 14px 16px;
}

.code-text {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: 6px;
  color: var(--color-text);
  font-variant-numeric: tabular-nums;
}

.btn-copy {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 7px 12px;
  font-size: 13px;
  font-weight: 600;
  border-radius: 7px;
  border: none;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  background: var(--color-primary);
  color: #fff;
  flex-shrink: 0;

  svg { width: 14px; height: 14px; }

  &.copied {
    background: #4caf7d;
  }

  &:hover:not(.copied) {
    background: var(--color-primary-hover);
  }
}

.error-msg {
  font-size: 13px;
  color: var(--color-danger);
  margin: 0;
}
</style>
