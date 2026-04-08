import sequelize from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const { groupId } = event.context.auth
  if (!groupId) return []

  const query = getQuery(event)
  const folderId = query.folder_id as string | undefined
  const pinned   = query.pinned === 'true'

  const conditions = ['d.group_id = :groupId']
  const replacements: Record<string, any> = { groupId }

  if (folderId) {
    conditions.push('d.folder_id = :folderId')
    replacements.folderId = folderId
  }
  if (pinned) {
    conditions.push('d.is_pinned = true')
  }

  const where = conditions.join(' AND ')

  const [rows] = await sequelize.query(
    `SELECT d.id, d.title, d.content, d.is_pinned, d.folder_id,
            d.created_by, d.updated_at, d.created_at,
            f.name  AS folder_name,
            p.name  AS creator_name
     FROM documents d
     LEFT JOIN folders  f ON f.id = d.folder_id
     LEFT JOIN profiles p ON p.id = d.created_by
     WHERE ${where}
     ORDER BY d.updated_at DESC`,
    { replacements },
  )
  return rows
})
