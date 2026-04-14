import sequelize from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const { groupId } = event.context.auth
  const postId = event.context.params?.id
  if (!postId) throw createError({ statusCode: 400 })

  const [rows] = await sequelize.query(
    `SELECT is_pinned FROM posts WHERE id = :postId AND group_id = :groupId`,
    { replacements: { postId, groupId } },
  )
  if (!(rows as any[]).length) throw createError({ statusCode: 404, message: '게시글을 찾을 수 없습니다.' })

  const next = !(rows as any[])[0].is_pinned
  await sequelize.query(`UPDATE posts SET is_pinned = :next WHERE id = :postId`, { replacements: { postId, next } })
  return { is_pinned: next }
})
