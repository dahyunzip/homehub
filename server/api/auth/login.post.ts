import { createClient } from '@supabase/supabase-js'
import { signToken } from '~/server/utils/jwt'
import sequelize from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const { email, password } = await readBody(event)

  if (!email || !password) {
    throw createError({ statusCode: 400, message: '이메일과 비밀번호를 입력해주세요.' })
  }

  // 1. Supabase Auth 로그인
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_KEY!,
  )

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (authError || !authData.user) {
    throw createError({ statusCode: 401, message: '이메일 또는 비밀번호가 올바르지 않습니다.' })
  }

  const userId = authData.user.id

  // 2. 그룹 조회 (group_members 테이블)
  const [members] = await sequelize.query(
    `SELECT group_id FROM group_members WHERE user_id = :userId LIMIT 1`,
    { replacements: { userId } },
  )

  const groupId = (members as { group_id: string }[])[0]?.group_id ?? null

  // 3. JWT 발급
  const token = signToken({ userId, groupId })

  // 4. httpOnly 쿠키에 저장
  setCookie(event, 'auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24시간
    path: '/',
  })

  // 5. 프로필 조회
  const [profiles] = await sequelize.query(
    `SELECT id, name, color, avatar_url FROM profiles WHERE id = :userId`,
    { replacements: { userId } },
  )

  const profile = (profiles as any[])[0] ?? null

  return { user: profile, groupId }
})