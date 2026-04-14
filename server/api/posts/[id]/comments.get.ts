import sequelize from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const { groupId } = event.context.auth
  const postId = event.context.params?.id
  if (!postId) throw createError({ statusCode: 400 })

  const [check] = await sequelize.query(
    `SELECT id FROM posts WHERE id = :postId AND group_id = :groupId`,
    { replacements: { postId, groupId } },
  )
  if (!(check as any[]).length) throw createError({ statusCode: 404 })

  const [rows] = await sequelize.query(
    `SELECT c.id, c.content, c.created_at, c.created_by,
            p.name AS creator_name, p.color AS creator_color
     FROM comments c
     LEFT JOIN profiles p ON p.id = c.created_by
     WHERE c.post_id = :postId
     ORDER BY c.created_at ASC`,
    { replacements: { postId } },
  )
  return rows
})
