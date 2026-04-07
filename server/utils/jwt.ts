import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET 환경변수가 설정되지 않았습니다.')
}

export interface JwtPayload {
  userId: string
  groupId: string | null
}

/** JWT 발급 (24시간 만료) */
export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET as string, { expiresIn: '24h' })
}

/** JWT 검증 — 유효하면 payload 반환, 실패하면 null */
export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET as string) as JwtPayload
  } catch {
    return null
  }
}