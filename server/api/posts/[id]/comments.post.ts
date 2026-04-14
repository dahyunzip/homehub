import sequelize from '~/server/utils/db'
import { v4 as uuidv4 } from 'uuid'

export default defineEventHandler(async (event) => {
  const { userId, groupId } = event.context.auth
  const postId = event.context.params?.id
  if (!postId) throw createError({ statusCode: 400 })

  const { content } = await readBody(event)
  if (!content?.trim()) throw createError({ statusCode: 400, message: '댓글 내용을 입력해주세요.' })

  const [check] = await sequelize.query(
    `SELECT id FROM posts WHERE id = :postId AND group_id = :groupId`,
    { replacements: { postId, groupId } },
  )
  if (!(check as any[]).length) throw createError({ statusCode: 404 })

  const cid = uuidv4()
  await sequelize.query(
    `INSERT INTO comments (id, post_id, created_by, content) VALUES (:cid, :postId, :userId, :content)`,
    { replacements: { cid, postId, userId, content: content.trim() } },
  )

  const [rows] = await sequelize.query(
    `SELECT c.id, c.content, c.created_at, c.created_by,
            p.name AS creator_name, p.color AS creator_color
     FROM comments c LEFT JOIN profiles p ON p.id = c.created_by
     WHERE c.id = :cid`,
    { replacements: { cid } },
  )
  return (rows as any[])[0]
})
