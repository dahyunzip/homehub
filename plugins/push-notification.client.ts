import { useAuthStore } from '~/stores/auth'

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return new Uint8Array([...rawData].map((c) => c.charCodeAt(0)))
}

async function registerPush(vapidPublicKey: string) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

  const registration = await navigator.serviceWorker.register('/sw.js')

  // 이미 구독 중이면 서버에 재전송 (새 기기/브라우저 대응)
  let subscription = await registration.pushManager.getSubscription()

  if (!subscription) {
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return

    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    })
  }

  await $fetch('/api/push/subscribe', {
    method: 'POST',
    body: subscription.toJSON(),
  })
}

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const authStore = useAuthStore()

  // 이미 로그인된 상태라면 바로 등록
  if (authStore.isLoggedIn) {
    registerPush(config.public.vapidPublicKey)
    return
  }

  // 로그인 후 상태 변화 시 등록
  const unwatch = watch(
    () => authStore.isLoggedIn,
    (loggedIn) => {
      if (loggedIn) {
        registerPush(config.public.vapidPublicKey)
        unwatch()
      }
    },
  )
})
