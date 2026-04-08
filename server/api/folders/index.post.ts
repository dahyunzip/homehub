import sequelize from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const { groupId } = event.context.auth
  const { name } = await readBody(event)

  if (!name?.trim()) {
    throw createError({ statusCode: 400, message: '컬렉션 이름을 입력해주세요.' })
  }
  if (!groupId) {
    throw createError({ statusCode: 403, message: '그룹에 속해 있지 않습니다.' })
  }

  const [rows] = await sequelize.query(
    `INSERT INTO folders (group_id, name)
     VALUES (:groupId, :name)
     RETURNING id, name, sort_order`,
    { replacements: { groupId, name: name.trim() } },
  )
  return (rows as any[])[0]
})
