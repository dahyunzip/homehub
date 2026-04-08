import sequelize from '~/server/utils/db'
import { signToken } from '~/server/utils/jwt'

export default defineEventHandler(async (event) => {
  const { userId } = event.context.auth
  const { inviteCode } = await readBody(event)

  if (!inviteCode?.trim()) {
    throw createError({ statusCode: 400, message: '초대 코드를 입력해주세요.' })
  }

  // 이미 그룹이 있으면 거부
  const [existing] = await sequelize.query(
    `SELECT group_id FROM group_members WHERE user_id = :userId LIMIT 1`,
    { replacements: { userId } },
  )
  if ((existing as any[]).length > 0) {
    throw createError({ statusCode: 409, message: '이미 그룹에 속해 있습니다.' })
  }

  // 초대 코드로 그룹 찾기
  const [groups] = await sequelize.query(
    `SELECT id, name FROM family_groups WHERE invite_code = :inviteCode`,
    { replacements: { inviteCode: inviteCode.trim() } },
  )
  const group = (groups as any[])[0]

  if (!group) {
    throw createError({ statusCode: 404, message: '유효하지 않은 초대 코드입니다.' })
  }

  await sequelize.query(
    `INSERT INTO group_members (group_id, user_id) VALUES (:groupId, :userId)`,
    { replacements: { groupId: group.id, userId } },
  )

  // JWT 재발급 (groupId 포함)
  const token = signToken({ userId, groupId: group.id })
  setCookie(event, 'auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
    path: '/',
  })

  return { groupId: group.id, groupName: group.name }
})
