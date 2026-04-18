import { useContext, useRef, useMemo, RefObject } from "react";
import type React from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sky, Cloud, Clouds, Environment, Float } from "@react-three/drei";
import * as THREE from "three";
import { useGame, GameCtx, ISLAND_TIERS } from "../state";
import { Building3D } from "./Building3D";
import { Agent3D } from "./Agent3D";
import { SceneryRenderer, GrassTuft } from "./Scenery3D";
import { DistrictsRenderer } from "./Districts3D";
import { PlacementGhost } from "./PlacementGhost";

/* ── Animated ocean water with realistic multi-layer waves ─ */
const Water = ({ color }: { color: string }) => {
  const surfRef   = useRef<THREE.Mesh>(null);
  const caust1Ref = useRef<THREE.Mesh>(null);
  const caust2Ref = useRef<THREE.Mesh>(null);
  const foam0 = useRef<THREE.Mesh>(null);
  const foam1 = useRef<THREE.Mesh>(null);
  const foam2 = useRef<THREE.Mesh>(null);
  const originalPositions = useRef<Float32Array | null>(null);
  const waveFrame = useRef(0);

  const waveGeo = useMemo(() => {
    const geo = new THREE.CircleGeometry(40, 72);
    originalPositions.current = new Float32Array(geo.attributes.position.array);
    return geo;
  }, []);

  const waterMat = useMemo(() => new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    transparent: true,
    opacity: 0.86,
    metalness: 0.55,
    roughness: 0.08,
    envMapIntensity: 1.7,
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [color]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    waveFrame.current++;

    if (waveFrame.current % 2 === 0 && surfRef.current && originalPositions.current) {
      const pos  = surfRef.current.geometry.attributes.position;
      const orig = originalPositions.current;
      for (let i = 0; i < pos.count; i++) {
        const x = orig[i * 3];
        const y = orig[i * 3 + 1];
        const dist = Math.sqrt(x * x + y * y);
        const env = Math.min(1, Math.max(0, (dist - 3) / 7)) * Math.max(0, 1 - dist / 34);
        if (env <= 0) { pos.setZ(i, 0); continue; }
        const w1 = Math.sin(x * 0.28  + t * 0.82)        * 0.14;
        const w2 = Math.cos(y * 0.33  - t * 0.68)        * 0.10;
        const w3 = Math.sin((x + y)   * 0.55 + t * 1.55) * 0.045;
        const w4 = Math.cos((x - y)   * 0.72 - t * 2.15) * 0.022;
        pos.setZ(i, (w1 + w2 + w3 + w4) * env);
      }
      pos.needsUpdate = true;
      if (waveFrame.current % 4 === 0) surfRef.current.geometry.computeVertexNormals();
    }

    if (caust1Ref.current) caust1Ref.current.rotation.z =  t * 0.018;
    if (caust2Ref.current) caust2Ref.current.rotation.z = -t * 0.025;

    const foams = [foam0, foam1, foam2];
    foams.forEach((ref, i) => {
      if (!ref.current) return;
      const ph = t * 0.65 + (i * Math.PI * 2) / 3;
      const sc = 1 + Math.sin(ph) * 0.038;
      ref.current.scale.set(sc, sc, 1);
      (ref.current.material as THREE.MeshBasicMaterial).opacity =
        0.12 + Math.sin(ph + 1.1) * 0.07;
    });
  });

  return (
    <group>
      <mesh position={[0, -2.8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[80, 32]} />
        <meshStandardMaterial color="#0b1d2e" />
      </mesh>
      <mesh position={[0, -1.9, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[70, 40]} />
        <meshStandardMaterial color="#173450" transparent opacity={0.92} />
      </mesh>
      <mesh position={[0, -1.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[55, 48]} />
        <meshStandardMaterial color="#1e4d6e" transparent opacity={0.78} />
      </mesh>
      <mesh ref={surfRef} position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow geometry={waveGeo} scale={[1.9, 1.9, 1]}>
        <primitive object={waterMat} attach="material" />
      </mesh>
      <mesh ref={caust1Ref} position={[0, -0.47, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0, 24, 6, 4]} />
        <meshBasicMaterial color="#7dd4fc" transparent opacity={0.07}
          blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh ref={caust2Ref} position={[0, -0.46, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3, 20, 5, 3]} />
        <meshBasicMaterial color="#bae6fd" transparent opacity={0.05}
          blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh ref={foam0} position={[0, -0.43, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[6.0, 6.65, 80]} />
        <meshBasicMaterial color="#e0f7ff" transparent opacity={0.15} depthWrite={false} />
      </mesh>
      <mesh ref={foam1} position={[0, -0.42, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[6.35, 6.9, 80]} />
        <meshBasicMaterial color="#f0faff" transparent opacity={0.12} depthWrite={false} />
      </mesh>
      <mesh ref={foam2} position={[0, -0.41, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[5.6, 6.2, 80]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.09} depthWrite={false} />
      </mesh>
      <mesh position={[0, -0.52, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[26, 42, 64, 1]} />
        <meshBasicMaterial color={color} transparent opacity={0.14}
          blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  );
};

/* ── Scattered grass tufts ───────────────────────────── */
const GrassDecor = () => {
  const tufts = useMemo(
    () =>
      Array.from({ length: 40 }).map((_, i) => {
        const a = (i / 80) * Math.PI * 2 + Math.random() * 0.5;
        const r = 0.6 + Math.random() * 5.5;
        return [Math.cos(a) * r, Math.sin(a) * r] as [number, number];
      }),
    [],
  );
  return (
    <>
      {tufts.map((p, i) => (
        <GrassTuft key={i} pos={p} />
      ))}
    </>
  );
};

/* ── Ambient particles / fireflies ───────────────────── */
const Particles = () => {
  const ref = useRef<THREE.Points>(null);
  const count = 25;
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 12;
      arr[i * 3 + 1] = 0.5 + Math.random() * 3;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }
    return arr;
  }, []);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const geo = ref.current.geometry;
    const pos = geo.attributes.position.array as Float32Array;
    const t = clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      pos[i * 3 + 1] += Math.sin(t * 0.5 + i) * 0.002;
      if (pos[i * 3 + 1] > 4) pos[i * 3 + 1] = 0.5;
    }
    geo.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.04} color="#F4E8A0" transparent opacity={0.6} sizeAttenuation />
    </points>
  );
};

/* ── Real-time build ticker ──────────────────────────── */
const BuildTicker = () => {
  const { tickBuildings, viewingEra } = useGame();
  const flushTimer = useRef(0);
  const accumulated = useRef(0);
  useFrame((_s, delta) => {
    if (viewingEra !== null) return;
    accumulated.current += delta;
    flushTimer.current += delta;
    if (flushTimer.current >= 2.0) {
      tickBuildings(accumulated.current);
      accumulated.current = 0;
      flushTimer.current = 0;
    }
  });
  return null;
};

/* ── Camera tracker — smoothly follows the you-agent ─── */
const CameraTracker = ({
  tracking,
  agentPos,
  controlsRef,
}: {
  tracking: boolean;
  agentPos: React.MutableRefObject<THREE.Vector3>;
  controlsRef: React.MutableRefObject<any>; // eslint-disable-line @typescript-eslint/no-explicit-any
}) => {
  useFrame(() => {
    if (!tracking || !controlsRef.current) return;
    const target = new THREE.Vector3(agentPos.current.x, 0.5, agentPos.current.z);
    controlsRef.current.target.lerp(target, 0.06);
    controlsRef.current.update();
  });
  return null;
};

/* ── Distance-based blur — applied to canvas wrapper div ─ */
const ZoomBlur = ({ containerRef }: { containerRef: RefObject<HTMLDivElement> }) => {
  useFrame(({ camera }) => {
    if (!containerRef.current) return;
    const dist = camera.position.length();
    const blur = Math.max(0, Math.min(5, ((dist - 24) / 26) * 5));
    containerRef.current.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : "";
  });
  return null;
};

/* ── Agent waypoints ─────────────────────────────────── */
const WAYPOINTS: [number, number][] = [
  [-2.5,  1.2], [ 2.0, -1.0], [ 1.0,  3.0], [-3.5, -2.5], [ 4.0, -1.5],
  [ 0.0, -2.5], [-1.0, -1.5], [ 5.0,  1.5], [-5.0,  0.5], [ 3.0,  4.0],
  [-3.0,  3.5], [ 1.0, -4.5], [-4.5,  1.5], [ 4.5, -3.5], [ 0.0,  5.0],
];

/* ── Main scene ──────────────────────────────────────── */
const Scene = ({ agentTrackPos }: { agentTrackPos: React.MutableRefObject<THREE.Vector3> }) => {
  const { agents, buildings, scenery, selectedAgent, setSelectedAgent, placingType, islandEra, viewingEra, islandHistory } = useGame();
  const displayEra = viewingEra ?? islandEra;
  const tier = ISLAND_TIERS[displayEra];
  const displayBuildings = viewingEra !== null
    ? (islandHistory[viewingEra]?.buildings ?? [])
    : buildings;

  return (
    <>
      <Sky
        sunPosition={tier.sunPos}
        turbidity={tier.skyTurbidity}
        rayleigh={tier.skyRayleigh}
        mieCoefficient={0.003}
        mieDirectionalG={0.92}
      />
      <fog attach="fog" args={[tier.fogColor, 28, 70]} />
      <Environment preset="park" environmentIntensity={0.4} />

      <ambientLight intensity={0.4} color="#E8DDD0" />
      <directionalLight
        position={[8, 12, 6]}
        intensity={1.6}
        color="#FFF5E0"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
        shadow-bias={-0.0003}
        shadow-normalBias={0.02}
      />
      <directionalLight position={[-5, 4, -6]} intensity={0.3} color="#8AB4D0" />
      <hemisphereLight args={["#A8D4F0", "#6B9848", 0.5]} />

      <Clouds material={THREE.MeshBasicMaterial}>
        <Float speed={0.4} rotationIntensity={0.1} floatIntensity={0.3}>
          <Cloud segments={28} bounds={[4, 1.5, 2]} volume={3} color="#ffffff" position={[-6, 5.5, -4]} opacity={0.55} />
        </Float>
        <Float speed={0.3} rotationIntensity={0.05} floatIntensity={0.4}>
          <Cloud segments={22} bounds={[3, 1, 1.5]} volume={2} color="#ffffff" position={[7, 6, 3]} opacity={0.45} />
        </Float>
        <Float speed={0.35} rotationIntensity={0.08} floatIntensity={0.35}>
          <Cloud segments={20} bounds={[3.5, 1.2, 1.5]} volume={2.5} color="#ffffff" position={[0, 6.5, -7]} opacity={0.5} />
        </Float>
        <Float speed={0.25} rotationIntensity={0.06} floatIntensity={0.2}>
          <Cloud segments={16} bounds={[2, 0.8, 1]} volume={1.5} color="#ffffff" position={[-8, 7, 5]} opacity={0.4} />
        </Float>
      </Clouds>

      <Water color={tier.waterColor} />

      <DistrictsRenderer />
      <GrassDecor />
      <SceneryRenderer scenery={scenery} />
      <Particles />

      {displayBuildings.map((b) => (
        <Building3D key={b.id} building={b} />
      ))}

      {viewingEra === null && agents.map((a) => (
        <Agent3D
          key={a.id}
          agent={a}
          waypoints={WAYPOINTS}
          buildings={buildings}
          scenery={scenery}
          islandRadius={ISLAND_TIERS[islandEra].radius}
          isSelected={selectedAgent === a.id}
          onClick={() => {
            if (placingType) return;
            setSelectedAgent(a.id);
          }}
          onPositionUpdate={a.isYou ? (p) => agentTrackPos.current.copy(p) : undefined}
        />
      ))}

      {placingType && <PlacementGhost />}
      <BuildTicker />
    </>
  );
};

/* ── Canvas wrapper ──────────────────────────────────── */
export const Island3D = () => {
  const game = useContext(GameCtx);
  const isPlacing = !!game?.placingType;
  const trackAgent = game?.trackAgent ?? false;
  const agentTrackPos = useRef(new THREE.Vector3());
  const controlsRef = useRef<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const canvasWrapRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={canvasWrapRef} style={{ width: "100%", height: "100%", willChange: "filter" }}>
      <Canvas
        shadows
        camera={{ position: [16, 13, 16], fov: 45, near: 0.5, far: 120 }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.15,
        }}
        dpr={[1, 1.5]}
        style={{ width: "100%", height: "100%" }}
      >
        <GameCtx.Provider value={game}>
          <Scene agentTrackPos={agentTrackPos} />
          <CameraTracker tracking={trackAgent} agentPos={agentTrackPos} controlsRef={controlsRef} />
          <ZoomBlur containerRef={canvasWrapRef} />
          <OrbitControls
            ref={controlsRef}
            enablePan={false}
            minDistance={4}
            maxDistance={55}
            minPolarAngle={Math.PI / 6}
            maxPolarAngle={Math.PI / 2.3}
            target={[0, 0.5, 0]}
            autoRotate={!isPlacing && !trackAgent}
            autoRotateSpeed={0.22}
            enableDamping
            dampingFactor={0.05}
            zoomSpeed={2.2}
          />
        </GameCtx.Provider>
      </Canvas>
    </div>
  );
};
