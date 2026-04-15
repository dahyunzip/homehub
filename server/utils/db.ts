import { Sequelize } from 'sequelize'
import 'pg' // Vercel NFT가 pg를 정적 추적하도록 강제 (Sequelize 내부의 require('pg') 대신)

const dbUrl = process.env.DATABASE_URL ?? ''

const sequelize = new Sequelize(dbUrl || 'postgres://localhost:5432/placeholder', {
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