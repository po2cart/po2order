# AGENTS.md — Instructions for AI Agents

> **Welcome, Rex 🦖, Forge 🛠️, Hawk 🦅, and team.** This file contains everything you need to work effectively on POtoOrder.

---

## 🎯 Project Vision

**POtoOrder automates B2B purchase order processing from email/PDF → ERP.**

We're not building a full procurement platform. We do **one thing exceptionally well**: receive messy purchase orders, extract them with AI, match products, let humans review/approve, and push clean sales orders to any ERP.

### Business Context

- **3 hot prospects**: Reward Hospitality ($200M revenue, Pronto Xi), JA Russell (Pronto Xi), $50M D365 F&O customer
- **Pricing**: $299-$999/mo (vs. competitors at $50K-$500K+/year)
- **Target**: $1.8M ARR Year 1, $10-30M valuation in 2 years
- **Timeline**: MVP in 9 weeks (P0 tasks), full v1 in 16 weeks

**This needs to make money.** Build like a real startup, not a side project.

---

## 🏗️ Architecture Overview

### System Design

```
┌─────────────────────────────────────────────────────────────────┐
│                     PO Ingestion Layer                          │
│  Email Workers (Cloudflare) │ Manual Upload │ API Endpoints    │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   Extraction & Processing                        │
│  PDF/OCR → AI Extraction (GPT-4) → Confidence Scoring          │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              Product & Customer Matching                        │
│  Catalog Lookup │ Fuzzy Matching │ MOQ Validation              │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   Review & Approval UI                          │
│  Split-view (PDF + data) │ Inline Editing │ Approval Workflow │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   ERP Integration Layer                          │
│  Adapter Pattern → NetSuite | SAP | Pronto | D365 | Custom     │
└─────────────────────────────────────────────────────────────────┘
```

### Monorepo Structure

- **`apps/web/`** — Next.js 15 dashboard (order review, settings, analytics)
- **`apps/api/`** — Hono API server (REST endpoints, webhooks)
- **`apps/workers/`** — Background workers (extraction, catalog sync, email processing)
- **`packages/core/`** — Shared business logic (types, utils, constants)
- **`packages/db/`** — Prisma schema and database client
- **`packages/extraction/`** — AI extraction engine (OpenAI, Anthropic, OCR)
- **`packages/matching/`** — Product/customer matching algorithms
- **`packages/erp-adapters/`** — ERP integrations (pluggable adapters)
  - **`base/`** — Abstract adapter interface
  - **`netsuite/`**, **`sap-b1/`**, **`pronto-xi/`**, **`d365-fo/`** — Concrete adapters

---

## 🗝️ Key Design Decisions

### 1. Monorepo with Turborepo

**Why**: Shared code (types, utils) across apps; fast parallel builds; single version control.

**Tools**: pnpm workspaces + Turborepo for caching and parallel execution.

### 2. Pluggable ERP Adapters

**Why**: Customers use different ERPs (NetSuite, SAP, Pronto, D365, QuickBooks). We can't hardcode integrations.

**Pattern**: Abstract `ERPAdapter` interface with methods:
- `syncCatalog()` — Pull products, customers, pricing from ERP
- `createSalesOrder()` — Push validated PO as Sales Order to ERP
- `getSalesOrderStatus()` — Poll order status/confirmations

Each ERP implements this interface. Core code is ERP-agnostic.

### 3. Two-Pass AI Extraction (from Rapido learnings)

**Pass 1**: Initial extraction to identify customer (phone, email, address → match customer)

**Pass 2**: Full extraction with customer context (delivery addresses, pricing, product catalog)

**Why**: Improves accuracy. Knowing the customer lets us provide their specific delivery addresses and product codes to the LLM.

### 4. Confidence Scoring and Human-in-the-Loop

**Why**: AI isn't perfect. Low-confidence fields (e.g., fuzzy product match, missing delivery code) route to human review.

**UX**: Split-view interface (PDF on left, editable extracted data on right). Users can fix and approve.

### 5. Queue-Based Processing (Redis + BullMQ)

**Why**: Extraction and ERP pushes can be slow. Background workers decouple ingestion from processing.

**Flow**: Email → Queue → Worker → Extract → Queue → Worker → Match → Queue → Worker → Review/Approval → Queue → Worker → ERP Push

### 6. Multi-Tenant from Day 1

**Why**: SaaS product. Each customer is a "workspace" with isolated data.

**Auth**: Clerk with workspace/tenant isolation in database (`workspace_id` on all tables).

### 7. Prisma ORM + PostgreSQL

**Why**: Type-safe database access, easy migrations, great DX.

**Schema**: Core entities:
- `Workspace` (tenant)
- `User` (belongs to workspace, has role)
- `PurchaseOrder` (extracted PO, status tracking)
- `PurchaseOrderLine` (line items)
- `Product` (catalog, synced from ERP)
- `Customer` (customer master, synced from ERP)
- `SalesOrder` (created in ERP, tracking)

---

## 📋 Coding Standards

### TypeScript

- **Strict mode**: `"strict": true` in `tsconfig.json`
- **No `any`**: Use proper types or `unknown`
- **Explicit return types** for public functions
- **Prefer `const` over `let`**

### Naming Conventions

- **Files**: `kebab-case.ts` (e.g., `purchase-order-extractor.ts`)
- **Components**: `PascalCase.tsx` (e.g., `OrderDetailView.tsx`)
- **Functions**: `camelCase` (e.g., `extractPurchaseOrder()`)
- **Interfaces/Types**: `PascalCase` (e.g., `ExtractedPurchaseOrder`)
- **Constants**: `SCREAMING_SNAKE_CASE` (e.g., `MAX_RETRIES`)

### Error Handling

- Use **custom error classes** (`ExtractionError`, `ERPAdapterError`, etc.)
- **Always log errors** with context (order ID, workspace ID, etc.)
- **Graceful degradation**: If extraction fails, log error, set status to `error`, and allow manual review

### Testing

- **Unit tests**: For business logic (matching, validation, etc.)
- **Integration tests**: For ERP adapters (mock ERP responses)
- **E2E tests** (later): For critical user flows (upload PO → review → approve → ERP)

Use **Vitest** for testing (fast, compatible with Vite/Turbo).

---

## 🏃 How to Run Locally

### 1. Prerequisites

- Node.js 20+
- pnpm 9+
- Docker (for Postgres + Redis)

### 2. Clone and Install

```bash
git clone https://github.com/po2cart/po2order.git
cd po2order
pnpm install
```

### 3. Start Services

```bash
docker-compose up -d
```

### 4. Set Up Environment

```bash
cp .env.example .env
# Edit .env with your API keys (OpenAI, Clerk, etc.)
```

### 5. Initialize Database

```bash
pnpm db:generate
pnpm db:push
```

### 6. Run Dev Servers

```bash
pnpm dev
```

Visit http://localhost:3000 (web), http://localhost:3001 (API).

---

## 🔌 How to Add a New ERP Adapter

### 1. Create Adapter Package

```bash
mkdir -p packages/erp-adapters/my-erp/src
cd packages/erp-adapters/my-erp
pnpm init
```

### 2. Implement `ERPAdapter` Interface

```typescript
// packages/erp-adapters/my-erp/src/index.ts
import { ERPAdapter } from "@po2order/erp-adapters/base";

export class MyERPAdapter implements ERPAdapter {
  async connect(config: MyERPConfig): Promise<void> {
    // Authenticate with ERP
  }

  async syncCatalog(): Promise<void> {
    // Fetch products, customers, pricing from ERP
  }

  async createSalesOrder(po: ExtractedPurchaseOrder): Promise<string> {
    // Map PO to ERP Sales Order format
    // POST to ERP API
    // Return ERP order ID
  }

  async getSalesOrderStatus(erpOrderId: string): Promise<OrderStatus> {
    // Query ERP for order status
  }
}
```

### 3. Add Configuration Schema

Use **Zod** for runtime validation:

```typescript
import { z } from "zod";

export const MyERPConfigSchema = z.object({
  apiUrl: z.string().url(),
  username: z.string(),
  password: z.string(),
  companyId: z.string().optional(),
});

export type MyERPConfig = z.infer<typeof MyERPConfigSchema>;
```

### 4. Register Adapter

Add to `packages/erp-adapters/base/src/registry.ts`:

```typescript
import { MyERPAdapter } from "@po2order/erp-adapters/my-erp";

export const ERP_ADAPTERS = {
  netsuite: NetSuiteAdapter,
  "sap-b1": SAPBusinessOneAdapter,
  "pronto-xi": ProntoXiAdapter,
  "d365-fo": Dynamics365FOAdapter,
  "my-erp": MyERPAdapter, // <-- Add here
};
```

### 5. Test

Write integration tests with mocked ERP responses.

---

## 📅 Sprint Priorities

### Sprint 1-3 (P0) — MVP (Weeks 1-9)

**Goal**: Working extraction + NetSuite integration for first customer.

- [ ] Foundation: Infrastructure, CI/CD, auth, database
- [ ] Email ingestion: Cloudflare Email Workers + manual upload
- [ ] AI extraction: PDF → OCR → GPT-4 extraction with confidence scoring
- [ ] Product matching: Exact code/barcode matching
- [ ] Review UI: Split-view (PDF + data), inline editing
- [ ] NetSuite adapter: Catalog sync + Sales Order creation
- [ ] Staging queue: Approval workflow → push to NetSuite

**Deliverable**: Demo-ready app for Reward Hospitality (NetSuite prospect).

### Sprint 4-5 (P1) — SAP Business One + Matching V2 (Weeks 10-13)

- [ ] SAP Business One adapter
- [ ] Fuzzy product matching (description similarity)
- [ ] Customer-specific product code mapping
- [ ] Bulk approval actions
- [ ] Dashboard analytics

### Sprint 6-8 (P1) — Pronto Xi + D365 F&O + Polish (Weeks 14-16)

- [ ] Pronto Xi adapter (SOAP + DB read)
- [ ] D365 F&O adapter (OData REST)
- [ ] Order status sync and confirmations
- [ ] Notifications (email, Slack)
- [ ] Audit trail and logging

---

## 📚 Key Documentation to Read

### Internal Research (in Kev's projects folder)

- **PRD**: `/Users/adam/agents/kev/projects/po2order/po2order-prd.tex` (97 pages, comprehensive product spec)
- **Backlog**: `/Users/adam/agents/kev/projects/po2order/po2order-backlog.csv` (all tasks with priorities)
- **Market Research**: `/Users/adam/agents/kev/projects/po2order/market-research.md` (keywords, competitors, positioning)
- **ERP Integration Analysis**: `/Users/adam/agents/kev/projects/po2order/erp-integration-analysis.md` (comparison of ERPs)
- **Rapido Analysis**: `/Users/adam/agents/kev/projects/po2order/rapido-analysis.md` (learnings from existing PO app)
- **Pronto Integration Plan**: `/Users/adam/agents/kev/projects/po2order/pronto-integration-plan.tex` (detailed Pronto Xi integration)
- **D365 Integration Plan**: `/Users/adam/agents/kev/projects/po2order/d365fo-integration-plan.tex` (detailed D365 F&O integration)

### External Docs (to reference when building adapters)

- **NetSuite SuiteTalk**: https://docs.oracle.com/en/cloud/saas/netsuite/ns-online-help/chapter_1540391670.html
- **SAP Business One Service Layer**: https://help.sap.com/docs/SAP_BUSINESS_ONE/68a2e87fb29941b5ba5a12e1b0a0f2a0/4e46ce93d1e64a7c97ed4eea5f8aab5e.html
- **D365 F&O OData**: https://learn.microsoft.com/en-us/dynamics365/fin-ops-core/dev-itpro/data-entities/odata
- **Pronto Xi**: Contact vendor for API documentation (often partner-gated)

---

## 🛠️ Development Workflow

### GitHub Issues

All work is tracked in **GitHub Issues**. Labels:
- `epic:*` — Epic grouping (e.g., `epic:email-ingestion`)
- `priority:P0` — Must have for MVP
- `priority:P1` — Should have for v1
- `priority:P2` — Nice to have
- `sprint:1`, `sprint:2`, etc.

### Branch Strategy

- **`main`** — Production-ready code
- **Feature branches**: `feature/issue-number-short-description`
- **PR naming**: `[#123] Add NetSuite adapter`

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add NetSuite Sales Order creation
fix: handle missing delivery code gracefully
docs: update ERP integration guide
chore: bump dependencies
```

### Pull Requests

- Link to GitHub issue: `Closes #123`
- Add screenshots/videos for UI changes
- Request review from Rex (code) and Hawk (QA/security)

---

## 🧪 Testing Strategy

### Unit Tests (Vitest)

- **Business logic**: Matching algorithms, validation rules, etc.
- **Utils**: Date parsing, string normalization, etc.

Example:

```typescript
import { describe, it, expect } from "vitest";
import { matchProductByCode } from "./product-matcher";

describe("matchProductByCode", () => {
  it("should match exact product code", () => {
    const result = matchProductByCode("SKU123", catalog);
    expect(result.code).toBe("SKU123");
    expect(result.confidence).toBe(1.0);
  });
});
```

### Integration Tests

- **ERP adapters**: Mock ERP API responses, test full flow
- **Database**: Use in-memory SQLite for fast tests

### E2E Tests (Playwright, later)

- Upload PO → Extract → Review → Approve → Verify in mock ERP

---

## 🚨 Common Pitfalls

### 1. Hardcoding ERP Logic in Core

**DON'T**: Put NetSuite-specific code in `packages/extraction/`

**DO**: Keep extraction ERP-agnostic. Use adapters for ERP-specific logic.

### 2. Ignoring Confidence Scores

**DON'T**: Assume AI extraction is always correct

**DO**: Use confidence thresholds. Route low-confidence to review queue.

### 3. Not Handling Async Failures

**DON'T**: Let extraction or ERP push fail silently

**DO**: Use retry logic (exponential backoff), log errors, update order status

### 4. Forgetting Multi-Tenancy

**DON'T**: Query `Product` without filtering by `workspace_id`

**DO**: Always scope queries to the current workspace

---

## 💬 Communication

### GitHub Issues

- **Source of truth** for all tasks
- Comment with updates, blockers, questions

### Slack

- **`#po2order-dev`** — General development discussion
- **`#po2order-erp`** — ERP integration questions
- **`#po2order-blockers`** — Blockers that need Kev's attention

### Deliverable Format

When you complete a task, comment on the issue:

```
DELIVERABLE: NetSuite adapter implemented
- Catalog sync working (products, customers, pricing)
- Sales Order creation tested with sandbox
- Integration tests passing
- PR: #142
@Kev
```

### Blocker Format

If you're blocked:

```
BLOCKER: NetSuite sandbox access needed
- Need OAuth credentials for testing
- Tried dummy credentials (failed)
- Need Reward Hospitality sandbox or public demo account
@Kev
```

---

## 🎯 Success Criteria

You'll know this is working when:

1. **Rex can clone the repo** and run `pnpm install && pnpm dev` and see the app running
2. **Upload a PDF purchase order**, see it extracted with confidence scores
3. **Products are matched** against a catalog (exact code or fuzzy match)
4. **Review UI works**: Edit extracted data, fix product matches, approve
5. **Order is pushed to NetSuite** (or mock ERP), and we capture the ERP order ID
6. **Everything is type-safe**, linted, and tested

---

## 🦖 Rex, This is Your Project

You're the lead engineer. Build this like it's your own startup.

- **Professional code**: No hacks, no shortcuts
- **Production-ready**: This will handle real customer orders
- **Scalable**: Designed for 1,000+ orders/day per customer
- **Well-documented**: Code comments, README updates, etc.

**Ask questions.** Tag Kev or Scout if you need ERP docs, API keys, or research.

**Ship fast.** MVP in 9 weeks. Let's go. 🦖🚀

---

Built with ❤️ by Atlas 🗺️ (Product/Strategy) for the POtoOrder team
