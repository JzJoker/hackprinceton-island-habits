import { useRef, useState } from "react";
import { useFrame, useThree, ThreeEvent } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { useGame, scorePlacement, BUILD_LIBRARY } from "../state";
import { Building3D } from "./Building3D";

// Floor pointer-tracking plane: invisible, large, captures hover for ghost preview
export const PlacementGhost = () => {
  const { placingType, buildings, scenery, districts, placeBuildingAt, cancelPlacing } = useGame();
  const [pos, setPos] = useState<[number, number] | null>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (ringRef.current) {
      const s = 1 + Math.sin(clock.elapsedTime * 4) * 0.05;
      ringRef.current.scale.set(s, 1, s);
    }
  });

  if (!placingType) return null;

  const opt = BUILD_LIBRARY.find((b) => b.type === placingType)!;
  const result = pos ? scorePlacement(placingType, pos, buildings, scenery, districts) : null;
  const valid = result?.valid;

  const handleMove = (e: ThreeEvent<PointerEvent>) => {
    setPos([e.point.x, e.point.z]);
  };
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (pos) placeBuildingAt(pos);
  };

  return (
    <>
      {/* Invisible catcher plane */}
      <mesh
        position={[0, -0.18, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerMove={handleMove}
        onClick={handleClick}
        onPointerLeave={() => setPos(null)}
      >
        <planeGeometry args={[40, 40]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>

      {pos && (
        <group position={[pos[0], 0, pos[1]]}>
          {/* Footprint ring */}
          <mesh ref={ringRef} position={[0, -0.16, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[opt.radius, opt.radius + 0.06, 32]} />
            <meshBasicMaterial color={valid ? "#7AC5A0" : "#E55A6B"} transparent opacity={0.85} />
          </mesh>
          <mesh position={[0, -0.155, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[opt.radius, 32]} />
            <meshBasicMaterial color={valid ? "#7AC5A0" : "#E55A6B"} transparent opacity={0.25} />
          </mesh>

          {/* Ghost building (semi-transparent) */}
          <group scale={[1, 1, 1]}>
            <GhostBuildingPreview type={placingType} valid={!!valid} />
          </group>

          {/* Score popup */}
          <Html position={[0, 1.5, 0]} center distanceFactor={7}>
            <div className={`hud-panel-dark px-3 py-2 pointer-events-none whitespace-nowrap text-center ${valid ? "" : "!border-destructive"}`}
                 style={!valid ? { borderBottomColor: "hsl(0 70% 45%)" } : undefined}>
              {valid ? (
                <>
                  <div className={`display-font text-lg font-black ${(result?.score ?? 0) > 0 ? "text-primary" : (result?.score ?? 0) < 0 ? "text-destructive" : "text-foreground"}`}>
                    {(result?.score ?? 0) > 0 ? "+" : ""}{result?.score ?? 0}
                  </div>
                  <div className="text-[9px] uppercase tracking-wider opacity-70 font-bold">harmony</div>
                  {result && result.breakdown.length > 0 && (
                    <div className="mt-1 pt-1 border-t border-white/15 space-y-0.5">
                      {result.breakdown.slice(0, 3).map((b, i) => (
                        <div key={i} className="text-[10px] font-bold flex justify-between gap-2">
                          <span className="opacity-80">{b.label}</span>
                          <span className={b.pts > 0 ? "text-primary" : "text-destructive"}>{b.pts > 0 ? "+" : ""}{b.pts}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-xs font-extrabold text-destructive">{result?.reason}</div>
              )}
            </div>
          </Html>
        </group>
      )}

      {/* Cancel button via Esc-like floating UI */}
      <Html position={[0, 4, 0]} center>
        <button
          onClick={(e) => { e.stopPropagation(); cancelPlacing(); }}
          className="btn-game-coral text-xs px-3 py-1.5 pointer-events-auto"
        >
          ✕ Cancel placing {opt.emoji} {opt.name}
        </button>
      </Html>
    </>
  );
};

// Lightweight ghost preview — re-uses building meshes but with transparent override
const GhostBuildingPreview = ({ type, valid }: { type: string; valid: boolean }) => (
  <group>
    <Building3D building={{ id: "ghost", type: type as any, pos: [0, 0], district: "main" }} />
    {/* Tint overlay sphere — visual hint */}
    <mesh position={[0, 0.5, 0]}>
      <sphereGeometry args={[0.6, 16, 16]} />
      <meshBasicMaterial color={valid ? "#7AC5A0" : "#E55A6B"} transparent opacity={0.15} />
    </mesh>
  </group>
);
