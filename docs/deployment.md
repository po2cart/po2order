# Deployment Guide

This guide covers deploying POtoOrder to production.

## Architecture

- **Frontend (Next.js)**: Vercel
- **API (Hono)**: AWS Lambda or Railway
- **Workers**: AWS Lambda or Railway
- **Database**: AWS RDS (PostgreSQL) or Neon
- **Redis**: Upstash or Redis Cloud
- **Storage**: AWS S3 or Cloudflare R2
- **Email Workers**: Cloudflare Workers

## Prerequisites

- Vercel account
- AWS account (or Railway)
- Cloudflare account
- Domain name

## Deployment Steps

### 1. Set Up Database

**Option A: Neon (recommended for quick setup)**

1. Sign up at https://neon.tech
2. Create new project
3. Copy connection string

**Option B: AWS RDS**

1. Create RDS PostgreSQL instance
2. Configure security groups
3. Copy connection string

### 2. Set Up Redis

**Option A: Upstash (recommended)**

1. Sign up at https://upstash.com
2. Create Redis database
3. Copy connection string

### 3. Deploy Frontend (Vercel)

```bash
cd apps/web
vercel --prod
```

Set environment variables in Vercel dashboard:
- `DATABASE_URL`
- `REDIS_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `OPENAI_API_KEY`

### 4. Deploy API

**Option A: Railway**

```bash
cd apps/api
railway up
```

**Option B: AWS Lambda**

Use AWS CDK or Serverless Framework.

### 5. Deploy Workers

Similar to API deployment.

### 6. Deploy Email Workers (Cloudflare)

```bash
cd apps/workers
wrangler deploy
```

Configure email routing in Cloudflare dashboard.

### 7. Run Database Migrations

```bash
pnpm db:migrate
```

### 8. Configure DNS

Point domain to:
- `app.po2order.com` → Vercel
- `api.po2order.com` → API deployment
- `orders.po2order.com` → Cloudflare Workers (email)

## Environment Variables

See `.env.example` for full list.

## Monitoring

Set up:
- **Sentry** for error tracking
- **DataDog** for metrics
- **UptimeRobot** for uptime monitoring
- **PagerDuty** for alerts

## Backup & Disaster Recovery

- Database: Daily automated backups
- S3: Versioning enabled
- Redis: Persistence enabled

## Security Checklist

- [ ] All secrets stored in secrets manager
- [ ] Database connection uses SSL
- [ ] API rate limiting enabled
- [ ] CORS configured
- [ ] CSP headers configured
- [ ] Regular security audits

---

For detailed AWS setup, see [AWS Deployment Guide](./aws-deployment.md) (coming soon).
