import sequelize from '~/server/utils/db'
import { useSupabaseStorage } from '~/server/utils/storage'

export default defineEventHandler(async (event) => {
  const { groupId } = event.context.auth
  const id = event.context.params?.id
  if (!id) throw createError({ statusCode: 400 })

  const [check] = await sequelize.query(
    `SELECT id FROM documents WHERE id = :id AND group_id = :groupId`,
    { replacements: { id, groupId } },
  )
  if (!(check as any[]).length) throw createError({ statusCode: 404 })

  const [rows] = await sequelize.query(
    `SELECT a.id, a.name, a.size, a.mime_type, a.storage_path, a.created_at,
            p.name AS creator_name
     FROM attachments a
     LEFT JOIN profiles p ON p.id = a.created_by
     WHERE a.document_id = :id
     ORDER BY a.created_at ASC`,
    { replacements: { id } },
  )

  const result = await Promise.all(
    (rows as any[]).map(async (row) => {
      const { data } = await useSupabaseStorage()
        .from('documents')
        .createSignedUrl(row.storage_path, 3600)
      return { ...row, url: data?.signedUrl ?? null }
    }),
  )

  return result
})
