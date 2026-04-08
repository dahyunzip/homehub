import sequelize from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const { groupId } = event.context.auth
  const id = getRouterParam(event, 'id')

  // 해당 그룹 소유 폴더인지 확인
  const [rows] = await sequelize.query(
    `SELECT id FROM folders WHERE id = :id AND group_id = :groupId`,
    { replacements: { id, groupId } },
  )
  if (!(rows as any[]).length) {
    throw createError({ statusCode: 404, message: '컬렉션을 찾을 수 없습니다.' })
  }

  // 폴더 삭제 (문서는 folder_id = NULL 처리)
  await sequelize.query(
    `UPDATE documents SET folder_id = NULL WHERE folder_id = :id`,
    { replacements: { id } },
  )
  await sequelize.query(
    `DELETE FROM folders WHERE id = :id`,
    { replacements: { id } },
  )
  return { ok: true }
})
