import sequelize from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const { groupId } = event.context.auth
  const id = getRouterParam(event, 'id')

  const [check] = await sequelize.query(
    `SELECT id FROM documents WHERE id = :id AND group_id = :groupId`,
    { replacements: { id, groupId } },
  )
  if (!(check as any[]).length) {
    throw createError({ statusCode: 404, message: '문서를 찾을 수 없습니다.' })
  }

  await sequelize.query(`DELETE FROM documents WHERE id = :id`, { replacements: { id } })
  return { ok: true }
})
