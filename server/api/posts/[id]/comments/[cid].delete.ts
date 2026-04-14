import sequelize from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const { userId } = event.context.auth
  const cid = event.context.params?.cid
  if (!cid) throw createError({ statusCode: 400 })

  const [check] = await sequelize.query(
    `SELECT id FROM comments WHERE id = :cid AND created_by = :userId`,
    { replacements: { cid, userId } },
  )
  if (!(check as any[]).length) throw createError({ statusCode: 403, message: '삭제 권한이 없습니다.' })

  await sequelize.query(`DELETE FROM comments WHERE id = :cid`, { replacements: { cid } })
  return { ok: true }
})
