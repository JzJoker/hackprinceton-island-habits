import { useContext, useRef, useMemo, useState, useCallback } from "react";
import type { MutableRefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, Float } from "@react-three/drei";
import { EffectComposer, Pixelation, Vignette } from "@react-three/postprocessing";
import * as THREE from "three";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { useGame, GameCtx, ISLAND_TIERS } from "../state";
import type { Agent } from "../state";
import { Building3D } from "./Building3D";
import { Agent3D } from "./Agent3D";
import { SceneryRenderer, GrassTuft } from "./Scenery3D";
import { DistrictsRenderer } from "./Districts3D";
import { PlacementGhost } from "./PlacementGhost";

/* ── Gradient skydome (A Short Hike-inspired palette) ─ */
const SkyDome = () => {
  const domeRef = useRef<THREE.Mesh>(null);
  const uniforms = useMemo(
    () => ({
      topColor: { value: new THREE.Color("#beddff") },
      middleColor: { value: new THREE.Color("#ffd8b7") },
      horizonColor: { value: new THREE.Color("#ffae93") },
      glowColor: { value: new THREE.Color("#fff0d8") },
    }),
    [],
  );

  useFrame(({ camera }) => {
    if (!domeRef.current) return;
    domeRef.current.position.copy(camera.position);
  });

  return (
    <mesh ref={domeRef} frustumCulled={false}>
      <sphereGeometry args={[90, 48, 24]} />
      <shaderMaterial
        side={THREE.BackSide}
        depthWrite={false}
        uniforms={uniforms}
        vertexShader={`
          varying float vH;
          void main() {
            vec3 dir = normalize(position);
            vH = clamp(dir.y * 0.5 + 0.5, 0.0, 1.0);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform vec3 topColor;
          uniform vec3 middleColor;
          uniform vec3 horizonColor;
          uniform vec3 glowColor;
          varying float vH;
          void main() {
            float h = vH;
            vec3 low = mix(horizonColor, middleColor, smoothstep(0.02, 0.36, h));
            vec3 high = mix(middleColor, topColor, smoothstep(0.30, 1.0, h));
            vec3 color = mix(low, high, smoothstep(0.12, 0.90, h));
            float horizonGlow = smoothstep(0.34, 0.53, h) * (1.0 - smoothstep(0.60, 0.80, h));
            color += glowColor * horizonGlow * 0.28;
            gl_FragColor = vec4(color, 1.0);
          }
        `}
      />
    </mesh>
  );
};

type CloudBlob = {
  position: [number, number, number];
  scale: [number, number, number];
  rot: number;
};

const ROUNDED_CLOUD_BLOBS: CloudBlob[] = [
  { position: [-1.7, 0.0, 0.06], scale: [1.5, 1.02, 1.16], rot: 0.12 },
  { position: [-0.65, 0.26, -0.05], scale: [1.44, 1.08, 1.2], rot: 0.28 },
  { position: [0.45, 0.14, 0.02], scale: [1.56, 1.02, 1.24], rot: -0.18 },
  { position: [1.58, -0.08, 0.06], scale: [1.3, 0.94, 1.08], rot: 0.22 },
  { position: [0.22, -0.42, 0.04], scale: [1.38, 0.8, 1.18], rot: 0.08 },
];

const RoundedCloud = ({
  position,
  scale = 1,
  hueShift = 0,
}: {
  position: [number, number, number];
  scale?: number;
  hueShift?: number;
}) => {
  const colors = useMemo(() => {
    const c0 = new THREE.Color("#ffffff");
    const c1 = new THREE.Color("#f6fbff");
    const c2 = new THREE.Color("#ecf5ff");
    if (hueShift !== 0) {
      c0.offsetHSL(hueShift, -0.01, 0);
      c1.offsetHSL(hueShift, -0.01, 0);
      c2.offsetHSL(hueShift, 0, 0);
    }
    return [`#${c0.getHexString()}`, `#${c1.getHexString()}`, `#${c2.getHexString()}`];
  }, [hueShift]);

  return (
    <group position={position} scale={scale}>
      {ROUNDED_CLOUD_BLOBS.map((blob, idx) => (
        <group key={idx} position={blob.position} rotation={[0, blob.rot, 0]}>
          <mesh castShadow={false} receiveShadow={false} scale={blob.scale}>
            <sphereGeometry args={[1, 24, 20]} />
            <meshLambertMaterial color={colors[idx % colors.length]} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

const CloudLayer = () => (
  <group>
    <Float speed={0.2} rotationIntensity={0.03} floatIntensity={0.16}>
      <RoundedCloud position={[-11.5, 11.0, -8.0]} scale={1.32} />
    </Float>
    <Float speed={0.16} rotationIntensity={0.025} floatIntensity={0.14}>
      <RoundedCloud position={[10.0, 12.0, -10.0]} scale={1.18} hueShift={-0.004} />
    </Float>
    <Float speed={0.18} rotationIntensity={0.02} floatIntensity={0.13}>
      <RoundedCloud position={[-7.5, 13.0, 9.0]} scale={1.1} hueShift={0.004} />
    </Float>
    <Float speed={0.15} rotationIntensity={0.02} floatIntensity={0.12}>
      <RoundedCloud position={[13.0, 11.6, 7.0]} scale={1.2} />
    </Float>
  </group>
);

/* ── Animated ocean water with GPU ripples + soft fresnel edge ─ */
const WATER_GEOMETRY = (() => {
  const geo = new THREE.PlaneGeometry(220, 220, 80, 80);
  geo.rotateX(-Math.PI / 2);
  return geo;
})();

const Water = ({ color }: { color: string }) => {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const uniforms = useMemo(() => {
    const eraTint = new THREE.Color(color);
    const shallow = eraTint.clone().lerp(new THREE.Color("#9be7ea"), 0.7);
    const deep = eraTint.clone().lerp(new THREE.Color("#63bfca"), 0.8);
    return {
      uTime: { value: 0 },
      uDeep: { value: deep },
      uShallow: { value: shallow },
      uEdge: { value: new THREE.Color("#d8fbff") },
      uOpacity: { value: 0.9 },
    };
  }, [color]);

  useFrame(({ clock }) => {
    if (!matRef.current) {
      return;
    }
    matRef.current.uniforms.uTime.value = clock.elapsedTime;
  });

  return (
    <mesh geometry={WATER_GEOMETRY} position={[0, -0.68, 0]} receiveShadow renderOrder={-1}>
      <shaderMaterial
        ref={matRef}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        vertexShader={`
          uniform float uTime;
          varying vec3 vWorldPos;
          varying vec3 vWorldNormal;

          void main() {
            vec3 pos = position;

            float w1 = sin((pos.x * 0.11) + uTime * 0.45) * 0.18;
            float w2 = cos((pos.z * 0.09) - uTime * 0.38) * 0.15;
            float w3 = sin((pos.x + pos.z) * 0.14 + uTime * 0.62) * 0.07;
            pos.y += w1 + w2 + w3;

            vec3 normalApprox = normalize(vec3(
              -0.11 * cos((position.x * 0.11) + uTime * 0.45) - 0.14 * cos((position.x + position.z) * 0.14 + uTime * 0.62),
               1.0,
               0.09 * sin((position.z * 0.09) - uTime * 0.38) - 0.14 * cos((position.x + position.z) * 0.14 + uTime * 0.62)
            ));

            vec4 worldPos = modelMatrix * vec4(pos, 1.0);
            vWorldPos = worldPos.xyz;
            vWorldNormal = normalize(mat3(modelMatrix) * normalApprox);

            gl_Position = projectionMatrix * viewMatrix * worldPos;
          }
        `}
        fragmentShader={`
          uniform vec3 uDeep;
          uniform vec3 uShallow;
          uniform vec3 uEdge;
          uniform float uOpacity;
          uniform float uTime;
          varying vec3 vWorldPos;
          varying vec3 vWorldNormal;

          void main() {
            vec3 viewDir = normalize(cameraPosition - vWorldPos);
            float fresnel = pow(1.0 - max(dot(normalize(vWorldNormal), viewDir), 0.0), 2.4);
            float ripple = 0.5 + 0.5 * sin(vWorldPos.x * 0.09 + vWorldPos.z * 0.07 + uTime * 0.7);

            vec3 base = mix(uDeep, uShallow, ripple * 0.7 + 0.15);
            vec3 color = base + uEdge * fresnel * 0.55;

            float radial = length(vWorldPos.xz) / 95.0;
            float fade = 1.0 - smoothstep(0.82, 1.14, radial);
            float alpha = uOpacity * fade;

            gl_FragColor = vec4(color, alpha);
          }
        `}
      />
    </mesh>
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
  agentPos: MutableRefObject<THREE.Vector3>;
  controlsRef: MutableRefObject<OrbitControlsImpl | null>;
}) => {
  const wasTracking = useRef(false);
  const initialized = useRef(false);
  const lastAgentPos = useRef(new THREE.Vector3());
  const heading = useRef(0);
  const desiredCamPos = useRef(new THREE.Vector3());
  const desiredTarget = useRef(new THREE.Vector3());
  const moveDelta = useRef(new THREE.Vector3());

  useFrame((state, delta) => {
    const controls = controlsRef.current;
    if (!tracking || !controls) {
      wasTracking.current = false;
      return;
    }
    if (!wasTracking.current) {
      initialized.current = false;
      wasTracking.current = true;
    }

    const current = agentPos.current;
    if (!initialized.current) {
      lastAgentPos.current.copy(current);
      const cameraDir = new THREE.Vector3(
        state.camera.position.x - controls.target.x,
        0,
        state.camera.position.z - controls.target.z,
      );
      if (cameraDir.lengthSq() < 1e-5) {
        cameraDir.set(0, 0, 1);
      }
      cameraDir.normalize();
      heading.current = Math.atan2(-cameraDir.x, -cameraDir.z);
      initialized.current = true;
    }

    moveDelta.current.copy(current).sub(lastAgentPos.current);
    if (moveDelta.current.lengthSq() > 0.000004) {
      const desiredHeading = Math.atan2(moveDelta.current.x, moveDelta.current.z);
      let d = desiredHeading - heading.current;
      d = ((d + Math.PI) % (Math.PI * 2)) - Math.PI;
      heading.current += d * Math.min(1, delta * 9);
    }

    const sinH = Math.sin(heading.current);
    const cosH = Math.cos(heading.current);
    const followDistance = 3.5;
    const followHeight = 1.55;
    const shoulderOffset = 0.2;
    const lookAhead = 0.38;

    desiredCamPos.current.set(
      current.x - sinH * followDistance - cosH * shoulderOffset,
      followHeight,
      current.z - cosH * followDistance + sinH * shoulderOffset,
    );
    desiredTarget.current.set(
      current.x + sinH * lookAhead,
      0.66,
      current.z + cosH * lookAhead,
    );

    const camLerp = Math.min(1, delta * 7.8);
    const targetLerp = Math.min(1, delta * 11);
    state.camera.position.lerp(desiredCamPos.current, camLerp);
    controls.target.lerp(desiredTarget.current, targetLerp);
    controls.update();

    lastAgentPos.current.copy(current);
  });
  return null;
};

/* ── Proximity detector — fires gossip when agents meet ── */
const ProximityDetector = ({
  agents,
  agentPositions,
  onGossip,
}: {
  agents: Agent[];
  agentPositions: MutableRefObject<Map<string, THREE.Vector3>>;
  onGossip: (a: Agent, b: Agent) => void;
}) => {
  const timers = useRef(new Map<string, number>());
  const cooldowns = useRef(new Map<string, number>());
  useFrame((_s, delta) => {
    const now = Date.now();
    for (let i = 0; i < agents.length; i++) {
      for (let j = i + 1; j < agents.length; j++) {
        const a = agents[i], b = agents[j];
        if (!a || !b) continue;
        const key = `${a.id}:${b.id}`;
        const posA = agentPositions.current.get(a.id);
        const posB = agentPositions.current.get(b.id);
        if (!posA || !posB) continue;
        if (posA.distanceTo(posB) < 1.5) {
          timers.current.set(key, (timers.current.get(key) ?? 0) + delta);
          const sustained = (timers.current.get(key) ?? 0) >= 2.0;
          const cooled = now - (cooldowns.current.get(key) ?? 0) > 60_000;
          if (sustained && cooled) {
            cooldowns.current.set(key, now);
            timers.current.set(key, 0);
            onGossip(a, b);
          }
        } else {
          timers.current.set(key, 0);
        }
      }
    }
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
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:5001";
const GOSSIP_ENDPOINT = "/jobs/agent-gossip";
const GOSSIP_BUBBLE_MS = 5000;

const Scene = ({ agentTrackPos }: { agentTrackPos: MutableRefObject<THREE.Vector3> }) => {
  const { agents, buildings, scenery, selectedAgent, setSelectedAgent, placingType, islandEra, viewingEra, islandHistory } = useGame();
  const agentPositions = useRef(new Map<string, THREE.Vector3>());
  const [gossipBubbles, setGossipBubbles] = useState<Map<string, string>>(new Map());

  const onGossip = useCallback((agentA: Agent, agentB: Agent) => {
    void fetch(`${BACKEND_URL}${GOSSIP_ENDPOINT}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        agent_personality: agentA.goal,
        recent_events: [`Just met ${agentB.name} on the island`],
      }),
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { message?: string; gossip?: string; text?: string } | null) => {
        const msg = data?.message ?? data?.gossip ?? data?.text;
        if (!msg) return;
        setGossipBubbles((prev) => new Map(prev).set(agentA.id, msg));
        setTimeout(() => {
          setGossipBubbles((prev) => { const n = new Map(prev); n.delete(agentA.id); return n; });
        }, GOSSIP_BUBBLE_MS);
      })
      .catch(() => {});
  }, []);

  const displayEra = viewingEra ?? islandEra;
  const tier = ISLAND_TIERS[displayEra];
  const displayBuildings = viewingEra !== null
    ? (islandHistory[viewingEra]?.buildings ?? [])
    : buildings;

  return (
    <>
      <SkyDome />
      <fog attach="fog" args={["#d8ecff", 36, 104]} />
      <Environment preset="sunset" environmentIntensity={0.25} />

      <ambientLight intensity={0.54} color="#ffead2" />
      <directionalLight
        position={[10, 14, 6]}
        intensity={1.35}
        color="#ffe9c7"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-15}
        shadow-camera-right={15}
        shadow-camera-top={15}
        shadow-camera-bottom={-15}
        shadow-bias={-0.0003}
        shadow-normalBias={0.02}
      />
      <directionalLight position={[-6, 6, -8]} intensity={0.42} color="#9dc5e0" />
      <hemisphereLight args={["#ffc595", "#6f9f67", 0.34]} />

      <CloudLayer />

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
          onPositionUpdate={(p) => {
            const cached = agentPositions.current.get(a.id);
            if (cached) {
              cached.copy(p);
            } else {
              agentPositions.current.set(a.id, p.clone());
            }
            if (a.isYou) agentTrackPos.current.copy(p);
          }}
          gossipText={gossipBubbles.get(a.id) ?? null}
        />
      ))}

      {viewingEra === null && (
        <ProximityDetector agents={agents} agentPositions={agentPositions} onGossip={onGossip} />
      )}

      {placingType && <PlacementGhost />}
      <BuildTicker />
    </>
  );
};

/* ── Canvas wrapper ──────────────────────────────────── */
export const Island3D = () => {
  const game = useContext(GameCtx);
  const trackAgent = game?.trackAgent ?? false;
  const agentTrackPos = useRef(new THREE.Vector3());
  const controlsRef = useRef<OrbitControlsImpl | null>(null);

  return (
    <div style={{ width: "100%", height: "100%" }}>
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
          <OrbitControls
            ref={controlsRef}
            enablePan={false}
            enableRotate={!trackAgent}
            minDistance={trackAgent ? 1.4 : 4}
            maxDistance={trackAgent ? 9 : 55}
            minPolarAngle={trackAgent ? Math.PI / 3.3 : Math.PI / 6}
            maxPolarAngle={trackAgent ? Math.PI / 2.2 : Math.PI / 2.3}
            target={[0, 0.5, 0]}
            autoRotate={false}
            enableDamping
            dampingFactor={0.05}
            zoomSpeed={2.2}
          />
          <EffectComposer multisampling={0} enableNormalPass={false}>
            <Pixelation granularity={1} />
            <Vignette eskil={false} offset={0.18} darkness={0.34} />
          </EffectComposer>
        </GameCtx.Provider>
      </Canvas>
    </div>
  );
};
