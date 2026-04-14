import jwt from 'jsonwebtoken'

export interface JwtPayload {
  userId: string
  groupId: string | null
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) throw new Error('JWT_SECRET 환경변수가 설정되지 않았습니다.')
  return secret
}

/** JWT 발급 (24시간 만료) */
export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: '24h' })
}

/** JWT 검증 — 유효하면 payload 반환, 실패하면 null */
export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, getSecret()) as JwtPayload
  } catch {
    return null
  }
}