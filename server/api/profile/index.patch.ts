import sequelize from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const { userId } = event.context.auth
  const { name, color } = await readBody(event)

  if (!name?.trim()) {
    throw createError({ statusCode: 400, message: '이름을 입력해주세요.' })
  }

  const validColor = /^#[0-9a-fA-F]{6}$/.test(color ?? '') ? color : undefined

  await sequelize.query(
    `UPDATE profiles SET
       name  = :name
       ${validColor ? ', color = :color' : ''}
     WHERE id = :userId`,
    { replacements: { name: name.trim(), color: validColor, userId } },
  )

  const [rows] = await sequelize.query(
    `SELECT id, name, color, avatar_url FROM profiles WHERE id = :userId`,
    { replacements: { userId } },
  )

  return (rows as any[])[0]
})
