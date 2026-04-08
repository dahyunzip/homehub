import sequelize from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const { groupId } = event.context.auth
  const query = getQuery(event)

  if (!groupId) return []

  let startDate: string
  let endDate: string

  if (query.startDate && query.endDate) {
    // Week/Year 뷰: 직접 날짜 범위 전달
    startDate = String(query.startDate)
    endDate = String(query.endDate)
  } else {
    // Month 뷰: year + month로 범위 계산
    const { year, month } = query
    const lastDay = new Date(Number(year), Number(month), 0).getDate()
    startDate = `${year}-${String(month).padStart(2, '0')}-01`
    endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  }

  const [rows] = await sequelize.query(
    `SELECT e.id, e.title, e.memo, e.start_date, e.end_date,
            e.is_repeat, e.repeat_rule, e.created_by,
            p.color, p.name as creator_name
     FROM events e
     LEFT JOIN profiles p ON p.id = e.created_by
     WHERE e.group_id = :groupId
       AND e.start_date BETWEEN :startDate AND :endDate
     ORDER BY e.start_date ASC`,
    { replacements: { groupId, startDate, endDate } },
  )

  return rows
})
