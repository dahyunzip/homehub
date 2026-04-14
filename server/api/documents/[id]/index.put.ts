import sequelize from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const { groupId } = event.context.auth
  const id = event.context.params?.id
  if (!id) throw createError({ statusCode: 400 })

  const { title, content, folder_id, is_pinned } = await readBody(event)
  if (!title?.trim()) throw createError({ statusCode: 400, message: '제목을 입력해주세요.' })

  const [check] = await sequelize.query(
    `SELECT id FROM documents WHERE id = :id AND group_id = :groupId`,
    { replacements: { id, groupId } },
  )
  if (!(check as any[]).length) throw createError({ statusCode: 404, message: '문서를 찾을 수 없습니다.' })

  await sequelize.query(
    `UPDATE documents
     SET title = :title, content = :content,
         folder_id = :folderId, is_pinned = :isPinned,
         updated_at = now()
     WHERE id = :id`,
    {
      replacements: {
        id,
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
  return (rows as any[])[0]
})
