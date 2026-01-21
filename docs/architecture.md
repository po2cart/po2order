# POtoOrder Architecture

## Overview

POtoOrder is a multi-tenant SaaS platform built as a monorepo with Next.js (frontend), Hono (API), and background workers.

## System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Ingestion Layer                              │
│  Cloudflare Email Workers │ Next.js Upload │ REST API           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                      ┌──────────────┐
                      │ Redis Queue  │
                      │  (BullMQ)    │
                      └──────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                     Processing Workers                           │
│  Extraction │ Matching │ Validation │ ERP Push                  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                      ┌──────────────┐
                      │  PostgreSQL  │
                      │  (Prisma)    │
                      └──────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                     Review & Approval UI                         │
│  Next.js Dashboard │ PDF Viewer │ Inline Editing                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                     ERP Integration                              │
│  NetSuite │ SAP B1 │ Pronto Xi │ D365 F&O                       │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. PO Ingestion

- **Email**: Cloudflare Email Workers receive forwarded emails, extract attachments, store in R2, queue for processing
- **Upload**: Users upload PDFs/Excel via Next.js UI
- **API**: External systems POST PO data via REST API

### 2. Extraction

- Worker pulls job from queue
- Extract text from PDF using `pdftotext` or OCR
- Send to OpenAI GPT-4 with structured schema
- Store extracted data with confidence scores

### 3. Matching

- Match customer by code/phone/email
- Match products by code/barcode
- Calculate confidence scores
- Flag low-confidence items for review

### 4. Review & Approval

- Users see split-view UI (PDF on left, data on right)
- Edit extracted fields, fix product matches
- Approve → status changes to "approved"

### 5. ERP Push

- Worker pulls approved POs from queue
- Load ERP adapter for workspace
- Map PO to ERP Sales Order format
- POST to ERP API
- Store ERP order ID and status

### 6. Status Sync

- Poll ERP for order confirmations, shipments
- Update order status in database
- Notify user via email/dashboard

## Tech Stack

### Frontend

- **Next.js 15** (App Router)
- **React 19**
- **Tailwind CSS**
- **shadcn/ui** components
- **Clerk** for auth

### Backend

- **Hono** (fast, lightweight API framework)
- **PostgreSQL** (Prisma ORM)
- **Redis** (BullMQ for queues)
- **Cloudflare Workers** (email ingestion)

### AI/ML

- **OpenAI GPT-4o** (extraction)
- **Anthropic Claude** (optional fallback)
- **Tesseract OCR** (scanned documents)

### Storage

- **S3 / Cloudflare R2** (documents, PDFs)
- **PostgreSQL** (structured data)
- **Redis** (queue, cache)

### Deployment

- **Vercel** (Next.js web app)
- **AWS Lambda** / **Railway** (API + workers)
- **Cloudflare Workers** (email ingestion)
- **AWS RDS** / **Neon** (PostgreSQL)
- **Upstash** / **Redis Cloud** (Redis)

## Database Schema

See [`packages/db/prisma/schema.prisma`](../packages/db/prisma/schema.prisma) for full schema.

### Core Entities

- **Workspace** — Tenant/organization
- **User** — Belongs to workspace, has role
- **PurchaseOrder** — Extracted PO with status tracking
- **PurchaseOrderLine** — Line items
- **Product** — Catalog synced from ERP
- **Customer** — Customer master synced from ERP
- **SalesOrder** — Created in ERP, tracking
- **ERPConfig** — ERP credentials per workspace

## Security

- **Multi-tenancy**: All queries filtered by `workspace_id`
- **Authentication**: Clerk (OAuth, magic links, SSO)
- **Authorization**: RBAC (admin, manager, user roles)
- **Encryption**: Credentials encrypted at rest
- **API keys**: Stored in secrets manager (AWS Secrets Manager, Vercel Env Vars)

## Scalability

- **Queue-based**: Async processing, horizontal scaling
- **Stateless workers**: Can scale to N instances
- **Database**: Connection pooling (PgBouncer)
- **Caching**: Redis for hot data (catalog, pricing)
- **CDN**: Cloudflare for static assets

## Monitoring

- **Logging**: Structured JSON logs (Winston / Pino)
- **Metrics**: DataDog / Prometheus
- **Error tracking**: Sentry
- **Uptime**: UptimeRobot / BetterUptime
- **Alerts**: PagerDuty / Slack

## Future Architecture

- **Event-driven**: Use AWS EventBridge or Kafka for events
- **ML matching**: Train custom product matching models
- **OCR improvements**: Custom-trained models for industry-specific POs
- **Multi-region**: Deploy API/workers closer to customers

---

See also:
- [API Reference](./api-reference.md)
- [ERP Integration Guide](./erp-integration-guide.md)
- [Deployment Guide](./deployment.md)
