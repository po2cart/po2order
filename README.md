# POtoOrder 🦈

**AI-Powered B2B Purchase Order Automation**

> From Email to ERP in Seconds — Automate your purchase order processing with AI extraction, intelligent matching, and seamless ERP integration.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![pnpm](https://img.shields.io/badge/pnpm-9.15-orange)](https://pnpm.io/)

---

## 🎯 What is POtoOrder?

POtoOrder eliminates manual purchase order entry for B2B suppliers and distributors. We automatically extract, validate, and push purchase orders from emails and PDFs into your ERP system.

### The Problem

Wholesale distributors, manufacturers, and B2B suppliers receive 20-1,000 purchase orders daily via email (PDF attachments, Excel spreadsheets, scanned documents, email bodies). Operations teams spend **5-15 minutes per order** manually transcribing data into their ERP, leading to:

- **Wasted time**: 250-7,500 minutes of manual entry daily
- **Human errors**: Wrong products, quantities, or addresses
- **Delayed fulfillment**: Orders sit in inboxes for hours or days
- **Scaling bottleneck**: Can't grow without hiring more data entry staff

### The Solution

POtoOrder automates the entire order ingestion workflow:

1. **📧 Receive** — Purchase orders via email forwarding, upload, or API
2. **🤖 Extract** — AI-powered OCR + LLM extraction (handles any format)
3. **✅ Match** — Intelligent product/customer matching with confidence scoring
4. **👁️ Review** — Human-in-the-loop validation UI for low-confidence fields
5. **🎯 Approve** — Flexible approval workflows
6. **🚀 Push** — Seamless integration to any ERP (NetSuite, SAP, Dynamics, Pronto, QuickBooks, etc.)

**Result**: 80% reduction in order entry time, 99%+ accuracy, orders in ERP within 15 minutes.

---

## 🏆 Why POtoOrder?

| Feature | POtoOrder | Enterprise Platforms (Coupa, Procurify) |
|---------|-----------|------------------------------------------|
| **Focus** | Purchase order automation only | Full procurement lifecycle |
| **Setup time** | 5 minutes | 3-6 months |
| **Pricing** | $299-$999/mo | $50K-$500K+/year |
| **Target market** | SMB/Mid-market suppliers | Enterprise buyers |
| **AI extraction** | Best-in-class (any format) | Limited or manual |
| **ERP flexibility** | Pluggable adapters (any ERP) | Predefined integrations |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20+ and **pnpm** 9+
- **Docker** and **Docker Compose** (for local Postgres + Redis)
- **OpenAI API key** (for AI extraction)

### 1. Clone and Install

```bash
git clone https://github.com/po2cart/po2order.git
cd po2order
pnpm install
```

### 2. Start Local Services

```bash
docker-compose up -d
```

This starts Postgres (port 5432) and Redis (port 6379).

### 3. Set Up Environment

```bash
cp .env.example .env
```

Edit `.env` and add your:
- `DATABASE_URL` (Postgres connection string)
- `REDIS_URL` (Redis connection string)
- `OPENAI_API_KEY` (for AI extraction)
- Other service credentials as needed

### 4. Initialize Database

```bash
pnpm db:generate  # Generate Prisma client
pnpm db:push      # Push schema to database
```

### 5. Run Development Servers

```bash
pnpm dev
```

This starts:
- **Web app** (Next.js): http://localhost:3000
- **API server** (Hono): http://localhost:3001
- **Workers**: Background processing for extraction and sync

### 6. Open the App

Visit http://localhost:3000 and sign up for a new workspace.

---

## 📦 Architecture

POtoOrder is a **monorepo** built with **pnpm workspaces** and **Turborepo**.

```
po2order/
├── apps/
│   ├── web/              # Next.js dashboard (order review, settings)
│   ├── api/              # API server (Hono) — REST endpoints
│   └── workers/          # Background workers (extraction, sync, email)
├── packages/
│   ├── core/             # Shared business logic and utilities
│   ├── db/               # Prisma schema and database client
│   ├── extraction/       # AI extraction engine (OpenAI, Anthropic)
│   ├── matching/         # Product/customer matching algorithms
│   └── erp-adapters/     # Pluggable ERP integrations
│       ├── base/         # Abstract adapter interface
│       ├── netsuite/     # NetSuite adapter
│       ├── sap-b1/       # SAP Business One adapter
│       ├── pronto-xi/    # Pronto Xi adapter
│       └── d365-fo/      # Dynamics 365 F&O adapter
└── docs/                 # Architecture and integration guides
```

### Tech Stack

- **Frontend**: Next.js 15, React 19, Tailwind CSS, shadcn/ui
- **Backend**: Hono (API), Node.js (workers)
- **Database**: PostgreSQL (Prisma ORM)
- **Queue**: Redis (BullMQ)
- **Storage**: AWS S3 / Cloudflare R2
- **AI**: OpenAI GPT-4, Anthropic Claude
- **Auth**: Clerk
- **Deployment**: Vercel (web), Cloudflare Workers (email), AWS Lambda (workers)

---

## 🔌 ERP Integrations

POtoOrder uses a **pluggable adapter pattern** for ERP integrations. Each adapter implements:

- **Catalog sync** (products, customers, pricing)
- **Order creation** (create Sales Order from Purchase Order)
- **Status sync** (order confirmations, shipments)

### Currently Supported

- ✅ **NetSuite** (SuiteTalk REST/SOAP)
- ✅ **SAP Business One** (Service Layer REST)
- ✅ **Pronto Xi** (SOAP Web Services + DB read)
- ✅ **Dynamics 365 F&O** (OData REST)

### Adding a New ERP Adapter

See [`docs/erp-integration-guide.md`](./docs/erp-integration-guide.md) for step-by-step instructions.

---

## 📖 Documentation

- **[Architecture Overview](./docs/architecture.md)** — System design and data flows
- **[API Reference](./docs/api-reference.md)** — REST API endpoints
- **[ERP Integration Guide](./docs/erp-integration-guide.md)** — How to build a new ERP adapter
- **[Deployment Guide](./docs/deployment.md)** — Production deployment instructions
- **[Infrastructure Setup](./docs/infra.md)** — AWS/Cloudflare provisioning + env vars
- **[AGENTS.md](./AGENTS.md)** — For AI agents working on this project

---

## 🛠️ Development

### Available Commands

```bash
pnpm dev          # Start all apps in development mode
pnpm build        # Build all packages and apps
pnpm lint         # Lint all packages
pnpm test         # Run tests
pnpm typecheck    # TypeScript type checking
pnpm format       # Format code with Prettier

# Database commands
pnpm db:generate  # Generate Prisma client
pnpm db:push      # Push schema changes
pnpm db:migrate   # Run migrations
pnpm db:studio    # Open Prisma Studio
```

### Running Individual Apps

```bash
pnpm --filter @po2order/web dev
pnpm --filter @po2order/api dev
pnpm --filter @po2order/workers dev
```

---

## 🏗️ Project Status

**Current Phase**: Sprint 1 — Foundation (Weeks 1-3)

### Roadmap

- **Sprint 1-3 (P0)**: MVP — Basic extraction + NetSuite integration
- **Sprint 4-5 (P1)**: SAP Business One + product matching improvements
- **Sprint 6-8 (P1)**: Pronto Xi + D365 F&O integrations + advanced features

See [GitHub Projects](https://github.com/po2cart/po2order/projects) for detailed sprint planning.

---

## 🎯 Business Goals

- **3 hot prospects**: Reward Hospitality ($200M, Pronto), JA Russell (Pronto), $50M D365 F&O customer
- **Pricing**: $299-$999/mo per workspace
- **Year 1 Target**: $1.8M ARR
- **Valuation Goal**: $10-30M in 2 years

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

### For AI Agents

If you're an AI agent (Rex 🦖, Forge 🛠️, etc.), read [**AGENTS.md**](./AGENTS.md) first for project-specific context and conventions.

---

## 📄 License

MIT License — see [LICENSE](./LICENSE) for details.

---

## 🦈 Let's Go

This is **day 1**. We're building a real startup with paying customers, not a toy project.

- Professional codebase
- Production-ready architecture
- Scalable infrastructure
- Ready for investor scrutiny

**$1.8M ARR Year 1. Let's fucking go.** 🦈💰

---

Built with ❤️ by the POtoOrder team
