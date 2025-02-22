# Payment Voucher Approvals

A Next.js application for managing and approving payment vouchers.

## Features

- User Authentication with Supabase
- Payment Voucher Creation and Management
- Approval Workflow
- Email Notifications
- Web Push Notifications
- PWA Support

## Tech Stack

- Next.js 14
- Supabase
- Tailwind CSS
- TypeScript
- Vercel Deployment

## Environment Variables

Required environment variables:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
RESEND_API_KEY=
SUPABASE_SERVICE_ROLE_KEY=
RP_ID=
VAPID_PRIVATE_KEY=
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
NEXT_PUBLIC_BASE_URL=
NEXT_PUBLIC_APP_URL=
NEXTAUTH_SECRET=
```

## Development

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
npm start
```

## Deployment

This application is automatically deployed to Vercel on every push to the main branch.
