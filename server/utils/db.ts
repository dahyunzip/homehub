import { Sequelize } from 'sequelize'

const dbUrl = process.env.DATABASE_URL

if (!dbUrl) {
  throw new Error('DATABASE_URL 환경변수가 설정되지 않았습니다.')
}

const sequelize = new Sequelize(dbUrl, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false, // Supabase는 self-signed cert 사용
    },
  },
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
})

export async function testDbConnection() {
  await sequelize.authenticate()
  console.log('[DB] Supabase PostgreSQL 연결 성공')
}

export default sequelize