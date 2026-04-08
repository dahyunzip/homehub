import sequelize from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const { userId, groupId } = event.context.auth
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const { title, memo, start_date, end_date } = body

  if (!title || !start_date) {
    throw createError({ statusCode: 400, message: '제목과 시작 날짜는 필수입니다.' })
  }

  // 본인이 만든 이벤트만 수정 가능
  const [existing] = await sequelize.query(
    `SELECT id FROM events WHERE id = :id AND created_by = :userId AND group_id = :groupId`,
    { replacements: { id, userId, groupId } },
  )
  if ((existing as any[]).length === 0) {
    throw createError({ statusCode: 403, message: '수정 권한이 없습니다.' })
  }

  await sequelize.query(
    `UPDATE events SET title = :title, memo = :memo, start_date = :start_date, end_date = :end_date
     WHERE id = :id`,
    { replacements: { id, title, memo: memo || null, start_date, end_date: end_date || null } },
  )

  const [rows] = await sequelize.query(
    `SELECT e.*, p.color, p.name as creator_name
     FROM events e LEFT JOIN profiles p ON p.id = e.created_by
     WHERE e.id = :id`,
    { replacements: { id } },
  )

  return (rows as any[])[0]
})
