import { useRef, useMemo } from "react";
import type { RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Building } from "../state";

interface Props { building: Building; }

export const Building3D = ({ building }: Props) => {
  const { type, pos, rot = 0 } = building;
  const flameRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.Mesh>(null);
  const smokeRef = useRef<THREE.Mesh>(null);
  const bladesRef = useRef<THREE.Group>(null);
  const flagRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const mountTime = useMemo(() => performance.now(), []);

  useFrame(({ clock }) => {
    // Pop-in elastic on first appearance
    if (groupRef.current) {
      const elapsed = (performance.now() - mountTime) / 1000;
      if (elapsed < 0.7) {
        const t = elapsed / 0.7;
        const eased = 1 - Math.pow(1 - t, 3);
        const overshoot = Math.sin(t * Math.PI * 2) * (1 - t) * 0.15;
        groupRef.current.scale.setScalar(eased + overshoot);
      } else {
        groupRef.current.scale.setScalar(1);
      }
    }
    if (type === "bonfire" && flameRef.current) {
      const s = 0.9 + Math.sin(clock.elapsedTime * 8) * 0.15;
      flameRef.current.scale.set(s, s * 1.3, s);
    }
    if (type === "lighthouse" && lightRef.current) {
      lightRef.current.rotation.y = clock.elapsedTime * 1.5;
    }
    if (type === "windmill" && bladesRef.current) {
      bladesRef.current.rotation.z = clock.elapsedTime * 0.8;
    }
    if ((type === "house" || type === "cabin") && smokeRef.current) {
      smokeRef.current.position.y = 1.2 + (clock.elapsedTime % 2) * 0.3;
      const m = smokeRef.current.material as THREE.MeshStandardMaterial;
      m.opacity = 0.5 - (clock.elapsedTime % 2) * 0.25;
    }
    if (type === "house" && flagRef.current) {
      flagRef.current.rotation.y = Math.sin(clock.elapsedTime * 4) * 0.3;
      flagRef.current.scale.x = 1 + Math.sin(clock.elapsedTime * 5) * 0.06;
    }
  });

  return (
    <group ref={groupRef} position={[pos[0], 0.26, pos[1]]} rotation={[0, rot, 0]}>
      {type === "house" && <House smokeRef={smokeRef} flagRef={flagRef} />}
      {type === "garden" && <Garden />}
      {type === "library" && <Library />}
      {type === "gym" && <Gym />}
      {type === "fountain" && <Fountain />}
      {type === "bonfire" && <Bonfire flameRef={flameRef} />}
      {type === "lighthouse" && <Lighthouse lightRef={lightRef} />}
      {type === "cabin" && <Cabin smokeRef={smokeRef} />}
      {type === "dock" && <Dock />}
      {type === "shrine" && <Shrine />}
      {type === "windmill" && <Windmill bladesRef={bladesRef} />}
      {type === "treehouse" && <Treehouse />}
    </group>
  );
};

const House = ({ smokeRef, flagRef }: { smokeRef: RefObject<THREE.Mesh | null>; flagRef: RefObject<THREE.Mesh | null> }) => (
  <group>
    <mesh position={[0, 0.05, 0]} receiveShadow>
      <boxGeometry args={[0.95, 0.1, 0.95]} />
      <meshStandardMaterial color="#9B8E7E" />
    </mesh>
    <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
      <boxGeometry args={[0.85, 0.7, 0.85]} />
      <meshStandardMaterial color="#F4E1C1" />
    </mesh>
    {/* Window left */}
    <mesh position={[-0.25, 0.45, 0.43]}>
      <boxGeometry args={[0.18, 0.18, 0.02]} />
      <meshStandardMaterial color="#7BC5E5" emissive="#7BC5E5" emissiveIntensity={0.3} />
    </mesh>
    <mesh position={[-0.25, 0.45, 0.44]}>
      <boxGeometry args={[0.2, 0.02, 0.005]} /><meshStandardMaterial color="#5A4226" />
    </mesh>
    <mesh position={[-0.25, 0.45, 0.44]}>
      <boxGeometry args={[0.02, 0.2, 0.005]} /><meshStandardMaterial color="#5A4226" />
    </mesh>
    {/* Window planter with flowers */}
    <mesh position={[-0.25, 0.32, 0.46]} castShadow>
      <boxGeometry args={[0.22, 0.06, 0.06]} />
      <meshStandardMaterial color="#6B4226" />
    </mesh>
    {[-0.32, -0.25, -0.18].map((x, i) => (
      <mesh key={i} position={[x, 0.37, 0.46]}>
        <sphereGeometry args={[0.025, 6, 6]} />
        <meshStandardMaterial color={["#E58F7B", "#F2C46C", "#C9A0E0"][i]} />
      </mesh>
    ))}
    {/* Door */}
    <mesh position={[0.18, 0.32, 0.43]}>
      <boxGeometry args={[0.18, 0.42, 0.02]} />
      <meshStandardMaterial color="#6B4226" />
    </mesh>
    <mesh position={[0.24, 0.32, 0.44]}>
      <sphereGeometry args={[0.012, 6, 6]} /><meshStandardMaterial color="#C9A55B" metalness={0.6} />
    </mesh>
    {/* Roof */}
    <mesh position={[0, 0.92, 0]} castShadow rotation={[0, Math.PI / 4, 0]}>
      <coneGeometry args={[0.75, 0.55, 4]} />
      <meshStandardMaterial color="#C5523A" />
    </mesh>
    {/* Flag pole + animated flag */}
    <mesh position={[0, 1.3, 0]} castShadow>
      <cylinderGeometry args={[0.012, 0.012, 0.35, 6]} />
      <meshStandardMaterial color="#3A2818" />
    </mesh>
    <mesh ref={flagRef} position={[0.08, 1.38, 0]}>
      <planeGeometry args={[0.16, 0.1]} />
      <meshStandardMaterial color="#D9433A" side={THREE.DoubleSide} />
    </mesh>
    {/* Chimney + smoke */}
    <mesh position={[0.25, 1.0, -0.15]} castShadow>
      <boxGeometry args={[0.1, 0.25, 0.1]} />
      <meshStandardMaterial color="#5A4A38" />
    </mesh>
    <mesh ref={smokeRef} position={[0.25, 1.2, -0.15]}>
      <sphereGeometry args={[0.08, 8, 8]} />
      <meshStandardMaterial color="#E0E0E0" transparent opacity={0.5} />
    </mesh>
    <mesh position={[0.18, 0.07, 0.5]}>
      <boxGeometry args={[0.22, 0.05, 0.1]} />
      <meshStandardMaterial color="#6B4226" />
    </mesh>
  </group>
);

const Garden = () => (
  <group>
    <mesh position={[0, 0.05, 0]} receiveShadow>
      <cylinderGeometry args={[0.4, 0.45, 0.1, 12]} />
      <meshStandardMaterial color="#6B4226" />
    </mesh>
    <mesh position={[0, 0.11, 0]}>
      <cylinderGeometry args={[0.36, 0.36, 0.02, 12]} />
      <meshStandardMaterial color="#3A2818" />
    </mesh>
    {[[-0.18, 0.18], [0.15, -0.1], [0.05, 0.2], [-0.1, -0.15], [0.2, 0.15], [-0.2, -0.05]].map((p, i) => (
      <group key={i} position={[p[0], 0.13, p[1]]}>
        <mesh><cylinderGeometry args={[0.018, 0.018, 0.18, 6]} /><meshStandardMaterial color="#5A8C3B" /></mesh>
        <mesh position={[0, 0.13, 0]}><sphereGeometry args={[0.07, 8, 8]} /><meshStandardMaterial color={["#E58F7B", "#F2C46C", "#C9A0E0", "#FFB6C1", "#E89BC5", "#F4A8A8"][i]} /></mesh>
        <mesh position={[0, 0.13, 0]}><sphereGeometry args={[0.025, 6, 6]} /><meshStandardMaterial color="#F2C46C" /></mesh>
      </group>
    ))}
  </group>
);

const Library = () => (
  <group>
    <mesh position={[0, 0.05, 0]} receiveShadow>
      <boxGeometry args={[1.2, 0.1, 0.9]} />
      <meshStandardMaterial color="#9B8E7E" />
    </mesh>
    <mesh position={[0, 0.5, 0]} castShadow>
      <boxGeometry args={[1.1, 0.9, 0.8]} />
      <meshStandardMaterial color="#A87FCB" />
    </mesh>
    <mesh position={[0, 1.0, 0]} castShadow>
      <boxGeometry args={[1.2, 0.15, 0.9]} />
      <meshStandardMaterial color="#6B4F8C" />
    </mesh>
    {/* Columns */}
    {[-0.45, 0.45].map((x) => (
      <mesh key={x} position={[x, 0.5, 0.41]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.85, 8]} />
        <meshStandardMaterial color="#F4E8D9" />
      </mesh>
    ))}
    {/* Door */}
    <mesh position={[0, 0.4, 0.42]}>
      <boxGeometry args={[0.25, 0.6, 0.02]} />
      <meshStandardMaterial color="#5A3820" />
    </mesh>
    {/* Windows */}
    {[-0.42, 0.42].map((x) => (
      <mesh key={x} position={[x, 0.7, 0.41]}>
        <boxGeometry args={[0.12, 0.18, 0.005]} />
        <meshStandardMaterial color="#F2C46C" emissive="#F2C46C" emissiveIntensity={0.5} />
      </mesh>
    ))}
    {/* Sign */}
    <mesh position={[0, 1.15, 0.46]}>
      <boxGeometry args={[0.4, 0.12, 0.02]} />
      <meshStandardMaterial color="#F4E1C1" />
    </mesh>
  </group>
);

const Gym = () => (
  <group>
    <mesh position={[0, 0.05, 0]} receiveShadow>
      <boxGeometry args={[1.0, 0.1, 1.0]} />
      <meshStandardMaterial color="#5A4A38" />
    </mesh>
    <mesh position={[0, 0.45, 0]} castShadow>
      <boxGeometry args={[0.9, 0.8, 0.9]} />
      <meshStandardMaterial color="#6FA8DC" />
    </mesh>
    <mesh position={[0, 0.9, 0]} castShadow>
      <boxGeometry args={[1.0, 0.1, 1.0]} />
      <meshStandardMaterial color="#3F6FA0" />
    </mesh>
    {/* Garage door */}
    <mesh position={[0, 0.4, 0.46]}>
      <boxGeometry args={[0.55, 0.65, 0.02]} />
      <meshStandardMaterial color="#2C4F70" />
    </mesh>
    {[0.15, 0.3, 0.45, 0.6].map((y, i) => (
      <mesh key={i} position={[0, y, 0.47]}>
        <boxGeometry args={[0.55, 0.012, 0.005]} />
        <meshStandardMaterial color="#1F3A52" />
      </mesh>
    ))}
    {/* Dumbbell */}
    <group position={[0.55, 0.12, 0.45]}>
      <mesh><sphereGeometry args={[0.08, 8, 8]} /><meshStandardMaterial color="#1A1A1A" /></mesh>
      <mesh position={[0.18, 0, 0]}><sphereGeometry args={[0.08, 8, 8]} /><meshStandardMaterial color="#1A1A1A" /></mesh>
      <mesh position={[0.09, 0, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.025, 0.025, 0.18, 6]} /><meshStandardMaterial color="#555" /></mesh>
    </group>
    {/* Sign */}
    <mesh position={[0, 0.95, 0.51]}>
      <boxGeometry args={[0.5, 0.1, 0.02]} />
      <meshStandardMaterial color="#F2C46C" emissive="#F2C46C" emissiveIntensity={0.3} />
    </mesh>
  </group>
);

const Fountain = () => (
  <group>
    <mesh position={[0, 0.1, 0]} receiveShadow><cylinderGeometry args={[0.6, 0.65, 0.2, 24]} /><meshStandardMaterial color="#E0D5C0" /></mesh>
    <mesh position={[0, 0.21, 0]}><torusGeometry args={[0.55, 0.05, 8, 24]} /><meshStandardMaterial color="#9B8E7E" /></mesh>
    <mesh position={[0, 0.22, 0]}><cylinderGeometry args={[0.5, 0.5, 0.04, 24]} /><meshStandardMaterial color="#5BA3D0" transparent opacity={0.85} /></mesh>
    <mesh position={[0, 0.4, 0]}><cylinderGeometry args={[0.08, 0.12, 0.35, 8]} /><meshStandardMaterial color="#E0D5C0" /></mesh>
    <mesh position={[0, 0.6, 0]}><cylinderGeometry args={[0.18, 0.18, 0.04, 16]} /><meshStandardMaterial color="#9B8E7E" /></mesh>
    <mesh position={[0, 0.65, 0]}><cylinderGeometry args={[0.16, 0.16, 0.02, 16]} /><meshStandardMaterial color="#5BA3D0" transparent opacity={0.85} /></mesh>
    <mesh position={[0, 0.78, 0]}><sphereGeometry args={[0.13, 16, 16]} /><meshStandardMaterial color="#7BC5E5" transparent opacity={0.7} emissive="#7BC5E5" emissiveIntensity={0.2} /></mesh>
    {/* Water droplets */}
    {[0, 1, 2, 3].map((i) => {
      const a = (i / 4) * Math.PI * 2;
      return <mesh key={i} position={[Math.cos(a) * 0.35, 0.5, Math.sin(a) * 0.35]}><sphereGeometry args={[0.04, 6, 6]} /><meshStandardMaterial color="#7BC5E5" transparent opacity={0.6} /></mesh>;
    })}
  </group>
);

const Bonfire = ({ flameRef }: { flameRef: RefObject<THREE.Mesh | null> }) => (
  <group>
    <mesh position={[0, 0.02, 0]}><cylinderGeometry args={[0.32, 0.35, 0.04, 16]} /><meshStandardMaterial color="#3A2818" /></mesh>
    {[0, 1, 2, 3, 4].map((i) => (
      <mesh key={i} position={[Math.cos(i * Math.PI / 2.5) * 0.15, 0.1, Math.sin(i * Math.PI / 2.5) * 0.15]} rotation={[Math.PI / 2.5, 0, i]}>
        <cylinderGeometry args={[0.04, 0.04, 0.34, 6]} />
        <meshStandardMaterial color="#6B4226" />
      </mesh>
    ))}
    <mesh ref={flameRef} position={[0, 0.28, 0]}>
      <coneGeometry args={[0.16, 0.45, 8]} />
      <meshStandardMaterial color="#F2A04C" emissive="#E55A2B" emissiveIntensity={0.8} />
    </mesh>
    <mesh position={[0, 0.42, 0]}>
      <coneGeometry args={[0.08, 0.22, 6]} />
      <meshStandardMaterial color="#F4D87C" emissive="#F4D87C" emissiveIntensity={0.8} />
    </mesh>
    <pointLight position={[0, 0.4, 0]} color="#FF8030" intensity={0.8} distance={2.5} />
    {/* Stones around */}
    {[0, 1, 2, 3, 4, 5].map((i) => {
      const a = (i / 6) * Math.PI * 2;
      return <mesh key={i} position={[Math.cos(a) * 0.32, 0.04, Math.sin(a) * 0.32]}><dodecahedronGeometry args={[0.06]} /><meshStandardMaterial color="#7A6B5A" flatShading /></mesh>;
    })}
  </group>
);

const Lighthouse = ({ lightRef }: { lightRef: RefObject<THREE.Mesh | null> }) => (
  <group>
    <mesh position={[0, 0.05, 0]}><cylinderGeometry args={[0.5, 0.55, 0.1, 16]} /><meshStandardMaterial color="#7A6B5A" /></mesh>
    <mesh position={[0, 0.7, 0]} castShadow><cylinderGeometry args={[0.25, 0.35, 1.3, 16]} /><meshStandardMaterial color="#F4F0E8" /></mesh>
    {/* Red stripes */}
    {[0.4, 0.9, 1.2].map((y) => (
      <mesh key={y} position={[0, y, 0]}>
        <cylinderGeometry args={[
          y === 0.4 ? 0.32 : y === 0.9 ? 0.27 : 0.255,
          y === 0.4 ? 0.33 : y === 0.9 ? 0.28 : 0.26,
          0.08, 16
        ]} />
        <meshStandardMaterial color="#D9433A" />
      </mesh>
    ))}
    <mesh position={[0, 1.45, 0]}><cylinderGeometry args={[0.3, 0.3, 0.08, 16]} /><meshStandardMaterial color="#3A2818" /></mesh>
    {/* Lantern room */}
    <mesh position={[0, 1.6, 0]}><cylinderGeometry args={[0.2, 0.22, 0.25, 12]} /><meshStandardMaterial color="#222" transparent opacity={0.4} /></mesh>
    <mesh ref={lightRef} position={[0, 1.6, 0]}>
      <coneGeometry args={[1.5, 2, 8, 1, true]} />
      <meshBasicMaterial color="#FFE49B" transparent opacity={0.25} side={THREE.DoubleSide} />
    </mesh>
    <pointLight position={[0, 1.6, 0]} color="#FFE49B" intensity={1.2} distance={5} />
    <mesh position={[0, 1.85, 0]}><coneGeometry args={[0.25, 0.35, 12]} /><meshStandardMaterial color="#3A4A6B" /></mesh>
    <mesh position={[0, 2.05, 0]}><sphereGeometry args={[0.04, 8, 8]} /><meshStandardMaterial color="#C9A55B" metalness={0.7} /></mesh>
  </group>
);

const Cabin = ({ smokeRef }: { smokeRef: RefObject<THREE.Mesh | null> }) => (
  <group>
    {/* Log walls */}
    {[0.15, 0.3, 0.45, 0.6, 0.75].map((y) => (
      <mesh key={y} position={[0, y, 0]} castShadow>
        <boxGeometry args={[0.85, 0.13, 0.85]} />
        <meshStandardMaterial color={y % 0.3 < 0.15 ? "#8B5E3C" : "#6B4226"} />
      </mesh>
    ))}
    {/* Roof */}
    <mesh position={[0, 1.0, 0]} castShadow rotation={[0, 0, 0]}>
      <boxGeometry args={[1.0, 0.05, 1.0]} />
      <meshStandardMaterial color="#3A4A6B" />
    </mesh>
    <mesh position={[0, 1.2, 0]} castShadow rotation={[0, Math.PI / 4, 0]}>
      <coneGeometry args={[0.8, 0.55, 4]} />
      <meshStandardMaterial color="#3F7A3F" />
    </mesh>
    {/* Door */}
    <mesh position={[0, 0.35, 0.43]}>
      <boxGeometry args={[0.22, 0.55, 0.02]} />
      <meshStandardMaterial color="#3A2818" />
    </mesh>
    {/* Window */}
    <mesh position={[-0.28, 0.5, 0.43]}>
      <boxGeometry args={[0.18, 0.18, 0.02]} />
      <meshStandardMaterial color="#F2C46C" emissive="#F2C46C" emissiveIntensity={0.4} />
    </mesh>
    {/* Chimney smoke */}
    <mesh position={[0.3, 1.1, -0.2]}>
      <boxGeometry args={[0.1, 0.3, 0.1]} />
      <meshStandardMaterial color="#3A2818" />
    </mesh>
    <mesh ref={smokeRef} position={[0.3, 1.3, -0.2]}>
      <sphereGeometry args={[0.09, 8, 8]} />
      <meshStandardMaterial color="#D0D0D0" transparent opacity={0.5} />
    </mesh>
  </group>
);

const Dock = () => (
  <group>
    {/* Wooden planks */}
    <mesh position={[0, 0.12, 0]} receiveShadow castShadow>
      <boxGeometry args={[1.2, 0.05, 0.6]} />
      <meshStandardMaterial color="#8B5E3C" />
    </mesh>
    {/* Plank seams */}
    {[-0.4, -0.13, 0.13, 0.4].map((x) => (
      <mesh key={x} position={[x, 0.15, 0]}>
        <boxGeometry args={[0.02, 0.005, 0.6]} />
        <meshStandardMaterial color="#5A3820" />
      </mesh>
    ))}
    {/* Posts */}
    {[[-0.5, -0.25], [0.5, -0.25], [-0.5, 0.25], [0.5, 0.25]].map(([x, z], i) => (
      <mesh key={i} position={[x, 0.05, z]} castShadow>
        <cylinderGeometry args={[0.05, 0.05, 0.3, 8]} />
        <meshStandardMaterial color="#5A3820" />
      </mesh>
    ))}
    {/* Lantern */}
    <mesh position={[0.55, 0.4, 0]}>
      <cylinderGeometry args={[0.04, 0.04, 0.4, 6]} />
      <meshStandardMaterial color="#3A2818" />
    </mesh>
    <mesh position={[0.55, 0.65, 0]}>
      <boxGeometry args={[0.12, 0.12, 0.12]} />
      <meshStandardMaterial color="#F4D87C" emissive="#F4D87C" emissiveIntensity={0.8} />
    </mesh>
    <pointLight position={[0.55, 0.65, 0]} color="#F4D87C" intensity={0.5} distance={2} />
  </group>
);

const Shrine = () => (
  <group>
    {/* Stone base */}
    <mesh position={[0, 0.05, 0]}><boxGeometry args={[0.9, 0.1, 0.7]} /><meshStandardMaterial color="#9B8E7E" /></mesh>
    {/* Two red columns */}
    {[-0.35, 0.35].map((x) => (
      <mesh key={x} position={[x, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.07, 0.85, 8]} />
        <meshStandardMaterial color="#C5523A" />
      </mesh>
    ))}
    {/* Top crossbeams */}
    <mesh position={[0, 0.95, 0]}>
      <boxGeometry args={[0.95, 0.06, 0.12]} />
      <meshStandardMaterial color="#3A2818" />
    </mesh>
    <mesh position={[0, 1.05, 0]}>
      <boxGeometry args={[1.05, 0.08, 0.18]} />
      <meshStandardMaterial color="#C5523A" />
    </mesh>
    {/* Bell */}
    <mesh position={[0, 0.85, 0]}>
      <cylinderGeometry args={[0.08, 0.1, 0.12, 8]} />
      <meshStandardMaterial color="#C9A55B" metalness={0.5} />
    </mesh>
  </group>
);

/* ── Windmill — rotating blades, classic Dutch ──────── */
const Windmill = ({ bladesRef }: { bladesRef: RefObject<THREE.Group | null> }) => (
  <group>
    {/* Stone base */}
    <mesh position={[0, 0.1, 0]} receiveShadow castShadow>
      <cylinderGeometry args={[0.45, 0.55, 0.2, 16]} />
      <meshStandardMaterial color="#7A6B5A" roughness={0.9} flatShading />
    </mesh>
    {/* Tapered tower */}
    <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[0.32, 0.45, 1.1, 16]} />
      <meshStandardMaterial color="#F4E1C1" roughness={0.85} />
    </mesh>
    {/* Wood beam stripes */}
    {[0.4, 0.7, 1.0].map((y) => (
      <mesh key={y} position={[0, y, 0]}>
        <cylinderGeometry args={[
          0.45 - (y - 0.2) * 0.118,
          0.45 - (y - 0.2) * 0.118,
          0.04, 16
        ]} />
        <meshStandardMaterial color="#8B6B4A" roughness={0.9} />
      </mesh>
    ))}
    {/* Door */}
    <mesh position={[0, 0.35, 0.43]}>
      <boxGeometry args={[0.18, 0.4, 0.02]} />
      <meshStandardMaterial color="#5A3820" />
    </mesh>
    {/* Window */}
    <mesh position={[0, 0.85, 0.4]}>
      <boxGeometry args={[0.14, 0.14, 0.02]} />
      <meshStandardMaterial color="#F2C46C" emissive="#F2C46C" emissiveIntensity={0.5} />
    </mesh>
    {/* Conical roof cap */}
    <mesh position={[0, 1.42, 0]} castShadow>
      <coneGeometry args={[0.36, 0.32, 12]} />
      <meshStandardMaterial color="#5A3820" roughness={0.8} flatShading />
    </mesh>
    {/* Hub for blades */}
    <mesh position={[0, 1.15, 0.35]} rotation={[Math.PI / 2, 0, 0]} castShadow>
      <cylinderGeometry args={[0.06, 0.06, 0.12, 12]} />
      <meshStandardMaterial color="#3A2818" />
    </mesh>
    {/* Rotating blades */}
    <group ref={bladesRef} position={[0, 1.15, 0.4]}>
      {[0, 1, 2, 3].map((i) => {
        const angle = (i / 4) * Math.PI * 2;
        return (
          <group key={i} rotation={[0, 0, angle]}>
            {/* Blade arm */}
            <mesh position={[0, 0.4, 0]} castShadow>
              <boxGeometry args={[0.04, 0.8, 0.03]} />
              <meshStandardMaterial color="#5A3820" roughness={0.85} />
            </mesh>
            {/* Sail (cloth) */}
            <mesh position={[0.1, 0.5, 0]} castShadow>
              <boxGeometry args={[0.18, 0.45, 0.005]} />
              <meshStandardMaterial color="#F4E8D9" side={THREE.DoubleSide} roughness={0.7} />
            </mesh>
            {/* Cross slats on sail */}
            {[0.35, 0.55, 0.7].map((y) => (
              <mesh key={y} position={[0.1, y, 0.005]}>
                <boxGeometry args={[0.18, 0.008, 0.002]} />
                <meshStandardMaterial color="#8B6B4A" />
              </mesh>
            ))}
          </group>
        );
      })}
    </group>
  </group>
);

/* ── Treehouse — built into a big oak ──────────────── */
const Treehouse = () => (
  <group>
    {/* Big trunk */}
    <mesh position={[0, 0.5, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[0.16, 0.22, 1.0, 8]} />
      <meshStandardMaterial color="#5A3820" roughness={0.92} flatShading />
    </mesh>
    {/* Side branch supports */}
    {[-0.3, 0.3].map((x) => (
      <mesh key={x} position={[x, 0.6, 0]} rotation={[0, 0, x > 0 ? -0.6 : 0.6]}>
        <cylinderGeometry args={[0.04, 0.05, 0.35, 6]} />
        <meshStandardMaterial color="#5A3820" roughness={0.9} />
      </mesh>
    ))}
    {/* Wood platform */}
    <mesh position={[0, 0.85, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[0.55, 0.55, 0.06, 16]} />
      <meshStandardMaterial color="#8B6B4A" roughness={0.85} />
    </mesh>
    {/* Plank seams on platform */}
    {[-0.3, -0.1, 0.1, 0.3].map((x) => (
      <mesh key={x} position={[x, 0.89, 0]}>
        <boxGeometry args={[0.015, 0.005, 1.0]} />
        <meshStandardMaterial color="#5A3820" />
      </mesh>
    ))}
    {/* Cabin walls */}
    <mesh position={[0, 1.15, 0]} castShadow receiveShadow>
      <boxGeometry args={[0.7, 0.5, 0.7]} />
      <meshStandardMaterial color="#A87A4E" roughness={0.85} />
    </mesh>
    {/* Window */}
    <mesh position={[0, 1.2, 0.36]}>
      <boxGeometry args={[0.2, 0.2, 0.02]} />
      <meshStandardMaterial color="#F2C46C" emissive="#F2C46C" emissiveIntensity={0.6} />
    </mesh>
    {/* Door (side) */}
    <mesh position={[0.36, 1.1, 0]}>
      <boxGeometry args={[0.02, 0.32, 0.18]} />
      <meshStandardMaterial color="#3A2818" />
    </mesh>
    {/* Slanted roof */}
    <mesh position={[0, 1.55, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
      <coneGeometry args={[0.6, 0.45, 4]} />
      <meshStandardMaterial color="#3F7A3F" roughness={0.78} />
    </mesh>
    {/* Foliage around treehouse */}
    {[
      [0.6, 1.1, 0.3, 0.3],
      [-0.55, 1.2, -0.2, 0.28],
      [0.2, 1.4, -0.55, 0.32],
      [-0.4, 1.5, 0.45, 0.26],
    ].map(([x, y, z, r], i) => (
      <mesh key={i} position={[x, y, z]} castShadow>
        <sphereGeometry args={[r, 12, 10]} />
        <meshStandardMaterial color={i % 2 ? "#4A8548" : "#5A9A55"} roughness={0.75} flatShading />
      </mesh>
    ))}
    {/* Rope ladder */}
    {[0.05, 0.15, 0.25, 0.35, 0.5, 0.65].map((y, i) => (
      <mesh key={i} position={[-0.5, y, 0.1]}>
        <boxGeometry args={[0.12, 0.015, 0.015]} />
        <meshStandardMaterial color="#6B4226" />
      </mesh>
    ))}
    {/* Rope sides */}
    <mesh position={[-0.56, 0.4, 0.1]}>
      <cylinderGeometry args={[0.008, 0.008, 0.85, 4]} />
      <meshStandardMaterial color="#3A2818" />
    </mesh>
    <mesh position={[-0.44, 0.4, 0.1]}>
      <cylinderGeometry args={[0.008, 0.008, 0.85, 4]} />
      <meshStandardMaterial color="#3A2818" />
    </mesh>
    {/* Lantern hanging */}
    <mesh position={[0.4, 1.35, 0.4]}>
      <boxGeometry args={[0.08, 0.1, 0.08]} />
      <meshStandardMaterial color="#F4D87C" emissive="#F4D87C" emissiveIntensity={0.7} />
    </mesh>
    <pointLight position={[0.4, 1.35, 0.4]} color="#F4D87C" intensity={0.4} distance={1.8} />
  </group>
);
