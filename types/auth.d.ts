import type { JwtPayload } from '~/server/utils/jwt'

declare module 'h3' {
  interface H3EventContext {
    auth: JwtPayload
  }
}