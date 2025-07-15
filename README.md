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
