import { useAuthStore } from '~/stores/auth'

export default defineNuxtRouteMiddleware(async (to) => {
  if (to.path === '/login' || to.path === '/register' || to.path === '/setup') return

  const authStore = useAuthStore()

  // 이미 store에 유저 정보 있으면 그룹 여부만 확인
  if (!authStore.isLoggedIn) {
    // httpOnly 쿠키 검증을 위해 서버에 확인 요청
    try {
      const data = await $fetch<{ user: typeof authStore.user; groupId: string | null }>('/api/auth/me')
      authStore.user = data.user
      authStore.groupId = data.groupId
    } catch {
      return navigateTo('/login')
    }
  }

  // 그룹 미가입 유저는 setup 페이지로
  if (!authStore.groupId) {
    return navigateTo('/setup')
  }
})