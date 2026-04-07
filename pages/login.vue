<template>
  <div class="login-wrap">
    <div class="login-box">
      <h1 class="login-title">우리집</h1>
      <p class="login-sub">가족 공간에 오신 걸 환영해요</p>

      <form class="login-form" @submit.prevent="handleLogin">
        <div class="field">
          <label for="email">이메일</label>
          <input
            id="email"
            v-model="email"
            type="email"
            placeholder="example@email.com"
            autocomplete="email"
            required
          />
        </div>

        <div class="field">
          <label for="password">비밀번호</label>
          <input
            id="password"
            v-model="password"
            type="password"
            placeholder="비밀번호 입력"
            autocomplete="current-password"
            required
          />
        </div>

        <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>

        <button type="submit" class="btn-login" :disabled="loading">
          {{ loading ? '로그인 중...' : '로그인' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: false })

const authStore = useAuthStore()
const router = useRouter()

const email = ref('')
const password = ref('')
const errorMsg = ref('')
const loading = ref(false)

async function handleLogin() {
  errorMsg.value = ''
  loading.value = true
  try {
    await authStore.login(email.value, password.value)
    await router.push('/')
  } catch (err: any) {
    errorMsg.value = err?.data?.message ?? '로그인에 실패했습니다.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.login-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: var(--color-bg);
}

.login-box {
  width: 100%;
  max-width: 400px;
  padding: 48px 40px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
}

.login-title {
  font-size: 26px;
  font-weight: 700;
  color: var(--color-primary);
  text-align: center;
  margin-bottom: 6px;
}

.login-sub {
  font-size: 14px;
  color: var(--color-text-muted);
  text-align: center;
  margin-bottom: 32px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
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

  input {
    height: var(--form-height);
    padding: 0 12px;
    font-size: var(--form-font-size);
    border: 1px solid var(--color-border);
    border-radius: var(--form-radius);
    outline: none;
    transition: border-color 0.15s;

    &::placeholder {
      color: var(--color-text-placeholder);
    }

    &:focus {
      border-color: var(--color-primary);
      box-shadow: 0 0 0 3px var(--color-focus-ring);
    }
  }
}

.error-msg {
  font-size: 13px;
  color: var(--color-danger);
}

.btn-login {
  height: var(--form-height);
  background: var(--color-primary);
  color: #fff;
  font-size: var(--form-font-size);
  font-weight: 600;
  border: none;
  border-radius: var(--form-radius);
  cursor: pointer;
  transition: background 0.15s;
  margin-top: 8px;

  &:hover:not(:disabled) {
    background: var(--color-primary-hover);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}
</style>