import { useRef, useMemo, useState } from "react";
import { useFrame } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import { Html, Float } from "@react-three/drei";
import * as THREE from "three";
import type { Agent, Building, Scenery } from "../state";
import { BUILD_LIBRARY } from "../state";

interface Props {
  agent: Agent;
  waypoints: [number, number][];
  buildings: Building[];
  scenery: Scenery[];
  onClick: () => void;
  isSelected: boolean;
  islandRadius?: number;
  onPositionUpdate?: (pos: THREE.Vector3) => void;
}

const AGENT_RADIUS = 0.32;

/* ── Chibi-style cozy villager agent ──────────────────── */
export const Agent3D = ({ agent, waypoints, buildings, scenery, onClick, isSelected, islandRadius = 7.0, onPositionUpdate }: Props) => {
  const group = useRef<THREE.Group>(null);
  const bodyGroup = useRef<THREE.Group>(null);
  const leftLeg = useRef<THREE.Mesh>(null);
  const rightLeg = useRef<THREE.Mesh>(null);
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  const seed = useMemo(() => Math.random(), []);
  const GROUND_Y = 0.26;

  // All waypoints are on the single current island
  const targetIdx = useRef(Math.max(0, Math.floor(seed * waypoints.length)));

  const pos = useRef(new THREE.Vector3(agent.home[0], GROUND_Y, agent.home[1]));
  const angle = useRef(seed * Math.PI * 2);
  const idleTimer = useRef(0);
  const walkCycle = useRef(0);
  const stuckTimer = useRef(0);
  const lastPos = useRef(new THREE.Vector3());

  // Keep fresh refs so useFrame closure always has latest obstacle data
  const buildingsRef = useRef(buildings);
  buildingsRef.current = buildings;
  const sceneryRef = useRef(scenery);
  sceneryRef.current = scenery;

  const speed = 0.35 + (agent.mood / 100) * 0.35;

  useFrame((_state, delta) => {
    if (!group.current) return;

    // ── Find nearest under-construction building ────────
    const CONSTRUCTION_RANGE = 1.6;  // stop and build within this radius
    const CONSTRUCTION_SEEK = 6.0;   // notice a site from this far
    let nearestSite: [number, number] | null = null;
    let nearestDist = Infinity;
    for (const b of buildingsRef.current) {
      if ((b.buildProgress ?? 1) >= 1) continue;
      const dx = b.pos[0] - pos.current.x;
      const dz = b.pos[1] - pos.current.z;
      const d = Math.hypot(dx, dz);
      if (d < nearestDist) { nearestDist = d; nearestSite = b.pos; }
    }
    const nearConstruction = nearestSite !== null && nearestDist < CONSTRUCTION_RANGE;
    const seekConstruction = nearestSite !== null && nearestDist < CONSTRUCTION_SEEK && !nearConstruction;

    // ── Movement: walk to construction site or waypoints ─
    let walking = false;
    if (nearConstruction) {
      // Stop — face the building and start hammering
      if (nearestSite) {
        const dx = nearestSite[0] - pos.current.x;
        const dz = nearestSite[1] - pos.current.z;
        const targetAngle = Math.atan2(dx, dz);
        const diff = targetAngle - angle.current;
        const wrapped = ((diff + Math.PI) % (Math.PI * 2)) - Math.PI;
        angle.current += wrapped * 0.08;
      }
      idleTimer.current = 0;
    } else if (seekConstruction && nearestSite) {
      // Walk toward the construction site
      const tv = new THREE.Vector3(nearestSite[0], GROUND_Y, nearestSite[1]);
      const dir = tv.clone().sub(pos.current);
      const distance = dir.length();
      walking = distance > 0.15;
      if (walking) {
        dir.normalize();
        pos.current.add(dir.clone().multiplyScalar(Math.min(distance, speed * delta)));
        const targetAngle = Math.atan2(dir.x, dir.z);
        const diff = targetAngle - angle.current;
        const wrapped = ((diff + Math.PI) % (Math.PI * 2)) - Math.PI;
        angle.current += wrapped * 0.12;
      }
    } else {
      // Normal waypoint wandering
      if (!waypoints || waypoints.length === 0) return;
      const target = waypoints[targetIdx.current % waypoints.length];
      if (!target) return;
      const tv = new THREE.Vector3(target[0], GROUND_Y, target[1]);
      const dir = tv.clone().sub(pos.current);
      const distance = dir.length();
      walking = distance > 0.15;
      if (!walking) {
        idleTimer.current += delta;
        if (idleTimer.current > 2 + Math.random() * 3) {
          targetIdx.current = Math.floor(Math.random() * waypoints.length);
          idleTimer.current = 0;
        }
      } else {
        dir.normalize();
        const move = Math.min(distance, speed * delta);
        pos.current.add(dir.multiplyScalar(move));
        const targetAngle = Math.atan2(dir.x, dir.z);
        const diff = targetAngle - angle.current;
        const wrapped = ((diff + Math.PI) % (Math.PI * 2)) - Math.PI;
        angle.current += wrapped * 0.12;
      }
    }

    // ── Obstacle repulsion ──────────────────────────────
    const repX = { v: 0 }, repZ = { v: 0 };
    const dt = Math.min(delta, 0.05);

    for (const b of buildingsRef.current) {
      const opt = BUILD_LIBRARY.find((x) => x.type === b.type);
      const bR = (opt?.radius ?? 0.5) + AGENT_RADIUS;
      const dx = pos.current.x - b.pos[0];
      const dz = pos.current.z - b.pos[1];
      const d = Math.hypot(dx, dz);
      if (d < bR && d > 0.001) {
        const str = ((bR - d) / bR) * 5;
        repX.v += (dx / d) * str;
        repZ.v += (dz / d) * str;
      }
    }

    for (const s of sceneryRef.current) {
      if (s.type === "flower") continue;
      const sR = (s.type === "tree" ? 0.38 : 0.22) + AGENT_RADIUS;
      const dx = pos.current.x - s.pos[0];
      const dz = pos.current.z - s.pos[1];
      const d = Math.hypot(dx, dz);
      if (d < sR && d > 0.001) {
        const str = ((sR - d) / sR) * 4;
        repX.v += (dx / d) * str;
        repZ.v += (dz / d) * str;
      }
    }

    pos.current.x += repX.v * dt;
    pos.current.z += repZ.v * dt;

    // ── Hard clamp to island zone ────────────────────────
    {
      const dx = pos.current.x;
      const dz = pos.current.z;
      const d = Math.hypot(dx, dz);
      if (d > islandRadius) {
        pos.current.x = (dx / d) * islandRadius;
        pos.current.z = (dz / d) * islandRadius;
      }
    }

    // ── Stuck detection ──────────────────────────────────
    stuckTimer.current += delta;
    if (stuckTimer.current > 3) {
      const moved = pos.current.distanceTo(lastPos.current);
      if (walking && moved < 0.02) {
        targetIdx.current = Math.floor(Math.random() * waypoints.length);
      }
      lastPos.current.copy(pos.current);
      stuckTimer.current = 0;
    }

    group.current.position.copy(pos.current);
    group.current.rotation.y = angle.current;
    onPositionUpdate?.(pos.current);

    // ── Animation cycle — always ticks when building ────
    walkCycle.current += delta * (nearConstruction ? 10 : (walking ? speed * 12 : 0));
    const t = walkCycle.current;
    const swing = walking ? Math.sin(t) * 0.45 : 0;
    const bounce = (walking || nearConstruction)
      ? Math.abs(Math.sin(t * 2)) * 0.035
      : Math.sin(Date.now() * 0.002) * 0.008;

    if (leftLeg.current) leftLeg.current.rotation.x = nearConstruction ? 0 : swing;
    if (rightLeg.current) rightLeg.current.rotation.x = nearConstruction ? 0 : -swing;

    if (nearConstruction) {
      // Hammering: right arm pumps aggressively up and down
      const hammer = Math.sin(t) * 0.9;
      if (rightArm.current) {
        rightArm.current.rotation.x = -0.6 + hammer;
        rightArm.current.rotation.z = -0.25;
      }
      if (leftArm.current) {
        leftArm.current.rotation.x = 0.3;
        leftArm.current.rotation.z = 0.1;
      }
      if (leftArm.current) leftArm.current.rotation.x = 0.2;
    } else {
      if (leftArm.current) leftArm.current.rotation.x = -swing * 0.5;
      if (rightArm.current) rightArm.current.rotation.x = swing * 0.5;
    }

    // Body bounce
    if (bodyGroup.current) {
      bodyGroup.current.position.y = bounce;
      bodyGroup.current.rotation.z = walking ? Math.sin(t) * 0.03 : 0;
    }
  });

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onClick();
  };

  const moodColor = agent.mood > 70 ? "#7AC5A0" : agent.mood > 50 ? "#F2C46C" : "#E58F7B";
  const skinMat = useMemo(() => new THREE.MeshStandardMaterial({ color: agent.skin, roughness: 0.7, metalness: 0.02 }), [agent.skin]);
  const shirtMat = useMemo(() => new THREE.MeshStandardMaterial({ color: agent.shirt, roughness: 0.65, metalness: 0.05 }), [agent.shirt]);
  const pantsMat = useMemo(() => new THREE.MeshStandardMaterial({ color: agent.pants, roughness: 0.75, metalness: 0.02 }), [agent.pants]);
  const hairMat = useMemo(() => new THREE.MeshStandardMaterial({ color: agent.hair, roughness: 0.8, metalness: 0.0 }), [agent.hair]);

  return (
    <group
      ref={group}
      onClick={handleClick}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "default";
      }}
    >
      {/* Selection / hover ring */}
      {(isSelected || hovered) && (
        <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.32, 0.4, 32]} />
          <meshBasicMaterial
            color={agent.isYou ? "#7AC5A0" : isSelected ? "#6FA8DC" : "#F2C46C"}
            transparent
            opacity={0.75}
          />
        </mesh>
      )}

      {/* Shadow blob */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.2, 16]} />
        <meshBasicMaterial color="#2A3A20" transparent opacity={0.2} />
      </mesh>

      <group ref={bodyGroup}>
        {/* ── LEGS ── */}
        {/* Left leg */}
        <group position={[0.08, 0.12, 0]}>
          <mesh ref={leftLeg} castShadow>
            <capsuleGeometry args={[0.055, 0.1, 4, 8]} />
            <primitive object={pantsMat} attach="material" />
          </mesh>
          {/* Shoe */}
          <mesh position={[0, -0.08, 0.02]}>
            <sphereGeometry args={[0.06, 8, 6, 0, Math.PI * 2, 0, Math.PI / 1.5]} />
            <meshStandardMaterial color="#3A2418" roughness={0.8} />
          </mesh>
        </group>
        {/* Right leg */}
        <group position={[-0.08, 0.12, 0]}>
          <mesh ref={rightLeg} castShadow>
            <capsuleGeometry args={[0.055, 0.1, 4, 8]} />
            <primitive object={pantsMat} attach="material" />
          </mesh>
          <mesh position={[0, -0.08, 0.02]}>
            <sphereGeometry args={[0.06, 8, 6, 0, Math.PI * 2, 0, Math.PI / 1.5]} />
            <meshStandardMaterial color="#3A2418" roughness={0.8} />
          </mesh>
        </group>

        {/* ── TORSO ── roundish body */}
        <mesh position={[0, 0.34, 0]} castShadow>
          <sphereGeometry args={[0.18, 12, 10]} />
          <primitive object={shirtMat} attach="material" />
        </mesh>
        {/* Lower shirt overlap */}
        <mesh position={[0, 0.24, 0]} castShadow>
          <sphereGeometry args={[0.155, 10, 8]} />
          <primitive object={shirtMat} attach="material" />
        </mesh>

        {/* ── ARMS ── */}
        <group ref={leftArm} position={[0.22, 0.36, 0]}>
          {/* Sleeve */}
          <mesh castShadow>
            <sphereGeometry args={[0.065, 8, 8]} />
            <primitive object={shirtMat} attach="material" />
          </mesh>
          {/* Lower arm */}
          <mesh position={[0, -0.1, 0]} castShadow>
            <capsuleGeometry args={[0.04, 0.08, 4, 6]} />
            <primitive object={skinMat} attach="material" />
          </mesh>
          {/* Hand */}
          <mesh position={[0, -0.17, 0]}>
            <sphereGeometry args={[0.042, 8, 8]} />
            <primitive object={skinMat} attach="material" />
          </mesh>
        </group>
        <group ref={rightArm} position={[-0.22, 0.36, 0]}>
          <mesh castShadow>
            <sphereGeometry args={[0.065, 8, 8]} />
            <primitive object={shirtMat} attach="material" />
          </mesh>
          <mesh position={[0, -0.1, 0]} castShadow>
            <capsuleGeometry args={[0.04, 0.08, 4, 6]} />
            <primitive object={skinMat} attach="material" />
          </mesh>
          <mesh position={[0, -0.17, 0]}>
            <sphereGeometry args={[0.042, 8, 8]} />
            <primitive object={skinMat} attach="material" />
          </mesh>
        </group>

        {/* ── NECK ── */}
        <mesh position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.05, 0.06, 0.06, 8]} />
          <primitive object={skinMat} attach="material" />
        </mesh>

        {/* ── HEAD — big chibi head ── */}
        <group position={[0, 0.68, 0]}>
          {/* Main head sphere */}
          <mesh castShadow>
            <sphereGeometry args={[0.2, 20, 18]} />
            <primitive object={skinMat} attach="material" />
          </mesh>

          {/* ── FACE ── */}
          {/* Eyes — big expressive */}
          <group position={[0, 0, 0.16]}>
            {/* Eye whites */}
            <mesh position={[0.065, 0.01, 0]}>
              <sphereGeometry args={[0.035, 12, 12]} />
              <meshStandardMaterial color="#FAFAF8" roughness={0.3} />
            </mesh>
            <mesh position={[-0.065, 0.01, 0]}>
              <sphereGeometry args={[0.035, 12, 12]} />
              <meshStandardMaterial color="#FAFAF8" roughness={0.3} />
            </mesh>
            {/* Pupils */}
            <mesh position={[0.065, 0.01, 0.025]}>
              <sphereGeometry args={[0.02, 10, 10]} />
              <meshBasicMaterial color="#1A1410" />
            </mesh>
            <mesh position={[-0.065, 0.01, 0.025]}>
              <sphereGeometry args={[0.02, 10, 10]} />
              <meshBasicMaterial color="#1A1410" />
            </mesh>
            {/* Eye shine */}
            <mesh position={[0.058, 0.02, 0.035]}>
              <sphereGeometry args={[0.008, 6, 6]} />
              <meshBasicMaterial color="#FFFFFF" />
            </mesh>
            <mesh position={[-0.058, 0.02, 0.035]}>
              <sphereGeometry args={[0.008, 6, 6]} />
              <meshBasicMaterial color="#FFFFFF" />
            </mesh>
          </group>

          {/* Cheek blush — rosy */}
          <mesh position={[0.12, -0.04, 0.13]}>
            <sphereGeometry args={[0.035, 8, 8]} />
            <meshStandardMaterial color="#F4A8A8" transparent opacity={0.5} roughness={0.9} />
          </mesh>
          <mesh position={[-0.12, -0.04, 0.13]}>
            <sphereGeometry args={[0.035, 8, 8]} />
            <meshStandardMaterial color="#F4A8A8" transparent opacity={0.5} roughness={0.9} />
          </mesh>

          {/* Nose — tiny dot */}
          <mesh position={[0, -0.02, 0.19]}>
            <sphereGeometry args={[0.015, 8, 8]} />
            <meshStandardMaterial color={agent.skin} roughness={0.6} />
          </mesh>

          {/* Mouth */}
          {agent.mood > 60 ? (
            /* Smile arc */
            <mesh position={[0, -0.065, 0.175]} rotation={[0.15, 0, 0]}>
              <torusGeometry args={[0.025, 0.005, 6, 12, Math.PI]} />
              <meshBasicMaterial color="#5A3020" />
            </mesh>
          ) : (
            /* Neutral line */
            <mesh position={[0, -0.065, 0.18]}>
              <boxGeometry args={[0.035, 0.008, 0.004]} />
              <meshBasicMaterial color="#5A3020" />
            </mesh>
          )}

          {/* ── HAIR ── */}
          {agent.hairStyle === "short" && (
            <group>
              <mesh position={[0, 0.06, -0.02]} castShadow>
                <sphereGeometry args={[0.21, 16, 14, 0, Math.PI * 2, 0, Math.PI / 1.8]} />
                <primitive object={hairMat} attach="material" />
              </mesh>
              {/* Side tufts */}
              <mesh position={[0.15, 0.02, 0.08]} castShadow>
                <sphereGeometry args={[0.06, 8, 8]} />
                <primitive object={hairMat} attach="material" />
              </mesh>
              <mesh position={[-0.15, 0.02, 0.08]} castShadow>
                <sphereGeometry args={[0.06, 8, 8]} />
                <primitive object={hairMat} attach="material" />
              </mesh>
            </group>
          )}
          {agent.hairStyle === "long" && (
            <group>
              <mesh position={[0, 0.06, -0.02]} castShadow>
                <sphereGeometry args={[0.215, 16, 14, 0, Math.PI * 2, 0, Math.PI / 1.6]} />
                <primitive object={hairMat} attach="material" />
              </mesh>
              {/* Long hair draping down */}
              <mesh position={[0.13, -0.1, -0.08]} castShadow>
                <capsuleGeometry args={[0.06, 0.2, 4, 8]} />
                <primitive object={hairMat} attach="material" />
              </mesh>
              <mesh position={[-0.13, -0.1, -0.08]} castShadow>
                <capsuleGeometry args={[0.06, 0.2, 4, 8]} />
                <primitive object={hairMat} attach="material" />
              </mesh>
              <mesh position={[0, -0.05, -0.15]} castShadow>
                <capsuleGeometry args={[0.1, 0.18, 4, 8]} />
                <primitive object={hairMat} attach="material" />
              </mesh>
            </group>
          )}
          {agent.hairStyle === "bun" && (
            <group>
              <mesh position={[0, 0.05, -0.02]} castShadow>
                <sphereGeometry args={[0.21, 16, 14, 0, Math.PI * 2, 0, Math.PI / 1.8]} />
                <primitive object={hairMat} attach="material" />
              </mesh>
              {/* Bun on top */}
              <mesh position={[0, 0.22, -0.06]} castShadow>
                <sphereGeometry args={[0.1, 12, 10]} />
                <primitive object={hairMat} attach="material" />
              </mesh>
              {/* Hair stick */}
              <mesh position={[0.04, 0.28, -0.06]} rotation={[0.3, 0, 0.4]}>
                <cylinderGeometry args={[0.008, 0.008, 0.12, 4]} />
                <meshStandardMaterial color="#C9A55B" metalness={0.4} roughness={0.4} />
              </mesh>
            </group>
          )}
          {agent.hairStyle === "cap" && (
            <group>
              {/* Hair under cap */}
              <mesh position={[0, 0.03, 0.08]} castShadow>
                <sphereGeometry args={[0.19, 12, 10, 0, Math.PI * 2, Math.PI / 3, Math.PI / 2]} />
                <primitive object={hairMat} attach="material" />
              </mesh>
              {/* Cap dome */}
              <mesh position={[0, 0.1, 0]} castShadow>
                <sphereGeometry args={[0.215, 14, 12, 0, Math.PI * 2, 0, Math.PI / 2.2]} />
                <primitive object={shirtMat} attach="material" />
              </mesh>
              {/* Visor */}
              <mesh position={[0, 0.08, 0.15]} rotation={[-0.3, 0, 0]}>
                <cylinderGeometry args={[0.18, 0.18, 0.02, 12, 1, false, -Math.PI / 2, Math.PI]} />
                <primitive object={shirtMat} attach="material" />
              </mesh>
            </group>
          )}

          {/* Ears (subtle) */}
          <mesh position={[0.19, -0.02, 0]}>
            <sphereGeometry args={[0.035, 8, 8]} />
            <primitive object={skinMat} attach="material" />
          </mesh>
          <mesh position={[-0.19, -0.02, 0]}>
            <sphereGeometry args={[0.035, 8, 8]} />
            <primitive object={skinMat} attach="material" />
          </mesh>
        </group>

        {/* ── Mood orb floating above ── */}
        <Float speed={3} rotationIntensity={0} floatIntensity={0.15}>
          <mesh position={[0, 1.08, 0]}>
            <sphereGeometry args={[0.05, 12, 12]} />
            <meshStandardMaterial
              color={moodColor}
              emissive={moodColor}
              emissiveIntensity={0.6}
              transparent
              opacity={0.85}
            />
          </mesh>
          <pointLight position={[0, 1.08, 0]} color={moodColor} intensity={0.15} distance={1} />
        </Float>
      </group>

      {/* ── Name tag label ── */}
      <Html position={[0, 1.25, 0]} center distanceFactor={6} zIndexRange={[10, 0]}>
        <div className="pointer-events-none flex flex-col items-center gap-0.5 select-none">
          <div
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-black shadow-lg whitespace-nowrap ${
              agent.isYou
                ? "bg-primary text-primary-foreground border-2 border-white"
                : "bg-card text-foreground border border-border"
            }`}
          >
            {agent.name}
            {agent.isYou && " ★"}
          </div>
          <div className="h-1 w-10 rounded-full bg-black/30 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${agent.mood}%`, background: moodColor }}
            />
          </div>
        </div>
      </Html>
    </group>
  );
};
