// src/components/ParticleField.tsx
import { Canvas } from "@react-three/fiber";
import { Points, PointMaterial } from "@react-three/drei";

type Props = {
  count?: number;
};

export default function ParticleField({ count = 40 }: Props) {
  const particles = Array.from({ length: count }, () => ({
    position: [
      (Math.random() - 0.5) * 12,
      (Math.random() - 0.5) * 12,
      (Math.random() - 0.5) * 12,
    ],
    size: Math.random() * 0.04 + 0.02,
  }));

  return (
    <Canvas
      className="fixed inset-0 pointer-events-none"
      camera={{ position: [0, 0, 8] }}
    >
      <Points
        positions={new Float32Array(particles.flatMap(p => p.position))}
        limit={200}
      >
        <PointMaterial
          transparent
          color="rgba(255,209,179,0.5)"
          sizeAttenuation
          size={0.07}
          opacity={0.4}
        />
      </Points>
    </Canvas>
  );
}
