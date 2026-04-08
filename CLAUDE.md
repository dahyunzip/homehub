# CLAUDE.md

## 프로젝트 개요

가족 전용 캘린더 + 문서 공유 공간.
Nuxt 3 풀스택(프론트 + 백엔드 일체형) + Supabase(PostgreSQL 호스팅).

---

## 기술 스택

| 항목       | 내용                          |
| ---------- | ----------------------------- |
| 프레임워크 | Nuxt 3                        |
| 언어       | TypeScript                    |
| 상태관리   | Pinia                         |
| ORM        | Sequelize + pg                |
| 인증       | JWT (jsonwebtoken + bcryptjs) |
| DB         | Supabase (PostgreSQL)         |
| 스타일     | SCSS (sass-embedded)          |
| 날짜       | date-fns                      |

---

## 아키텍처 원칙

- `pages/`, `stores/`는 프론트 전용. DB에 직접 접근하지 않는다.
- DB 접근은 반드시 `server/api/`를 통해서만 한다.
- `server/utils/db.ts` — Sequelize 인스턴스 단일 관리.
- `server/utils/jwt.ts` — JWT 발급/검증 헬퍼.
- `server/middleware/auth.ts` — 모든 API 요청의 JWT 검증.
- 클라이언트 라우트 가드는 `middleware/auth.ts`에서 처리.

---

## 네이밍 규칙

- 파일명: `kebab-case`
- 컴포넌트: `PascalCase`
- 변수/함수: `camelCase`
- DB 컬럼: `snake_case`
- API 라우트: Nuxt 파일 기반 라우팅 규칙 (`index.get.ts`, `index.post.ts`)

---

## 환경변수 (.env)

```
SUPABASE_URL=
SUPABASE_KEY=
JWT_SECRET=
```

---

## 주요 참고사항

- 가족 그룹 단위로 모든 데이터가 격리된다. `group_id` 기준으로 항상 필터링.
- Supabase Auth로 소셜 로그인 처리. 가입 시 `profiles` 테이블에 자동 insert (트리거).
- 비로그인 접근은 미들웨어에서 `/login`으로 리다이렉트.
- 그룹 미가입 유저는 초대 코드 입력 화면으로 리다이렉트.
