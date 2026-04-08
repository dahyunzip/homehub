import sequelize from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const { userId, groupId } = event.context.auth
  const id = getRouterParam(event, 'id')

  const [existing] = await sequelize.query(
    `SELECT id FROM events WHERE id = :id AND created_by = :userId AND group_id = :groupId`,
    { replacements: { id, userId, groupId } },
  )
  if ((existing as any[]).length === 0) {
    throw createError({ statusCode: 403, message: '삭제 권한이 없습니다.' })
  }

  await sequelize.query(`DELETE FROM events WHERE id = :id`, { replacements: { id } })

  return { ok: true }
})
