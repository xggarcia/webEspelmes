# 🕯️ Espelmes — Botiga d'espelmes artesanes

Web completa per a la botiga d'espelmes fetes a mà de la mare. Monorepo
full-stack amb catàleg, configurador en temps real, autenticació, pagaments
Stripe i un panell d'administració amb un mòdul de _comandes_ estructurades.

> **Estat**: en construcció per fases. Aquest fitxer s'ampliarà amb instruccions
> de desplegament, proves i checklist QA al final de la Fase 10.

## Stack

| Àrea | Tecnologia |
| --- | --- |
| Monorepo | pnpm workspaces + Turborepo |
| Web | Next.js 15 (App Router) · TypeScript · Tailwind · next-intl (ca/es) |
| 3D / live preview | `<canvas>` 2D (MVP) + contracte llest per a three.js / R3F |
| Realtime | socket.io (client + gateway NestJS) |
| API | NestJS 10 · Prisma · Zod · Pino |
| DB | PostgreSQL 16 · Prisma migrations |
| Cache / rate-limit | Redis 7 |
| Auth | JWT access + refresh rotatiu · argon2id · cookies HttpOnly |
| Pagaments | Stripe (test mode per defecte) |
| Infra | Docker + docker-compose · Caddy (TLS auto) |

## Estructura

```
apps/
  web/     # Next.js (botiga + admin UI)
  api/     # NestJS (REST + WS Gateway)
packages/
  shared/  # Schemes Zod, tipus i constants compartides
  ui/      # Tokens de disseny i primitius React
  config/  # tsconfig, tailwind preset, eslint base
infra/
  docker/  # Dockerfiles, Caddyfile
  compose/ # docker-compose (dev + prod)
docs/      # Arquitectura, full de ruta 3D, checklist QA
```

## Arrencada ràpida (dev)

```bash
cp .env.example .env
pnpm install
pnpm docker:up                 # postgres + redis
pnpm db:migrate                # aplica migracions
pnpm db:seed                   # carrega productes de demo + admin
pnpm dev                       # web (3000) + api (4000) en paral·lel
```

- Web: http://localhost:3000
- API: http://localhost:4000
- Swagger: http://localhost:4000/docs

## Pròximes fases

Consulta [`docs/architecture.md`](docs/architecture.md) (generat a la Fase 10)
i el pla inicial a `C:/Users/guill/.claude/plans/binary-giggling-leaf.md`.
