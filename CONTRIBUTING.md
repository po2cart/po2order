# Contributing to POtoOrder

Thank you for your interest in contributing to POtoOrder! This document provides guidelines and instructions for contributing.

## 🦈 Code of Conduct

Be professional, respectful, and collaborative. We're building a real startup with paying customers.

## 🏗️ Development Setup

See [README.md](./README.md#-quick-start) for setup instructions.

## 📋 How to Contribute

### 1. Find or Create an Issue

- Check [GitHub Issues](https://github.com/po2cart/po2order/issues) for open tasks
- For new features or bugs, create an issue first (before starting work)
- Comment on the issue to claim it

### 2. Fork and Branch

```bash
git checkout -b feature/issue-number-short-description
```

### 3. Make Changes

- Follow the [coding standards](./AGENTS.md#-coding-standards)
- Write tests for new features
- Update documentation if needed

### 4. Commit

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add fuzzy product matching
fix: handle null delivery address
docs: update ERP adapter guide
chore: bump dependencies
test: add unit tests for matching
```

### 5. Push and Create PR

```bash
git push origin feature/issue-number-short-description
```

Create a pull request:
- Link to the issue: `Closes #123`
- Describe what you changed and why
- Add screenshots/videos for UI changes
- Request review from maintainers

### 6. Address Review Feedback

Respond to comments, make requested changes, and push updates.

## 🧪 Testing

Run tests before submitting:

```bash
pnpm test        # All tests
pnpm typecheck   # TypeScript checks
pnpm lint        # Linting
```

## 📄 Documentation

- Update `README.md` if you add new features
- Update `docs/` for architecture or integration changes
- Add JSDoc comments for exported functions

## 🎯 What We're Looking For

### Priority Areas

- **ERP adapters**: Add support for new ERPs (QuickBooks, Xero, MYOB, etc.)
- **Extraction improvements**: Better OCR, handling edge cases
- **Matching algorithms**: Fuzzy matching, ML-based matching
- **UI/UX**: Faster review workflow, keyboard shortcuts
- **Performance**: Optimize extraction speed, database queries

### Not Accepting

- Major architectural changes without discussion
- Features not aligned with product vision
- Code that breaks existing functionality

## 🔒 Security

If you discover a security vulnerability, **do not open a public issue**. Email security@po2order.com (or DM Kev in Slack).

## 📜 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Questions? Ask in [GitHub Discussions](https://github.com/po2cart/po2order/discussions) or Slack `#po2order-dev`.
