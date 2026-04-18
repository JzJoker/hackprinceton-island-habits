import { useContext, useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sky, Cloud, Clouds, Environment, ContactShadows, Float } from "@react-three/drei";
import * as THREE from "three";
import { useGame, GameCtx } from "../state";
import { Building3D } from "./Building3D";
import { Agent3D } from "./Agent3D";
import { SceneryRenderer, GrassTuft } from "./Scenery3D";
import { DistrictsRenderer } from "./Districts3D";
import { PlacementGhost } from "./PlacementGhost";

/* ── Animated ocean water with vertex wave displacement ─ */
const Water = () => {
  const ref = useRef<THREE.Mesh>(null);
  const ref2 = useRef<THREE.Mesh>(null);
  const originalPositions = useRef<Float32Array | null>(null);

  // Build wave geometry once
  const waveGeo = useMemo(() => {
    const geo = new THREE.CircleGeometry(40, 128);
    originalPositions.current = new Float32Array(geo.attributes.position.array);
    return geo;
  }, []);

  const waterMat = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: new THREE.Color("#3B8EBF"),
      transparent: true,
      opacity: 0.82,
      metalness: 0.4,
      roughness: 0.18,
      envMapIntensity: 1.3,
      flatShading: false,
    });
  }, []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    if (ref.current && originalPositions.current) {
      const pos = ref.current.geometry.attributes.position;
      const orig = originalPositions.current;
      for (let i = 0; i < pos.count; i++) {
        const x = orig[i * 3];
        const y = orig[i * 3 + 1];
        // Multi-octave wave
        const wave1 = Math.sin(x * 0.5 + t * 1.2) * 0.08;
        const wave2 = Math.cos(y * 0.4 + t * 0.9) * 0.06;
        const wave3 = Math.sin((x + y) * 0.3 + t * 1.5) * 0.04;
        pos.setZ(i, wave1 + wave2 + wave3);
      }
      pos.needsUpdate = true;
      ref.current.geometry.computeVertexNormals();
    }
    if (ref2.current) {
      ref2.current.rotation.z = t * 0.02;
    }
  });

  return (
    <group>
      {/* Deep ocean floor */}
      <mesh position={[0, -2.8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[45, 64]} />
        <meshStandardMaterial color="#152838" />
      </mesh>
      {/* Mid-depth water */}
      <mesh position={[0, -1.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[40, 64]} />
        <meshStandardMaterial color="#214860" transparent opacity={0.92} />
      </mesh>
      {/* Surface water — vertex-animated */}
      <mesh
        ref={ref}
        position={[0, -0.5, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        geometry={waveGeo}
      >
        <primitive object={waterMat} attach="material" />
      </mesh>
      {/* Caustic shimmer layer */}
      <mesh ref={ref2} position={[0, -0.48, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0, 22, 64, 4]} />
        <meshBasicMaterial color="#8BD4F0" transparent opacity={0.08} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
};

/* ── Scattered grass tufts ───────────────────────────── */
const GrassDecor = () => {
  const tufts = useMemo(
    () =>
      Array.from({ length: 45 }).map((_, i) => {
        const a = (i / 45) * Math.PI * 2 + Math.random() * 0.5;
        const r = 0.6 + Math.random() * 2.6;
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
  const count = 60;
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
        <bufferAttribute attach="attributes-position" array={positions} count={count} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.04} color="#F4E8A0" transparent opacity={0.6} sizeAttenuation />
    </points>
  );
};

/* ── Agent waypoints ─────────────────────────────────── */
const WAYPOINTS: [number, number][] = [
  [-2.0, -0.5],
  [1.8, 1.4],
  [-0.7, -2.0],
  [0, 0],
  [2.2, -1.7],
  [-1.5, 1.8],
  [1.0, -2.5],
  [-2.5, 1.0],
  [2.5, -0.2],
  [0.5, 2.5],
  [-1.2, -1.5],
  [0.8, 0.8],
];

/* ── Main scene ──────────────────────────────────────── */
const Scene = () => {
  const { agents, buildings, scenery, selectedAgent, setSelectedAgent, setScreen, placingType } = useGame();

  return (
    <>
      {/* Sky & atmosphere */}
      <Sky
        sunPosition={[10, 5, 4]}
        turbidity={1.8}
        rayleigh={0.8}
        mieCoefficient={0.003}
        mieDirectionalG={0.92}
      />
      <fog attach="fog" args={["#C8DFF0", 15, 35]} />
      <Environment preset="park" environmentIntensity={0.4} />

      {/* Lighting — warm key, cool fill, rim */}
      <ambientLight intensity={0.4} color="#E8DDD0" />
      <directionalLight
        position={[8, 12, 6]}
        intensity={1.6}
        color="#FFF5E0"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
        shadow-bias={-0.0003}
        shadow-normalBias={0.02}
      />
      <directionalLight position={[-5, 4, -6]} intensity={0.3} color="#8AB4D0" />
      <hemisphereLight args={["#A8D4F0", "#6B9848", 0.5]} />

      {/* Clouds — dreamy fluffy */}
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

      {/* Water */}
      <Water />

      {/* Contact shadows — soft ground shadows */}
      <ContactShadows
        position={[0, -0.17, 0]}
        opacity={0.35}
        scale={16}
        blur={2.5}
        far={6}
        color="#2A4020"
      />

      {/* World content */}
      <DistrictsRenderer />
      <GrassDecor />
      <SceneryRenderer scenery={scenery} />
      <Particles />

      {buildings.map((b) => (
        <Building3D key={b.id} building={b} />
      ))}

      {agents.map((a) => (
        <Agent3D
          key={a.id}
          agent={a}
          waypoints={WAYPOINTS}
          isSelected={selectedAgent === a.id}
          onClick={() => {
            if (placingType) return;
            setSelectedAgent(a.id);
            setScreen("chat");
          }}
        />
      ))}

      {placingType && <PlacementGhost />}
    </>
  );
};

/* ── Canvas wrapper ──────────────────────────────────── */
export const Island3D = () => {
  const game = useContext(GameCtx);
  return (
    <Canvas
      shadows
      camera={{ position: [11, 9, 11], fov: 42, near: 0.5, far: 70 }}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.15,
      }}
      dpr={[1, 1.5]}
    >
      <GameCtx.Provider value={game}>
        <Scene />
        <OrbitControls
          enablePan={false}
          minDistance={6}
          maxDistance={22}
          minPolarAngle={Math.PI / 6}
          maxPolarAngle={Math.PI / 2.3}
          target={[0, 0.5, 0]}
          autoRotate
          autoRotateSpeed={0.22}
          enableDamping
          dampingFactor={0.08}
        />
      </GameCtx.Provider>
    </Canvas>
  );
};
