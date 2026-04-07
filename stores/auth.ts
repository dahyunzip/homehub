import { defineStore } from 'pinia'

interface UserProfile {
  id: string
  name: string
  color: string
  avatar_url: string | null
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<UserProfile | null>(null)
  const groupId = ref<string | null>(null)

  const isLoggedIn = computed(() => !!user.value)

  async function login(email: string, password: string) {
    const data = await $fetch('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    })
    user.value = data.user
    groupId.value = data.groupId
  }

  async function logout() {
    await $fetch('/api/auth/logout', { method: 'POST' })
    user.value = null
    groupId.value = null
  }

  return { user, groupId, isLoggedIn, login, logout }
})