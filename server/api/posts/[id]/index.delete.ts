import sequelize from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const { userId, groupId } = event.context.auth
  const postId = event.context.params?.id
  if (!postId) throw createError({ statusCode: 400 })

  const [check] = await sequelize.query(
    `SELECT id FROM posts WHERE id = :postId AND group_id = :groupId AND created_by = :userId`,
    { replacements: { postId, groupId, userId } },
  )
  if (!(check as any[]).length) throw createError({ statusCode: 403, message: '삭제 권한이 없습니다.' })

  await sequelize.query(`DELETE FROM posts WHERE id = :postId`, { replacements: { postId } })
  return { ok: true }
})
