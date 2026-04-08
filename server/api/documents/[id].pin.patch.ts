import sequelize from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const { groupId } = event.context.auth
  const id = getRouterParam(event, 'id')

  const [rows] = await sequelize.query(
    `SELECT is_pinned FROM documents WHERE id = :id AND group_id = :groupId`,
    { replacements: { id, groupId } },
  )
  if (!(rows as any[]).length) {
    throw createError({ statusCode: 404, message: '문서를 찾을 수 없습니다.' })
  }

  const current = (rows as any[])[0].is_pinned
  await sequelize.query(
    `UPDATE documents SET is_pinned = :isPinned, updated_at = now() WHERE id = :id`,
    { replacements: { id, isPinned: !current } },
  )
  return { is_pinned: !current }
})
