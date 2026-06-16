# Valentro

Valentro is a luxury fragrance e-commerce application built with Next.js App Router, TypeScript, Tailwind CSS, Prisma, PostgreSQL, NextAuth.js, and next-intl.

## Requirements

- Node.js 20+
- PostgreSQL
- A Hostinger VPS or another Node-capable server for production

## Local Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create your environment file:

   ```bash
   cp .env.example .env
   ```

3. Update `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, and `NEXT_PUBLIC_SITE_URL`.

4. Generate Prisma Client and apply the schema:

   ```bash
   npm run prisma:generate
   npm run prisma:migrate -- --name init
   ```

5. Seed the database:

   ```bash
   npm run db:seed
   ```

   The seed creates `admin@valentro.com` with password `Admin1234!`.

6. Start development:

   ```bash
   npm run dev
   ```

   Open `http://localhost:3000/en` or `http://localhost:3000/ar`.

## Hostinger VPS Deployment

1. Provision PostgreSQL and create the `valentro` database.
2. Set production environment variables on the VPS:

   ```bash
   DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/valentro
   NEXTAUTH_SECRET=replace-with-a-long-random-secret
   NEXTAUTH_URL=https://yourdomain.com
   NEXT_PUBLIC_SITE_URL=https://yourdomain.com
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=your-api-key
   CLOUDINARY_API_SECRET=your-api-secret
   ```

3. Install dependencies and build:

   ```bash
   npm ci
   npm run build
   ```

4. Run migrations and seed only when appropriate:

   ```bash
   npx prisma migrate deploy
   npm run db:seed
   ```

5. Start the single Next.js server:

   ```bash
   npm run start
   ```

6. Point the domain proxy to the Next.js process. Product imagery is optimized to WebP during upload, stored in Cloudinary, and referenced from PostgreSQL by secure Cloudinary URL.

## Current Phase

Phase 1 implements the homepage hero, announcement bar, navbar behavior, full Prisma schema, i18n/auth plumbing, typed API scaffolds, and UI primitive scaffolds. Admin and secondary storefront pages are intentionally TODO shells.
