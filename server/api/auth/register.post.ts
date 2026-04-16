import { createClient } from '@supabase/supabase-js'
import { signToken } from '~/server/utils/jwt'
import sequelize from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const { name, email, password, birthDate } = await readBody(event)

  if (!name?.trim() || !email?.trim() || !password || !birthDate) {
    throw createError({ statusCode: 400, message: '모든 항목을 입력해주세요.' })
  }

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_KEY!,
  )

  // 1. Supabase Auth 회원가입 — options.data.name 은 트리거가 profiles.name 에 INSERT
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: { name: name.trim() },
    },
  })

  if (authError || !authData.user) {
    const msg = authError?.message?.includes('already registered')
      ? '이미 사용 중인 이메일입니다.'
      : '회원가입에 실패했습니다.'
    throw createError({ statusCode: 400, message: msg })
  }

  const userId = authData.user.id

  // 2. 트리거가 profiles(id, name) 을 INSERT한 뒤 birth_date 를 UPDATE
  await sequelize.query(
    `UPDATE profiles SET birth_date = :birthDate WHERE id = :userId`,
    { replacements: { birthDate, userId } },
  )

  // 3. JWT 발급 (groupId 없음 — /setup 에서 그룹 설정)
  const token = signToken({ userId, groupId: null })

  setCookie(event, 'auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
    path: '/',
  })

  return { userId, name: name.trim() }
})
