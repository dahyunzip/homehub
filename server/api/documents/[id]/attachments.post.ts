import sequelize from '~/server/utils/db'
import { useSupabaseStorage } from '~/server/utils/storage'
import { v4 as uuidv4 } from 'uuid'

const MAX_SIZE = 10 * 1024 * 1024 // 10MB

export default defineEventHandler(async (event) => {
  const { userId, groupId } = event.context.auth
  const documentId = event.context.params?.id
  if (!documentId) throw createError({ statusCode: 400 })

  const [check] = await sequelize.query(
    `SELECT id FROM documents WHERE id = :documentId AND group_id = :groupId`,
    { replacements: { documentId, groupId } },
  )
  if (!(check as any[]).length) throw createError({ statusCode: 404 })

  const form = await readMultipartFormData(event)
  const fileEntry = form?.find((f) => f.name === 'file')
  if (!fileEntry?.data || !fileEntry.filename) {
    throw createError({ statusCode: 400, message: '파일이 없습니다.' })
  }

  if (fileEntry.data.length > MAX_SIZE) {
    throw createError({ statusCode: 400, message: '파일 크기는 10MB 이하여야 합니다.' })
  }

  const ext = fileEntry.filename.split('.').pop() ?? ''
  const storagePath = `${groupId}/${documentId}/${uuidv4()}${ext ? '.' + ext : ''}`
  const st = useSupabaseStorage()

  const { error: uploadError } = await st.from('documents').upload(storagePath, fileEntry.data, {
    contentType: fileEntry.type ?? 'application/octet-stream',
    upsert: false,
  })

  if (uploadError) {
    throw createError({ statusCode: 500, message: '파일 업로드에 실패했습니다.' })
  }

  const aid = uuidv4()
  await sequelize.query(
    `INSERT INTO attachments (id, document_id, created_by, name, size, mime_type, storage_path)
     VALUES (:aid, :documentId, :userId, :name, :size, :mimeType, :storagePath)`,
    {
      replacements: {
        aid, documentId, userId,
        name: fileEntry.filename,
        size: fileEntry.data.length,
        mimeType: fileEntry.type ?? 'application/octet-stream',
        storagePath,
      },
    },
  )

  const { data: urlData } = await st.from('documents').createSignedUrl(storagePath, 3600)

  return {
    id: aid,
    name: fileEntry.filename,
    size: fileEntry.data.length,
    mime_type: fileEntry.type ?? 'application/octet-stream',
    storage_path: storagePath,
    url: urlData?.signedUrl ?? null,
  }
})
