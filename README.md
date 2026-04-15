## 🚀 Arrencar en local (ordre exacte)

```bash
# 1. Arrenca Docker Desktop (icona de la balena). Espera que digui "Running".
# 2. Aixeca Postgres + Redis
docker compose -f infra/compose/docker-compose.yml up -d postgres redis

# 3. (només el primer cop) migracions + seed
pnpm --filter @espelmes/api prisma migrate deploy
pnpm --filter @espelmes/api prisma db seed

# 4. Arrenca tot (web port 3000 + api port 4000) — des de l'arrel del monorepo
pnpm dev
```

Obre http://localhost:3000/ca — el configurador viu a `/ca/personalitza/espelma-personalitzable`.

---

## 🔐 Panell d'administració

El backoffice viu sota `/ca/admin` (o `/es/admin`). Està protegit a dues
capes: el layout del servidor redirigeix a `/auth/login` si no hi ha sessió i
al `/` si la sessió no té `role = ADMIN`, i tots els endpoints `/admin/*` de
l'API tenen `RolesGuard` + `@Roles(Role.ADMIN)`. Els permisos són servidor
final — el frontend no pot saltar-se'ls.

### Com entrar

El seed crea un usuari admin a partir de variables d'entorn (o uns valors per
defecte). Els **pots (i hauries de) sobreescriure** abans de fer `db seed`:

```bash
# .env (o el teu shell abans del seed)
ADMIN_EMAIL=admin@espelmes.local        # per defecte
ADMIN_PASSWORD=?            # CANVIA-HO a producció
ADMIN_NAME=Administradora
```

Entra a `/ca/auth/login` amb aquestes credencials. Al header apareixerà un
enllaç "Admin" (només visible si la sessió és administradora).

### Què hi ha dins

| Secció | Ruta | Què fa |
| --- | --- | --- |
| Tauler | `/admin/dashboard` | KPIs (productes actius, comandes obertes, clients, facturació acumulada, últims 30 dies) i llista d'estoc baix (≤ 5 u.) amb enllaç directe al producte. |
| Productes | `/admin/products` | Taula amb categoria, preu, estoc i estat. Botó **+ Nou producte** obre el formulari. Editar un producte permet canviar tots els camps o fer **desactivar** (soft-delete: posa `isActive=false`, conserva l'històric de comandes). |
| Comandes | `/admin/orders` | Llista de comandes recents amb estat acolorit. El detall mostra articles (amb la personalització completa del configurador en JSON plegable), adreça d'enviament i un **control de transicions** que només mostra els estats vàlids segons la màquina d'estats (`PENDING → PAID/CANCELLED`, `PAID → FULFILLED/REFUNDED`, `FULFILLED → SHIPPED/REFUNDED`, `SHIPPED → DELIVERED`, `DELIVERED → REFUNDED`). |
| Clients | `/admin/customers` | Llista d'usuaris `CUSTOMER` amb nombre de comandes i data d'alta. |
| Ordres | `/admin/commands` | Llançador del **mòdul de comandes**. Veure secció següent. |
| Auditoria | `/admin/audit` | Registre de totes les mutacions d'admin amb actor, IP, acció, objectiu i metadades (inclou diff en els `update`). Filtre per acció via query string. |

### Mòdul de comandes (`/admin/commands`)

Les "comandes" són operacions estructurades d'administració: validades amb
Zod, autoritzades per rol, executades dins una transacció i **auditades
automàticament** (qui, quan, IP, duració, afectats, resultat o error). Cada
comanda exposa el seu schema d'entrada i es pot executar amb `dryRun: true`
per simular l'impacte sense escriure a la BD.

Comandes registrades ara mateix:

- **`recalculate-pricing`** — aplica un multiplicador al preu base de tots
  els productes d'una categoria (o de tots), arrodonint a X cèntims.
  Exemple: `{ "multiplier": 1.05, "roundToCents": 10, "dryRun": true }`.
- **`bulk-inventory-update`** — aplica deltes d'estoc en bloc amb motiu per
  cada moviment (genera registres a `StockMovement`).
- **`order-status-batch`** — transiciona múltiples comandes al mateix estat
  (`FULFILLED`, `SHIPPED` o `CANCELLED`) amb una nota comuna.

El panell té exemples pre-omplerts. El resultat mostra `affected`, duració,
`dryRun` si escau i errors per ítem. A la dreta, l'historial complet de les
últimes 50 execucions.

Afegir una comanda nova: crea un handler que estengui `BaseCommand` a
`apps/api/src/commands/handlers/`, exposa `name`, `schema` (Zod),
`requiredRole` i `execute()`, registra'l a `CommandRegistry` i afegeix el
nom a `CommandNameSchema` a `packages/shared/src/commands`. El frontend el
recollirà automàticament via `GET /admin/commands`.

### Rate limits i seguretat

- `/auth/login` → 5 peticions/minut/IP
- `/admin/commands/*` → 30 peticions/minut per admin
- Totes les mutacions admin passen per `AuditInterceptor` i queden
  registrades a `AuditLog` amb `ip`, `userAgent`, actor i diff quan aplica.
- Les cookies de sessió són `HttpOnly` + `Secure` en prod. El refresh token
  rota a cada ús i detecta reutilització (revoca tota la família).

---

# 🕯️ Espelmes — Botiga d'espelmes artesanes

Web completa per a la botiga d'espelmes fetes a mà de la mare. Monorepo
full-stack amb catàleg, configurador en temps real, autenticació, pagaments
Stripe i un panell d'administració amb un mòdul de _comandes_ estructurades.

> **Estat**: fases 1–10 completades. MVP funcional amb catàleg, configurador
> realtime (2D), checkout Stripe (test), admin complet, mòdul de comandes,
> proves unit (API + web) i docs. 3D live preview roadmap a
> [`docs/3d-roadmap.md`](docs/3d-roadmap.md).

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
docker compose -f infra/compose/docker-compose.yml up -d postgres redis
pnpm --filter @espelmes/api prisma migrate deploy   # primer cop
pnpm --filter @espelmes/api prisma db seed           # primer cop
pnpm dev                                             # web (3000) + api (4000)
```

- Web: http://localhost:3000
- API: http://localhost:4000
- Swagger: http://localhost:4000/docs

## Proves

```bash
# API — jest (unit)
pnpm --filter @espelmes/api test

# Web — vitest + React Testing Library (jsdom)
pnpm --filter @espelmes/web test
pnpm --filter @espelmes/web test:watch   # mode watch

# Typecheck global
pnpm -r typecheck
```

Cobertura mínima objectiu (no forçada a CI): **≥ 60%** a `auth`, `orders`,
`payments` i `commands`. La checklist manual viu a
[`QA-CHECKLIST.md`](QA-CHECKLIST.md) — passa-la sencera abans de cada
desplegament a producció.

## Desplegament

### Opció A — VPS propi amb docker-compose (recomanada per cost)

Provisiona un Hetzner CX22 (~€4.5/mes, Ubuntu 24.04) o equivalent:

```bash
# al servidor, com a root o usuari amb sudo
apt update && apt install -y docker.io docker-compose-plugin git
git clone https://github.com/<owner>/webEspelmes.git && cd webEspelmes
cp .env.example .env.production
$EDITOR .env.production   # omple DATABASE_URL, JWT_SECRET, STRIPE_*, ADMIN_*, DOMAIN

docker compose -f infra/compose/docker-compose.prod.yml up -d
docker compose -f infra/compose/docker-compose.prod.yml exec api \
  pnpm --filter @espelmes/api prisma migrate deploy
docker compose -f infra/compose/docker-compose.prod.yml exec api \
  pnpm --filter @espelmes/api prisma db seed
```

Caddy al compose gestiona TLS automàtic (Let's Encrypt) per al `DOMAIN`
indicat i fa reverse proxy a web (3000) i api (4000). Backups: `pg_dump`
diari a `/var/backups` + còpia fora del host (rsync a un bucket barat o
storage de Hetzner).

**Upgrade**: `git pull && docker compose -f infra/compose/docker-compose.prod.yml up -d --build`. Les migracions es fan manualment (veure sota) per no córrer-les en calent sense supervisió.

### Opció B — PaaS (Vercel + Railway/Neon)

Si no vols mantenir un VPS:

- **Web**: importa `apps/web` a Vercel. Configura `API_URL`, `NEXT_PUBLIC_*`.
- **API**: deploy de `apps/api` a Railway (o Fly.io). Munta Dockerfile de `infra/docker/api.Dockerfile`.
- **Postgres**: Neon (free tier) o Railway. Posa `DATABASE_URL` al servei de l'API.
- **Redis**: Upstash (free tier suficient al MVP).
- Cost aproximat: 0–5 €/mes fins que cal escalar.

El `docker-compose` queda només per a dev local en aquesta opció.

### Migracions en prod

Mai executis `prisma migrate dev` a producció — això reset-eja històric.
Sempre:

```bash
pnpm --filter @espelmes/api prisma migrate deploy
```

Backup just abans (`pg_dump -Fc -f backup-$(date +%F).dump`).

## Docs

- [`docs/architecture.md`](docs/architecture.md) — arquitectura viva, contractes i patrons
- [`docs/3d-roadmap.md`](docs/3d-roadmap.md) — full de ruta per passar el configurador a R3F
- [`QA-CHECKLIST.md`](QA-CHECKLIST.md) — checklist manual pre-deploy
