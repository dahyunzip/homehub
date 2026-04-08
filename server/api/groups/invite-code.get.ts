import sequelize from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const { groupId } = event.context.auth

  if (!groupId) {
    throw createError({ statusCode: 403, message: '그룹에 속해 있지 않습니다.' })
  }

  const [rows] = await sequelize.query(
    `SELECT invite_code FROM family_groups WHERE id = :groupId`,
    { replacements: { groupId } },
  )
  const row = (rows as any[])[0]

  if (!row) {
    throw createError({ statusCode: 404, message: '그룹을 찾을 수 없습니다.' })
  }

  return { inviteCode: row.invite_code }
})
