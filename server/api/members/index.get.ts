import sequelize from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const { groupId } = event.context.auth

  if (!groupId) return []

  const [rows] = await sequelize.query(
    `SELECT p.id, p.name, p.color, p.avatar_url, gm.joined_at
     FROM profiles p
     INNER JOIN group_members gm ON gm.user_id = p.id
     WHERE gm.group_id = :groupId
     ORDER BY gm.joined_at ASC`,
    { replacements: { groupId } },
  )

  return rows
})
