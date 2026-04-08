<template>
  <div class="setup-page">
    <div class="setup-card">
      <h1 class="setup-title">홈허브 시작하기</h1>
      <p class="setup-desc">가족 그룹을 만들거나 초대 코드로 참여하세요.</p>

      <div class="tab-bar">
        <button :class="['tab', { active: tab === 'create' }]" @click="tab = 'create'">그룹 만들기</button>
        <button :class="['tab', { active: tab === 'join' }]" @click="tab = 'join'">코드로 참여</button>
      </div>

      <!-- 그룹 만들기 -->
      <form v-if="tab === 'create'" class="form" @submit.prevent="createGroup">
        <label class="field-label">그룹 이름</label>
        <input
          v-model="groupName"
          class="field-input"
          type="text"
          placeholder="예) 김씨네 가족"
          maxlength="30"
          required
        />
        <p v-if="error" class="error-msg">{{ error }}</p>
        <button class="submit-btn" type="submit" :disabled="loading">
          {{ loading ? '생성 중...' : '그룹 만들기' }}
        </button>
      </form>

      <!-- 코드로 참여 -->
      <form v-else class="form" @submit.prevent="joinGroup">
        <label class="field-label">초대 코드</label>
        <input
          v-model="inviteCode"
          class="field-input"
          type="text"
          placeholder="8자리 초대 코드 입력"
          maxlength="8"
          required
        />
        <p v-if="error" class="error-msg">{{ error }}</p>
        <button class="submit-btn" type="submit" :disabled="loading">
          {{ loading ? '참여 중...' : '그룹 참여하기' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

definePageMeta({ middleware: [] })  // auth 미들웨어 제외 (그룹 없는 유저 접근 허용)

const authStore = useAuthStore()
const router = useRouter()

const tab = ref<'create' | 'join'>('create')
const groupName = ref('')
const inviteCode = ref('')
const error = ref('')
const loading = ref(false)

async function createGroup() {
  error.value = ''
  loading.value = true
  try {
    const data = await $fetch<{ groupId: string; groupName: string; inviteCode: string }>(
      '/api/groups',
      { method: 'POST', body: { name: groupName.value } },
    )
    authStore.groupId = data.groupId
    router.push('/')
  } catch (e: any) {
    error.value = e?.data?.message ?? '그룹 생성에 실패했습니다.'
  } finally {
    loading.value = false
  }
}

async function joinGroup() {
  error.value = ''
  loading.value = true
  try {
    const data = await $fetch<{ groupId: string; groupName: string }>(
      '/api/groups/join',
      { method: 'POST', body: { inviteCode: inviteCode.value } },
    )
    authStore.groupId = data.groupId
    router.push('/')
  } catch (e: any) {
    error.value = e?.data?.message ?? '그룹 참여에 실패했습니다.'
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.setup-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f5f7;
}

.setup-card {
  background: #fff;
  border-radius: 16px;
  padding: 40px 36px;
  width: 100%;
  max-width: 400px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
}

.setup-title {
  font-size: 22px;
  font-weight: 700;
  margin: 0 0 8px;
  color: #1a1a1a;
}

.setup-desc {
  font-size: 14px;
  color: #666;
  margin: 0 0 28px;
}

.tab-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
}

.tab {
  flex: 1;
  padding: 10px;
  border: 1.5px solid #e0e0e0;
  border-radius: 8px;
  background: none;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  color: #888;
  transition: all 0.15s;

  &.active {
    border-color: #5dcaa5;
    color: #5dcaa5;
    background: #f0faf6;
  }
}

.form {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.field-label {
  font-size: 13px;
  font-weight: 600;
  color: #444;
}

.field-input {
  padding: 12px 14px;
  border: 1.5px solid #e0e0e0;
  border-radius: 8px;
  font-size: 15px;
  outline: none;
  transition: border-color 0.15s;

  &:focus {
    border-color: #5dcaa5;
  }
}

.error-msg {
  font-size: 13px;
  color: #e05050;
  margin: 0;
}

.submit-btn {
  margin-top: 8px;
  padding: 13px;
  background: #5dcaa5;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;

  &:hover:not(:disabled) {
    background: #4ab591;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}
</style>
