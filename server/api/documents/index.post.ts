import sequelize from '~/server/utils/db'
import { v4 as uuidv4 } from 'uuid'
import { notifyGroup } from '~/server/utils/push'

export default defineEventHandler(async (event) => {
  const { userId, groupId } = event.context.auth
  if (!groupId) throw createError({ statusCode: 403, message: '그룹에 속해 있지 않습니다.' })

  const { title, content, folder_id, is_pinned } = await readBody(event)

  if (!title?.trim()) {
    throw createError({ statusCode: 400, message: '제목을 입력해주세요.' })
  }

  const id = uuidv4()
  await sequelize.query(
    `INSERT INTO documents (id, group_id, created_by, title, content, folder_id, is_pinned)
     VALUES (:id, :groupId, :userId, :title, :content, :folderId, :isPinned)`,
    {
      replacements: {
        id, groupId, userId,
        title: title.trim(),
        content: content ?? '',
        folderId: folder_id || null,
        isPinned: is_pinned ?? false,
      },
    },
  )

  const [rows] = await sequelize.query(
    `SELECT d.id, d.title, d.content, d.is_pinned, d.folder_id,
            d.created_by, d.updated_at, d.created_at,
            f.name AS folder_name, p.name AS creator_name
     FROM documents d
     LEFT JOIN folders  f ON f.id = d.folder_id
     LEFT JOIN profiles p ON p.id = d.created_by
     WHERE d.id = :id`,
    { replacements: { id } },
  )
  const doc = (rows as any[])[0]

  notifyGroup(groupId, userId, {
    title: '새 문서',
    body: `${doc.creator_name}: ${title.trim()}`,
  }).catch(() => {})

  return doc
})
