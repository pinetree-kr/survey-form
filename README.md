This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Supabase 설정

이 프로젝트는 Supabase를 데이터베이스로 사용합니다.

### 환경 변수 설정

1. `.env.local` 파일을 생성하고 다음 변수들을 설정하세요:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
JWT_SECRET=your_jwt_secret_here
```

### 데이터베이스 초기화 및 Seed 데이터

로컬 개발 환경에서 데이터베이스를 초기화하고 샘플 데이터를 삽입하려면:

```bash
# Supabase 로컬 서버 시작
supabase start

# 데이터베이스 리셋 (마이그레이션 + 시드 데이터 적용)
supabase db reset

# 또는 마이그레이션만 실행
supabase db push

# 시드 데이터만 실행
supabase db seed
```

### Seed 데이터 수정

#### SQL 기반 Seed (기본)
`supabase/seed.sql` 파일을 수정하여 원하는 샘플 데이터를 추가할 수 있습니다.

#### TypeScript 기반 Seed (고급)
`supabase/seed.ts` 파일을 사용하여 TypeScript로 seed를 작성할 수 있습니다:

```bash
# config.toml에서 script_paths 활성화 후
supabase db seed
```

#### API 기반 Seed (웹 인터페이스)
관리자 대시보드에서 "시드 데이터 삽입" 버튼을 클릭하여 웹에서 seed를 실행할 수 있습니다.

#### 포함된 기본 데이터
- 관리자 계정: `admin@example.com` / `password123`
- 일반 사용자 계정: `user@example.com` / `password123`
- 샘플 설문조사 1개 (텍스트, 라디오, 체크박스, 텍스트영역 질문 포함)

### Cloudflare Hyperdrive 설정

Cloudflare에 배포하기 위해서는 Hyperdrive를 설정해야 합니다:

1. Cloudflare 대시보드에서 Hyperdrive를 생성하세요
2. Supabase PostgreSQL 데이터베이스에 연결하세요
3. `wrangler.jsonc` 파일의 `hyperdrive.id`를 실제 Hyperdrive ID로 교체하세요
4. Cloudflare Secrets에 환경 변수를 설정하세요:

```bash
wrangler secret put NEXT_PUBLIC_SUPABASE_URL
wrangler secret put NEXT_PUBLIC_SUPABASE_ANON_KEY
wrangler secret put JWT_SECRET
```

## 배포

### Cloudflare에 배포

```bash
npm run deploy
```

### 로컬 미리보기

```bash
npm run preview
```

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
