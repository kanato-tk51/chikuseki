# chikuseki

## Development

```bash
pnpm install
docker compose up -d
cp .env.example .env.local
pnpm db:migrate
pnpm dev
```

Useful commands:

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm db:generate
pnpm db:migrate
pnpm db:studio
```

## Documents

- [Engineering Learning OS implementation plan](./docs/engineering-learning-os-plan.md)
- [ADR 0001: 初期技術選定](./docs/adr/0001-initial-technology-selection.md)
