import sequelize from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const { groupId, userId } = event.context.auth
  if (!groupId) return []

  const [rows] = await sequelize.query(
    `SELECT
       p.id, p.content, p.link_url, p.is_pinned, p.created_at, p.created_by,
       pr.name  AS creator_name,
       pr.color AS creator_color,
       (SELECT COUNT(*)::int FROM comments c WHERE c.post_id = p.id)    AS comment_count,
       (SELECT COUNT(*)::int FROM reactions r WHERE r.post_id = p.id)   AS reaction_count,
       EXISTS(SELECT 1 FROM reactions r WHERE r.post_id = p.id AND r.user_id = :userId) AS user_reacted
     FROM posts p
     LEFT JOIN profiles pr ON pr.id = p.created_by
     WHERE p.group_id = :groupId
     ORDER BY p.is_pinned DESC, p.created_at DESC
     LIMIT 50`,
    { replacements: { groupId, userId } },
  )
  return rows
})
