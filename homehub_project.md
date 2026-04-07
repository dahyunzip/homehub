# HomeHub 프로젝트 정리

> 가족 전용 캘린더 + 문서 공유 공간
> Nuxt 풀스택 (프론트 + 백엔드 일체형) + Supabase (PostgreSQL 호스팅)

---

## 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 프로젝트명 | HomeHub (우리집 / Haom) |
| 대상 | 가족 2~3명 (소규모 프라이빗) |
| 목적 | 가족 일정 공유 + 정보 아카이빙 공간 |
| DB | Supabase (PostgreSQL) |
| 프레임워크 | Nuxt 3 풀스택 (server/api로 백엔드 일체형) |
| 상태관리 | Pinia |
| 스타일 | SCSS |

---

## 결론 및 방향성

### DB — Supabase 그대로 사용

- Supabase = PostgreSQL을 대신 운영해주는 플랫폼 (설치/운영 불필요)
- 내부 엔진은 PostgreSQL이므로 나중에 직접 운영 서버로 이전 가능
- Supabase 대시보드가 pgAdmin4 역할을 대신함
- RLS(Row Level Security)로 DB 레벨 보안 처리

### 백엔드 — Nuxt server/api 일체형

- `server/api/` 디렉토리가 Spring Controller 역할
- Sequelize ORM으로 PostgreSQL 쿼리 (JPA와 유사)
- JWT로 인증 처리
- 프론트(`pages/`, `stores/`)는 그대로 두고 `server/`만 교체하면 나중에 Spring Boot 전환 가능

```
브라우저 → Nuxt server/api → Supabase PostgreSQL
           (JWT 인증 처리)    (Sequelize로 쿼리)
```

---

## 메뉴 구조

```
우리집 (HomeHub)
├── 홈              - 오늘 일정 위젯, 공지 피드, D-day, 고정문서 바로가기
├── 캘린더          - 월간/주간 뷰, 구성원별 색상, 일정 CRUD, 반복일정
├── 문서함          - 폴더 구조, 마크다운 에디터, 핀 고정, 검색
├── 게시판          - 공지/일반 글, 링크 공유, 이모지 반응
└── 설정            - 가족 그룹 관리, 프로필, 알림
    └── 인증/접근   - 소셜 로그인, 초대 코드, 비로그인 차단
```

### 개발 우선순위

```
1순위  인증 (로그인 + 그룹 합류)
2순위  캘린더
3순위  문서함
4순위  게시판
5순위  홈 위젯
```

---

## Supabase DB 테이블 설계

### ERD 관계 요약

```
profiles ────< group_members >──── family_groups
                                        │
                    ┌───────────────────┼──────────────────┐
                    │                   │                  │
                  events            folders             posts
                    │                   │
                  (created_by)      documents
```

### DDL (Supabase SQL Editor에서 실행)

```sql
create extension if not exists "uuid-ossp";

create table profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  color text default '#5DCAA5',
  avatar_url text,
  created_at timestamptz default now()
);

create table family_groups (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  invite_code text unique default substr(md5(random()::text), 1, 8),
  created_at timestamptz default now()
);

create table group_members (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references family_groups on delete cascade not null,
  user_id uuid references profiles on delete cascade not null,
  joined_at timestamptz default now(),
  unique(group_id, user_id)
);

create table folders (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references family_groups on delete cascade not null,
  name text not null,
  sort_order int default 0,
  created_at timestamptz default now()
);

create table documents (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references family_groups on delete cascade not null,
  folder_id uuid references folders on delete set null,
  created_by uuid references profiles on delete set null,
  title text not null,
  content text default '',
  is_pinned boolean default false,
  updated_at timestamptz default now(),
  created_at timestamptz default now()
);

create table events (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references family_groups on delete cascade not null,
  created_by uuid references profiles on delete set null,
  title text not null,
  memo text,
  start_date date not null,
  end_date date,
  is_repeat boolean default false,
  repeat_rule text,
  created_at timestamptz default now()
);

create table posts (
  id uuid primary key default uuid_generate_v4(),
  group_id uuid references family_groups on delete cascade not null,
  created_by uuid references profiles on delete set null,
  content text not null,
  link_url text,
  link_preview jsonb,
  created_at timestamptz default now()
);
```

### RLS 설정

```sql
-- 1. RLS 활성화 (Enable automatic RLS 체크했으면 생략 가능)
alter table profiles       enable row level security;
alter table family_groups  enable row level security;
alter table group_members  enable row level security;
alter table folders        enable row level security;
alter table documents      enable row level security;
alter table events         enable row level security;
alter table posts          enable row level security;

-- 2. 헬퍼 함수
create or replace function my_group_ids()
returns setof uuid
language sql
security definer
stable
as $$
  select group_id
  from group_members
  where user_id = auth.uid()
$$;

-- 3. 각 테이블 정책
create policy "profiles_select" on profiles
  for select using (
    id = auth.uid() or
    id in (
      select user_id from group_members
      where group_id in (select my_group_ids())
    )
  );
create policy "profiles_update" on profiles
  for update using (id = auth.uid());
create policy "profiles_insert" on profiles
  for insert with check (id = auth.uid());

create policy "groups_select" on family_groups
  for select using (id in (select my_group_ids()));
create policy "groups_insert" on family_groups
  for insert with check (true);

create policy "members_select" on group_members
  for select using (group_id in (select my_group_ids()));
create policy "members_insert" on group_members
  for insert with check (user_id = auth.uid());
create policy "members_delete" on group_members
  for delete using (user_id = auth.uid());

create policy "folders_all"   on folders   for all using (group_id in (select my_group_ids()));
create policy "documents_all" on documents for all using (group_id in (select my_group_ids()));
create policy "events_all"    on events    for all using (group_id in (select my_group_ids()));

create policy "posts_select" on posts
  for select using (group_id in (select my_group_ids()));
create policy "posts_insert" on posts
  for insert with check (group_id in (select my_group_ids()));
create policy "posts_delete" on posts
  for delete using (created_by = auth.uid());

-- 4. 신규 유저 가입 시 profiles 자동 생성 트리거
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
  insert into profiles (id, name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', '새 멤버')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
```

---

## package.json

```json
{
  "name": "homehub",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "nuxt build",
    "dev": "nuxt dev",
    "generate": "nuxt generate",
    "preview": "nuxt preview",
    "postinstall": "nuxt prepare"
  },
  "dependencies": {
    "nuxt": "^3.15.4",
    "vue": "latest",
    "vue-router": "latest",

    "@pinia/nuxt": "^0.11.3",
    "pinia": "^3.0.1",

    "pg": "^8.13.3",
    "pg-hstore": "^2.3.4",
    "sequelize": "^6.37.5",

    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^3.0.3",

    "dotenv": "^16.4.7",
    "uuid": "^11.1.0",
    "date-fns": "^2.29.3",

    "swiper": "^11.2.5"
  },
  "devDependencies": {
    "@types/pg": "^8.11.11",
    "@types/sequelize": "^4.28.20",
    "@types/jsonwebtoken": "^9.0.9",
    "@types/bcryptjs": "^2.4.6",
    "@types/node": "latest",
    "cross-env": "^7.0.3",
    "sass-embedded": "^1.85.1"
  }
}
```

### 주요 패키지 역할

| 패키지 | 역할 | Java 대응 |
|--------|------|-----------|
| `pg` + `pg-hstore` | PostgreSQL 연결 드라이버 | JDBC Driver |
| `sequelize` | ORM | JPA / Hibernate |
| `jsonwebtoken` | JWT 발급/검증 | Spring Security JWT |
| `bcryptjs` | 비밀번호 해싱 | BCryptPasswordEncoder |
| `dotenv` | 환경변수 관리 | application.properties |
| `pinia` | 전역 상태관리 | — |
| `date-fns` | 날짜 유틸 | LocalDate |
| `swiper` | 슬라이더 UI | — |

---

## 폴더 구조

```
homehub/
├── assets/
│   └── scss/
│       └── main.scss
├── components/
│   ├── calendar/
│   ├── docs/
│   ├── board/
│   └── common/
├── composables/
│   └── useApi.ts              # useFetch 래퍼
├── middleware/                # 클라이언트 사이드 라우트 가드
│   └── auth.ts                # 비로그인 차단
├── pages/
│   ├── index.vue              # 홈 대시보드
│   ├── login.vue
│   ├── calendar/
│   │   └── index.vue
│   ├── docs/
│   │   ├── index.vue
│   │   └── [id].vue
│   ├── board/
│   │   └── index.vue
│   └── settings/
│       └── index.vue
├── server/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login.post.ts
│   │   │   └── logout.post.ts
│   │   ├── events/
│   │   │   ├── index.get.ts
│   │   │   └── index.post.ts
│   │   ├── docs/
│   │   └── posts/
│   ├── middleware/
│   │   └── auth.ts            # 서버 사이드 JWT 검증
│   └── utils/
│       ├── db.ts              # Sequelize 인스턴스
│       └── jwt.ts             # JWT 헬퍼
├── stores/
│   ├── auth.ts
│   ├── calendar.ts
│   ├── docs.ts
│   └── board.ts
├── .env
├── nuxt.config.ts
└── package.json
```

---

## nuxt.config.ts

```typescript
export default defineNuxtConfig({
  modules: [
    '@pinia/nuxt',
    '@nuxtjs/supabase',
  ],

  css: ['~/assets/scss/main.scss'],

  supabase: {
    redirect: false,
  },

  compatibilityDate: '2024-01-01',
})
```

---

## .env

```bash
SUPABASE_URL=https://xxxxxxxx.supabase.co
SUPABASE_KEY=your-anon-public-key

JWT_SECRET=your-jwt-secret-key
```

> Supabase 대시보드 → Settings → API 에서 URL과 KEY 복사

---

## 초기 세팅 순서

```
1. npx nuxi@latest init homehub
2. cd homehub
3. npm install (위 package.json 기준)
4. .env 파일 작성
5. nuxt.config.ts 작성
6. npm run dev 실행 확인
7. Supabase SQL Editor에서 DDL 실행
8. RLS 정책 실행
9. 트리거 실행
10. 로그인 페이지부터 개발 시작
```

---

## 앞으로 개발 순서

```
1단계  server/utils/db.ts       Sequelize + PostgreSQL 연결
2단계  server/utils/jwt.ts      JWT 헬퍼 함수
3단계  server/api/auth/         로그인 / 로그아웃 API
4단계  pages/login.vue          로그인 화면
5단계  middleware/auth.ts       라우트 가드
6단계  캘린더 API + 화면
7단계  문서함 API + 화면
8단계  게시판 API + 화면
9단계  홈 대시보드 위젯
```
