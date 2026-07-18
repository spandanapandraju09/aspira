// src/components/NeuralMesh.tsx
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";

function NeuralMeshContent() {
  const group = useRef<any>();
  const points = useRef(
    Array.from({ length: 25 }, () => {
      const velocity = [
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02,
        (Math.random() - 0.5) * 0.02,
      ];
      return {
        x: (Math.random() - 0.5) * 8,
        y: (Math.random() - 0.5) * 8,
        z: (Math.random() - 0.5) * 8,
        vx: velocity[0],
        vy: velocity[1],
        vz: velocity[2],
      };
    })
  );

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    // Animate points
    points.current.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.z += p.vz;
      // Bounce back when reaching bounds (+/-4)
      if (Math.abs(p.x) > 4) p.vx *= -1;
      if (Math.abs(p.y) > 4) p.vy *= -1;
      if (Math.abs(p.z) > 4) p.vz *= -1;
    });
    if (group.current) {
      group.current.rotation.y = Math.sin(t * 0.1) * 0.04;
      group.current.rotation.x = Math.cos(t * 0.07) * 0.03;
    }
  });

  return (
    <group ref={group}>
      {points.current.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, p.z]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshBasicMaterial
            color="rgba(255,209,179,0.6)"
            transparent
          />
        </mesh>
      ))}
      {/* Connect near‑by points – omitted for simplicity */}
      /* line connections omitted */
    </group>
  );
}

// Simple neural‑network mesh with moving nodes and connecting lines
export default function NeuralMesh() {
  return (
    <Canvas
      className="fixed inset-0 pointer-events-none"
      camera={{ position: [0, 0, 10], fov: 70 }}
    >
      <NeuralMeshContent />
    </Canvas>
  );
}
