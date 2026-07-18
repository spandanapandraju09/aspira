import { useEffect, useState } from 'react';

export function useParallax(strength = 0.1, useDevice = false) {
  const [{ x, y }, set] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const mouseHandler = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const dx = (e.clientX - cx) / cx;
      const dy = (e.clientY - cy) / cy;
      set({ x: dx * strength * 20, y: dy * strength * 20 });
    };
    window.addEventListener('mousemove', mouseHandler);

    const deviceHandler = (e: DeviceOrientationEvent) => {
      if (!useDevice) return;
      const dx = e.gamma ? e.gamma / 90 : 0;
      const dy = e.beta ? e.beta / 90 : 0;
      set({ x: dx * strength * 20, y: dy * strength * 20 });
    };
    window.addEventListener('deviceorientation', deviceHandler);

    return () => {
      window.removeEventListener('mousemove', mouseHandler);
      window.removeEventListener('deviceorientation', deviceHandler);
    };
  }, [strength, useDevice]);

  return { x, y };
}
