import sequelize from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const { userId, groupId } = event.context.auth
  const postId = event.context.params?.id
  if (!postId) throw createError({ statusCode: 400 })

  const { content, link_url, is_pinned } = await readBody(event)
  if (!content?.trim()) throw createError({ statusCode: 400, message: '내용을 입력해주세요.' })

  const [check] = await sequelize.query(
    `SELECT id FROM posts WHERE id = :postId AND group_id = :groupId AND created_by = :userId`,
    { replacements: { postId, groupId, userId } },
  )
  if (!(check as any[]).length) throw createError({ statusCode: 403, message: '수정 권한이 없습니다.' })

  await sequelize.query(
    `UPDATE posts SET content = :content, link_url = :linkUrl, is_pinned = :isPinned WHERE id = :postId`,
    { replacements: { postId, content: content.trim(), linkUrl: link_url || null, isPinned: is_pinned ?? false } },
  )

  const [rows] = await sequelize.query(
    `SELECT p.id, p.content, p.link_url, p.is_pinned, p.created_at, p.created_by,
            pr.name AS creator_name, pr.color AS creator_color,
            (SELECT COUNT(*)::int FROM comments c WHERE c.post_id = p.id)  AS comment_count,
            (SELECT COUNT(*)::int FROM reactions r WHERE r.post_id = p.id) AS reaction_count,
            EXISTS(SELECT 1 FROM reactions r WHERE r.post_id = p.id AND r.user_id = :userId) AS user_reacted
     FROM posts p LEFT JOIN profiles pr ON pr.id = p.created_by
     WHERE p.id = :postId`,
    { replacements: { postId, userId } },
  )
  return (rows as any[])[0]
})
