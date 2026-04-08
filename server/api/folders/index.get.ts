import sequelize from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const { groupId } = event.context.auth
  if (!groupId) return []

  const [rows] = await sequelize.query(
    `SELECT id, name, sort_order
     FROM folders
     WHERE group_id = :groupId
     ORDER BY sort_order ASC, created_at ASC`,
    { replacements: { groupId } },
  )
  return rows
})
