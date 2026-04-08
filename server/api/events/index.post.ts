import sequelize from '~/server/utils/db'
import { v4 as uuidv4 } from 'uuid'

export default defineEventHandler(async (event) => {
  const { userId, groupId } = event.context.auth
  const body = await readBody(event)
  const { title, memo, start_date, end_date } = body

  if (!title || !start_date) {
    throw createError({ statusCode: 400, message: '제목과 시작 날짜는 필수입니다.' })
  }
  if (!groupId) {
    throw createError({ statusCode: 403, message: '그룹에 속해있지 않습니다.' })
  }

  const id = uuidv4()

  await sequelize.query(
    `INSERT INTO events (id, group_id, created_by, title, memo, start_date, end_date)
     VALUES (:id, :groupId, :userId, :title, :memo, :start_date, :end_date)`,
    { replacements: { id, groupId, userId, title, memo: memo || null, start_date, end_date: end_date || null } },
  )

  // 생성된 이벤트 + creator 색상 반환
  const [rows] = await sequelize.query(
    `SELECT e.*, p.color, p.name as creator_name
     FROM events e LEFT JOIN profiles p ON p.id = e.created_by
     WHERE e.id = :id`,
    { replacements: { id } },
  )

  return (rows as any[])[0]
})
