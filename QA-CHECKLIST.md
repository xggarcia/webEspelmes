# QA Checklist — webEspelmes

Llista de comprovació manual abans de cada desplegament a producció.
Marca amb `[x]` quan passi. Si alguna cosa falla, anota-ho a la secció
"Incidències" al final.

## 0. Pre-vol

- [ ] `pnpm install` sense errors
- [ ] `docker compose -f infra/compose/docker-compose.yml up -d postgres redis` → els dos sans (`docker ps` mostra healthy)
- [ ] `.env` té totes les vars de `.env.example`
- [ ] Proves automàtiques verdes:
  - [ ] `pnpm --filter @espelmes/api test`
  - [ ] `pnpm --filter @espelmes/web test`
  - [ ] `pnpm --filter @espelmes/web typecheck`
  - [ ] `pnpm --filter @espelmes/api typecheck`

## 1. Autenticació

- [ ] Registre amb email nou → crea usuari `CUSTOMER`, posa cookies, redirigeix a `/compte`.
- [ ] Registre amb email existent → error clar, no es duplica.
- [ ] Login OK amb credencials correctes → sessió activa, enllaç "Admin" **no** apareix al header.
- [ ] Login KO amb password incorrecta → missatge genèric (no revela si l'email existeix).
- [ ] Login > 5 intents/minut → `429 Too Many Requests`.
- [ ] Logout → cookies buidades, `/compte` redirigeix a login.
- [ ] Forgot password → genera token i el mostra al `MailerService` (consola en dev).
- [ ] Reset password amb token vàlid → password canviada, tokens antics revocats.
- [ ] Refresh token rotatiu: esperar > 15 min, una crida autenticada renova l'access sense re-login.
- [ ] Reutilització d'un refresh token ja gastat → revoca la família; cal tornar a fer login.

## 2. Catàleg i navegació

- [ ] `/ca` carrega hero + productes destacats; `/es` canvia copys.
- [ ] Selector d'idioma navega a la mateixa URL traduïda.
- [ ] `/ca/botiga` mostra llista amb filtres (categoria, preu) i paginació.
- [ ] `/ca/botiga/[slug]` mostra detall amb imatges i botó **Personalitza** si `isCustomizable`.
- [ ] 404 si el slug no existeix.

## 3. Configurador en temps real

- [ ] `/ca/personalitza/espelma-personalitzable` carrega, socket connecta (pestanya DevTools → Network → WS → 101).
- [ ] Canviar mida → preu s'actualitza **sense recàrrega** (<200ms).
- [ ] Canviar color → canvas redibuixa amb el nou color.
- [ ] Afegir etiqueta amb text → delta sumat només si text no és buit/whitespace.
- [ ] Afegir 2 accessoris → ambdós deltes al desglossament.
- [ ] Canviar quantitat → `unitCents` estable, `totalCents` = unit × quantitat.
- [ ] Stock insuficient → warning visible, "Afegir al cistell" desactivat.
- [ ] "Afegir al cistell" desa la personalització completa (refresca carret, el veuràs al detall).

## 4. Cistell + checkout

- [ ] `/ca/cistell` llista ítems amb personalització llegible.
- [ ] Canviar quantitat → total recalculat.
- [ ] Eliminar ítem → desapareix.
- [ ] `/ca/checkout` amb adreça nova → desa, mostra Stripe Elements.
- [ ] Pagament amb targeta test `4242 4242 4242 4242` → redirecció a `/checkout/exit?status=success`.
- [ ] Pagament declinat `4000 0000 0000 0002` → missatge clar, cap comanda creada com a PAID.
- [ ] Webhook Stripe (`stripe listen --forward-to localhost:4000/payments/webhook`) rep `payment_intent.succeeded` → ordre passa a `PAID`, estoc decrementat a `StockMovement`.
- [ ] Reenviament del mateix event (mateix `event.id`) → no duplica la transició (idempotent).

## 5. Compte personal

- [ ] `/ca/compte` llista comandes pròpies, no les d'altres usuaris.
- [ ] Detall de comanda mostra estat actual, articles i personalització.
- [ ] Editar perfil (nom) → desat OK.
- [ ] Afegir/editar/esborrar adreça → OK.

## 6. Admin

- [ ] Login com a admin → apareix "Admin" al header.
- [ ] Accés a `/ca/admin` com a `CUSTOMER` → redirigit a `/ca`.
- [ ] Accés sense sessió → redirigit a `/ca/auth/login`.
- [ ] **Dashboard**: KPIs coincideixen amb consultes directes a BD.
- [ ] **Productes**:
  - [ ] Crear producte → apareix a la llista.
  - [ ] Editar preu → desat, visible al públic.
  - [ ] Desactivar → desapareix del catàleg però es manté a comandes existents.
- [ ] **Comandes**:
  - [ ] Transicions vàlides (PAID → FULFILLED) funcionen.
  - [ ] Transicions invàlides (PAID → PENDING) no es mostren al selector.
  - [ ] `REFUNDED` restaura estoc (`StockMovement` amb type `REFUND`).
- [ ] **Clients**: llista paginada, sense fuites d'admins.
- [ ] **Ordres (commands)**:
  - [ ] `recalculate-pricing` amb `dryRun: true` → mostra afectats sense tocar BD.
  - [ ] `recalculate-pricing` amb `dryRun: false` → preus canvien realment.
  - [ ] Comanda amb input invàlid → 400 amb details de Zod, no crea `CommandRun`.
  - [ ] Historial actualitzat després de cada execució.
- [ ] **Auditoria**:
  - [ ] Cada mutació admin genera entrada amb actor, IP i metadades.
  - [ ] Filtre per `action` funciona.
- [ ] Rate limit a `/admin/commands/*` (> 30 req/min) → 429.

## 7. Seguretat

- [ ] Headers d'https en prod inclouen `Strict-Transport-Security`, CSP restrictiva (via helmet).
- [ ] Cookies `access_token`/`refresh_token` són `HttpOnly; Secure; SameSite=Lax` en prod.
- [ ] CORS només permet origins de la allowlist.
- [ ] `/docs` (Swagger) no exposat en prod o protegit per basic auth.
- [ ] Admins NO reben tokens amb scopes ampliats (el mateix JWT, RBAC és server-side).

## 8. i18n

- [ ] Cada string visible està a `messages/ca.json` i `messages/es.json`.
- [ ] No hi ha claus `missing` a consola.
- [ ] Format de moneda: `26,40 €` (ca-ES/es-ES).
- [ ] Dates en format local (`DD/MM/YYYY`).

## 9. Rendiment bàsic

- [ ] Home `/ca` LCP < 2.5s en 4G simulat (Chrome DevTools).
- [ ] Catàleg `/ca/botiga` CLS < 0.1.
- [ ] Configurador: canvi d'opció → pintat < 100ms.
- [ ] API p95 < 200ms a endpoints `GET /products` i `GET /products/:slug` (amb DB local).

## 10. Recuperació i backup (prod)

- [ ] Backup diari de Postgres configurat (`pg_dump` cron + fora del host).
- [ ] Test de restore a staging recent (< 30 dies).
- [ ] Stripe dashboard en test mode ≠ live mode (comprova `STRIPE_SECRET_KEY` comença per `sk_live_` només en prod real).

## Incidències detectades

| Data | Entorn | Àrea | Descripció | Resolució |
| --- | --- | --- | --- | --- |
| | | | | |
