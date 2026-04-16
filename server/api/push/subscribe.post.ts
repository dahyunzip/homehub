import sequelize from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const { userId } = event.context.auth
  const subscription = await readBody(event)

  if (!subscription?.endpoint) {
    throw createError({ statusCode: 400, message: '유효하지 않은 구독 정보입니다.' })
  }

  await sequelize.query(
    `UPDATE profiles SET push_subscription = :subscription WHERE id = :userId`,
    { replacements: { subscription: JSON.stringify(subscription), userId } },
  )

  return { ok: true }
})
