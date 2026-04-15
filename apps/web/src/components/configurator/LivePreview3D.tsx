'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import {
  ContactShadows,
  Environment,
  PerformanceMonitor,
  Preload,
  PresentationControls,
  useGLTF,
} from '@react-three/drei';
import * as THREE from 'three';
import type { ConfiguratorState } from '@espelmes/shared';
type FinishPreset = Partial<THREE.MeshPhysicalMaterialParameters>;
import { API_BASE } from '@/lib/api';

type ModelMeta = {
  scale?: number;
  yOffset?: number;
  cameraFov?: number;
} | null;

const FINISH_PRESETS: Record<string, FinishPreset> = {
  matte:    { roughness: 0.95, clearcoat: 0 },
  mat:      { roughness: 0.95, clearcoat: 0 },
  glossy:   { roughness: 0.15, clearcoat: 1, clearcoatRoughness: 0.05 },
  brillant: { roughness: 0.15, clearcoat: 1, clearcoatRoughness: 0.05 },
  pearl:    { roughness: 0.35, clearcoat: 0.3, sheen: 1, sheenColor: new THREE.Color('#ffe7d6') },
  perla:    { roughness: 0.35, clearcoat: 0.3, sheen: 1, sheenColor: new THREE.Color('#ffe7d6') },
  textured: { roughness: 0.85, clearcoat: 0 },
  rugos:    { roughness: 0.85, clearcoat: 0 },
};
const DEFAULT_FINISH: FinishPreset = { roughness: 0.95, clearcoat: 0 }; // fallback = matte

function absoluteModelUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  const origin = API_BASE.replace(/\/api\/?$/, '');
  return `${origin}${path.startsWith('/') ? '' : '/'}${path}`;
}

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
  const cloned = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    cloned.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh) {
        const preset = FINISH_PRESETS[finish] ?? DEFAULT_FINISH;
        mesh.material = new THREE.MeshPhysicalMaterial({
          color: new THREE.Color(colorHex),
          ...preset,
        });
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
  }, [cloned, colorHex, finish]);

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
  onFail,
}: {
  state: ConfiguratorState | null;
  modelUrl?: string | null;
  modelMeta?: ModelMeta;
  onFail?: () => void;
}) {
  const [dpr, setDpr] = useState(1.5);

  if (!modelUrl) return null;

  const scale = modelMeta?.scale ?? 1;
  const yOffset = modelMeta?.yOffset ?? 0;
  const fov = modelMeta?.cameraFov ?? 35;
  const url = absoluteModelUrl(modelUrl);

  return (
    <div className="aspect-[4/5] w-full overflow-hidden rounded-xl2 bg-gradient-to-br from-linen to-wax/40 shadow-warm">
      <Canvas
        shadows
        dpr={dpr}
        camera={{ position: [0, 0.5, 2.4], fov }}
        onCreated={({ gl }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace;
        }}
        onError={() => onFail?.()}
      >
        <Suspense fallback={null}>
          <PerformanceMonitor onDecline={() => setDpr(1)} />
          <ambientLight intensity={0.4} />
          <directionalLight position={[3, 4, 2]} intensity={1.1} castShadow />
          <Environment preset="warehouse" />
          <PresentationControls
            global
            snap
            polar={[-0.2, 0.2]}
            azimuth={[-Math.PI / 3, Math.PI / 3]}
          >
            <CandleModel
              url={url}
              colorHex={state?.color.hex ?? '#F3E3C3'}
              finish={state?.finish ?? 'matte'}
              scale={scale}
              yOffset={yOffset}
            />
          </PresentationControls>
          <ContactShadows
            position={[0, -0.5, 0]}
            opacity={0.35}
            blur={2.4}
            scale={3}
          />
          <Preload all />
        </Suspense>
      </Canvas>
    </div>
  );
}
