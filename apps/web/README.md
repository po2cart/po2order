# @po2order/web

Next.js 15 frontend for POtoOrder.

## Features

- Dashboard with order inbox
- Split-view PDF viewer + data editor
- Product and customer management
- ERP configuration
- Analytics

## Development

```bash
pnpm dev
```

Visit http://localhost:3000

## Tech Stack

- Next.js 15 (App Router)
- React 19
- Clerk (auth)
- Tailwind CSS
- shadcn/ui

## Structure

```
app/
├── (auth)/          # Auth pages (sign-in, sign-up)
├── (dashboard)/     # Main app (protected)
│   ├── orders/      # Order inbox and detail
│   ├── products/    # Product catalog
│   ├── customers/   # Customer management
│   ├── settings/    # Workspace settings, ERP config
│   └── analytics/   # Dashboard and analytics
└── api/             # API routes (webhooks, etc.)
```

## TODO

- [ ] Implement order inbox UI
- [ ] Implement split-view PDF viewer
- [ ] Implement inline editing
- [ ] Implement ERP configuration wizard
- [ ] Implement dashboard analytics
