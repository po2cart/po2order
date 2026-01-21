# @po2order/workers

Background workers for POtoOrder using BullMQ.

## Workers

- **Extraction** — Extract PO data from PDFs using AI
- **Matching** — Match products and customers to catalog
- **ERP Push** — Push approved orders to ERP
- **Catalog Sync** — Sync products/customers from ERP

## Development

```bash
pnpm dev
```

Requires Redis running (see `docker-compose.yml` in project root).

## Tech Stack

- BullMQ (Redis-backed queues)
- Prisma (database)
- OpenAI (AI extraction)

## TODO

- [ ] Implement extraction worker logic
- [ ] Implement matching worker logic
- [ ] Implement ERP push worker logic
- [ ] Implement catalog sync worker
- [ ] Add error handling and retries
- [ ] Add job progress tracking
- [ ] Add job metrics and monitoring
