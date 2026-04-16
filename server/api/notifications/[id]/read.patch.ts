import sequelize from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const { userId } = event.context.auth
  const id = getRouterParam(event, 'id')

  await sequelize.query(
    `UPDATE notifications SET is_read = true
     WHERE id = :id AND user_id = :userId`,
    { replacements: { id, userId } },
  )

  return { ok: true }
})
