import sequelize from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const { userId, groupId } = event.context.auth
  const postId = event.context.params?.id
  if (!postId) throw createError({ statusCode: 400 })

  const [check] = await sequelize.query(
    `SELECT id FROM posts WHERE id = :postId AND group_id = :groupId`,
    { replacements: { postId, groupId } },
  )
  if (!(check as any[]).length) throw createError({ statusCode: 404 })

  const [existing] = await sequelize.query(
    `SELECT id FROM reactions WHERE post_id = :postId AND user_id = :userId`,
    { replacements: { postId, userId } },
  )

  if ((existing as any[]).length) {
    await sequelize.query(
      `DELETE FROM reactions WHERE post_id = :postId AND user_id = :userId`,
      { replacements: { postId, userId } },
    )
  } else {
    await sequelize.query(
      `INSERT INTO reactions (post_id, user_id) VALUES (:postId, :userId)`,
      { replacements: { postId, userId } },
    )
  }

  const [countRows] = await sequelize.query(
    `SELECT COUNT(*)::int AS reaction_count FROM reactions WHERE post_id = :postId`,
    { replacements: { postId } },
  )
  return {
    user_reacted: !(existing as any[]).length,
    reaction_count: (countRows as any[])[0].reaction_count,
  }
})
