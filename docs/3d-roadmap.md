# 3D Configurator Roadmap

The MVP ships with a 2D canvas preview (`LivePreview2D.tsx`). The state contract
(`ConfiguratorState` in `packages/shared`) is intentionally render-agnostic so a
real-time 3D viewer can replace `LivePreview3D.tsx` without touching controls,
socket events, pricing, or cart persistence.

## Target stack

- `three` + `@react-three/fiber` (R3F) + `@react-three/drei`
- `zustand` (optional) for viewer-local UI state (camera, hover)
- `meshoptimizer` server-side for validating admin-uploaded GLBs

## Scene composition

```
<Canvas shadows camera={{ position: [0, 0.5, 2.3], fov: 35 }}>
  <Environment preset="warehouse" />
  <PresentationControls global>
    <Stage intensity={0.4} shadows="contact">
      <PlatformMesh code={state.platform} />
      <CandleMesh
        shape={state.shape}
        size={state.sizeCode}
        color={state.color.hex}
        finish={state.finish}
      />
      <LabelDecal label={state.label} shape={state.shape} />
      <Accessories items={state.accessories} />
      <Flame />
    </Stage>
  </PresentationControls>
  <PerformanceMonitor onDecline={() => setDpr(1)} />
</Canvas>
```

## Shape library

Six base shapes match the 2D MVP:

| Code        | Source                         | Notes                                              |
| ----------- | ------------------------------ | -------------------------------------------------- |
| `pillar`    | `CylinderGeometry` (or GLB)    | Simple, bake wick as child `<group>`               |
| `taper`     | `LatheGeometry` with spline    | Spline points exposed to admin for fine-tuning    |
| `votive`    | `LatheGeometry`                | Shorter, wider mouth                               |
| `container` | GLB (glass vessel + wax)       | Double-material: glass (transmission) + wax body   |
| `heart`     | Custom GLB                     | Low-poly, decimated via meshoptimizer              |
| `sphere`    | `SphereGeometry`               | Slight vertical squash                             |

Admins can upload custom GLB per product. Validated server-side: size < 2MB,
vertices < 20k, materials stripped and rebuilt on the client so finish still
applies.

## Materials per finish

`MeshPhysicalMaterial` with these presets, all driven by `state.finish`:

```ts
const FINISHES = {
  matte:    { roughness: 0.95, clearcoat: 0,    sheen: 0.0, sheenRoughness: 1 },
  glossy:   { roughness: 0.15, clearcoat: 1,    sheen: 0.0, sheenRoughness: 0 },
  pearl:    { roughness: 0.35, clearcoat: 0.3,  sheen: 1.0, sheenColor: '#ffe7d6' },
  textured: { roughness: 0.85, clearcoat: 0,    normalMap: noiseNormal,            },
};
```

Color comes from `state.color.hex` → `material.color`. Switching finish is a
single property update — no rebuild, no re-mount.

## Wax translucency

For container / pillar candles in glossy or pearl finishes, enable
`transmission: 0.4` + `thickness: 0.6` + `attenuationColor = color`. Disable
automatically on devices without `WEBGL_compressed_texture_etc` (mobile
fallback).

## Label as decal

Render the user's text to an offscreen canvas, wrap in `CanvasTexture`, apply
via `@react-three/drei`'s `<Decal>` on the candle body. The projection surface
is shape-specific (centered cylinder wrap for pillar/taper/votive; front-face
projection for heart/sphere). Canvas is redrawn on every `state.label` change —
cheap and pixel-perfect.

## Accessories

Small items (dried flowers, ribbons, bees, stars) are `<Instances>` from drei.
User drags them onto the candle; we raycast against the UV-projected surface
and store `(u, v, rotation)` per instance in `state.accessories` metadata
(current contract is `string[]`; extend to `{code, u, v, rot}[]` when 3D ships).

## Performance

- `<Preload all />` warm textures on mount.
- `PerformanceMonitor` → auto-drop `dpr` to 1 below 30fps for 2s.
- Disable `transmission` on low-end.
- Fall back to `<LivePreview2D>` if `WebGLRenderingContext` missing or FPS
  stays < 20 for 4s.

## State contract (unchanged)

The 3D viewer consumes the exact same `ConfiguratorState` the 2D preview
consumes. Adding 3D does not change:

- `packages/shared/src/configurator.ts` schemas
- `apps/api/src/configurator/*` gateway, pricing engine
- `CartItem.customization` / `OrderItem.customization` JSON shape
- The controls (`ShapeSelect`, `SizeSelect`, `ColorPicker`, ...)

Only `LivePreview3D.tsx` is replaced.

## Migration plan

1. Install `three @react-three/fiber @react-three/drei` in `apps/web`.
2. Replace `LivePreview3D.tsx` with the R3F implementation above.
3. Add base GLBs under `apps/web/public/models/candles/`.
4. Ship behind a feature flag (`NEXT_PUBLIC_3D=1`) until perf is validated on
   mid-range Android.
5. Once stable, remove the 2D/3D toggle button — keep 2D only as fallback.
