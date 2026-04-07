import sequelize from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  // server/middleware/auth.ts 가 먼저 실행되어 context.auth 에 payload 주입
  const { userId, groupId } = event.context.auth

  const [profiles] = await sequelize.query(
    `SELECT id, name, color, avatar_url FROM profiles WHERE id = :userId`,
    { replacements: { userId } },
  )

  const profile = (profiles as any[])[0] ?? null

  return { user: profile, groupId }
})