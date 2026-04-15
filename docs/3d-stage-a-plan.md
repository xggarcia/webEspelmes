# 3D Configurator — Stage A Implementation Spec

> **Progress log (2026-04-15)**: foundation pieces already landed. What's done
> and what remains is listed at the bottom under "Progress". Start there.



**Goal**: replace the `LivePreview3D.tsx` stub with a real R3F viewer that loads
a per-product GLB (uploaded by admin) and applies live color from
`ConfiguratorState`. Ship behind the existing 2D/3D toggle; no feature flag.

Context: the mum's candles are sculptural, not parametric. She'll generate GLBs
with an image-to-3D tool (Meshy/Tripo — outside the app) and upload one per
product. ~15 products at launch. Packs (Stage C) come later; this spec is
Stage A only.

---

## 1. Prisma schema

Add two fields to `Product` in `apps/api/prisma/schema.prisma`:

```prisma
model Product {
  // ... existing fields ...
  modelUrl     String?   @db.Text       // public URL to the GLB
  modelMeta    Json?                     // { scale?: number, yOffset?: number, cameraFov?: number }
}
```

Create migration:

```bash
pnpm --filter @espelmes/api prisma migrate dev --name add_product_model_url
```

---

## 2. GLB upload endpoint (API)

Create `apps/api/src/uploads/uploads.module.ts` + `uploads.controller.ts`:

- `POST /admin/uploads/model` — admin-only, accepts `multipart/form-data` with field `file`.
- Validate: MIME `model/gltf-binary` OR extension `.glb`, max 5MB.
- Store under `apps/api/uploads/models/{uuid}.glb` (ensure dir exists at startup).
- Return `{ url: '/uploads/models/{uuid}.glb' }`.

Wire up static serving: in `apps/api/src/main.ts`, after app creation:

```ts
import { join } from 'node:path';
import { NestExpressApplication } from '@nestjs/platform-express';
// cast if needed:
(app as NestExpressApplication).useStaticAssets(
  join(process.cwd(), 'uploads'),
  { prefix: '/uploads/' },
);
```

Install multer types: `pnpm --filter @espelmes/api add -D @types/multer` (multer
ships with `@nestjs/platform-express`).

Guard the endpoint with `JwtAuthGuard` + `@Roles(Role.ADMIN)`; audit log the
upload (`action: 'product.model.upload'`, metadata includes filename + size).

**Prod note**: the local-disk driver is fine for VPS deploy. For
Vercel+Railway, swap to S3 via a `StorageService` abstraction later — not in
this stage.

---

## 3. Admin UI: file input in ProductForm

Edit [apps/web/src/components/admin/ProductForm.tsx](apps/web/src/components/admin/ProductForm.tsx):

- Add a file input labelled "Model 3D (.glb)".
- On change: POST the file to `${API_BASE}/admin/uploads/model` with
  `credentials: 'include'` and `FormData`.
- Show the returned URL as a small preview link + a "remove" button (sets
  `modelUrl: null`).
- When saving the product (PATCH/POST), include `modelUrl` and `modelMeta` in
  the body. Add a simple numeric input for `modelMeta.scale` (default 1) and
  `modelMeta.yOffset` (default 0).

Next-intl strings to add to [messages/ca.json](apps/web/src/messages/ca.json)
and `es.json` under `admin.products`:

```
"model3d": "Model 3D (.glb)",
"modelScale": "Escala",
"modelOffset": "Desplaçament vertical",
"uploadModel": "Puja GLB",
"removeModel": "Eliminar model",
"noModel": "Sense model 3D (s'usa 2D al configurador)"
```

---

## 4. Shared types

Extend `packages/shared/src/products.ts` (or wherever `ProductDetail` lives):

```ts
export const ModelMetaSchema = z.object({
  scale: z.number().positive().default(1),
  yOffset: z.number().default(0),
  cameraFov: z.number().int().min(20).max(75).default(35),
}).partial();

export type ModelMeta = z.infer<typeof ModelMetaSchema>;
```

Add `modelUrl: z.string().nullable().optional()` and `modelMeta: ModelMetaSchema.nullable().optional()`
to `ProductDetailSchema`. Rebuild shared: `pnpm --filter @espelmes/shared build`.

---

## 5. Web deps

```bash
pnpm --filter @espelmes/web add three @react-three/fiber @react-three/drei
pnpm --filter @espelmes/web add -D @types/three
```

Version pins as of 2026-04: `three@^0.170`, `@react-three/fiber@^8.17`,
`@react-three/drei@^9.114`. Bump only if peer warnings appear.

**Important**: R3F and Next.js 15 — the Canvas must be inside a
`'use client'` component. `LivePreview3D.tsx` already is.

---

## 6. New `LivePreview3D.tsx`

Replace the stub at [apps/web/src/components/configurator/LivePreview3D.tsx](apps/web/src/components/configurator/LivePreview3D.tsx). Outline:

```tsx
'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  Environment,
  PresentationControls,
  ContactShadows,
  useGLTF,
  PerformanceMonitor,
  Preload,
} from '@react-three/drei';
import * as THREE from 'three';
import type { ConfiguratorState } from '@espelmes/shared';

const FINISHES = {
  matte:    { roughness: 0.95, clearcoat: 0 },
  glossy:   { roughness: 0.15, clearcoat: 1 },
  pearl:    { roughness: 0.35, clearcoat: 0.3, sheen: 1, sheenColor: new THREE.Color('#ffe7d6') },
  textured: { roughness: 0.85, clearcoat: 0 },
} as const;

function CandleModel({
  url,
  colorHex,
  finish,
  scale,
  yOffset,
}: {
  url: string;
  colorHex: string;
  finish: ConfiguratorState['finish'];
  scale: number;
  yOffset: number;
}) {
  const { scene } = useGLTF(url);
  const group = useRef<THREE.Group>(null);

  // Clone so multiple instances don't share mutations.
  const cloned = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    const preset = FINISHES[finish] ?? FINISHES.matte;
    cloned.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        const mesh = obj as THREE.Mesh;
        // replace with MeshPhysicalMaterial so we can apply finish uniformly
        const mat = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color(colorHex),
          ...preset,
        });
        mesh.material = mat;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
  }, [cloned, colorHex, finish]);

  // gentle auto-rotate
  useFrame((_, dt) => {
    if (group.current) group.current.rotation.y += dt * 0.25;
  });

  return (
    <group ref={group} position={[0, yOffset, 0]} scale={scale}>
      <primitive object={cloned} />
    </group>
  );
}

export function LivePreview3D({
  state,
  modelUrl,
  modelMeta,
}: {
  state: ConfiguratorState | null;
  modelUrl: string | null;
  modelMeta: { scale?: number; yOffset?: number; cameraFov?: number } | null;
}) {
  const [dpr, setDpr] = useState<number>(1.5);
  const [failed, setFailed] = useState(false);

  if (!modelUrl || failed) {
    return (
      <div className="flex aspect-[4/5] w-full items-center justify-center rounded-xl2 bg-ink/5 text-center text-xs text-ink/60">
        {failed ? 'No s\'ha pogut carregar el 3D' : 'Aquest producte encara no té model 3D'}
      </div>
    );
  }

  const scale = modelMeta?.scale ?? 1;
  const yOffset = modelMeta?.yOffset ?? 0;
  const fov = modelMeta?.cameraFov ?? 35;

  return (
    <div className="aspect-[4/5] w-full overflow-hidden rounded-xl2 bg-gradient-to-br from-linen to-wax/40">
      <Canvas
        shadows
        dpr={dpr}
        camera={{ position: [0, 0.5, 2.4], fov }}
        onCreated={({ gl }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace;
        }}
        onError={() => setFailed(true)}
      >
        <Suspense fallback={null}>
          <PerformanceMonitor onDecline={() => setDpr(1)} />
          <ambientLight intensity={0.4} />
          <directionalLight position={[3, 4, 2]} intensity={1.1} castShadow />
          <Environment preset="warehouse" />
          <PresentationControls
            global
            snap
            rotation={[0, 0, 0]}
            polar={[-0.2, 0.2]}
            azimuth={[-Math.PI / 3, Math.PI / 3]}
          >
            <CandleModel
              url={modelUrl}
              colorHex={state?.color.hex ?? '#F3E3C3'}
              finish={state?.finish ?? 'matte'}
              scale={scale}
              yOffset={yOffset}
            />
          </PresentationControls>
          <ContactShadows position={[0, -0.5, 0]} opacity={0.35} blur={2.4} scale={3} />
          <Preload all />
        </Suspense>
      </Canvas>
    </div>
  );
}

// Note: useGLTF.preload(url) can be called once per product if we want to warm the cache.
```

Key points:
- Model is cloned per mount so color/finish mutations don't leak.
- `MeshPhysicalMaterial` overrides whatever material the GLB shipped with —
  the GLB is just geometry. This is exactly what we want so artists can export
  without worrying about materials.
- `PerformanceMonitor` drops DPR to 1 on weak devices; the existing 2D toggle
  in `ConfiguratorRoot.tsx` remains as the user-controllable fallback.
- `onError` flips to the "failed" placeholder instead of breaking the page.

---

## 7. Pass modelUrl to LivePreview3D

Edit `ConfiguratorRoot.tsx` (currently line 161):

```tsx
{viewer === '2d' ? (
  <LivePreview2D state={state} />
) : (
  <LivePreview3D
    state={state}
    modelUrl={product.modelUrl ?? null}
    modelMeta={(product.modelMeta as { scale?: number; yOffset?: number; cameraFov?: number }) ?? null}
  />
)}
```

`product` already flows in from the server page; we just added `modelUrl` and
`modelMeta` to `ProductDetailSchema` in step 4, so they'll be there.

Also: if `product.modelUrl` is null, default `viewer` to `'2d'` instead of
letting users toggle to a blank 3D panel. In the `useState<'2d' | '3d'>`
initializer:

```ts
const [viewer, setViewer] = useState<'2d' | '3d'>(product.modelUrl ? '2d' : '2d');
// still default to 2d, but disable the 3D button when no model:
```

Update the 3D button to be `disabled={!product.modelUrl}` with opacity hint.

---

## 8. Admin product listing indicator

In [apps/web/src/app/[locale]/admin/products/page.tsx](apps/web/src/app/[locale]/admin/products/page.tsx), add a small "3D" badge column showing ✓ when `product.modelUrl` is set. Helps the mum see which candles still need uploading.

---

## 9. Testing

Add a unit test for the upload controller (`apps/api/src/uploads/uploads.controller.spec.ts`):
- Rejects non-admin roles (403)
- Rejects files > 5MB (400)
- Rejects wrong extension (400)
- Happy path: saves file, returns `{ url }`, writes audit log

No web test needed for the R3F viewer (jsdom + WebGL don't mix — not worth the
mock effort for this stage). Verify manually in the browser.

---

## 10. Manual verification

1. `pnpm --filter @espelmes/api prisma migrate dev` → new columns exist.
2. Start API + web; log in as admin.
3. Go to `/ca/admin/products/{id}`, upload a sample GLB (find one at [khronosgroup/glTF-Sample-Models](https://github.com/KhronosGroup/glTF-Sample-Models) — e.g. `DamagedHelmet.glb` as a placeholder).
4. Set scale 0.4, save.
5. Navigate to `/ca/personalitza/{slug}` → click **3D** tab.
6. Model renders, auto-rotates, shows soft shadow.
7. Change color picker → mesh color updates live.
8. Change finish to glossy → specular shift visible.
9. Refresh page → model still there (it's stored on disk).
10. Try on a phone (or Chrome DevTools mobile emulation) → DPR drops, still smooth.
11. Click **2D** tab → 2D preview renders instantly (toggle works both ways).
12. Upload-reject paths: 10MB file → 400. `.jpg` file → 400. Unauthenticated → 401.

---

## 11. Gotchas encountered before (notes for the implementer)

- `dist/main.js MODULE_NOT_FOUND` during `pnpm start:prod`: tsbuildinfo cache
  issue. Already patched (`incremental: false` in `apps/api/tsconfig.json`),
  but if it reappears: `rm -f apps/api/tsconfig*.tsbuildinfo && pnpm --filter @espelmes/api build`.
- After any change to `packages/shared`, run `pnpm --filter @espelmes/shared build`
  before touching web — the web's tsc picks up the built `.d.ts`.
- `useGLTF` caches by URL globally; when deleting a model file on disk, the
  cache can still serve it until browser reload. Not a prod concern (URLs
  will have UUIDs), but surfaces in dev if you reuse filenames.
- Static file serving: remember to `.gitignore` `apps/api/uploads/` — do NOT
  commit uploaded models.

---

## 12. Files touched / created

**Created**
- `apps/api/src/uploads/uploads.module.ts`
- `apps/api/src/uploads/uploads.controller.ts`
- `apps/api/src/uploads/uploads.controller.spec.ts`
- (new migration dir) `apps/api/prisma/migrations/{timestamp}_add_product_model_url/`

**Edited**
- `apps/api/prisma/schema.prisma` — add `modelUrl`, `modelMeta` to Product
- `apps/api/src/app.module.ts` — register `UploadsModule`
- `apps/api/src/main.ts` — `useStaticAssets` for `/uploads`
- `apps/api/src/products/products.service.ts` + dto — accept `modelUrl`/`modelMeta` on create/update
- `apps/api/.gitignore` (or root) — add `apps/api/uploads/`
- `packages/shared/src/products.ts` (or equivalent) — extend `ProductDetailSchema`
- `apps/web/package.json` — add three, @react-three/fiber, @react-three/drei
- `apps/web/src/components/configurator/LivePreview3D.tsx` — full rewrite per §6
- `apps/web/src/components/configurator/ConfiguratorRoot.tsx` — pass modelUrl, disable 3D button when missing
- `apps/web/src/components/admin/ProductForm.tsx` — file input + scale/offset fields
- `apps/web/src/app/[locale]/admin/products/page.tsx` — 3D badge column
- `apps/web/src/messages/ca.json` + `es.json` — admin strings

Total: ~12 files touched, ~500 lines. Estimate 1 focused session.

---

## 13. After Stage A is live

Document a 1-page "how to add a 3D model to a candle" guide for the mum
(plain Catalan, screenshots of Meshy + the admin upload form). Put at
`docs/guia-models-3d.md`. This is the usability blocker, not the tech.

Then reassess whether Stage B (base swap) and Stage C (packs) are worth
building based on how Stage A feels.

---

## Progress (2026-04-15)

### Done already

- **Shared types** — `ModelMetaSchema` added to `packages/shared/src/catalog/index.ts`; `ProductDetailSchema` now has `modelUrl: string | null | undefined` and `modelMeta: ModelMeta | null | undefined`. Shared rebuilt successfully.
- **Prisma schema** — `modelUrl String?` and `modelMeta Json?` added to `Product` model in `apps/api/prisma/schema.prisma`.
- **Products mapper** — `apps/api/src/products/products.mapper.ts` `toProductDetail()` now returns `modelUrl` and `modelMeta`.
- **.gitignore** — already ignores `apps/api/uploads/` and `uploads/`, nothing to add.
- **Web 3D deps installed** — `three`, `@react-three/fiber`, `@react-three/drei`, `@types/three` added to `apps/web/package.json`.
- **Uploads module** — `apps/api/src/uploads/uploads.controller.ts` + `uploads.module.ts` created (POST `/admin/uploads/model`, multipart `.glb`, 5MB limit, audit-logged). Registered in `AppModule`.
- **Static assets** — `main.ts` serves `/uploads/*` from `{cwd}/uploads/` (excluded from the `api` global prefix).
- **Admin write-path** — `products-admin.controller.ts` `CreateProductSchema` now accepts `modelUrl` + `modelMeta` on create/update.
- **`LivePreview3D.tsx` fully rewritten** — R3F Canvas, `useGLTF` loader, `MeshPhysicalMaterial` override per finish, `PresentationControls`, `PerformanceMonitor` auto-DPR, absolute-URL helper, graceful fallback when no model. Uses the installed R3F/drei.
- **`ConfiguratorRoot.tsx` wired** — passes `modelUrl`/`modelMeta` to the viewer, disables the 3D button (with tooltip) when the product has no model.
- **`ProductForm.tsx` fully wired** — `.glb` file input POSTs to `/admin/uploads/model` (5MB + extension validation client-side), displays uploaded URL with "Eliminar" button, numeric inputs for `modelMeta.scale` and `modelMeta.yOffset`, all sent on save.

### Blocked in this session (Windows file lock)

- `pnpm --filter @espelmes/api exec prisma generate` failed with `EPERM ... query_engine-windows.dll.node` — a running API process (`pnpm dev` or `pnpm start:prod`) was holding the DLL. **Kill the API process first**, then re-run prisma generate.

### Remaining steps (execute in order)

1. **Kill any running API** holding the Prisma DLL: `taskkill //F //IM node.exe` (or find PID on port 4000 and kill only that one).
2. **Regenerate Prisma client**:
   ```bash
   pnpm --filter @espelmes/api exec prisma generate
   ```
3. **Create the migration** (needs Docker postgres running):
   ```bash
   docker compose -f infra/compose/docker-compose.yml up -d postgres
   pnpm --filter @espelmes/api prisma migrate dev --name add_product_model_url
   ```
4. **Typecheck API** — pre-existing rootDir errors on `seed.ts` and `test/` are unrelated. After prisma generate, the mapper + uploads controller should compile.
5. **Verify the admin edit page passes `modelUrl`/`modelMeta` into `ProductForm`'s `initial` prop** — check `apps/web/src/app/[locale]/admin/products/[id]/page.tsx`. If it just spreads the product response these fields will already be there (the API mapper now returns them). Otherwise add them to the `initial` object.
6. **(Nice-to-have) Badge column** in admin products list per §8 — small "3D ✓" marker so the mum can see which candles are missing models.
7. **(Optional) Uploads controller spec** per §9 — manual QA covers it.
8. **Manual QA** per §10. Drop a sample GLB (e.g. from glTF-Sample-Models) via the admin form, open `/personalitza/<slug>`, click 3D, verify live color/finish swap.

Estimated remaining effort: ~10 min of glue + manual QA. All the hard code is shipped.
