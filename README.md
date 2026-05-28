# MailVault - Email Archive

A Gmail-like email archive application for managing departed employees' emails.

## Quick Deploy to Vercel (Free)

### Step 1: Get a Free Turso Database
1. Go to [turso.tech](https://turso.tech) → Sign up free
2. Create a database: `turso db create mailvault`
3. Get your credentials:
   ```
   turso db show mailvault --url
   turso db tokens create mailvault
   ```

### Step 2: Deploy to Vercel
1. Push this code to GitHub
2. Go to [vercel.com](https://vercel.com) → Import your repo
3. Add these Environment Variables in Vercel:
   - `DATABASE_URL` = your Turso URL (from step 1)
   - `DATABASE_AUTH_TOKEN` = your Turso token (from step 1)
4. Click Deploy!

### Step 3: Initialize Database
After deploying, run this once:
```bash
npx prisma db push
```

## How to Use

1. **Create an Archive Account** — Add the departed employee's name and email
2. **Upload MBOX File** — Export from Google Takeout, then upload here
3. **Search & Browse** — Find any email instantly with full-text search
4. **Organize** — Use labels and tags to categorize important emails

## Exporting from Google Workspace

1. Sign into the employee's Gmail
2. Go to [takeout.google.com](https://takeout.google.com)
3. Select only "Mail"
4. Download the .mbox file
5. Upload it to MailVault

## Tech Stack
- Next.js 16 + TypeScript
- Prisma ORM + Turso (SQLite)
- Tailwind CSS + shadcn/ui
- Zustand + React Query
