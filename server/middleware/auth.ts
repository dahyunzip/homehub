import { verifyToken } from '~/server/utils/jwt'

// /api/auth/* 경로는 인증 없이 통과
const PUBLIC_PATHS = ['/api/auth/login', '/api/auth/logout']

export default defineEventHandler((event) => {
  const path = getRequestURL(event).pathname

  if (!path.startsWith('/api/') || PUBLIC_PATHS.includes(path)) {
    return
  }

  const token = getCookie(event, 'auth_token')

  if (!token) {
    throw createError({ statusCode: 401, message: '로그인이 필요합니다.' })
  }

  const payload = verifyToken(token)

  if (!payload) {
    throw createError({ statusCode: 401, message: '인증이 만료되었습니다. 다시 로그인해주세요.' })
  }

  // 이후 API 핸들러에서 event.context.auth 로 접근 가능
  event.context.auth = payload
})