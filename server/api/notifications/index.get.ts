import sequelize from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const { userId } = event.context.auth

  const [rows] = await sequelize.query(
    `SELECT id, title, body, is_read, created_at
     FROM notifications
     WHERE user_id = :userId
     ORDER BY created_at DESC
     LIMIT 20`,
    { replacements: { userId } },
  )

  return rows
})
