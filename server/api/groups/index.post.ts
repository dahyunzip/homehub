import sequelize from '~/server/utils/db'
import { signToken } from '~/server/utils/jwt'

export default defineEventHandler(async (event) => {
  const { userId } = event.context.auth
  const { name } = await readBody(event)

  if (!name?.trim()) {
    throw createError({ statusCode: 400, message: '그룹 이름을 입력해주세요.' })
  }

  // 이미 그룹이 있으면 거부
  const [existing] = await sequelize.query(
    `SELECT group_id FROM group_members WHERE user_id = :userId LIMIT 1`,
    { replacements: { userId } },
  )
  if ((existing as any[]).length > 0) {
    throw createError({ statusCode: 409, message: '이미 그룹에 속해 있습니다.' })
  }

  // 트랜잭션으로 그룹 생성 + 멤버 추가
  const t = await sequelize.transaction()
  try {
    const [groups] = await sequelize.query(
      `INSERT INTO family_groups (name) VALUES (:name) RETURNING id, name, invite_code`,
      { replacements: { name: name.trim() }, transaction: t },
    )
    const group = (groups as any[])[0]

    await sequelize.query(
      `INSERT INTO group_members (group_id, user_id) VALUES (:groupId, :userId)`,
      { replacements: { groupId: group.id, userId }, transaction: t },
    )

    await t.commit()

    // JWT 재발급 (groupId 포함)
    const token = signToken({ userId, groupId: group.id })
    setCookie(event, 'auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24,
      path: '/',
    })

    return { groupId: group.id, groupName: group.name, inviteCode: group.invite_code }
  } catch (err) {
    await t.rollback()
    throw createError({ statusCode: 500, message: '그룹 생성에 실패했습니다.' })
  }
})
