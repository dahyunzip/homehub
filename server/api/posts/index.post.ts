import sequelize from '~/server/utils/db'
import { v4 as uuidv4 } from 'uuid'
import { notifyGroup } from '~/server/utils/push'

export default defineEventHandler(async (event) => {
  const { userId, groupId } = event.context.auth
  if (!groupId) throw createError({ statusCode: 403, message: '그룹에 속해 있지 않습니다.' })

  const { content, link_url, is_pinned } = await readBody(event)
  if (!content?.trim()) throw createError({ statusCode: 400, message: '내용을 입력해주세요.' })

  const id = uuidv4()
  await sequelize.query(
    `INSERT INTO posts (id, group_id, created_by, content, link_url, is_pinned)
     VALUES (:id, :groupId, :userId, :content, :linkUrl, :isPinned)`,
    { replacements: { id, groupId, userId, content: content.trim(), linkUrl: link_url || null, isPinned: is_pinned ?? false } },
  )

  const [rows] = await sequelize.query(
    `SELECT p.id, p.content, p.link_url, p.is_pinned, p.created_at, p.created_by,
            pr.name AS creator_name, pr.color AS creator_color,
            0 AS comment_count, 0 AS reaction_count, false AS user_reacted
     FROM posts p LEFT JOIN profiles pr ON pr.id = p.created_by
     WHERE p.id = :id`,
    { replacements: { id } },
  )
  const post = (rows as any[])[0]

  notifyGroup(groupId, userId, {
    title: '새 게시글',
    body: `${post.creator_name}: ${content.trim().slice(0, 60)}`,
  }).catch(() => {})

  return post
})
