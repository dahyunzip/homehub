import { createClient } from '@supabase/supabase-js'

// 빌드 시점이 아닌 실제 호출 시점에 초기화 (Vercel 빌드 안전)
export function useSupabaseStorage() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY
  if (!url || !key) {
    throw new Error('SUPABASE_URL 또는 SUPABASE_SERVICE_KEY 환경변수가 설정되지 않았습니다.')
  }
  return createClient(url, key).storage
}
