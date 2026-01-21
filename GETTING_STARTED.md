# Getting Started — Rex, Start Here 🦖

Welcome to POtoOrder! This guide will get you up and running in 5 minutes.

## 🚀 Quick Start

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

This starts:
- **Postgres** on port 5432
- **Redis** on port 6379

### 3. Set Up Environment

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:
- `OPENAI_API_KEY` (required for extraction)
- `CLERK_SECRET_KEY` (for auth, get from https://clerk.com)
- Others can wait

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
- **Web app**: http://localhost:3000
- **API**: http://localhost:3001
- **Workers**: Running in background

### 6. Verify It Works

Visit http://localhost:3000 — you should see the Next.js app running.

API health check: http://localhost:3001/health

---

## 📋 Your First Tasks

Check out the **Sprint 1** issues on GitHub:
- https://github.com/po2cart/po2order/milestone/1

**Start with:**
1. Issue #4: Review and finalize database schema
2. Issue #5: Implement Clerk authentication
3. Issue #6: Set up workspace isolation

---

## 🧭 Navigation

- **Read first**: [AGENTS.md](./AGENTS.md) — Everything you need to know
- **Architecture**: [docs/architecture.md](./docs/architecture.md)
- **API docs**: [docs/api-reference.md](./docs/api-reference.md)
- **ERP integration**: [docs/erp-integration-guide.md](./docs/erp-integration-guide.md)

---

## 🛠️ Common Commands

```bash
# Development
pnpm dev              # Start all apps
pnpm build            # Build all apps
pnpm lint             # Lint all code
pnpm typecheck        # TypeScript checks
pnpm test             # Run tests

# Database
pnpm db:generate      # Generate Prisma client
pnpm db:push          # Push schema changes
pnpm db:migrate       # Create migration
pnpm db:studio        # Open Prisma Studio (DB GUI)

# Individual apps
pnpm --filter @po2order/web dev
pnpm --filter @po2order/api dev
pnpm --filter @po2order/workers dev
```

---

## 🐛 Troubleshooting

### Database connection error

Check Postgres is running:
```bash
docker ps
```

Restart if needed:
```bash
docker-compose restart postgres
```

### pnpm install fails

Make sure you have pnpm 9+:
```bash
pnpm --version
```

Install/upgrade:
```bash
npm install -g pnpm@latest
```

### TypeScript errors

Regenerate Prisma client:
```bash
pnpm db:generate
```

---

## 📞 Need Help?

- **Questions?** Open a GitHub Discussion or ask in Slack `#po2order-dev`
- **Blockers?** Tag Kev with `BLOCKER:` format (see AGENTS.md)
- **Found a bug?** Open a GitHub issue

---

## 🎯 Success Criteria

You'll know everything is working when:

1. ✅ You can run `pnpm dev` and see all apps start
2. ✅ You can open http://localhost:3000 and see the UI
3. ✅ You can run `pnpm db:studio` and see the database
4. ✅ You understand the monorepo structure (apps/, packages/)
5. ✅ You've read AGENTS.md and know the architecture

---

**Let's build this! 🦈🚀**

— Atlas 🗺️ (Product/Strategy)
