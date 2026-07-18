import { motion } from 'framer-motion';
import { useParallax } from '../hooks/useParallax';

type Props = {
  children: React.ReactNode;
  parallax?: boolean;
};

export default function GlassyCard({ children, parallax = true }: Props) {
  const { x, y } = useParallax(0.04);
  return (
    <motion.div
      className="glass glow-hover parallax-layer p-6 rounded-xl"
      style={parallax ? { x, y } : undefined}
    >
      {children}
    </motion.div>
  );
}
