import { defineStore } from 'pinia'

interface Notification {
  id: string
  title: string
  body: string
  is_read: boolean
  created_at: string
}

export const useNotificationsStore = defineStore('notifications', () => {
  const items = ref<Notification[]>([])
  const unreadCount = computed(() => items.value.filter((n) => !n.is_read).length)

  async function fetch() {
    try {
      const data = await $fetch<Notification[]>('/api/notifications')
      items.value = data
    } catch {
      // 미인증 상태 등 에러는 무시
    }
  }

  async function markRead(id: string) {
    await $fetch(`/api/notifications/${id}/read`, { method: 'PATCH' })
    const item = items.value.find((n) => n.id === id)
    if (item) item.is_read = true
  }

  async function markAllRead() {
    try {
      const unread = items.value.filter((n) => !n.is_read)
      await Promise.all(unread.map((n) => $fetch(`/api/notifications/${n.id}/read`, { method: 'PATCH' })))
      items.value.forEach((n) => { n.is_read = true })
    } catch {
      // 무시
    }
  }

  return { items, unreadCount, fetch, markRead, markAllRead }
})
