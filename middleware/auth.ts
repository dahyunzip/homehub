import { useAuthStore } from '~/stores/auth'

export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/login') return

  const authStore = useAuthStore()

  // 이미 store에 유저 정보 있으면 통과
  if (authStore.isLoggedIn) return

  // httpOnly 쿠키 검증을 위해 서버에 확인 요청
  try {
    const data = await $fetch<{ user: typeof authStore.user; groupId: string | null }>('/api/auth/me')
    authStore.user = data.user
    authStore.groupId = data.groupId
  } catch {
    return navigateTo('/login')
  }
})