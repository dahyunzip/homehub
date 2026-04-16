<template>
  <div class="register-wrap">
    <div class="register-box">
      <h1 class="register-title">HomeHub</h1>
      <p class="register-sub">가족 공간을 함께 시작해요</p>

      <form class="register-form" @submit.prevent="handleRegister">
        <div class="field">
          <label for="name">이름</label>
          <input
            id="name"
            v-model="name"
            type="text"
            placeholder="홍길동"
            maxlength="20"
            autocomplete="name"
            required
          />
        </div>

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
            placeholder="8자 이상 입력"
            autocomplete="new-password"
            minlength="8"
            required
          />
        </div>

        <div class="field">
          <label for="passwordConfirm">비밀번호 확인</label>
          <input
            id="passwordConfirm"
            v-model="passwordConfirm"
            type="password"
            placeholder="비밀번호 재입력"
            autocomplete="new-password"
            required
          />
        </div>

        <div class="field">
          <label for="birthDate">생년월일</label>
          <input
            id="birthDate"
            v-model="birthDate"
            type="date"
            :max="today"
            required
          />
        </div>

        <p v-if="errorMsg" class="error-msg">{{ errorMsg }}</p>

        <button type="submit" class="btn-register" :disabled="loading">
          {{ loading ? '가입 중...' : '회원가입' }}
        </button>
      </form>

      <p class="login-link">
        이미 계정이 있으신가요?
        <NuxtLink to="/login">로그인</NuxtLink>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: false, middleware: [] })

const router = useRouter()

const name = ref('')
const email = ref('')
const password = ref('')
const passwordConfirm = ref('')
const birthDate = ref('')
const errorMsg = ref('')
const loading = ref(false)

const today = new Date().toISOString().slice(0, 10)

async function handleRegister() {
  errorMsg.value = ''

  if (password.value !== passwordConfirm.value) {
    errorMsg.value = '비밀번호가 일치하지 않습니다.'
    return
  }

  loading.value = true
  try {
    await $fetch('/api/auth/register', {
      method: 'POST',
      body: {
        name: name.value,
        email: email.value,
        password: password.value,
        birthDate: birthDate.value,
      },
    })
    await router.push('/setup')
  } catch (err: any) {
    errorMsg.value = err?.data?.message ?? '회원가입에 실패했습니다.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped lang="scss">
.register-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: var(--color-bg);
}

.register-box {
  width: 100%;
  max-width: 400px;
  padding: 48px 40px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
}

.register-title {
  font-size: 26px;
  font-weight: 700;
  color: var(--color-primary);
  text-align: center;
  margin-bottom: 6px;
}

.register-sub {
  font-size: 14px;
  color: var(--color-text-muted);
  text-align: center;
  margin-bottom: 32px;
}

.register-form {
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

.btn-register {
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

.login-link {
  margin-top: 20px;
  text-align: center;
  font-size: 13px;
  color: var(--color-text-muted);

  a {
    color: var(--color-primary);
    font-weight: 600;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
}
</style>
