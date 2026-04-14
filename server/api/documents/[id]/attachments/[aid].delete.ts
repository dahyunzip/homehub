import sequelize from '~/server/utils/db'
import { useSupabaseStorage } from '~/server/utils/storage'

export default defineEventHandler(async (event) => {
  const { groupId } = event.context.auth
  const documentId = event.context.params?.id
  const aid = event.context.params?.aid
  if (!documentId || !aid) throw createError({ statusCode: 400 })

  const [rows] = await sequelize.query(
    `SELECT a.storage_path FROM attachments a
     JOIN documents d ON d.id = a.document_id
     WHERE a.id = :aid AND a.document_id = :documentId AND d.group_id = :groupId`,
    { replacements: { aid, documentId, groupId } },
  )
  if (!(rows as any[]).length) throw createError({ statusCode: 404 })

  const { storage_path } = (rows as any[])[0]

  await useSupabaseStorage().from('documents').remove([storage_path])
  await sequelize.query(`DELETE FROM attachments WHERE id = :aid`, { replacements: { aid } })

  return { ok: true }
})
