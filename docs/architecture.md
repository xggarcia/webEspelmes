# Arquitectura — webEspelmes

Document viu de com està organitzada la plataforma. Referenciat al README; si
canvies l'estructura, actualitza aquest fitxer.

## Visió general

```
┌──────────────────────┐        HTTPS / WSS        ┌──────────────────────┐
│  Next.js 15 (web)    │ ────────────────────────▶ │  NestJS 10 (api)     │
│  App Router · RSC    │                            │  REST + WS Gateway  │
│  next-intl (ca/es)   │ ◀──── socket.io ─────────▶│  Prisma ORM          │
└──────────┬───────────┘                            └──────────┬───────────┘
           │                                                   │
           │ cookies HttpOnly (access/refresh JWT)             │
           │                                                   ▼
           │                                           ┌───────────────┐
           │                                           │ PostgreSQL 16 │
           │                                           └───────────────┘
           │                                                   │
           │                                           ┌───────────────┐
           └─────── Stripe Elements (checkout) ───────▶│ Stripe API    │
                                                        └───────────────┘
                                                        ┌───────────────┐
                                                        │   Redis 7     │
                                                        │ (rate-limit / │
                                                        │  ws adapter)  │
                                                        └───────────────┘
```

## Monorepo (pnpm workspaces + Turborepo)

```
apps/
  web/     Next.js storefront + admin UI
  api/     NestJS REST + WS gateway + Prisma
packages/
  shared/  Zod schemes, enums, DTO-safe tipus (client ↔ server)
  ui/      Tailwind tokens + primitius React
  config/  tsconfig base, tailwind preset, eslint compartit
infra/
  docker/  Dockerfiles + Caddyfile
  compose/ docker-compose (dev + prod)
docs/      arquitectura, 3D roadmap, notes
```

`packages/shared` és la font de veritat dels contractes. Mai s'ha de duplicar
un tipus de domini al web o a l'api — si cal, afegir-lo a `shared` i importar.

## Web (apps/web)

- **App Router** amb segment `[locale]` (`ca` per defecte, `es`).
- Tots els pages d'interès són **Server Components**: llegeixen dades via
  `lib/api-client.ts` (fetch tipat amb `credentials: 'include'`) i passen props
  a fills `'use client'` només on cal interactivitat.
- **Auth** es llegeix via `lib/auth.ts::getSession()`, que fa `GET /auth/me`
  amb la cookie d'accés — fallable i idempotent (no llença si falla).
- **Middleware** (`middleware.ts`) només fa locale routing; la protecció
  d'admin viu al `app/[locale]/admin/layout.tsx` (redirect servidor si no hi
  ha sessió admin). El motiu: middleware no pot fer crides autenticades
  fàcilment contra l'API, i ja cal re-validar al layout igualment.
- **Configurator** (`/personalitza/[slug]`): server page carrega producte i
  opcions, passa a `<ConfiguratorRoot>` (client) que obre un socket a
  `/configurator`, manté un estat local i re-rep `configurator:state` amb
  preu i validacions. El `<LivePreview2D>` renderitza sobre `<canvas>` pur,
  consumint el mateix `PreviewState` que consumirà el futur 3D (veure
  `docs/3d-roadmap.md`).
- **Admin UI** (`/admin/*`): layout servidor amb role-guard, components
  client per a formularis (ProductForm, OrderStatusControl, CommandRunner).

## API (apps/api)

Mòduls NestJS:

| Mòdul | Responsabilitat |
| --- | --- |
| `auth` | register/login/refresh/logout/forgot/reset · argon2id · JWT access (15m) + refresh (30d) rotatiu a cookie HttpOnly. |
| `users` | perfil, adreces. |
| `products` · `categories` | catàleg amb `ProductOption` + `ProductOptionValue` (deltes de preu, meta JSON). |
| `inventory` | `StockMovement` (append-only) + `Product.stock` denormalitzat. Transicions de comanda ajusten estoc en una sola tx. |
| `cart` | carret server-side (per `userId` o cookie anònima). |
| `configurator` | `ConfiguratorGateway` (socket.io, namespace `/configurator`) + `PricingEngine` (regles base + size/finish/color/label/accessories + quantitat). |
| `orders` | màquina d'estats `PENDING → PAID → FULFILLED → SHIPPED → DELIVERED` amb branques `CANCELLED` i `REFUNDED`. Les transicions permeses viuen a `@espelmes/shared::ALLOWED_TRANSITIONS`. |
| `payments` | Stripe PaymentIntents + webhook raw-body verificat (idempotent per `event.id`). |
| `commands` | mòdul descrit a sota — operacions d'admin estructurades. |
| `audit` | `AuditLog` (append-only). `AuditInterceptor` el poblen automàticament a les mutacions d'admin. |
| `admin` | dashboards, agregats, llistats per al backoffice (no reutilitza els CRUDs client-facing per evitar fuites de camps). |
| `mailer` | `MailerService` abstracte amb driver `console` (dev) i `resend` (prod, no configurat). |
| `health` | `/health` bàsic per a compose/caddy. |

**Patrons globals**

- `ZodValidationPipe` registrat globalment; els DTOs arriben ja tipats des de `@espelmes/shared`.
- `AllExceptionsFilter` normalitza respostes d'error a `{ code, message, details? }` i emet JSON estructurat amb pino.
- `RolesGuard` + `@Roles(Role.ADMIN)` a tots els endpoints `/admin/*` i `/commands/*`.
- `ThrottlerGuard` amb límits específics: `/auth/login` 5/min/IP, `/admin/commands/*` 30/min/admin.
- Swagger a `/docs`.

## Mòdul de comandes

Contracte de cada handler:

```ts
abstract class BaseCommand<Input, Output> {
  abstract name: CommandName;       // literal a @espelmes/shared
  abstract schema: ZodSchema<Input>;
  abstract requiredRole: Role;
  abstract execute(input: Input, ctx: CommandContext): Promise<CommandResult<Output>>;
}
```

`CommandRegistry.run(name, input, ctx)`:

1. Busca el handler al Map (`NotFoundException` si no existeix).
2. Valida rol (`ForbiddenException`).
3. `schema.parse(input)` → en error llença `BadRequestException` amb details.
4. Obre tx Prisma, executa `handler.execute`, mesura duració.
5. Escriu `CommandRun` (success/failure + errorCode + input hash + affected).
6. Emet `AuditLog` (`action: 'command.run'` o `'command.run.failed'`).
7. Retorna `{ success, affected, summary, errors?, dryRun }`.

Afegir comanda nova = handler a `handlers/`, registrar al `CommandsModule` com a provider, afegir el literal a `CommandNameSchema` a `packages/shared`. El frontend llista automàticament via `GET /admin/commands`.

## Fluxe realtime del configurador

```
Client                                 Server
──────                                 ──────
connect (cookie JWT)       ──────────▶ auth handshake
emit configurator:join     ──────────▶ carrega producte + opcions
                           ◀────────── emit configurator:state { preview, price, availability }
emit configurator:update   ──────────▶ valida patch contra options
                           ──────────▶ recalc PricingEngine
                           ──────────▶ stock check
                           ◀────────── emit configurator:state (només a aquella sessió)
POST /cart/items (REST)    ──────────▶ desa estat final a CartItem.customization
```

`PreviewState` (contracte estable) és el que consumirà el 3D el dia que es
faci el swap — veure `docs/3d-roadmap.md`.

## Seguretat

- **Passwords**: argon2id (m=64MB, t=3, p=4). Sense fallback a bcrypt (repo greenfield).
- **Tokens**: access 15 min (header via cookie `access_token`), refresh 30 dies (cookie `refresh_token`, HttpOnly + Secure + SameSite=Lax). Rotació a cada ús; reutilització detectada ⇒ revoca tota la família.
- **CSRF**: les cookies són SameSite=Lax; els endpoints mutables requereixen header `Content-Type: application/json` i el frontend passa per `credentials: 'include'` sempre amb el seu propi origen.
- **Helmet + CSP** estricta (default-src 'self', Stripe i cdn com a allowlist).
- **Stripe webhook**: raw-body + `Stripe-Signature` verificada; `event.id` únic a DB per idempotència.
- **Audit immutable**: `AuditLog` no té endpoints d'actualització/esborrat.

## Persistència (Prisma)

Entitats principals (veure `apps/api/prisma/schema.prisma` per la veritat):
`User`, `RefreshToken`, `PasswordResetToken`, `Address`, `Category`, `Product`,
`ProductImage`, `ProductOption`, `ProductOptionValue`, `Variant`,
`StockMovement`, `Cart`, `CartItem`, `Order`, `OrderItem`, `Payment`,
`ShippingZone`, `AuditLog`, `CommandRun`, `NewsletterSubscription`.

`CartItem.customization` i `OrderItem.customization` són `Json` i contenen
l'estat complet del configurador — així el 3D futur pot re-renderitzar
qualsevol comanda històrica sense migració.

## Proves

- **API (jest)**: unit tests a `src/**/*.spec.ts` (pricing engine, orders
  state machine, command registry, auth). E2E amb supertest previst a
  `test/` (scaffold pendent).
- **Web (vitest + RTL)**: `src/**/*.test.{ts,tsx}` amb `jsdom` i
  `@testing-library/jest-dom/vitest`. Alias `@espelmes/shared` a
  `packages/shared/src` perquè el codi compartit es provi sense build previ.

## Límits coneguts / deute

- 3D viewer real ajornat (veure roadmap).
- Enviaments: només tarifes planes per zona; sense integració Correos/SEUR.
- `MailerService` driver Resend cablejat però sense credencials — ara
  imprimeix a consola en dev.
- Sense cobertura mínima forçada a CI (objectiu ≥60% a auth/orders/payments/commands).
