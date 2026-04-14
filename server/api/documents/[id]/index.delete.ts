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
  if (!(check as any[]).length) throw createError({ statusCode: 404, message: '문서를 찾을 수 없습니다.' })

  // 첨부파일 storage 경로 수집 후 삭제
  const [attachments] = await sequelize.query(
    `SELECT storage_path FROM attachments WHERE document_id = :id`,
    { replacements: { id } },
  )
  const paths = (attachments as any[]).map((a) => a.storage_path)
  if (paths.length) {
    await useSupabaseStorage().from('documents').remove(paths)
  }

  await sequelize.query(`DELETE FROM documents WHERE id = :id`, { replacements: { id } })
  return { ok: true }
})
