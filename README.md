# Juha Observation OS

부모가 학교/놀이터에서 본 장면을 빠르게 붙잡고, 나중에 전문가에게 보여줄 수 있는 관찰 기록 앱입니다. v1의 목표는 아이에게 바로 연습을 시키는 것이 아니라, 실제 반에서 반복되는 단서와 반응을 데이터로 모으는 것입니다.

## Stack

- Next.js App Router
- Vercel
- Postgres or Neon
- Prisma
- Auth.js magic link
- Tailwind CSS

## Local Setup

```bash
npm install
cp .env.example .env
npm run prisma:validate
npm run prisma:deploy
npm run test:normalize
npm run dev
```

`postinstall`에서 `prisma generate`가 실행됩니다. Vercel에서는 환경변수를 먼저 연결한 뒤 배포하세요.

## Required Env

```bash
DATABASE_URL="postgresql://..."
AUTH_SECRET="generate-a-long-random-secret"
NEXTAUTH_URL="http://localhost:3000"
RESEND_API_KEY="re_..."
EMAIL_FROM="Juha Observation OS <noreply@example.com>"
```

## Review Commands

```bash
npm run prisma:validate
npm run prisma:deploy
npm run test:normalize
npm run lint
npm run build
```

## Core Rules

- 화면에서는 부모가 바로 이해할 수 있는 말만 씁니다.
- 단서 저장 키는 앱 코드의 `normalizeCueText`가 유일한 기준입니다.
- 빈 단서는 저장하지 않습니다.
- 새 단서가 생기면 전문가 판단 행을 함께 만듭니다.
- 별칭은 `CueAlias`로 합칩니다.
- 모든 쓰기는 로그인, 가족 구성원, `familyId` 일치를 확인해야 합니다.
